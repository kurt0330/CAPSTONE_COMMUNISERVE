// PATH: /src/components/registration/Step3Trade.jsx
// Replaces: #step-3 panel in SP/html/form1.html
// Schema: providers.trade_category ENUM('Carpenter','Electrician','Kasambahay','Nanny','Other')

'use client';

// All 5 ENUM values from the schema — previously the action only allowed 3.
const TRADES = [
  {
    value:    'Carpenter',
    emoji:    '🪚',
    name:     'Carpenter',
    local:    'Panday',
    desc:     'Furniture making, house framing, wood repairs & general carpentry.',
  },
  {
    value:    'Electrician',
    emoji:    '⚡',
    name:     'Electrician',
    local:    'Elektrisyano',
    desc:     'Wiring, outlet repair, panel setup & electrical maintenance.',
  },
  {
    value:    'Kasambahay',
    emoji:    '🧹',
    name:     'Kasambahay',
    local:    'Household Helper',
    desc:     'Cleaning, cooking, laundry, caregiving & household tasks.',
  },
];

export default function Step3Trade({ fields, setFields, children }) {

  function selectTrade(value) {
    setFields((prev) => ({ ...prev, trade_category: value }));
  }

  return (
    <div className="page-container step-panel" id="step-3">

      <div className="section-header"><strong>SERVICE / TRADE SELECTION</strong></div>
      <p className="step-intro-text">
        Select the primary service you will offer. This determines which
        customers can discover your verified profile on CommuniServe.
      </p>

      {/*
        Trade grid — 3 columns on desktop, 1 on mobile (sp_steps.css handles this).
        Using CSS grid with auto-fill so 5 cards sit naturally at 3+2.
      */}
      <div className="trade-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {TRADES.map(({ value, emoji, name, local, desc }) => {
          const isSelected = fields.trade_category === value;
          return (
            <label
              key={value}
              className="trade-card"
              style={{ cursor: 'pointer' }}
              onClick={() => selectTrade(value)}
            >
              {/* Hidden radio — card is the click target */}
              <input
                type="radio"
                name="trade_category"
                value={value}
                checked={isSelected}
                onChange={() => selectTrade(value)}
                style={{ display: 'none' }}
              />
              <div
                className="trade-face"
                style={
                  isSelected
                    ? { borderTop: '4px solid var(--sp-blue)', background: 'var(--sp-blue-tint)' }
                    : { borderTop: '4px solid transparent' }
                }
              >
                <div className="trade-emoji">{emoji}</div>
                <strong className="trade-name">{name}</strong>
                <span className="trade-local">{local}</span>
                <p className="trade-desc">{desc}</p>
                {isSelected && (
                  <span className="trade-badge" style={{ display: 'inline-flex' }}>
                    ✓ Selected
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {children}
    </div>
  );
}