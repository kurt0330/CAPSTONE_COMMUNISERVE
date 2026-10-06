// PATH: /src/components/customer/ProviderSearchResultCard.jsx
// One approved provider in the customer's search results.

import ListCard, { MetaItem } from '@/components/shared/ListCard';
import StarRating             from '@/components/shared/StarRating';
import Avatar                 from '@/components/shared/Avatar';
import Icon                   from '@/components/ui/Icon';
import { TRADE_ICONS }        from '@/lib/constants';

export default function ProviderSearchResultCard({ provider }) {
  const {
    provider_id,
    full_name,
    trade_category,
    barangay,
    average_rating,
    review_count,
    id_verified,
    avatar_url,
    is_occupied,
  } = provider;

  return (
    <ListCard
      href={`/customer/providers/${provider_id}`}
      thumb={
        <Avatar
          src={avatar_url}
          name={full_name}
          fallback={<Icon name={TRADE_ICONS[trade_category] ?? 'toolbox'} size="xl" />}
        />
      }
      title={full_name}
      subtitle={trade_category}
      meta={
        <>
          <StarRating stars={average_rating} count={review_count} compact />
          <MetaItem icon="map-pin">{barangay}</MetaItem>
          {id_verified
            ? <MetaItem icon="shield-check" className="meta-verified">LGU Verified</MetaItem>
            : <MetaItem icon="hourglass">Verification pending</MetaItem>}
          {is_occupied && <MetaItem icon="clock">Currently on a job</MetaItem>}
        </>
      }
      chevron
    />
  );
}
