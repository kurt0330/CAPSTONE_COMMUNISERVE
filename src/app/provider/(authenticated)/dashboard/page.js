// PATH: /src/app/provider/(authenticated)/dashboard/page.js
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/shared/EmptyState';

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
    <div className="app-page">

      {/* ── Greeting + status ── */}
      <div className="dash-hero">
        <div>
          <h1 className="dash-greeting">Good day, {firstName}!</h1>
          <p className="dash-greeting-sub">Here is your service activity overview.</p>
        </div>
        <span className="verified-badge">
          <span className="status-dot status-dot--on" />
          {provider?.admin_status} · {provider?.trade_category}
        </span>
      </div>

      <div className="dash-grid">

        {/* Main content */}
        <div>
          <section className="section-card">
            <div className="section-card-head">
              <h2 className="section-card-title">Job Requests</h2>
              <Link href="/provider/requests" className="section-card-link">View All</Link>
            </div>
            <div className="section-card-body">
              <EmptyState
                icon="inbox"
                tone="primary"
                title="Live job requests coming soon!"
                hint="Your pending requests will appear here once customers begin booking."
              />
            </div>
          </section>

          <Link href="/provider/portfolio" className="link-row">
            <span className="icon-badge icon-badge--sm"><Icon name="briefcase" size="sm" /></span>
            <span className="link-row-label">View My Portfolio</span>
            <Icon name="chevron-right" size="md" />
          </Link>
        </div>

        {/* Profile snapshot */}
        <section className="section-card">
          <div className="section-card-head">
            <h2 className="section-card-title">My Profile Snapshot</h2>
          </div>
          <div className="section-card-body">
            <div className="info-list">
              <InfoRow icon="user"         label="Name"   value={publicUser?.full_name} />
              <InfoRow icon="briefcase"    label="Trade"  value={`${provider?.trade_category ?? ''} · ${publicUser?.barangay ?? ''}`} />
              <InfoRow icon="mail"         label="Email"  value={publicUser?.email} />
              <InfoRow icon="shield-check" label="Status" value={provider?.admin_status} success />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, success = false }) {
  return (
    <div className="info-row">
      <span className="icon-badge icon-badge--sm"><Icon name={icon} size="sm" /></span>
      <div className="info-row-body">
        <p className="info-label">{label}</p>
        <p className={`info-value${success ? ' info-value--success' : ''}`}>{value}</p>
      </div>
    </div>
  );
}