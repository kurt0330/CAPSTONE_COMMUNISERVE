// PATH: /src/actions/adminActions.js
// Replaces: approve/reject button wiring from admin_dashboard.js
// Two Server Actions: approveProvider() and rejectProvider()
// Both update providers.admin_status and handle the rejected_at timestamp.

'use server';

import { createServerClient } from '@/lib/supabase/server';

// ── Shared auth check ─────────────────────────────────────────────────────
async function assertAdmin(supabase) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', session.user.id)
    .single();

  if (!user || user.role !== 'Admin') throw new Error('Forbidden');
}

// ── Approve ───────────────────────────────────────────────────────────────
export async function approveProvider(providerId) {
  const supabase = createServerClient();
  try {
    await assertAdmin(supabase);

    const { error } = await supabase
      .from('providers')
      .update({
        admin_status: 'Approved',
        rejected_at:  null,           // clear any prior rejection timestamp
      })
      .eq('provider_id', providerId);

    if (error) throw error;
    return { success: true };

  } catch (err) {
    console.error('[adminActions] approveProvider error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Reject ────────────────────────────────────────────────────────────────
export async function rejectProvider(providerId) {
  const supabase = createServerClient();
  try {
    await assertAdmin(supabase);

    const { error } = await supabase
      .from('providers')
      .update({
        admin_status: 'Rejected',
        rejected_at:  new Date().toISOString(),  // drives 14-day re-apply timer
      })
      .eq('provider_id', providerId);

    if (error) throw error;
    return { success: true };

  } catch (err) {
    console.error('[adminActions] rejectProvider error:', err.message);
    return { success: false, error: err.message };
  }
}