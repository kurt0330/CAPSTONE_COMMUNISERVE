-- ═══════════════════════════════════════════════════════════════════
--  Full-page profiles: customer street address + provider work gallery
--
--  Additive only: one nullable column, one new table with RLS, one new
--  storage bucket with per-user policies. Nothing existing is changed.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Customer street address (editable; the barangay stays verified) ──
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS street_address varchar(160);

-- ── 2. Provider work gallery ────────────────────────────────────────
-- Photos of finished work, shown publicly on the provider's profile.
-- Kept apart from provider_files, which holds application documents and
-- certificates (private) and has a fixed list of file types.
CREATE TABLE IF NOT EXISTS public.provider_gallery (
    image_id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_id bigint NOT NULL REFERENCES public.providers(provider_id) ON DELETE CASCADE,
    file_path   text   NOT NULL,          -- object path in the provider-gallery bucket
    caption     varchar(120),
    created_at  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_gallery_provider_idx
    ON public.provider_gallery (provider_id, created_at DESC);

ALTER TABLE public.provider_gallery ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
                   AND tablename = 'provider_gallery' AND policyname = 'Providers manage own gallery') THEN
        CREATE POLICY "Providers manage own gallery" ON public.provider_gallery
            FOR ALL TO authenticated
            USING (EXISTS (SELECT 1 FROM providers p JOIN users u ON u.user_id = p.user_id
                           WHERE p.provider_id = provider_gallery.provider_id AND u.auth_id = auth.uid()))
            WITH CHECK (EXISTS (SELECT 1 FROM providers p JOIN users u ON u.user_id = p.user_id
                                WHERE p.provider_id = provider_gallery.provider_id AND u.auth_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
                   AND tablename = 'provider_gallery' AND policyname = 'Gallery of approved providers is visible') THEN
        CREATE POLICY "Gallery of approved providers is visible" ON public.provider_gallery
            FOR SELECT TO authenticated
            USING (EXISTS (SELECT 1 FROM providers p
                           WHERE p.provider_id = provider_gallery.provider_id AND p.admin_status = 'Approved'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
                   AND tablename = 'provider_gallery' AND policyname = 'Admins view gallery') THEN
        CREATE POLICY "Admins view gallery" ON public.provider_gallery
            FOR SELECT TO authenticated USING (is_admin());
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_gallery TO authenticated;
GRANT ALL ON public.provider_gallery TO service_role;

-- ── 3. Storage: provider-gallery (PUBLIC, images only, 5 MB) ────────
-- Work photos are meant to be seen, so this bucket is public like avatars.
-- Résumés and certificates stay in the PRIVATE provider-documents bucket.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('provider-gallery', 'provider-gallery', true, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
    b   text := 'provider-gallery';
    act text;
BEGIN
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
END $$;
