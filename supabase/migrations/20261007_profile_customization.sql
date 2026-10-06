-- ═══════════════════════════════════════════════════════════════════
--  Profile customization + dashboard data
--
--  Additive only: new nullable columns, two storage buckets with per-user
--  policies, two guard triggers and four read functions. No existing table,
--  column, row, function or policy is changed or removed.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Profile columns ──────────────────────────────────────────────
-- users.bio is the customer's personal bio; providers keep using the
-- existing providers.bio for their professional one.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS nickname   varchar(40),
    ADD COLUMN IF NOT EXISTS avatar_url text,
    ADD COLUMN IF NOT EXISTS bio        text;

-- The résumé lives in a PRIVATE bucket, so what is stored is the object
-- path (not a URL); the app issues short-lived signed links from it.
ALTER TABLE public.providers
    ADD COLUMN IF NOT EXISTS resume_path text,
    ADD COLUMN IF NOT EXISTS resume_name varchar(255);

-- ── 2. Verified registration data is read-only for its owner ────────
-- "Users update own profile" / "Providers update own row" let a signed-in
-- user update ANY column of their own row. These triggers pin the verified
-- fields (and role / status / rating) for direct end-user writes. Admins,
-- the service role and SECURITY DEFINER functions are unaffected.
CREATE OR REPLACE FUNCTION public.guard_user_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF current_user NOT IN ('authenticated', 'anon') OR is_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.full_name       IS DISTINCT FROM OLD.full_name
       OR NEW.barangay     IS DISTINCT FROM OLD.barangay
       OR NEW.municipality IS DISTINCT FROM OLD.municipality
       OR NEW.province     IS DISTINCT FROM OLD.province
       OR NEW.role         IS DISTINCT FROM OLD.role
       OR NEW.auth_id      IS DISTINCT FROM OLD.auth_id
       OR NEW.user_id      IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Your name and address are verified registration details and cannot be edited here.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_provider_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF current_user NOT IN ('authenticated', 'anon') OR is_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.trade_category    IS DISTINCT FROM OLD.trade_category
       OR NEW.admin_status   IS DISTINCT FROM OLD.admin_status
       OR NEW.average_rating IS DISTINCT FROM OLD.average_rating
       OR NEW.rejected_at    IS DISTINCT FROM OLD.rejected_at
       OR NEW.user_id        IS DISTINCT FROM OLD.user_id
       OR NEW.provider_id    IS DISTINCT FROM OLD.provider_id THEN
        RAISE EXCEPTION 'Your trade and verification status are set by the LGU and cannot be edited here.';
    END IF;

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'guard_user_identity'
                   AND tgrelid = 'public.users'::regclass) THEN
        CREATE TRIGGER guard_user_identity
            BEFORE UPDATE ON public.users
            FOR EACH ROW EXECUTE FUNCTION public.guard_user_identity();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'guard_provider_identity'
                   AND tgrelid = 'public.providers'::regclass) THEN
        CREATE TRIGGER guard_provider_identity
            BEFORE UPDATE ON public.providers
            FOR EACH ROW EXECUTE FUNCTION public.guard_provider_identity();
    END IF;
END $$;

-- ── 3. Storage buckets ──────────────────────────────────────────────
--   avatars             PUBLIC  — profile photos, shown across the app
--   provider-documents  PRIVATE — résumés and certificates (personal data;
--                                 BR-10), read through signed URLs
-- Both cap files at 5 MB and restrict the file types server-side.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', true, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('provider-documents', 'provider-documents', false, 5242880,
        ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Every object sits in a folder named after its owner's auth uid, and a
-- signed-in user may only write inside their own folder.
DO $$
DECLARE
    b   text;
    act text;
