-- ═══════════════════════════════════════════════════════════════════════
--  CommuniServe — read/write policies for the customer & provider portals
--
--  Implements BR-11 (RLS on every table) for the tables the new portal
--  screens use. RLS was already ENABLED on these tables but no SELECT
--  policies existed, which in Postgres means "deny all" — so customers
--  could not read skills, ratings, provider files or job requests at all.
--
--  Run AFTER 20260924_provider_identity_pin.sql. Idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
--  WHY SOME READS GO THROUGH FUNCTIONS INSTEAD OF POLICIES
--
--  Screens need provider names and reviewer names, which live in
--  public.users. RLS is ROW-level, not column-level: any policy that lets a
--  customer read another person's users row exposes that row entirely —
--  email, contact_number, password_hash and all.
--
--  So identity lookups go through SECURITY DEFINER functions at the bottom
--  of this file, which return only the safe columns. Everything else uses
--  ordinary row policies.
-- ───────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════
--  1. SKILLS  (M3 — provider portfolio)
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Public sees skills of approved providers" ON "public"."skills";
CREATE POLICY "Public sees skills of approved providers"
    ON "public"."skills" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."providers" p
            WHERE p."provider_id" = "skills"."provider_id"
              AND p."admin_status" = 'Approved'
        )
    );

DROP POLICY IF EXISTS "Providers manage own skills" ON "public"."skills";
CREATE POLICY "Providers manage own skills"
    ON "public"."skills" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."providers" p
            JOIN "public"."users" u ON u."user_id" = p."user_id"
            WHERE p."provider_id" = "skills"."provider_id"
              AND u."auth_id" = "auth"."uid"()
        )
    );

DROP POLICY IF EXISTS "Admins view skills" ON "public"."skills";
CREATE POLICY "Admins view skills"
    ON "public"."skills" FOR SELECT
    USING ("public"."is_admin"());


-- ═══════════════════════════════════════════════════════════════════════
--  2. PROVIDER_FILES  (gallery / certificates)
--
--  NOTE: this governs the METADATA rows only. The files themselves live in
--  Supabase Storage and are governed separately by Storage policies —
--  certificates stay in a private bucket served via short-lived signed URLs.
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Public sees files of approved providers" ON "public"."provider_files";
CREATE POLICY "Public sees files of approved providers"
    ON "public"."provider_files" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."providers" p
            WHERE p."provider_id" = "provider_files"."provider_id"
              AND p."admin_status" = 'Approved'
        )
    );

DROP POLICY IF EXISTS "Providers manage own files" ON "public"."provider_files";
CREATE POLICY "Providers manage own files"
    ON "public"."provider_files" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."providers" p
            JOIN "public"."users" u ON u."user_id" = p."user_id"
            WHERE p."provider_id" = "provider_files"."provider_id"
              AND u."auth_id" = "auth"."uid"()
        )
    );

DROP POLICY IF EXISTS "Admins view provider files" ON "public"."provider_files";
CREATE POLICY "Admins view provider files"
    ON "public"."provider_files" FOR SELECT
    USING ("public"."is_admin"());


-- ═══════════════════════════════════════════════════════════════════════
--  3. RATINGS  (M6 — reviews are public for approved providers)
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Public sees ratings of approved providers" ON "public"."ratings";
CREATE POLICY "Public sees ratings of approved providers"
    ON "public"."ratings" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."providers" p
            WHERE p."provider_id" = "ratings"."provider_id"
              AND p."admin_status" = 'Approved'
        )
    );

-- BR-07: a customer may only rate their own completed job.
DROP POLICY IF EXISTS "Customers rate own completed jobs" ON "public"."ratings";
CREATE POLICY "Customers rate own completed jobs"
    ON "public"."ratings" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM "public"."customers" c
            JOIN "public"."users" u ON u."user_id" = c."user_id"
            JOIN "public"."job_requests" j ON j."job_id" = "ratings"."job_id"
            WHERE c."customer_id" = "ratings"."customer_id"
              AND u."auth_id" = "auth"."uid"()
              AND j."customer_id" = c."customer_id"
              AND j."job_status" = 'Completed'
        )
    );

DROP POLICY IF EXISTS "Admins view ratings" ON "public"."ratings";
CREATE POLICY "Admins view ratings"
    ON "public"."ratings" FOR SELECT
    USING ("public"."is_admin"());


