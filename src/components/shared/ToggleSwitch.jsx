// PATH: /src/components/shared/ToggleSwitch.jsx
// Generic on/off switch. Used for the provider availability control.
// NOTE: the schema has no availability column yet (CAPSTONE_DOCS.md gap G-1),
// so callers hold this in local state only until that field exists.

'use client';

export default function ToggleSwitch({ on, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle-switch${on ? ' on' : ''}`}
      onClick={() => onToggle(!on)}
    >
      <span className="toggle-knob" />
    </button>
  );
}