BEGIN
    FOREACH b IN ARRAY ARRAY['avatars', 'provider-documents'] LOOP
        FOREACH act IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies
                WHERE schemaname = 'storage' AND tablename = 'objects'
                  AND policyname = format('%s: owner %s', b, lower(act))
            ) THEN
                EXECUTE format(
                    'CREATE POLICY %I ON storage.objects FOR %s TO authenticated %s',
                    format('%s: owner %s', b, lower(act)),
                    act,
                    CASE act
                        WHEN 'INSERT' THEN format(
                            'WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)', b)
                        WHEN 'UPDATE' THEN format(
                            'USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text) '
                            'WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)', b, b)
                        ELSE format(
                            'USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)', b)
                    END
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ── 4. Read functions (safe columns only) ───────────────────────────
-- Approved providers with their public profile extras. Supersedes
-- get_approved_providers() + get_occupied_providers() for the app; both
-- are left in place.
CREATE OR REPLACE FUNCTION public.get_provider_directory(p_provider_id bigint DEFAULT NULL)
RETURNS TABLE(
    provider_id    bigint,
    full_name      text,
    nickname       text,
    avatar_url     text,
    trade_category text,
    barangay       text,
    bio            text,
    average_rating numeric,
    review_count   bigint,
    id_verified    boolean,
    is_occupied    boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT
        p.provider_id,
        u.full_name::text,
        u.nickname::text,
        u.avatar_url,
        p.trade_category::text,
        u.barangay::text,
        p.bio::text,
        p.average_rating,
        (SELECT count(*) FROM ratings r WHERE r.provider_id = p.provider_id),
        COALESCE((SELECT pi.id_verified_at IS NOT NULL
                  FROM provider_identity pi
                  WHERE pi.provider_id = p.provider_id), false),
        -- on a job for ANOTHER customer (the caller's own jobs don't count)
        EXISTS (
            SELECT 1
            FROM job_requests j
            JOIN customers c ON c.customer_id = j.customer_id
            JOIN users cu    ON cu.user_id    = c.user_id
            WHERE j.provider_id = p.provider_id
              AND j.job_status IN ('Accepted', 'Ongoing')
              AND cu.auth_id IS DISTINCT FROM auth.uid()
        )
    FROM providers p
    JOIN users u ON u.user_id = p.user_id
    WHERE p.admin_status = 'Approved'
      AND (p_provider_id IS NULL OR p.provider_id = p_provider_id)
    ORDER BY p.average_rating DESC, 9 DESC, u.full_name ASC;
$$;

-- Profile photos of both parties, for every job the caller is part of.
CREATE OR REPLACE FUNCTION public.get_job_avatars()
RETURNS TABLE(job_id bigint, customer_avatar_url text, provider_avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT j.job_id, cu.avatar_url, pu.avatar_url
    FROM job_requests j
    JOIN customers c ON c.customer_id = j.customer_id
    JOIN users cu    ON cu.user_id    = c.user_id
    JOIN providers p ON p.provider_id = j.provider_id
    JOIN users pu    ON pu.user_id    = p.user_id
    WHERE cu.auth_id = auth.uid() OR pu.auth_id = auth.uid();
$$;

-- Reviewer photos for an approved provider's reviews.
CREATE OR REPLACE FUNCTION public.get_review_avatars(p_provider_id bigint)
RETURNS TABLE(rating_id bigint, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT r.rating_id, u.avatar_url
    FROM ratings r
    JOIN customers c ON c.customer_id = r.customer_id
    JOIN users u     ON u.user_id     = c.user_id
    JOIN providers p ON p.provider_id = r.provider_id
    WHERE r.provider_id = p_provider_id
      AND p.admin_status = 'Approved';
$$;

-- The signed-in provider's most recent completed jobs, with the rating
-- each one received.
CREATE OR REPLACE FUNCTION public.get_provider_completed_jobs(p_limit integer DEFAULT 5)
RETURNS TABLE(
    job_id              bigint,
    customer_name       text,
    customer_avatar_url text,
    service_name        text,
    service_description text,
    agreed_price        numeric,
    payment_structure   text,
    completed_at        timestamp with time zone,
    stars               smallint,
    review_text         text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT
        j.job_id,
        cu.full_name::text,
        cu.avatar_url,
        j.service_name::text,
        j.service_description::text,
        j.agreed_price,
        j.payment_structure,
        j.completed_at,
        r.stars,
        r.review_text::text
    FROM job_requests j
    JOIN customers c  ON c.customer_id = j.customer_id
    JOIN users cu     ON cu.user_id    = c.user_id
    JOIN providers p  ON p.provider_id = j.provider_id
    JOIN users pu     ON pu.user_id    = p.user_id
    LEFT JOIN ratings r ON r.job_id = j.job_id
    WHERE pu.auth_id = auth.uid()
      AND j.job_status = 'Completed'
    ORDER BY j.completed_at DESC NULLS LAST, j.job_id DESC
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 5), 50));
$$;

REVOKE ALL ON FUNCTION public.get_provider_directory(bigint)       FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_job_avatars()                    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_review_avatars(bigint)           FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_provider_completed_jobs(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_provider_directory(bigint)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_avatars()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_avatars(bigint)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_completed_jobs(integer) TO authenticated;
