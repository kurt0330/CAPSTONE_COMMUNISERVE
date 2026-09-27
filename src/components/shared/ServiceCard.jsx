// PATH: /src/components/shared/ServiceCard.jsx
// One offered service: icon badge, name, description, price + unit, and an
// optional action (e.g. "Book"). `custom` renders the dashed "Custom
// Service" variant that closes every provider's service list.

import Icon from '@/components/ui/Icon';
import { formatPeso } from '@/lib/format';

export default function ServiceCard({
  icon = 'toolbox',
  name,
  description,
  price,
  unit,
  priceNote,
  custom = false,
  off = false,
  action,
  children,
}) {
  const classes = ['service-card', custom && 'service-card--custom', off && 'service-card--off']
    .filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <span className="icon-badge">
        <Icon name={custom ? 'message' : icon} size="lg" />
      </span>

      <div className="service-card-body">
        <p className="service-card-name">{name}</p>
        {description && <p className="service-card-desc">{description}</p>}
        {price != null && (
          <span className="service-price">
            {formatPeso(price)}
            {unit && <span className="service-price-unit">{unit}</span>}
          </span>
        )}
        {priceNote && <span className="service-price-unit" style={{ marginLeft: 0 }}>{priceNote}</span>}
        {children}
      </div>

      {action && <div className="service-card-action">{action}</div>}
    </div>
  );
}
