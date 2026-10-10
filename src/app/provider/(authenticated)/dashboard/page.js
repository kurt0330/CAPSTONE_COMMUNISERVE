// PATH: /src/app/provider/(authenticated)/dashboard/page.js
// Provider dashboard — Server Component.
//   • activity counts
//   • the 5 newest requests still waiting (the full list lives in My Requests)
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
import StatusPill             from '@/components/shared/StatusPill';

import { formatDate, formatPeso } from '@/lib/format';
import { negotiationState, displayPrice } from '@/lib/negotiation';

export const metadata = { title: 'My Dashboard — CommuniServe Provider' };

const RECENT_LIMIT = 5;
const NEW_REQUEST_LIMIT = 5;

export default async function ProviderDashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: me } = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_id', user.id)
    .single();

  if (!me) redirect('/auth/login');

  const [{ data: jobRows }, { data: completedRows }, { data: avatarRows }] = await Promise.all([
    supabase.rpc('get_provider_jobs'),
    supabase.rpc('get_provider_completed_jobs', { p_limit: RECENT_LIMIT }),
    supabase.rpc('get_job_avatars'),
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

  // New requests = still Pending, newest first (get_provider_jobs is already
  // ordered that way). Only a handful here; My Requests has them all.
  const myTurn = (j) =>
    j.request_type === 'custom' ? negotiationState(j, 'provider').myTurn : j.job_status === 'Pending';
  const pending = jobs.filter((j) => j.job_status === 'Pending');
  const newRequests = pending.slice(0, NEW_REQUEST_LIMIT);
  const avatarByJob = Object.fromEntries((avatarRows ?? []).map((a) => [a.job_id, a.customer_avatar_url]));


  return (
    <div className="app-page">

      <h1 className="visually-hidden">Dashboard</h1>

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard icon="inbox"        value={needsReply}                   label="Need Your Reply" />
        <MetricCard icon="wrench"       value={count('Accepted', 'Ongoing')} label="Active Jobs" />
        <MetricCard icon="check-circle" value={completedTotal}               label="Jobs Completed" />
      </div>

      <div className="dash-columns dash-columns--flush">

      {/* New requests */}
      <section className="section-card" aria-labelledby="new-requests-title">
        <div className="section-card-head">
          <h2 className="section-card-title" id="new-requests-title">New Requests</h2>
          {pending.length > 0 && (
            <span className="section-card-count">{newRequests.length} of {pending.length}</span>
          )}
        </div>
        <div className="section-card-body">
          {newRequests.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="No new requests"
              hint="When a resident books you or sends an offer, it shows here."
            />
          ) : (
            <div className="dash-list">
              {newRequests.map((job) => {
                const price = displayPrice(job);
                return (
                  <ListCard
                    key={job.job_id}
                    href="/provider/requests"
                    thumb={<Avatar src={avatarByJob[job.job_id]} name={job.customer_name} />}
                    title={job.customer_name}
                    subtitle={[job.service_name, job.service_description].filter(Boolean).join(' — ')}
                    meta={
                      <>
                        <MetaItem icon="calendar">{formatDate(job.requested_at)}</MetaItem>
                        <MetaItem icon="map-pin">{job.service_barangay}</MetaItem>
                        {price != null && (
                          <span className="dash-price">
                            {job.agreed_price != null ? '' : 'Offer '}{formatPeso(price)}
                          </span>
                        )}
                      </>
                    }
                    trailing={myTurn(job)
                      ? <span className="turn-badge">Your turn</span>
                      : <StatusPill status={job.job_status} />}
                  />
                );
              })}
            </div>
          )}
          <Link href="/provider/requests" className="btn-primary-app btn-block dash-cta">
            <Icon name="clipboard" size="sm" />
            {pending.length > newRequests.length
              ? `View All ${pending.length} New Requests`
              : 'View All Requests'}
          </Link>
        </div>
      </section>

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
          <Link href="/provider/requests" className="btn-ghost-app btn-block dash-cta">
            <Icon name="clipboard" size="sm" />
            View All Completed Jobs / History
          </Link>
        </div>
      </section>

      </div>

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
