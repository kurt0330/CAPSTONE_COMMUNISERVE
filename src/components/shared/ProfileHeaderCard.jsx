// PATH: /src/components/shared/ProfileHeaderCard.jsx
// Provider identity card: avatar, name, trade, barangay, LGU Verified badge.
// Shared by the customer-facing profile (read-only) and the provider's own
// portfolio (editable={true} — local state only in Phase 1).

'use client';

import Icon from '@/components/ui/Icon';

export default function ProfileHeaderCard({
  provider,
  editable = false,
  onFieldChange,
}) {
  if (!provider) return null;

  const {
    full_name,
    trade_category,
    barangay,
    id_verified,
    avatar_initials,
  } = provider;

  return (
    <div className="profile-header-card">
      <div className="profile-avatar">
        {avatar_initials}
        {id_verified && <span className="profile-avatar-dot" aria-hidden="true" />}
      </div>

      <div className="profile-identity">
        <p className="profile-name">{full_name}</p>
        <p className="profile-trade">{trade_category}</p>

        <div className="profile-meta-row">
          {editable ? (
            <input
              className="profile-edit-input"
              value={barangay}
              onChange={(e) => onFieldChange?.('barangay', e.target.value)}
              aria-label="Barangay"
            />
          ) : (
            <span className="profile-location">
              <Icon name="map-pin" size="sm" />
              {barangay}, Anini-y
            </span>
          )}

          {id_verified && (
            <span className="verified-badge">
              <Icon name="shield-check" size="xs" />
              LGU Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
