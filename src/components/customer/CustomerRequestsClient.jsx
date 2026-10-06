// PATH: /src/components/customer/CustomerRequestsClient.jsx
// Status filtering for the customer's request list.

'use client';

import { useState } from 'react';
import Link from 'next/link';

import RequestCard from '@/components/customer/RequestCard';
import EmptyState  from '@/components/shared/EmptyState';
import Icon        from '@/components/ui/Icon';
import { JOB_STATUSES, jobStatusLabel } from '@/lib/constants';
import { negotiationState } from '@/lib/negotiation';

const ACTION_FILTER = 'Needs your reply';

export default function CustomerRequestsClient({ requests = [] }) {
  const [filter, setFilter] = useState('All');

  // Offers waiting on this customer float to the top of every view.
  const needsMe = (r) => negotiationState(r, 'customer').myTurn;
  const actionCount = requests.filter(needsMe).length;

  const visible = (filter === 'All'
    ? requests
    : filter === ACTION_FILTER
      ? requests.filter(needsMe)
      : requests.filter((r) => r.job_status === filter)
  ).slice().sort((a, b) => Number(needsMe(b)) - Number(needsMe(a)));

  return (
    <div className="app-page">

      <div className="app-page-head">
        <div>
          <h2 className="app-page-title">My Requests</h2>
          <p className="app-page-sub">
            Track the service requests you have sent to providers.
          </p>
        </div>
        <Link href="/customer/search" className="btn-primary-app">
          <Icon name="search" size="sm" />
          Find a Provider
        </Link>
      </div>

      <div className="filter-row">
        {actionCount > 0 && (
          <button
            type="button"
            className={`filter-chip${filter === ACTION_FILTER ? ' active' : ''}`}
            onClick={() => setFilter(ACTION_FILTER)}
          >
            {ACTION_FILTER} ({actionCount})
          </button>
        )}
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
          hint="Search for a provider in your barangay to send your first request."
        />
      ) : (
        <div className="card-grid">
          {visible.map((request) => (
            <RequestCard key={request.job_id} request={request} />
          ))}
        </div>
      )}

    </div>
  );
}
