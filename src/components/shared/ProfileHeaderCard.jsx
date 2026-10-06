// PATH: /src/components/shared/ProfileHeaderCard.jsx
// Provider identity card: avatar, name, trade, barangay, LGU Verified badge.
// Shared by the customer-facing profile (read-only) and the provider's own
// portfolio (editable={true} — local state only in Phase 1).

'use client';

import Icon from '@/components/ui/Icon';
import Avatar from '@/components/shared/Avatar';

export default function ProfileHeaderCard({
  provider,
  editable = false,
  onFieldChange,
  avatar,           // optional node replacing the static photo (e.g. <AvatarUploader />)
}) {
  if (!provider) return null;

  const {
    full_name,
    trade_category,
    barangay,
    id_verified,
    avatar_initials,
    avatar_url,
    nickname,
    occupied,          // has a job Accepted / In Progress for another customer
  } = provider;

  return (
    <div className="profile-header-card">
      {avatar ?? (
        <div className="profile-avatar">
          <Avatar src={avatar_url} name={full_name} fallback={avatar_initials} />
          {id_verified && <span className="profile-avatar-dot" aria-hidden="true" />}
        </div>
      )}

      <div className="profile-identity">
        <p className="profile-name">{full_name}</p>
        {nickname && <p className="profile-nickname">&ldquo;{nickname}&rdquo;</p>}
        {occupied && (
          <span className="occupied-pill">
            <Icon name="clock" size="xs" />
            Currently on a job
          </span>
        )}
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
