// PATH: /src/components/provider/ProviderRequestsClient.jsx
// M4 — Accept / Decline incoming requests. Each action calls the
// respondToJobRequest server action, which writes under RLS.

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import JobRequestCard from '@/components/provider/JobRequestCard';
import EmptyState     from '@/components/shared/EmptyState';
import Icon           from '@/components/ui/Icon';

import { JOB_STATUSES, jobStatusLabel } from '@/lib/constants';
import { respondToJobRequest } from '@/actions/jobActions';
import { negotiationState } from '@/lib/negotiation';

export default function ProviderRequestsClient({ requests = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filter,    setFilter]    = useState('All');
  const [busyId,    setBusyId]    = useState(null);
  const [error,     setError]     = useState('');

  async function respond(jobId, action) {
    setBusyId(jobId);
    setError('');

    const result = await respondToJobRequest(jobId, action);

    setBusyId(null);

    if (!result.success) {
      setError(result.error ?? 'Could not update this request.');
      return;
    }

    // Re-fetch the server component so the list reflects the new status.
    startTransition(() => router.refresh());
  }

  // Requests waiting on this provider: new fixed bookings + custom offers
  // where it's their turn. They float to the top of every view.
  const needsMe = (r) =>
    r.request_type === 'custom'
      ? negotiationState(r, 'provider').myTurn
      : r.job_status === 'Pending';

  const visible = (filter === 'All'
    ? requests
    : requests.filter((r) => r.job_status === filter)
  ).slice().sort((a, b) => Number(needsMe(b)) - Number(needsMe(a)));

  const pendingCount = requests.filter(needsMe).length;

  return (
    <div className="app-page">

      <div className="app-page-head">
        <div>
          <h2 className="app-page-title">My Requests</h2>
          <p className="app-page-sub">
            {pendingCount} pending {pendingCount === 1 ? 'request needs' : 'requests need'} your response.
          </p>
        </div>
      </div>

      {error && (
        <div className="app-alert" role="alert">
          <Icon name="warning" size="md" />
          <span>{error}</span>
        </div>
      )}

      <div className="filter-row">
        {['All', ...JOB_STATUSES].map((status) => (
          <button
            key={status}
            type="button"
            className={`filter-chip${filter === status ? ' active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {jobStatusLabel(status)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="inbox"
          title={
            requests.length === 0
              ? 'No requests yet'
              : `No ${jobStatusLabel(filter).toLowerCase()} requests`
          }
          hint="New requests from residents will appear here."
        />
      ) : (
        <div className="card-grid">
          {visible.map((request) => (
            <JobRequestCard
              key={request.job_id}
              request={request}
              busy={busyId === request.job_id || isPending}
              onAccept={(id) => respond(id, 'accept')}
              onReject={(id) => respond(id, 'decline')}
              onStart={(id) => respond(id, 'start')}
            />
          ))}
        </div>
      )}

    </div>
  );
}
