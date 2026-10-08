-- ═══════════════════════════════════════════════════════════════════
--  "My Requests" notification badge
--
--  Each request remembers when it last had activity and which side caused
--  it; each user remembers when they last opened My Requests. The badge is
--  the number of the user's requests with activity from the OTHER side
--  since then.
--
--  Additive only: three nullable columns, two triggers, one function.
--  Existing rows are left as they are (no activity recorded = no badge),
--  so nobody starts with a pile of old "news".
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.job_requests
    ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS last_activity_by text;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_requests_last_activity_by_check') THEN
        ALTER TABLE public.job_requests
            ADD CONSTRAINT job_requests_last_activity_by_check
            CHECK (last_activity_by IS NULL OR last_activity_by IN ('customer', 'provider'));
    END IF;
END $$;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS requests_seen_at timestamp with time zone;

-- ── A request is created, or its status changes ─────────────────────
-- A new request is always the customer's doing. For a status change the
-- actor is whichever party is signed in (auth.uid() is still the real user
-- inside the SECURITY DEFINER booking / negotiation functions).
CREATE OR REPLACE FUNCTION public.track_job_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_actor text;
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.last_activity_at := now();
        NEW.last_activity_by := 'customer';
        RETURN NEW;
    END IF;

    IF NEW.job_status IS DISTINCT FROM OLD.job_status THEN
        IF EXISTS (SELECT 1 FROM providers p JOIN users u ON u.user_id = p.user_id
                   WHERE p.provider_id = NEW.provider_id AND u.auth_id = auth.uid()) THEN
            v_actor := 'provider';
        ELSIF EXISTS (SELECT 1 FROM customers c JOIN users u ON u.user_id = c.user_id
                      WHERE c.customer_id = NEW.customer_id AND u.auth_id = auth.uid()) THEN
            v_actor := 'customer';
        END IF;

        -- An admin or the service role changing a status is not "news" from
        -- either party; leave the marker alone.
        IF v_actor IS NOT NULL THEN
            NEW.last_activity_at := now();
            NEW.last_activity_by := v_actor;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- ── An offer or counter-offer is made ───────────────────────────────
CREATE OR REPLACE FUNCTION public.track_offer_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE job_requests
    SET last_activity_at = now(),
        last_activity_by = NEW.offered_by
    WHERE job_id = NEW.job_id;
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    -- Named to sort after guard_job_lifecycle / guard_job_pricing, so the
    -- guards have already accepted the change when this runs.
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'track_job_activity'
                   AND tgrelid = 'public.job_requests'::regclass) THEN
        CREATE TRIGGER track_job_activity
            BEFORE INSERT OR UPDATE OF job_status ON public.job_requests
            FOR EACH ROW EXECUTE FUNCTION public.track_job_activity();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'track_offer_activity'
                   AND tgrelid = 'public.job_offers'::regclass) THEN
        CREATE TRIGGER track_offer_activity
            AFTER INSERT ON public.job_offers
            FOR EACH ROW EXECUTE FUNCTION public.track_offer_activity();
    END IF;
END $$;

-- ── How many of my requests have news from the other side? ──────────
CREATE OR REPLACE FUNCTION public.get_request_news_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT count(*)::integer
    FROM job_requests j
    JOIN customers c ON c.customer_id = j.customer_id
    JOIN users cu    ON cu.user_id    = c.user_id
    JOIN providers p ON p.provider_id = j.provider_id
    JOIN users pu    ON pu.user_id    = p.user_id
    WHERE j.last_activity_at > COALESCE(
              (SELECT me.requests_seen_at FROM users me WHERE me.auth_id = auth.uid()),
              '-infinity'::timestamptz)
      AND (   (cu.auth_id = auth.uid() AND j.last_activity_by = 'provider')
           OR (pu.auth_id = auth.uid() AND j.last_activity_by = 'customer'));
$$;

REVOKE ALL ON FUNCTION public.get_request_news_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_request_news_count() TO authenticated;
REVOKE ALL ON FUNCTION public.track_job_activity()   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.track_offer_activity() FROM PUBLIC, anon, authenticated;
