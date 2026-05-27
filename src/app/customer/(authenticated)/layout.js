// PATH: /src/app/customer/(authenticated)/layout.js
// Auth guard for all /customer/(authenticated)/* routes.
// Pattern mirrors /provider/(authenticated)/layout.js exactly.
// Verifies: session exists + role = 'Customer' + email confirmed.

import { redirect }           from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { createClient }       from '@supabase/supabase-js';
import Link                   from 'next/link';

export const metadata = {
  title: 'My Dashboard — CommuniServe',
};

export default async function CustomerAuthLayout({ children }) {

  // ── Gate 1: Active session ────────────────────────────────────────────
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect('/auth/login');

  // ── Gate 2: Email must be confirmed ──────────────────────────────────
  // Supabase sets email_confirmed_at once the OTP is verified.
  if (!user.email_confirmed_at) redirect('/auth/login');

  // ── Gate 3: Role must be Customer ─────────────────────────────────────
  const { data: publicUser } = await supabase
    .from('users')
    .select('user_id, full_name, barangay, role')
    .eq('auth_id', user.id)
    .single();

  if (!publicUser || publicUser.role !== 'Customer') redirect('/auth/login');

  // ── Gate 4: customers row must exist (service role for safety) ────────
  const adminSupa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: customerRow } = await adminSupa
    .from('customers')
    .select('customer_id')
    .eq('user_id', publicUser.user_id)
    .single();

  if (!customerRow) redirect('/auth/login');

  // ── All gates passed ──────────────────────────────────────────────────
  const initials = publicUser.full_name
    ?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'C';

  return (
    <div style={layoutStyles.root}>

      {/* ── Header ── */}
      <header style={layoutStyles.header}>

        {/* Brand */}
        <div style={layoutStyles.headerLeft}>
          <span style={layoutStyles.brandName}>COMMUNISERVE</span>
          <span style={layoutStyles.portalBadge}>Resident Portal</span>
        </div>

        {/* Nav links */}
        <nav style={layoutStyles.nav}>
          {[
            { label: 'Dashboard',        href: '/customer/dashboard' },
            { label: 'Find a Provider',  href: '/customer/search' },
            { label: 'My Requests',      href: '/customer/requests' },
          ].map(({ label, href }) => (
            <Link key={href} href={href} style={layoutStyles.navLink}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Identity + logout */}
        <div style={layoutStyles.headerRight}>
          <div style={layoutStyles.identityBlock}>
            <p style={layoutStyles.identityName}>{publicUser.full_name}</p>
            <p style={layoutStyles.identitySub}>{publicUser.barangay}</p>
          </div>
          <div style={layoutStyles.avatar}>{initials}</div>
          <a href="/customer/logout" style={layoutStyles.logoutBtn}>
            Sign Out
          </a>
        </div>

      </header>

      {/* ── Content ── */}
      <main style={layoutStyles.main}>
        {children}
      </main>

    </div>
  );
}

const layoutStyles = {
  root: {
    display:       'flex',
    flexDirection: 'column',
    minHeight:     '100vh',
    fontFamily:    'Arial, sans-serif',
    background:    '#f0f0f0',
  },
  header: {
    position:       'fixed',
    top:            0,
    left:           0,
    right:          0,
    zIndex:         1000,
    background:     '#0504AA',
    height:         70,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '0 28px',
    boxShadow:      '0 2px 8px rgba(0,0,0,0.15)',
  },
  headerLeft: {
    display:    'flex',
    alignItems: 'center',
    gap:        14,
  },
  brandName: {
    color:         '#fff',
    fontSize:      20,
    fontWeight:    700,
    letterSpacing: 1.2,
  },
  portalBadge: {
    background:    'rgba(255,255,255,0.15)',
    color:         'rgba(255,255,255,0.85)',
    fontSize:      11,
    fontWeight:    600,
    padding:       '3px 10px',
    borderRadius:  20,
    letterSpacing: '0.3px',
  },
  nav: {
    display: 'flex',
    gap:     4,
  },
  navLink: {
    color:          'rgba(255,255,255,0.80)',
    textDecoration: 'none',
    fontSize:       13,
    fontWeight:     600,
    padding:        '6px 14px',
    borderRadius:   6,
  },
  headerRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        12,
  },
  identityBlock: {
    textAlign: 'right',
  },
  identityName: {
    margin:     0,
    color:      '#fff',
    fontSize:   12,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  identitySub: {
    margin:     0,
    color:      'rgba(255,255,255,0.55)',
    fontSize:   10,
    lineHeight: 1.3,
  },
  avatar: {
    width:          36,
    height:         36,
    borderRadius:   '50%',
    background:     '#fff',
    color:          '#0504AA',
    fontWeight:     700,
    fontSize:       13,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    border:         '2px solid rgba(255,255,255,0.30)',
  },
  logoutBtn: {
    color:          'rgba(255,255,255,0.75)',
    fontSize:       12,
    fontWeight:     600,
    textDecoration: 'none',
    padding:        '6px 12px',
    borderRadius:   6,
    border:         '1px solid rgba(255,255,255,0.25)',
    whiteSpace:     'nowrap',
  },
  main: {
    flex:       1,
    paddingTop: 70,
    minHeight:  'calc(100vh - 70px)',
  },
};