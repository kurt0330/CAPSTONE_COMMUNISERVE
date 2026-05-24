// PATH: /src/app/provider/(authenticated)/layout.js
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import LogoutButton from '@/components/provider/LogoutButton';

export const metadata = {
  title: 'Provider Dashboard — CommuniServe',
};

export default async function AuthenticatedProviderLayout({ children }) {
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // 1. Fetch from public.users
  const { data: publicUser, error: userError } = await supabase
    .from('users')
    .select('user_id, full_name, role, onboarding_complete')
    .eq('auth_id', user.id)
    .single();

  if (userError || !publicUser || publicUser.role !== 'Provider') {
    redirect('/auth/login');
  }

  // 2. Kick them back to onboarding if they skipped it
  if (!publicUser.onboarding_complete) {
    redirect('/provider/onboarding'); 
  }

  // 3. Verify provider approval using service role (bypasses RLS limits for checking status)
  const adminSupa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: providerRow, error: provError } = await adminSupa
    .from('providers')
    .select('admin_status, trade_category, average_rating')
    .eq('user_id', publicUser.user_id)
    .single();

  if (provError || !providerRow || providerRow.admin_status !== 'Approved') {
    redirect('/auth/login');
  }

  const initials = publicUser.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'SP';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Arial, sans-serif', background: '#f0f0f0' }}>
      
      {/* ── Top Navigation Header ── */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: '#0504AA', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>COMMUNISERVE</h1>
          <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>Provider Portal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#f5c842', fontSize: 12 }}>★</span>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{providerRow.average_rating?.toFixed(2) ?? '0.00'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: '#fff', fontSize: 12, fontWeight: 600 }}>{publicUser.full_name}</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{providerRow.trade_category}</p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', color: '#0504AA', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.30)' }}>
              {initials}
            </div>
          </div>

          <LogoutButton />


        </div>
      </header>

      <main style={{ flex: 1, paddingTop: 70, minHeight: 'calc(100vh - 70px)' }}>
        {children}
      </main>
    </div>
  );
}