// PATH: /src/components/shared/AppTopBar.jsx
// Top app bar: circular back button + centred title + optional trailing action.
// Mirrors the design's provider-detail header.

'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

export default function AppTopBar({ title, backHref, onAction, actionIcon = 'share', actionLabel = 'Share' }) {
  const router = useRouter();

  function handleBack() {
    if (backHref) router.push(backHref);
    else router.back();
  }

  return (
    <div className="app-topbar">
      <button
        type="button"
        className="app-topbar-btn"
        onClick={handleBack}
        aria-label="Go back"
      >
        <Icon name="chevron-left" size="md" />
      </button>

      <p className="app-topbar-title">{title}</p>

      {onAction ? (
        <button
          type="button"
          className="app-topbar-btn"
          onClick={onAction}
          aria-label={actionLabel}
        >
          <Icon name={actionIcon} size="md" />
        </button>
      ) : (
        <span className="app-topbar-spacer" />
      )}
    </div>
  );
}
