// PATH: /src/components/ui/Icon.jsx
// The app's only way to render an icon. Replaces the emoji that used to be
// scattered through the UI.
//
//   <Icon name="search" />                     20px, inherits text colour
//   <Icon name="star" size="sm" />             icon-xs | sm | md | lg | xl | 2xl
//   <Icon name="bolt" label="Electrician" />   announced to screen readers
//   <Icon name="logo" color />                 full-colour asset (no tint)
//
// Files live in /public/assets/icons/ — see src/lib/icons.js for the list.

import { iconSrc } from '@/lib/icons';

export default function Icon({ name, size = 'md', label, color = false, className = '', style }) {
  const classes = ['icon', `icon-${size}`, color && 'icon--color', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={{ '--icon-src': `url(${iconSrc(name)})`, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
