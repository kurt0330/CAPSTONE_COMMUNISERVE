// PATH: /src/lib/supabase/server.js
// Server-side client — used in Server Actions, API Routes, Server Components
// Uses service role key to BYPASS RLS when needed (admin operations)

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}