// PATH: /src/app/admin/layout.js
// Role: Admin shell — sidebar navigation + header + lightweight auth guard.
// All /admin/* pages inherit this layout automatically (Next.js App Router).
// Auth strategy: server-side session check via Supabase. Redirect to login if not Admin.

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'CommuniServe — Admin Dashboard',
};

export default async function AdminLayout({ children }) {

  // ── Server-side auth guard ────────────────────────────────────────────
  // Uses service role client to check the user's role in public.users.
  // If the session is missing or role !== 'Admin', redirect immediately.
  const supabase = createServerClient();

  // Securely get the verified user from the Supabase server
  const { 
    data: { user }, 
    error: authError 
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Confirm this auth user has Admin role in public.users
  const { data: publicUser } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('auth_id', user.id)
    .single();

  if (!publicUser || publicUser.role !== 'Admin') {
    // Authenticated but not an admin — send to login, not 404
    redirect('/auth/login');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Top Header ── */}
      <header className="main-header" style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 24px',
        height:         90,
      }}>
        <h1 className="web-title">COMMUNISERVE</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(255,255,255,0.15)',
            padding: '4px 12px', borderRadius: 20,
          }}>
            Admin Panel
          </span>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: '#fff', color: '#0504AA',
            fontWeight: 700, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
            title={publicUser.full_name}
          >
            {publicUser.full_name?.[0]?.toUpperCase() ?? 'A'}
          </div>
        </div>
      </header>

      {/* ── Body: Sidebar + Page Content ── */}
      <div style={{ display: 'flex', flex: 1, paddingTop: 90 }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: '30px 32px', background: '#f0f0f0', minWidth: 0 }}>
          {children}
        </main>
      </div>

    </div>
  );
}