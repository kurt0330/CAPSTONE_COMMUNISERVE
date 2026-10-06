// PATH: /src/components/provider/JobRequestCard.jsx
// An incoming job request as the provider sees it (M4).
//   fixed / legacy → Accept / Decline (respondToJobRequest via the parent)
//   custom         → negotiation thread: Accept Agreement / Counter / Decline
//   Accepted       → Start Job (→ In Progress); the CUSTOMER completes it

'use client';

import ListCard, { MetaItem } from '@/components/shared/ListCard';
import StatusPill             from '@/components/shared/StatusPill';
import NegotiationPanel       from '@/components/shared/NegotiationPanel';
import Avatar                 from '@/components/shared/Avatar';
import Icon                   from '@/components/ui/Icon';
import { PAYMENT_STRUCTURES } from '@/lib/constants';
import { formatDate, formatPeso } from '@/lib/format';
import { negotiationState, displayPrice } from '@/lib/negotiation';

export default function JobRequestCard({ request, onAccept, onReject, onStart, busy = false }) {
  const {
    job_id,
    customer_name,
    customer_avatar_url,
    service_name,
    service_description,
    service_street,
    service_barangay,
    job_status,
    agreed_price,
    payment_structure,
    requested_at,
  } = request;

  const { isCustom, myTurn } = negotiationState(request, 'provider');
  const price = displayPrice(request);
  const structure = PAYMENT_STRUCTURES[payment_structure];
  const showFixedActions = !isCustom && job_status === 'Pending';

  return (
    <ListCard
      thumb={
        <Avatar
          src={customer_avatar_url}
          name={customer_name}
          fallback={isCustom ? <Icon name="message" size="xl" /> : (customer_name?.charAt(0) ?? '?')}
        />
      }
      title={service_name ? `${service_name} · ${customer_name}` : customer_name}
      subtitle={service_description}
      meta={
        <>
          <MetaItem icon="calendar">{formatDate(requested_at)}</MetaItem>
          <MetaItem icon="map-pin">
            {service_street ? `${service_street}, ${service_barangay}` : service_barangay}
          </MetaItem>
          {structure && <MetaItem icon="briefcase">{structure.label} · {structure.short}</MetaItem>}
        </>
      }
      trailing={myTurn ? <span className="turn-badge">Your turn</span> : <StatusPill status={job_status} />}
      footer={job_status === 'Ongoing' && (
        <p className="job-hint">
          <Icon name="hourglass" size="sm" />
          Job in progress. {customer_name} will mark it as completed once the work is checked.
        </p>
      )}
    >
      {price != null && (
        <div className="request-price-row">
          <span className="request-price-label">
            {agreed_price != null ? (isCustom ? 'Agreed price' : 'Fixed price') : 'Latest offer'}
          </span>
          <span className="service-price">
            {formatPeso(price)}
            {structure && <span className="service-price-unit">{structure.unit}</span>}
          </span>
        </div>
      )}

      {isCustom && (
        <NegotiationPanel job={request} viewer="provider" otherPartyName={customer_name} />
      )}

      {job_status === 'Accepted' && (
        <div className="list-card-actions">
          <button
            type="button"
            className="btn-primary-app btn-sm"
            onClick={() => onStart?.(job_id)}
            disabled={busy}
          >
            <Icon name="play" size="sm" />
            {busy ? 'Saving…' : 'Start Job'}
          </button>
        </div>
      )}

      {showFixedActions && (
        <div className="list-card-actions">
          <button
            type="button"
            className="btn-reject btn-sm"
            onClick={() => onReject(job_id)}
            disabled={busy}
          >
            <Icon name="close" size="sm" />
            Decline
          </button>
          <button
            type="button"
            className="btn-accept btn-sm"
            onClick={() => onAccept(job_id)}
            disabled={busy}
          >
            <Icon name="check" size="sm" />
            {busy ? 'Saving…' : 'Accept'}
          </button>
        </div>
      )}
    </ListCard>
  );
}