-- ═══════════════════════════════════════════════════════════════════════
--  4. JOB_REQUESTS  (M4 — each side sees only their own)
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Customers view own requests" ON "public"."job_requests";
CREATE POLICY "Customers view own requests"
    ON "public"."job_requests" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."customers" c
            JOIN "public"."users" u ON u."user_id" = c."user_id"
            WHERE c."customer_id" = "job_requests"."customer_id"
              AND u."auth_id" = "auth"."uid"()
        )
    );

DROP POLICY IF EXISTS "Providers view own requests" ON "public"."job_requests";
CREATE POLICY "Providers view own requests"
    ON "public"."job_requests" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."providers" p
            JOIN "public"."users" u ON u."user_id" = p."user_id"
            WHERE p."provider_id" = "job_requests"."provider_id"
              AND u."auth_id" = "auth"."uid"()
        )
    );

DROP POLICY IF EXISTS "Customers create own requests" ON "public"."job_requests";
CREATE POLICY "Customers create own requests"
    ON "public"."job_requests" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."customers" c
            JOIN "public"."users" u ON u."user_id" = c."user_id"
            WHERE c."customer_id" = "job_requests"."customer_id"
              AND u."auth_id" = "auth"."uid"()
        )
    );

-- Providers accept / decline / complete their own jobs.
DROP POLICY IF EXISTS "Providers update own requests" ON "public"."job_requests";
CREATE POLICY "Providers update own requests"
    ON "public"."job_requests" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."providers" p
            JOIN "public"."users" u ON u."user_id" = p."user_id"
            WHERE p."provider_id" = "job_requests"."provider_id"
              AND u."auth_id" = "auth"."uid"()
        )
    );

DROP POLICY IF EXISTS "Admins view job requests" ON "public"."job_requests";
CREATE POLICY "Admins view job requests"
    ON "public"."job_requests" FOR SELECT
    USING ("public"."is_admin"());


-- ═══════════════════════════════════════════════════════════════════════
--  5. CUSTOMERS  (own row only)
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Customers view own row" ON "public"."customers";
CREATE POLICY "Customers view own row"
    ON "public"."customers" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."users" u
            WHERE u."user_id" = "customers"."user_id"
              AND u."auth_id" = "auth"."uid"()
        )
    );

DROP POLICY IF EXISTS "Customers update own row" ON "public"."customers";
CREATE POLICY "Customers update own row"
    ON "public"."customers" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."users" u
            WHERE u."user_id" = "customers"."user_id"
              AND u."auth_id" = "auth"."uid"()
        )
    );

DROP POLICY IF EXISTS "Admins view customers" ON "public"."customers";
CREATE POLICY "Admins view customers"
    ON "public"."customers" FOR SELECT
    USING ("public"."is_admin"());


-- ═══════════════════════════════════════════════════════════════════════
--  5b. PROVIDERS — let a provider edit their own row (M3 portfolio)
--
--  The base schema only had "Admins update providers", so providers could
--  not edit their own bio. This adds self-service UPDATE. admin_status is
--  protected by the WITH CHECK clause: a provider cannot approve themselves.
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Providers update own row" ON "public"."providers";
CREATE POLICY "Providers update own row"
    ON "public"."providers" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."users" u
            WHERE u."user_id" = "providers"."user_id"
              AND u."auth_id" = "auth"."uid"()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."users" u
            WHERE u."user_id" = "providers"."user_id"
              AND u."auth_id" = "auth"."uid"()
        )
        AND "admin_status" = 'Approved'
    );


-- ═══════════════════════════════════════════════════════════════════════
--  6. SAFE IDENTITY LOOKUPS  (SECURITY DEFINER — safe columns only)
--
--  All varchar columns are cast to text so the declared return types match
--  exactly; a mismatch raises "structure of query does not match function
--  result type" at call time.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 6a. Approved provider directory (M5 search + profile) ──────────────
-- Pass NULL for the whole directory, or an id for one provider.

