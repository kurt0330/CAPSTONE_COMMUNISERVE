// PATH: /src/components/customer/RequestCard.jsx
// One of the customer's own job requests.
//   fixed / legacy → read-only; only the provider changes the status (BR-06)
//   custom         → negotiation thread; the customer answers counter-offers

'use client';

import Link                   from 'next/link';
import ListCard, { MetaItem } from '@/components/shared/ListCard';
import StatusPill             from '@/components/shared/StatusPill';
import NegotiationPanel       from '@/components/shared/NegotiationPanel';
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

  const { isCustom, myTurn } = negotiationState(request, 'customer');
  const price = displayPrice(request);
  const structure = PAYMENT_STRUCTURES[payment_structure];

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
    </ListCard>
  );
}
