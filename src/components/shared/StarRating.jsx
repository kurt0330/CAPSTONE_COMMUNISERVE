// PATH: /src/components/shared/StarRating.jsx
// Display-only rating (T-ratings.stars / providers.average_rating).
//   compact  → one star + score + optional (count), as in the design's cards
//   default  → a row of five stars

import Icon from '@/components/ui/Icon';

export default function StarRating({ stars = 0, showScore = false, count, compact = false }) {
  const value = Number(stars ?? 0);
  const rounded = Math.round(value);
  const label = `${value.toFixed(1)} out of 5 stars`;

  if (compact) {
    return (
      <span className="star-row" aria-label={label}>
        <Icon name="star" size="sm" className="star--filled" />
        <span className="star-score">{value.toFixed(1)}</span>
        {count !== undefined && <span className="star-count">({count})</span>}
      </span>
    );
  }

  return (
    <span className="star-row" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size="sm"
          className={n <= rounded ? 'star--filled' : 'star--empty'}
        />
      ))}
      {showScore && <span className="star-score">{value.toFixed(1)}</span>}
    </span>
  );
}
