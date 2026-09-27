// PATH: /src/app/customer/(authenticated)/dashboard/page.js
// Customer dashboard — Server Component.
// Fetches customer stats + recent job requests server-side.

import { createServerClient } from '@/lib/supabase/server';
import { createClient }       from '@supabase/supabase-js';
import { redirect }           from 'next/navigation';
import Link                   from 'next/link';
import Icon                   from '@/components/ui/Icon';
import EmptyState             from '@/components/shared/EmptyState';

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
    <div className="app-page">

      {/* Greeting + primary action */}
      <div className="dash-hero">
        <div>
          <h1 className="dash-greeting">Hello, {firstName}!</h1>
          <p className="dash-greeting-sub">
            Find and hire trusted local service providers in {publicUser.barangay}.
          </p>
        </div>
        <Link href="/customer/search" className="btn-primary-app">
          <Icon name="search" size="sm" />
          Find a Provider
        </Link>
      </div>

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard icon="clipboard"    value={pendingCount   ?? 0} label="Active Requests" />
        <MetricCard icon="wrench"       value={ongoingCount   ?? 0} label="Jobs Ongoing" />
        <MetricCard icon="check-circle" value={completedCount ?? 0} label="Jobs Completed" />
      </div>

      <div className="dash-grid">

        {/* Left: Recent requests */}
        <div>
          <section className="section-card">
            <div className="section-card-head">
              <h2 className="section-card-title">Recent Service Requests</h2>
              <Link href="/customer/requests" className="section-card-link">View All</Link>
            </div>
            <div className="section-card-body">
              <EmptyState
                icon="inbox"
                title="Your service request history will appear here."
                hint="Start by searching for a provider in your barangay."
              />
            </div>
          </section>

          <Link href="/customer/requests" className="link-row">
            <span className="icon-badge icon-badge--sm"><Icon name="clipboard" size="sm" /></span>
            <span className="link-row-label">View All Requests</span>
            <Icon name="chevron-right" size="md" />
          </Link>
        </div>

        {/* Right: Profile */}
        <section className="section-card">
          <div className="section-card-head">
            <h2 className="section-card-title">My Profile</h2>
          </div>
          <div className="section-card-body">
            <div className="info-list">
              <InfoRow icon="user"    label="Full Name"      value={publicUser.full_name} />
              <InfoRow icon="map-pin" label="Barangay"       value={publicUser.barangay} />
              <InfoRow icon="phone"   label="Contact"        value={publicUser.contact_number ?? 'Not set'} />
              <InfoRow icon="home"    label="Preferred Area" value={customerRow.preferred_barangay ?? publicUser.barangay} />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MetricCard({ icon, value, label }) {
  return (
    <div className="metric-card">
      <Icon name={icon} size="lg" />
      <div>
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="info-row">
      <span className="icon-badge icon-badge--sm"><Icon name={icon} size="sm" /></span>
      <div className="info-row-body">
        <p className="info-label">{label}</p>
        <p className="info-value">{value}</p>
      </div>
    </div>
  );
}