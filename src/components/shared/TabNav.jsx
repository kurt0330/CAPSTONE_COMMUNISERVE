// PATH: /src/components/shared/TabNav.jsx
// Tab bar + panel wrapper for the provider profile / portfolio screens.
// Props: tabs = [{ key, label }], activeTab, onChange

'use client';

export default function TabNav({ tabs = [], activeTab, onChange }) {
  return (
    <div className="tab-nav" role="tablist">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={activeTab === key}
          className={`tab-btn${activeTab === key ? ' active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ children }) {
  return <div className="tab-panel" role="tabpanel">{children}</div>;
}
