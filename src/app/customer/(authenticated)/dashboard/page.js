// PATH: /src/app/customer/(authenticated)/dashboard/page.js
// Customer dashboard — Server Component.
// Fetches customer stats + recent job requests server-side.

import { createServerClient } from '@/lib/supabase/server';
import { createClient }       from '@supabase/supabase-js';
import { redirect }           from 'next/navigation';
import Link                   from 'next/link';

export const metadata = { title: 'My Dashboard — CommuniServe Resident' };

export default async function CustomerDashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const adminSupa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: publicUser } = await adminSupa
    .from('users')
    .select('user_id, full_name, barangay, contact_number')
    .eq('auth_id', user.id)
    .single();

  if (!publicUser) redirect('/auth/login');

  const { data: customerRow } = await adminSupa
    .from('customers')
    .select('customer_id, preferred_barangay')
    .eq('user_id', publicUser.user_id)
    .single();

  if (!customerRow) redirect('/auth/login');

  // ── Job stats ──────────────────────────────────────────────────────────
  const [
    { count: pendingCount   },
    { count: ongoingCount   },
    { count: completedCount },
  ] = await Promise.all([
    adminSupa.from('job_requests')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerRow.customer_id)
      .in('job_status', ['Pending', 'Accepted']),
    adminSupa.from('job_requests')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerRow.customer_id)
      .eq('job_status', 'Ongoing'),
    adminSupa.from('job_requests')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerRow.customer_id)
      .eq('job_status', 'Completed'),
  ]);

  const firstName = publicUser.full_name?.split(' ')[0] ?? 'Resident';

  return (
    <div style={pageStyles.wrap}>

      {/* Welcome */}
      <div style={pageStyles.welcomeRow}>
        <div>
          <h2 style={pageStyles.welcomeTitle}>Hello, {firstName}! 👋</h2>
          <p style={pageStyles.welcomeSub}>
            Find and hire trusted local service providers in {publicUser.barangay}.
          </p>
        </div>
        <Link href="/customer/search" style={pageStyles.findBtn}>
          Find a Provider →
        </Link>
      </div>

      {/* Stats */}
      <div style={pageStyles.statsGrid}>
        <StatCard label="Active Requests" value={pendingCount   ?? 0} icon="📋" color="#0504AA" bg="#eef0ff" />
        <StatCard label="Jobs Ongoing"    value={ongoingCount   ?? 0} icon="🔧" color="#8b5cf6" bg="#f3eeff" />
        <StatCard label="Jobs Completed"  value={completedCount ?? 0} icon="✅" color="#1D9E75" bg="#e6f7f1" />
      </div>

      {/* Two-column body */}
      <div style={pageStyles.bodyGrid}>

        {/* Left: Recent requests placeholder */}
        <Section title="Recent Service Requests">
          <div style={pageStyles.placeholder}>
            📬 Your service request history will appear here.
            <br />
            <span style={{ fontSize: 11, marginTop: 6, display: 'block' }}>
              Start by searching for a provider in your barangay.
            </span>
          </div>
        </Section>

        {/* Right: Profile card */}
        <Section title="My Profile">
          <div style={pageStyles.profileGrid}>
            <ProfileRow label="Full Name"   value={publicUser.full_name} />
            <ProfileRow label="Barangay"    value={publicUser.barangay} />
            <ProfileRow label="Contact"     value={publicUser.contact_number ?? 'Not set'} />
            <ProfileRow label="Pref. Area"  value={customerRow.preferred_barangay ?? publicUser.barangay} />
          </div>
        </Section>

      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ ...pageStyles.statCard, borderLeft: `4px solid ${color}` }}>
      <div style={{ ...pageStyles.statIcon, background: bg, color }}>
        {icon}
      </div>
      <div>
        <div style={pageStyles.statValue}>{value}</div>
        <div style={pageStyles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={pageStyles.section}>
      <div style={pageStyles.sectionHeader}>
        <p style={pageStyles.sectionTitle}>{title}</p>
      </div>
      <div style={pageStyles.sectionBody}>{children}</div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div style={pageStyles.profileRow}>
      <span style={pageStyles.profileLabel}>{label}</span>
      <span style={pageStyles.profileValue}>{value}</span>
    </div>
  );
}

// ── Page styles ────────────────────────────────────────────────────────────

const pageStyles = {
  wrap: {
    padding:   '32px 36px',
    maxWidth:  1060,
    margin:    '0 auto',
    fontFamily:'Arial, sans-serif',
  },
  welcomeRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   28,
    flexWrap:       'wrap',
    gap:            12,
  },
  welcomeTitle: {
    fontSize:   22,
    fontWeight: 700,
    color:      '#0504AA',
    margin:     '0 0 4px',
  },
  welcomeSub: {
    fontSize: 13,
    color:    '#777',
    margin:   0,
  },
  findBtn: {
    background:     '#0504AA',
    color:          '#fff',
    textDecoration: 'none',
    padding:        '10px 22px',
    borderRadius:   8,
    fontSize:       14,
    fontWeight:     700,
    whiteSpace:     'nowrap',
  },
  statsGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap:                 16,
    marginBottom:        28,
  },
  statCard: {
    background:   '#fff',
    borderRadius: 10,
    padding:      '16px 18px',
    display:      'flex',
    alignItems:   'center',
    gap:          12,
    boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
  },
  statIcon: {
    width:          40,
    height:         40,
    borderRadius:   8,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       18,
    flexShrink:     0,
  },
  statValue: {
    fontSize:   22,
    fontWeight: 700,
    color:      '#222',
    lineHeight: 1,
  },
  statLabel: {
    fontSize:      11,
    color:         '#888',
    marginTop:     3,
    fontWeight:    600,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  bodyGrid: {
    display:             'grid',
    gridTemplateColumns: '1fr 320px',
    gap:                 20,
    alignItems:          'start',
  },
  section: {
    background:   '#fff',
    borderRadius: 10,
    boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
    overflow:     'hidden',
  },
  sectionHeader: {
    padding:      '14px 20px',
    borderBottom: '1px solid #f0f0f0',
  },
  sectionTitle: {
    margin:        0,
    fontSize:      11,
    fontWeight:    700,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color:         '#0504AA',
  },
  sectionBody: {
    padding: '16px 20px',
  },
  placeholder: {
    padding:      '28px 20px',
    textAlign:    'center',
    color:        '#bbb',
    fontSize:     13,
    border:       '1.5px dashed #dce0f5',
    borderRadius: 8,
    background:   '#f8f9fc',
    lineHeight:   1.6,
  },
  profileGrid: {
    display:       'flex',
    flexDirection: 'column',
    gap:           14,
  },
  profileRow: {
    display:       'flex',
    flexDirection: 'column',
    gap:           2,
  },
  profileLabel: {
    fontSize:      10,
    fontWeight:    700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color:         '#aaa',
  },
  profileValue: {
    fontSize:   13,
    color:      '#222',
    fontWeight: 500,
  },
};