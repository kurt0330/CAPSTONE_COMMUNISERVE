// PATH: /src/app/customer/(authenticated)/dashboard/page.js
// Customer dashboard — Server Component.
//   • the customer's 5 most recent requests
//   • top-rated providers
//   • providers in the customer's own barangay
// Everything is read through the session client: the customer's own row under
// RLS, and SECURITY DEFINER functions that expose safe columns only.

import { redirect } from 'next/navigation';
import Link         from 'next/link';

import { createServerClient } from '@/lib/supabase/server';
import Icon                     from '@/components/ui/Icon';
import Avatar                   from '@/components/shared/Avatar';
import EmptyState               from '@/components/shared/EmptyState';
import ListCard, { MetaItem }   from '@/components/shared/ListCard';
import StatusPill               from '@/components/shared/StatusPill';
import ProviderSearchResultCard from '@/components/customer/ProviderSearchResultCard';

import { TRADE_ICONS } from '@/lib/constants';
import { formatDate, formatPeso } from '@/lib/format';
import { displayPrice } from '@/lib/negotiation';

export const metadata = { title: 'My Dashboard — CommuniServe Resident' };

const RECENT_LIMIT   = 5;
const PROVIDER_LIMIT = 4;

export default async function CustomerDashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: me }, { data: jobRows }, { data: avatarRows }, { data: providerRows }] = await Promise.all([
    supabase.from('users').select('full_name, nickname, barangay').eq('auth_id', user.id).single(),
    supabase.rpc('get_customer_jobs'),          // newest first
    supabase.rpc('get_job_avatars'),
    supabase.rpc('get_provider_directory', { p_provider_id: null }),   // best rated first
  ]);

  if (!me) redirect('/auth/login');

  const jobs      = jobRows ?? [];
  const providers = providerRows ?? [];
  const avatarByJob = Object.fromEntries((avatarRows ?? []).map((a) => [a.job_id, a.provider_avatar_url]));

  const count = (...statuses) => jobs.filter((j) => statuses.includes(j.job_status)).length;

  const recent = jobs.slice(0, RECENT_LIMIT);
  // "Top" means rated: a provider nobody has reviewed yet is not top-rated.
  const topRated = providers.filter((p) => Number(p.review_count) > 0).slice(0, PROVIDER_LIMIT);
  const nearby   = providers.filter((p) => p.barangay === me.barangay).slice(0, PROVIDER_LIMIT);


  return (
    <div className="app-page">

      {/* Primary actions */}
      <h1 className="visually-hidden">Dashboard</h1>

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard icon="clipboard"    value={count('Pending', 'Accepted')} label="Active Requests" />
        <MetricCard icon="wrench"       value={count('Ongoing')}             label="Jobs In Progress" />
        <MetricCard icon="check-circle" value={count('Completed')}           label="Jobs Completed" />
      </div>

      {/* Recent requests */}
      <section className="section-card">
        <div className="section-card-head">
          <h2 className="section-card-title">Recent Requests</h2>
          {jobs.length > 0 && <span className="section-card-count">{recent.length} of {jobs.length}</span>}
        </div>
        <div className="section-card-body">
          {recent.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="No requests yet"
              hint="Book a service or send an offer to a provider to get started."
            />
          ) : (
            <div className="dash-list">
              {recent.map((job) => {
                const price = displayPrice(job);
                return (
                  <ListCard
                    key={job.job_id}
                    href="/customer/requests"
                    thumb={
                      <Avatar
                        src={avatarByJob[job.job_id]}
                        name={job.provider_name}
                        fallback={<Icon name={TRADE_ICONS[job.trade_category] ?? 'toolbox'} size="xl" />}
                      />
                    }
                    title={job.provider_name}
                    subtitle={job.service_name ?? job.service_description}
                    meta={
                      <>
                        <MetaItem icon="calendar">{formatDate(job.requested_at)}</MetaItem>
                        {price != null && (
                          <span className="dash-price">
                            {job.agreed_price != null ? 'Agreed' : 'Offer'} {formatPeso(price)}
                          </span>
                        )}
                      </>
                    }
                    trailing={<StatusPill status={job.job_status} />}
                  />
                );
              })}
            </div>
          )}
          <Link href="/customer/requests" className="btn-primary-app btn-block dash-cta">
            <Icon name="clipboard" size="sm" />
            View All Request History
          </Link>
        </div>
      </section>

      <div className="dash-columns">

        {/* Top-rated providers */}
        <section className="section-card">
          <div className="section-card-head">
            <h2 className="section-card-title">Top Service Providers</h2>
            <Link href="/customer/search" className="section-card-link">See all</Link>
          </div>
          <div className="section-card-body">
            {topRated.length === 0 ? (
              <EmptyState
                icon="star"
                title="No rated providers yet"
                hint="Providers appear here once residents have rated their work."
              />
            ) : (
              <div className="dash-list">
                {topRated.map((p) => <ProviderSearchResultCard key={p.provider_id} provider={p} />)}
              </div>
            )}
          </div>
        </section>

        {/* Providers in the customer's barangay */}
        <section className="section-card">
          <div className="section-card-head">
            <h2 className="section-card-title">Nearby in {me.barangay}</h2>
            <Link href="/customer/search" className="section-card-link">See all</Link>
          </div>
          <div className="section-card-body">
            {nearby.length === 0 ? (
              <EmptyState
                icon="map-pin"
                title={`No providers in ${me.barangay} yet`}
                hint="Search all of Anini-y to find providers in other barangays."
              />
            ) : (
              <div className="dash-list">
                {nearby.map((p) => <ProviderSearchResultCard key={p.provider_id} provider={p} />)}
              </div>
            )}
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
