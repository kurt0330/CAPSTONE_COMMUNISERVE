// PATH: /src/app/provider/(authenticated)/dashboard/page.js
// Provider dashboard — Server Component.
//   • activity counts
//   • the 5 most recent completed jobs, each with the rating it received
// Read through the session client: the provider's own rows under RLS and
// SECURITY DEFINER functions scoped to the caller.

import { redirect } from 'next/navigation';
import Link         from 'next/link';

import { createServerClient } from '@/lib/supabase/server';
import Icon                   from '@/components/ui/Icon';
import Avatar                 from '@/components/shared/Avatar';
import EmptyState             from '@/components/shared/EmptyState';
import ListCard, { MetaItem } from '@/components/shared/ListCard';
import StarRating             from '@/components/shared/StarRating';

import { formatDate, formatPeso } from '@/lib/format';
import { negotiationState } from '@/lib/negotiation';

export const metadata = { title: 'My Dashboard — CommuniServe Provider' };

const RECENT_LIMIT = 5;

export default async function ProviderDashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: me } = await supabase
    .from('users')
    .select('user_id, full_name, nickname')
    .eq('auth_id', user.id)
    .single();

  if (!me) redirect('/auth/login');

  const [{ data: provider }, { data: jobRows }, { data: completedRows }] = await Promise.all([
    supabase.from('providers').select('trade_category, admin_status').eq('user_id', me.user_id).single(),
    supabase.rpc('get_provider_jobs'),
    supabase.rpc('get_provider_completed_jobs', { p_limit: RECENT_LIMIT }),
  ]);

  const jobs      = jobRows ?? [];
  const completed = completedRows ?? [];

  // Waiting on this provider: new fixed bookings + custom offers on their turn.
  const needsReply = jobs.filter((j) =>
    j.request_type === 'custom'
      ? negotiationState(j, 'provider').myTurn
      : j.job_status === 'Pending'
  ).length;
  const count = (...statuses) => jobs.filter((j) => statuses.includes(j.job_status)).length;
  const completedTotal = count('Completed');

  const greetingName = me.nickname || me.full_name?.split(' ')[0] || 'Provider';

  return (
    <div className="app-page">

      {/* Greeting + status */}
      <div className="dash-hero">
        <div>
          <h1 className="dash-greeting">Good day, {greetingName}!</h1>
          <p className="dash-greeting-sub">Here is your service activity overview.</p>
          <span className="verified-badge">
            <span className="status-dot status-dot--on" />
            {provider?.admin_status} · {provider?.trade_category}
          </span>
        </div>
        <div className="form-actions">
          <Link href="/provider/requests" className="btn-primary-app">
            <Icon name="clipboard" size="sm" />
            My Requests
          </Link>
          <Link href="/provider/portfolio" className="btn-ghost-app">
            <Icon name="briefcase" size="sm" />
            My Portfolio
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard icon="inbox"        value={needsReply}                   label="Need Your Reply" />
        <MetricCard icon="wrench"       value={count('Accepted', 'Ongoing')} label="Active Jobs" />
        <MetricCard icon="check-circle" value={completedTotal}               label="Jobs Completed" />
      </div>

      {/* Recent completed jobs */}
      <section className="section-card">
        <div className="section-card-head">
          <h2 className="section-card-title">Recent Completed Jobs</h2>
          {completedTotal > 0 && (
            <span className="section-card-count">{completed.length} of {completedTotal}</span>
          )}
        </div>
        <div className="section-card-body">
          {completed.length === 0 ? (
            <EmptyState
              icon="check-circle"
              title="No completed jobs yet"
              hint="A job shows here once the customer confirms the work and rates it."
            />
          ) : (
            <div className="dash-list">
              {completed.map((job) => (
                <ListCard
                  key={job.job_id}
                  thumb={<Avatar src={job.customer_avatar_url} name={job.customer_name} />}
                  title={job.service_name ?? 'Custom Service'}
                  subtitle={job.customer_name}
                  meta={
                    <>
                      <MetaItem icon="calendar">{formatDate(job.completed_at)}</MetaItem>
                      {job.agreed_price != null && (
                        <span className="dash-price">{formatPeso(job.agreed_price)}</span>
                      )}
                    </>
                  }
                  trailing={
                    job.stars != null
                      ? <StarRating stars={job.stars} compact />
                      : <span className="dash-muted">Not rated</span>
                  }
                  footer={job.review_text && (
                    <p className="dash-review">&ldquo;{job.review_text}&rdquo;</p>
                  )}
                />
              ))}
            </div>
          )}
          <Link href="/provider/requests" className="btn-primary-app btn-block dash-cta">
            <Icon name="clipboard" size="sm" />
            View All Completed Jobs / History
          </Link>
        </div>
      </section>

    </div>
  );
}

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
