-- ═══════════════════════════════════════════════════════════════════
--  Realtime for the hiring flow
--  Adds job_requests and job_offers to the supabase_realtime publication
--  so the customer and provider portals receive INSERT / UPDATE / DELETE
--  events (src/hooks/useJobRealtime.js).
--
--  Additive and idempotent: no table, column or row is changed. Realtime
--  applies each table's existing RLS SELECT policies per subscriber, so a
--  user only receives changes to jobs they are a party to.
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['job_requests', 'job_offers'] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = t
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        END IF;
    END LOOP;
END $$;
