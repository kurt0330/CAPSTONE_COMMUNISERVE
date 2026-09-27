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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'var(--cs-font)', color: 'var(--cs-text)' }}>

      {/* ── Top Header ── (reskinned: white bar + hairline, design system v2) */}
      <header className="main-header" style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 24px',
        height:         90,
        boxSizing:      'border-box', // width:100% + padding was overflowing the viewport
        background:     'var(--cs-surface)',
        borderBottom:   '1px solid var(--cs-border)',
      }}>
        <h1 className="web-title" style={{
          color: 'var(--cs-primary)', fontFamily: 'var(--cs-font)',
          fontWeight: 800, letterSpacing: '-0.5px',
        }}>
          COMMUNISERVE
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: 'var(--cs-primary)',
            background: 'var(--cs-primary-tint)',
            padding: '4px 12px', borderRadius: 20,
          }}>
            Admin Panel
          </span>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--cs-primary)', color: '#fff',
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
        <main style={{ flex: 1, padding: '30px 32px', background: 'var(--cs-bg)', minWidth: 0 }}>
          {children}
        </main>
      </div>

    </div>
  );
}