CREATE OR REPLACE FUNCTION "public"."get_approved_providers"(
    "p_provider_id" bigint DEFAULT NULL
)
RETURNS TABLE (
    "provider_id"    bigint,
    "full_name"      "text",
    "trade_category" "text",
    "barangay"       "text",
    "bio"            "text",
    "average_rating" numeric,
    "review_count"   bigint,
    "id_verified"    boolean
)
LANGUAGE "sql"
STABLE
SECURITY DEFINER
SET "search_path" = "public"
AS $$
    SELECT
        p.provider_id,
        u.full_name::text,
        p.trade_category::text,
        u.barangay::text,
        p.bio::text,
        p.average_rating,
        (SELECT count(*) FROM ratings r WHERE r.provider_id = p.provider_id),
        COALESCE(
            (SELECT pi.id_verified_at IS NOT NULL
             FROM provider_identity pi
             WHERE pi.provider_id = p.provider_id),
            false
        )
    FROM providers p
    JOIN users u ON u.user_id = p.user_id
    WHERE p.admin_status = 'Approved'
      AND (p_provider_id IS NULL OR p.provider_id = p_provider_id)
    ORDER BY p.average_rating DESC, u.full_name ASC;
$$;

ALTER FUNCTION "public"."get_approved_providers"(bigint) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_approved_providers"(bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_approved_providers"(bigint) TO "anon";


-- ── 6b. Reviews with reviewer names (M6) ───────────────────────────────

CREATE OR REPLACE FUNCTION "public"."get_provider_reviews"(
    "p_provider_id" bigint
)
RETURNS TABLE (
    "rating_id"     bigint,
    "stars"         smallint,
    "review_text"   "text",
    "rated_at"      timestamp with time zone,
    "reviewer_name" "text"
)
LANGUAGE "sql"
STABLE
SECURITY DEFINER
SET "search_path" = "public"
AS $$
    SELECT
        r.rating_id,
        r.stars,
        r.review_text::text,
        r.rated_at,
        u.full_name::text
    FROM ratings r
    JOIN customers c ON c.customer_id = r.customer_id
    JOIN users u     ON u.user_id     = c.user_id
    JOIN providers p ON p.provider_id = r.provider_id
    WHERE r.provider_id = p_provider_id
      AND p.admin_status = 'Approved'
    ORDER BY r.rated_at DESC;
$$;

ALTER FUNCTION "public"."get_provider_reviews"(bigint) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_provider_reviews"(bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_provider_reviews"(bigint) TO "anon";


-- ── 6c. The signed-in CUSTOMER's own requests, with provider names ─────

CREATE OR REPLACE FUNCTION "public"."get_my_customer_requests"()
RETURNS TABLE (
    "job_id"              bigint,
    "provider_id"         bigint,
    "provider_name"       "text",
    "trade_category"      "text",
    "service_description" "text",
    "service_barangay"    "text",
    "job_status"          "text",
    "requested_at"        timestamp with time zone
)
LANGUAGE "sql"
STABLE
SECURITY DEFINER
SET "search_path" = "public"
AS $$
    SELECT
        j.job_id,
        j.provider_id,
        pu.full_name::text,
        p.trade_category::text,
        j.service_description::text,
        j.service_barangay::text,
        j.job_status::text,
        j.requested_at
    FROM job_requests j
    JOIN providers p  ON p.provider_id = j.provider_id
    JOIN users pu     ON pu.user_id    = p.user_id
    JOIN customers c  ON c.customer_id = j.customer_id
    JOIN users cu     ON cu.user_id    = c.user_id
    WHERE cu.auth_id = auth.uid()
    ORDER BY j.requested_at DESC;
$$;

ALTER FUNCTION "public"."get_my_customer_requests"() OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_my_customer_requests"() TO "authenticated";


-- ── 6d. The signed-in PROVIDER's incoming requests, with customer names ─

CREATE OR REPLACE FUNCTION "public"."get_my_provider_requests"()
RETURNS TABLE (
    "job_id"              bigint,
    "customer_name"       "text",
    "service_description" "text",
    "service_barangay"    "text",
    "job_status"          "text",
    "requested_at"        timestamp with time zone
)
LANGUAGE "sql"
STABLE
SECURITY DEFINER
SET "search_path" = "public"
AS $$
    SELECT
        j.job_id,
        cu.full_name::text,
        j.service_description::text,
        j.service_barangay::text,
        j.job_status::text,
        j.requested_at
    FROM job_requests j
    JOIN customers c ON c.customer_id = j.customer_id
    JOIN users cu    ON cu.user_id    = c.user_id
    JOIN providers p ON p.provider_id = j.provider_id
    JOIN users pu    ON pu.user_id    = p.user_id
    WHERE pu.auth_id = auth.uid()
    ORDER BY j.requested_at DESC;
$$;

ALTER FUNCTION "public"."get_my_provider_requests"() OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_my_provider_requests"() TO "authenticated";
