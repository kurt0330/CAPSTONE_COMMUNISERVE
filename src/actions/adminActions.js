// PATH: /src/actions/adminActions.js
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js'; // ADDED for service role
import { Resend } from 'resend';                      // ADDED for emails

// ── Service role client for Auth admin operations (Bypasses RLS securely) ──
function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ── Shared auth check ─────────────────────────────────────────────────────
async function assertAdmin(supabase) {
  // Upgraded to getUser() for strict security in Next.js 15
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (!userData || userData.role !== 'Admin') throw new Error('Forbidden');
}

// ── Approve (UPDATED TO CREATE AUTH ACCOUNT & SEND EMAIL) ─────────────────
export async function approveProvider(providerId) {
  const supabase = createServerClient();
  try {
    await assertAdmin(supabase);

    const adminSupa = adminSupabase();

    // 1. Fetch the provider's user record
    const { data: providerRow, error: provErr } = await adminSupa
      .from('providers')
      .select(`
        provider_id,
        admin_status,
        users (
          user_id,
          full_name,
          email,
          auth_id,
          onboarding_complete
        )
      `)
      .eq('provider_id', providerId)
      .single();

    if (provErr || !providerRow) throw new Error(`Provider not found: ${provErr?.message}`);

    const providerUser = providerRow.users;
    if (!providerUser?.email) throw new Error('Provider has no email address on record.');

    // Safety Check: Avoid re-provisioning an already approved account
    if (providerRow.admin_status === 'Approved') {
      return { success: false, error: 'This provider is already approved.' };
    }

    // 2. Create Supabase Auth account using the default temp password
    let authUserId = providerUser.auth_id;

    if (!authUserId) {
      const tempPassword = process.env.PROVIDER_TEMP_PASSWORD ?? 'CommuniServe@2025!';

      const { data: newAuthUser, error: authErr } = await adminSupa.auth.admin.createUser({
        email: providerUser.email,
        password: tempPassword,
        email_confirm: true, // Skip confirmation email — we send our own custom one
        user_metadata: {
          full_name: providerUser.full_name,
          role: 'Provider',
        },
      });

      if (authErr) {
        // If user already exists in Auth, fetch their id
        if (authErr.message?.toLowerCase().includes('already been registered') || authErr.message?.toLowerCase().includes('already exists')) {
          const { data: existingList } = await adminSupa.auth.admin.listUsers();
          const existing = existingList?.users?.find((u) => u.email === providerUser.email);
          if (existing) {
            authUserId = existing.id;
          } else {
            throw new Error(`Auth creation failed: ${authErr.message}`);
          }
        } else {
          throw new Error(`Auth creation failed: ${authErr.message}`);
        }
      } else {
        authUserId = newAuthUser.user.id;
      }

      // 3. Backfill auth_id into public.users
      const { error: linkErr } = await adminSupa
        .from('users')
        .update({ auth_id: authUserId })
        .eq('user_id', providerUser.user_id);

      if (linkErr) throw new Error(`Failed to link auth_id: ${linkErr.message}`);
    }

    // 4. Update admin_status to 'Approved'
    const { error: statusErr } = await adminSupa
      .from('providers')
      .update({ admin_status: 'Approved', rejected_at: null })
      .eq('provider_id', providerId);

    if (statusErr) throw new Error(`Status update failed: ${statusErr.message}`);

    // 5. Send onboarding email via Resend
    await sendOnboardingEmail({
      to: providerUser.email,
      fullName: providerUser.full_name,
      password: process.env.PROVIDER_TEMP_PASSWORD ?? 'CommuniServe@2025!',
    });

    return { success: true };

  } catch (err) {
    console.error('[adminActions] approveProvider error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Reject (UNCHANGED FROM YOUR ORIGINAL FILE) ────────────────────────────
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

// ════════════════════════════════════════════════════════════════
// EMAIL HELPER (Uses Resend to send the Temp Password)
// ════════════════════════════════════════════════════════════════
async function sendOnboardingEmail({ to, fullName, password }) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login`;

    await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: [to],
      subject: '🎉 Your CommuniServe Provider Account is Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #0504AA;">Congratulations, ${fullName}!</h2>
          <p>Your service provider application has been reviewed and <strong>officially approved</strong> by the PESO Office.</p>
          <div style="background-color: #f4f6ff; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #dce0f5;">
            <h3 style="margin-top: 0; color: #333; font-size: 14px; text-transform: uppercase;">Your Login Credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="color: #0504AA; font-weight: bold; font-size: 16px;">${password}</code></p>
          </div>
          <p style="color: #E24B4A; font-weight: bold; font-size: 13px;">⚠ You will be required to change this password on your first login.</p>
          <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #0504AA; color: #fff; text-decoration: none; font-weight: bold; border-radius: 6px; margin-top: 10px;">Access Your Dashboard →</a>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('[sendOnboardingEmail] failed:', emailErr.message);
  }
}