// PATH: /src/components/shared/Avatar.jsx
// The contents of any avatar circle: the uploaded photo when there is one,
// otherwise the person's initials (or a custom fallback such as a trade icon).
// It fills its parent, so the existing wrappers (.portal-avatar,
// .profile-avatar, .review-avatar, .list-card-thumb) keep their own size
// and shape.

import { initialsOf } from '@/lib/format';

export default function Avatar({ src, name, fallback }) {
  if (src) {
    // alt="" — the name is always printed next to the photo.
    return <img src={src} alt="" className="avatar-img" loading="lazy" decoding="async" />;
  }
  return fallback ?? initialsOf(name);
}
