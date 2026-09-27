-- ═══════════════════════════════════════════════════════════════════════
--  CommuniServe — National ID PIN verification
--  Migration: create public.provider_identity
--
--  Implements CAPSTONE_DOCS.md §0.1 deviation D-1 and BR-17: providers are
--  verified by a National ID PIN number, not by an uploaded ID photo.
--
--  Run this in the Supabase SQL Editor. It is idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
--  NOTE ON provider_files — INTENTIONALLY NOT MODIFIED
--
--  This migration does NOT touch public.provider_files. There are no
--  "file_national_id" / "file_national_id_back" COLUMNS to drop or relax:
--  provider_files stores one ROW per uploaded file, and ID uploads were
--  simply rows whose file_type was 'national_id' / 'national_id_back'.
--
--  That table's CHECK constraint still permits both of those values, so
--  ID uploads can be reintroduced later (e.g. from a profile editor) by
--  inserting rows again — no schema change required then or now.
--  The application has merely stopped creating those rows.
-- ───────────────────────────────────────────────────────────────────────


-- ── 1. Table ───────────────────────────────────────────────────────────
-- Kept OUT of public.providers on purpose: customers can read approved
-- providers rows, and RLS is row-level, so the PIN must live in a table
-- customers cannot read at all.

CREATE TABLE IF NOT EXISTS "public"."provider_identity" (
    "provider_id"     bigint NOT NULL,
    "national_id_pin" "text" NOT NULL,
    "id_verified_at"  timestamp with time zone,
    "id_verified_by"  bigint,
    "created_at"      timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."provider_identity" OWNER TO "postgres";


-- ── 2. Keys and constraints ────────────────────────────────────────────

DO $$
BEGIN
    -- Primary key (one identity row per provider)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_identity_pkey') THEN
        ALTER TABLE "public"."provider_identity"
            ADD CONSTRAINT "provider_identity_pkey" PRIMARY KEY ("provider_id");
    END IF;

    -- Deleting a provider removes their identity row (matches provider_files)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_identity_provider_id_fkey') THEN
        ALTER TABLE "public"."provider_identity"
            ADD CONSTRAINT "provider_identity_provider_id_fkey"
            FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id") ON DELETE CASCADE;
    END IF;

    -- Which admin verified the PIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_identity_id_verified_by_fkey') THEN
        ALTER TABLE "public"."provider_identity"
            ADD CONSTRAINT "provider_identity_id_verified_by_fkey"
            FOREIGN KEY ("id_verified_by") REFERENCES "public"."admins"("admin_id");
    END IF;

    -- BR-17: UNIQUE PIN blocks duplicate / fraudulent registrations
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_identity_national_id_pin_key') THEN
        ALTER TABLE "public"."provider_identity"
            ADD CONSTRAINT "provider_identity_national_id_pin_key" UNIQUE ("national_id_pin");
    END IF;

    -- Format guard. Digits only, 12–16 characters.
    -- The app enforces an exact length via NATIONAL_ID_PIN_LENGTH in
    -- src/lib/constants.js (currently 16 = PhilSys Card Number). The range is
    -- deliberately wider here because CAPSTONE_DOCS.md Q-01 has not confirmed
    -- whether the LGU wants the 16-digit PCN or the 12-digit PSN — this way a
    -- change of mind is a constants.js edit, not another migration.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_identity_pin_format_check') THEN
        ALTER TABLE "public"."provider_identity"
            ADD CONSTRAINT "provider_identity_pin_format_check"
            CHECK ("national_id_pin" ~ '^[0-9]{12,16}$');
    END IF;
END
$$;


-- ── 3. Row Level Security (BR-11, BR-17) ───────────────────────────────
-- The PIN must be readable ONLY by the owning provider and by admins, and
-- must never be returned by public or customer-facing queries.

ALTER TABLE "public"."provider_identity" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers view own identity" ON "public"."provider_identity";
CREATE POLICY "Providers view own identity"
    ON "public"."provider_identity"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM "public"."providers" p
            JOIN "public"."users" u ON u."user_id" = p."user_id"
            WHERE p."provider_id" = "provider_identity"."provider_id"
              AND u."auth_id" = "auth"."uid"()
        )
    );

DROP POLICY IF EXISTS "Admins view all identities" ON "public"."provider_identity";
CREATE POLICY "Admins view all identities"
    ON "public"."provider_identity"
    FOR SELECT
    USING ("public"."is_admin"());

-- Admins mark a PIN verified (sets id_verified_at / id_verified_by)
DROP POLICY IF EXISTS "Admins update identities" ON "public"."provider_identity";
CREATE POLICY "Admins update identities"
    ON "public"."provider_identity"
    FOR UPDATE
    USING ("public"."is_admin"());

-- No INSERT policy by design: applications are written by the registration
-- server action using the service role key, which bypasses RLS.


-- ── 4. Grants ──────────────────────────────────────────────────────────
-- Deliberately NOT granted to "anon". This is the most sensitive table in
-- the schema, so it gets defence in depth: RLS plus no anonymous grant.

GRANT ALL ON TABLE "public"."provider_identity" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_identity" TO "service_role";


-- ── 5. Helpful index for the admin verification queue ──────────────────
CREATE INDEX IF NOT EXISTS "provider_identity_unverified_idx"
    ON "public"."provider_identity" ("id_verified_at")
    WHERE "id_verified_at" IS NULL;
