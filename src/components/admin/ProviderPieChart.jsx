// PATH: /src/components/admin/ProviderPieChart.jsx
'use client';

export default function ProviderPieChart({ data }) {
  const kasCount = data?.Kasambahay || 0;
  const carCount = data?.Carpenter || 0;
  const eleCount = data?.Electrician || 0;
  const total = kasCount + carCount + eleCount;

  if (total === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--cs-text-muted)', fontSize: 13, minHeight: '150px' }}>
        No approved providers yet.
      </div>
    );
  }

  // Calculate percentages
  const kasPct = (kasCount / total) * 100;
  const carPct = (carCount / total) * 100;
  const elePct = (eleCount / total) * 100;

  // Calculate stops for the CSS conic-gradient
  const kasEnd = kasPct;
  const carEnd = kasEnd + carPct;

  // Colors requested: Green (Kasambahay), Orange (Carpenter), Yellow (Electrician)
  const COLORS = {
    Kasambahay: 'var(--cs-success)', 
    Carpenter:  '#F97316', 
    Electrician: '#FACC15' 
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '40px', width: '100%', padding: '10px 0' }}>
      
      {/* ── THE PIE CHART (UPGRADED SIZE) ── */}
      <div style={{
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        flexShrink: 0,
        background: `conic-gradient(
          ${COLORS.Kasambahay} 0% ${kasEnd}%,
          ${COLORS.Carpenter} ${kasEnd}% ${carEnd}%,
          ${COLORS.Electrician} ${carEnd}% 100%
        )`,
        boxShadow: 'var(--cs-shadow)'
      }} />

      {/* ── THE LEGEND ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
        <div>
          <h3 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 800, color: 'var(--cs-text)' }}>
            Service Provider Breakdown
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--cs-text-muted)' }}>
            Distribution of approved workers
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Kasambahay', count: kasCount, pct: kasPct, color: COLORS.Kasambahay },
            { label: 'Carpenter', count: carCount, pct: carPct, color: COLORS.Carpenter },
            { label: 'Electrician', count: eleCount, pct: elePct, color: COLORS.Electrician },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color }} />
                <span style={{ color: 'var(--cs-text-muted)', fontWeight: 600 }}>{item.label}</span>
              </div>
              <div style={{ color: 'var(--cs-text-muted)', fontWeight: 500 }}>
                <span style={{ color: 'var(--cs-text)', fontWeight: 700, marginRight: '6px' }}>{item.count}</span> 
                ({item.pct.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}