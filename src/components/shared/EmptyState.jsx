// PATH: /src/components/shared/EmptyState.jsx
// Dashed placeholder block for empty lists, load errors and confirmations.
// `icon` is an icon name from src/lib/icons.js.
// `tone` tints the icon badge: neutral | primary | success | warning | danger.

import Icon from '@/components/ui/Icon';

const BADGE_TONE = {
  neutral: 'icon-badge--neutral',
  primary: '',
  success: 'icon-badge--success',
  warning: 'icon-badge--warning',
  danger:  'icon-badge--danger',
};

export default function EmptyState({ icon = 'inbox', title, hint, tone = 'neutral', className = '' }) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <span className={`empty-state-icon icon-badge icon-badge--lg ${BADGE_TONE[tone] ?? ''}`.trim()}>
        <Icon name={icon} size="lg" />
      </span>
      {title && <p className="empty-state-title">{title}</p>}
      {hint && <p className="empty-state-hint">{hint}</p>}
    </div>
  );
}
