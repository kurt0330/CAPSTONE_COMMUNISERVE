// PATH: /src/lib/supabase/admin.js
// Service-role Supabase client — bypasses RLS.
//
// ⚠ SERVER ONLY. Never import this from a 'use client' component. The service
// role key must never reach the browser (CAPSTONE_DOCS.md §0 rule 4); it is
// safe here only because Route Handlers and Server Components run on the server.
//
// This factory replaces the inline createClient(...SERVICE_ROLE_KEY) block that
// is currently repeated across the dashboards, layouts and server actions.
// Existing call sites keep working as-is; new code should use this.

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      '[CommuniServe] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add both to .env.local — see .env.example.'
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** True when both Supabase environment variables are present. */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
