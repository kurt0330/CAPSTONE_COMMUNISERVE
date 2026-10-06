// PATH: /src/components/shared/ListCard.jsx
// Generic vertical list row used by search results, requests and skill lists.
// Props: thumb, title, subtitle, meta, trailing, chevron, href, onClick, children
//   - `thumb` is any node (initials, <Icon />)
//   - `meta` is any node — pass <MetaItem>s for icon + text pairs
//   - `trailing` renders in the right-hand slot (rating, status pill)
//   - `chevron` adds a right chevron under the trailing slot (tappable rows)
//   - `children` renders below the body (e.g. an action button row)
//   - `footer` renders under the whole card at full width (a primary
//     action that should not be squeezed into the body column on phones)

import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function ListCard({
  thumb,
  title,
  subtitle,
  meta,
  trailing,
  chevron = false,
  href,
  onClick,
  children,
  footer,
}) {
  const inner = (
    <>
      {thumb && <div className="list-card-thumb">{thumb}</div>}
      <div className="list-card-body">
        <p className="list-card-title">{title}</p>
        {subtitle && <p className="list-card-sub">{subtitle}</p>}
        {meta && <div className="list-card-meta">{meta}</div>}
        {children}
      </div>
      {(trailing || chevron) && (
        <div className="list-card-trailing">
          {trailing}
          {chevron && <Icon name="chevron-right" size="md" className="list-card-chevron" />}
        </div>
      )}
      {footer && <div className="list-card-footer">{footer}</div>}
    </>
  );

  const className = footer ? 'list-card list-card--with-footer' : 'list-card';

  // Link variant — whole card is tappable (large tap target, per §13 UI rules)
  if (href) {
    return <Link href={href} className={className}>{inner}</Link>;
  }

  return <div className={className} onClick={onClick}>{inner}</div>;
}

/** One icon + text pair inside a ListCard's `meta` row. */
export function MetaItem({ icon, children, className = '' }) {
  return (
    <span className={`icon-text ${className}`.trim()}>
      {icon && <Icon name={icon} size="sm" />}
      <span>{children}</span>
    </span>
  );
}
