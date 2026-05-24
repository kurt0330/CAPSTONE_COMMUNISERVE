// PATH: /src/app/provider/(authenticated)/dashboard/page.js
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export const metadata = { title: 'My Dashboard — CommuniServe Provider' };

export default async function ProviderDashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const adminSupa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: publicUser } = await adminSupa
    .from('users')
    .select('user_id, full_name, email, barangay')
    .eq('auth_id', user.id)
    .single();

  const { data: provider } = await adminSupa
    .from('providers')
    .select('trade_category, average_rating, admin_status')
    .eq('user_id', publicUser?.user_id)
    .single();

  const firstName = publicUser?.full_name?.split(' ')[0] ?? 'Provider';

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto' }}>
      
      {/* ── Welcome row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0504AA', margin: '0 0 4px' }}>Good day, {firstName}! 👋</h2>
          <p style={{ fontSize: 13, color: '#777', margin: 0 }}>Here is your service activity overview.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, padding: '8px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontSize: 13, color: '#555' }}>
          <span style={{ color: '#1D9E75', fontWeight: 700 }}>●</span> Approved · {provider?.trade_category}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        
        {/* Main Content Area */}
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 32, textAlign: 'center', border: '1.5px dashed #dce0f5' }}>
          <h3 style={{ color: '#0504AA', fontSize: 16 }}>📬 Live job requests coming soon!</h3>
          <p style={{ color: '#777', fontSize: 13 }}>Your pending requests will appear here once customers begin booking.</p>
        </div>

        {/* Profile Card */}
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '24px 20px' }}>
          <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 14, marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0504AA', margin: '0 0 10px' }}>My Profile Snapshot</p>
            <p style={{ margin: 0, fontWeight: 700, color: '#111', fontSize: 14 }}>{publicUser?.full_name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{provider?.trade_category} · {publicUser?.barangay}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#aaa' }}>Email</span>
              <div style={{ fontSize: 13, color: '#222', fontWeight: 500 }}>{publicUser?.email}</div>
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#aaa' }}>Status</span>
              <div style={{ fontSize: 13, color: '#1D9E75', fontWeight: 700 }}>{provider?.admin_status}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}