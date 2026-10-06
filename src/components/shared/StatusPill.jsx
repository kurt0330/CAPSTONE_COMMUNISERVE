// PATH: /src/components/shared/StatusPill.jsx
// Single source of truth for job_status → colour mapping.
// Statuses mirror T-job_requests.job_status (CAPSTONE_DOCS.md §9).

import { jobStatusLabel } from '@/lib/constants';

const MODIFIERS = {
  Pending:   'pending',
  Accepted:  'accepted',
  Ongoing:   'ongoing',
  Completed: 'completed',
  Declined:  'declined',
  Cancelled: 'cancelled',
};

export default function StatusPill({ status }) {
  const modifier = MODIFIERS[status] ?? 'pending';
  return (
    <span className={`status-pill status-pill--${modifier}`}>
      {jobStatusLabel(status)}
    </span>
  );
}
