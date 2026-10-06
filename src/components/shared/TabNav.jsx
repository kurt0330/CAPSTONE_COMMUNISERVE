// PATH: /src/components/shared/TabNav.jsx
// Tab bar + panel wrapper for the provider profile / portfolio screens.
// Props: tabs = [{ key, label }], activeTab, onChange, scroll
//   scroll → tabs keep their natural width and the bar scrolls sideways
//            (for bars with many or long labels on a phone)

'use client';

export default function TabNav({ tabs = [], activeTab, onChange, scroll = false }) {
  return (
    <div className={scroll ? 'tab-nav tab-nav--scroll' : 'tab-nav'} role="tablist">
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

// `stable` reserves a minimum height so switching to a shorter tab never
// shrinks the page and makes the tab bar jump.
export function TabPanel({ children, stable = false }) {
  return (
    <div className={stable ? 'tab-panel tab-panel--stable' : 'tab-panel'} role="tabpanel">
      {children}
    </div>
  );
}
