// PATH: /src/components/shared/StatRow.jsx
// Row of small stat tiles beneath the profile header card.
// Props: stats = [{ icon, value, label }] — `icon` is an icon name.

import Icon from '@/components/ui/Icon';

export default function StatRow({ stats = [] }) {
  return (
    <div className="stat-row">
      {stats.map(({ icon, value, label }) => (
        <div className="stat-item" key={label}>
          <span className="stat-icon">
            <Icon name={icon} size="md" />
          </span>
          <span className="stat-value">{value}</span>
          <span className="stat-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
