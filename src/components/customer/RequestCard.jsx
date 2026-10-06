// PATH: /src/components/customer/RequestCard.jsx
// One of the customer's own job requests.
//   fixed / legacy → read-only; only the provider changes the status (BR-06)
//   custom         → negotiation thread; the customer answers counter-offers
//   In Progress    → "Mark Job as Completed" opens the rating sheet

'use client';

import { useState }           from 'react';
import Link                   from 'next/link';
import { useRouter }          from 'next/navigation';
import ListCard, { MetaItem } from '@/components/shared/ListCard';
import StatusPill             from '@/components/shared/StatusPill';
import NegotiationPanel       from '@/components/shared/NegotiationPanel';
import RateProviderSheet      from '@/components/customer/RateProviderSheet';
import Icon                   from '@/components/ui/Icon';
import { TRADE_ICONS, PAYMENT_STRUCTURES } from '@/lib/constants';
import { formatDate, formatPeso } from '@/lib/format';
import { negotiationState, displayPrice } from '@/lib/negotiation';

export default function RequestCard({ request }) {
  const {
    provider_id,
    provider_name,
    trade_category,
    request_type,
    service_name,
    service_description,
    service_barangay,
    job_status,
    agreed_price,
    payment_structure,
    requested_at,
  } = request;

  const router = useRouter();
  const [rating, setRating] = useState(false);   // rate-and-complete sheet open?

  const { isCustom, myTurn } = negotiationState(request, 'customer');
  const price = displayPrice(request);
  const structure = PAYMENT_STRUCTURES[payment_structure];

  // Full-width row under the card. The customer concludes the job: they are
  // the one who checks the work.
  let footer = null;
  if (job_status === 'Accepted') {
    footer = (
      <p className="job-hint">
        <Icon name="hourglass" size="sm" />
        Waiting for {provider_name} to start the job.
      </p>
    );
  } else if (job_status === 'Ongoing') {
    footer = (
      <>
        <p className="job-hint">
          <Icon name="info" size="sm" />
          Once the work is done and you have checked it, mark the job as completed.
        </p>
        <button type="button" className="btn-primary-app btn-block" onClick={() => setRating(true)}>
          <Icon name="check-circle" size="sm" />
          Mark Job as Completed
        </button>
      </>
    );
  }

  return (
    <ListCard
      thumb={<Icon name={isCustom ? 'message' : (TRADE_ICONS[trade_category] ?? 'toolbox')} size="xl" />}
      title={service_name ? `${service_name} · ${provider_name}` : provider_name}
      subtitle={service_description}
      meta={
        <>
          <MetaItem icon="calendar">{formatDate(requested_at)}</MetaItem>
          <MetaItem icon="map-pin">{service_barangay}</MetaItem>
          {structure && <MetaItem icon="briefcase">{structure.label} · {structure.short}</MetaItem>}
        </>
      }
      trailing={myTurn ? <span className="turn-badge">Your turn</span> : <StatusPill status={job_status} />}
      footer={footer}
    >
      {price != null && (
        <div className="request-price-row">
          <span className="request-price-label">
            {agreed_price != null ? 'Agreed price' : 'Latest offer'}
          </span>
          <span className="service-price">
            {formatPeso(price)}
            {structure && <span className="service-price-unit">{structure.unit}</span>}
          </span>
        </div>
      )}

      {isCustom && (
        <NegotiationPanel job={request} viewer="customer" otherPartyName={provider_name} />
      )}

      {provider_id && (
        <div className="list-card-actions">
          <Link href={`/customer/providers/${provider_id}`} className="btn-ghost-app btn-sm">
            <Icon name="user" size="sm" />
            View Provider
          </Link>
        </div>
      )}

      {rating && (
        <RateProviderSheet
          job={request}
          onClose={() => setRating(false)}
          onDone={() => { setRating(false); router.refresh(); }}
        />
      )}
    </ListCard>
  );
}
