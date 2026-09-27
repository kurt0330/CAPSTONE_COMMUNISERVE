// PATH: /src/components/shared/ChipList.jsx
// Dismissible chips — used for the "Recent Search" row on the search screen.

'use client';

import Icon from '@/components/ui/Icon';

export default function ChipList({ items = [], onSelect, onDismiss }) {
  if (!items.length) return null;

  return (
    <div className="chip-list">
      {items.map((item) => (
        <span className="chip" key={item}>
          <button
            type="button"
            className="chip-label"
            onClick={() => onSelect?.(item)}
          >
            {item}
          </button>
          <button
            type="button"
            className="chip-dismiss"
            onClick={() => onDismiss?.(item)}
            aria-label={`Remove ${item}`}
          >
            <Icon name="close" size="sm" />
          </button>
        </span>
      ))}
    </div>
  );
}
