// PATH: /src/lib/format.js
// Small presentation helpers shared by the portal screens.

/** "Rico Salvador" → "RS" */
export function initialsOf(name) {
  return String(name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

/** 1500 → "₱1,500" · 1500.5 → "₱1,500.50" */
export function formatPeso(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return '₱' + n.toLocaleString('en-PH', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** ISO timestamp → "24 Sep 2026" */
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' });
}
