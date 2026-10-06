-- ═══════════════════════════════════════════════════════════════════
--  Job Execution Lifecycle
--    Accepted ──(provider: Start Job)──► Ongoing
--    Ongoing  ──(customer: rate + confirm)──► Completed
--
--  The CUSTOMER concludes a job, because the customer is the one who checks
--  the work. Completing and rating happen in one step, so a Completed job
--  always has its mandatory rating (BR-07).
--
--  Additive only: three functions and one trigger. No table, column or row
--  is changed or removed. Reviews use the existing `ratings` table, whose
--  trg_update_avg_rating trigger already recalculates
--  providers.average_rating; the review count is derived from it.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Which providers are currently on a job ───────────────────────
-- Derived from job_requests, so it can never drift out of sync the way a
-- stored flag could. Returns only a provider id and a count — no job or
-- customer details. The caller's OWN jobs are left out: the notice is for
-- OTHER customers ("handling another request").
CREATE OR REPLACE FUNCTION public.get_occupied_providers(p_provider_id bigint DEFAULT NULL)
RETURNS TABLE(provider_id bigint, active_jobs bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT j.provider_id, count(*)
    FROM job_requests j
    JOIN customers c ON c.customer_id = j.customer_id
    JOIN users cu    ON cu.user_id    = c.user_id
    WHERE j.job_status IN ('Accepted', 'Ongoing')
      AND (p_provider_id IS NULL OR j.provider_id = p_provider_id)
      AND cu.auth_id IS DISTINCT FROM auth.uid()
    GROUP BY j.provider_id;
$$;

REVOKE ALL ON FUNCTION public.get_occupied_providers(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_occupied_providers(bigint) TO authenticated;

-- ── 2. Status transition guard ──────────────────────────────────────
-- Providers update their own rows directly under RLS, so the rules live in
-- a trigger rather than in the app:
--   • a job can only be started (Ongoing) from Accepted
--   • nobody can set Completed directly — only complete_job_with_review()
--   • the only direct moves are Pending → Accepted/Declined and
--     Accepted → Ongoing; nothing moves backwards
-- The negotiation/booking functions set communiserve.trusted_write and pass
-- through, exactly as they do for guard_job_pricing.
CREATE OR REPLACE FUNCTION public.guard_job_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF current_setting('communiserve.trusted_write', true) = 'on' THEN
        RETURN NEW;
    END IF;

    IF NEW.job_status IS NOT DISTINCT FROM OLD.job_status THEN
        RETURN NEW;
    END IF;

    IF NEW.job_status = 'Completed' THEN
        RAISE EXCEPTION 'Only the customer can mark a job as completed.';
    END IF;

    IF NEW.job_status = 'Ongoing' AND OLD.job_status <> 'Accepted' THEN
        RAISE EXCEPTION 'A job can only be started after it has been accepted.';
    END IF;

    -- The only direct moves a provider may make (BR-06: no skipping, no
    -- going backwards). Everything else goes through a trusted function.
    IF (OLD.job_status = 'Pending'  AND NEW.job_status IN ('Accepted', 'Declined'))
       OR (OLD.job_status = 'Accepted' AND NEW.job_status = 'Ongoing') THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'This job can no longer be changed that way.';
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'guard_job_lifecycle'
          AND tgrelid = 'public.job_requests'::regclass
    ) THEN
        CREATE TRIGGER guard_job_lifecycle
            BEFORE UPDATE OF job_status ON public.job_requests
            FOR EACH ROW EXECUTE FUNCTION public.guard_job_lifecycle();
    END IF;
END $$;

-- ── 3. Customer confirms completion and rates the provider ──────────
-- One transaction: the job becomes Completed and the rating is saved, or
-- neither happens. ratings.job_id is UNIQUE, so a job is rated once.
CREATE OR REPLACE FUNCTION public.complete_job_with_review(
    p_job_id  bigint,
    p_stars   integer,
    p_comment text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_customer_id bigint;
    v_job         job_requests%ROWTYPE;
BEGIN
    SELECT c.customer_id INTO v_customer_id
    FROM customers c
    JOIN users u ON u.user_id = c.user_id
    WHERE u.auth_id = auth.uid();

    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Only the customer can mark a job as completed.';
    END IF;

    SELECT * INTO v_job
    FROM job_requests
    WHERE job_id = p_job_id AND customer_id = v_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'We could not find that request.';
    END IF;

    IF v_job.job_status <> 'Ongoing' THEN
        RAISE EXCEPTION 'This job is not in progress, so it cannot be completed yet.';
    END IF;

    IF p_stars IS NULL OR p_stars < 1 OR p_stars > 5 THEN
        RAISE EXCEPTION 'Please choose a rating from 1 to 5 stars.';
    END IF;

    PERFORM set_config('communiserve.trusted_write', 'on', true);

    UPDATE job_requests
    SET job_status = 'Completed', completed_at = now()
    WHERE job_id = p_job_id;

    INSERT INTO ratings (job_id, customer_id, provider_id, stars, review_text)
    VALUES (p_job_id, v_customer_id, v_job.provider_id, p_stars::smallint,
            NULLIF(btrim(left(p_comment, 500)), ''));

    PERFORM set_config('communiserve.trusted_write', 'off', true);

    RETURN 'Completed';
END;
$$;

REVOKE ALL ON FUNCTION public.complete_job_with_review(bigint, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_job_with_review(bigint, integer, text) TO authenticated;
