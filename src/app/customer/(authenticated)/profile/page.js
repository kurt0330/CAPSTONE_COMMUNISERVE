// PATH: /src/app/customer/(authenticated)/profile/page.js
// The customer's own profile — a full page, reached from the header avatar.
//   identity card   photo (tap to change) + verified name and barangay
//   profile details nickname, about me, street address, contact number
//   activity        request counts + the latest requests
//   account         quick links
// Phones: one column in that order. Desktop (≥ 900px): identity, activity and
// account stack in a left column; the details form takes the wider right one.

import { redirect } from 'next/navigation';
import Link         from 'next/link';

import { createServerClient } from '@/lib/supabase/server';
import Icon               from '@/components/ui/Icon';
import Avatar             from '@/components/shared/Avatar';
import AvatarUploader     from '@/components/shared/AvatarUploader';
import ProfileDetailsForm from '@/components/shared/ProfileDetailsForm';
import VerifiedDetails    from '@/components/shared/VerifiedDetails';
import StatusPill         from '@/components/shared/StatusPill';
import EmptyState         from '@/components/shared/EmptyState';

import { TRADE_ICONS } from '@/lib/constants';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'My Profile — CommuniServe' };

const RECENT_LIMIT = 3;

export default async function CustomerProfilePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: me }, { data: jobRows }, { data: avatarRows }] = await Promise.all([
    supabase
      .from('users')
      .select('full_name, nickname, bio, barangay, municipality, street_address, contact_number, avatar_url, email, created_at')
      .eq('auth_id', user.id)
      .single(),
    supabase.rpc('get_customer_jobs'),     // newest first
    supabase.rpc('get_job_avatars'),
  ]);

  if (!me) redirect('/auth/login');

  const jobs = jobRows ?? [];
  const avatarByJob = Object.fromEntries((avatarRows ?? []).map((a) => [a.job_id, a.provider_avatar_url]));
  const count = (...statuses) => jobs.filter((j) => statuses.includes(j.job_status)).length;
  const recent = jobs.slice(0, RECENT_LIMIT);

  return (
    <div className="app-page">

      <div className="app-page-head">
        <div>
          <h2 className="app-page-title">My Profile</h2>
          <p className="app-page-sub">How providers see you, and how they can reach you.</p>
        </div>
      </div>

      <div className="account-layout">

        {/* ── Identity ── */}
        <section className="section-card account-identity" aria-label="Your identity">
          <div className="section-card-body identity-card">
            <AvatarUploader authId={user.id} avatarUrl={me.avatar_url} name={me.full_name} size="xl" />
            <div className="identity-text">
              <p className="identity-name">{me.full_name}</p>
              {me.nickname && <p className="profile-nickname">&ldquo;{me.nickname}&rdquo;</p>}
              <p className="identity-meta">
                <Icon name="map-pin" size="sm" />
                {me.barangay}, {me.municipality ?? 'Anini-y'}
              </p>
            </div>
            <VerifiedDetails
              items={[
                { label: 'Full name', value: me.full_name },
                { label: 'Barangay',  value: `${me.barangay}, ${me.municipality ?? 'Anini-y'}` },
                { label: 'Email',     value: me.email },
              ]}
            />
          </div>
        </section>

        {/* ── Editable details ── */}
        <section className="section-card account-details" aria-labelledby="details-title">
          <div className="section-card-head">
            <h3 className="section-card-title" id="details-title">Profile details</h3>
          </div>
          <div className="section-card-body">
            <ProfileDetailsForm
              variant="customer"
              initial={{
                nickname:      me.nickname,
                bio:           me.bio,
                streetAddress: me.street_address,
                contactNumber: me.contact_number,
              }}
            />
          </div>
        </section>

        {/* ── Activity overview ── */}
        <section className="section-card account-activity" aria-labelledby="activity-title">
          <div className="section-card-head">
            <h3 className="section-card-title" id="activity-title">Activity overview</h3>
            <Link href="/customer/requests" className="section-card-link">View all</Link>
          </div>
          <div className="section-card-body">
            <dl className="mini-stats">
              <div className="mini-stat"><dt>Active</dt><dd>{count('Pending', 'Accepted')}</dd></div>
              <div className="mini-stat"><dt>In progress</dt><dd>{count('Ongoing')}</dd></div>
              <div className="mini-stat"><dt>Completed</dt><dd>{count('Completed')}</dd></div>
            </dl>

            {recent.length === 0 ? (
              <EmptyState icon="inbox" title="No requests yet" hint="Your latest requests will show here." />
            ) : (
              <ul className="mini-list" aria-label="Latest requests">
                {recent.map((job) => (
                  <li key={job.job_id}>
                    <Link href="/customer/requests" className="mini-row">
                      <span className="mini-row-thumb">
                        <Avatar
                          src={avatarByJob[job.job_id]}
                          name={job.provider_name}
                          fallback={<Icon name={TRADE_ICONS[job.trade_category] ?? 'toolbox'} size="md" />}
                        />
                      </span>
                      <span className="mini-row-body">
                        <span className="mini-row-title">{job.provider_name}</span>
                        <span className="mini-row-sub">
                          {job.service_name ?? 'Custom Service'} · {formatDate(job.requested_at)}
                        </span>
                      </span>
                      <StatusPill status={job.job_status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Account quick links ── */}
        <nav className="account-links" aria-label="Account">
          <Link href="/customer/requests" className="link-row">
            <span className="icon-badge icon-badge--sm"><Icon name="clipboard" size="sm" /></span>
            <span className="link-row-label">My Requests</span>
            <Icon name="chevron-right" size="md" />
          </Link>
          <Link href="/customer/search" className="link-row">
            <span className="icon-badge icon-badge--sm"><Icon name="search" size="sm" /></span>
            <span className="link-row-label">Find a Provider</span>
            <Icon name="chevron-right" size="md" />
          </Link>
          <a href="/customer/logout" className="link-row">
            <span className="icon-badge icon-badge--sm icon-badge--neutral"><Icon name="logout" size="sm" /></span>
            <span className="link-row-label">Sign out</span>
            <Icon name="chevron-right" size="md" />
          </a>
        </nav>

      </div>
    </div>
  );
}
