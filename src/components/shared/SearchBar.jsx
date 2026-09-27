// PATH: /src/components/shared/SearchBar.jsx
// Search field with a leading icon and a trailing clear button.

'use client';

import Icon from '@/components/ui/Icon';

export default function SearchBar({
  value,
  onChange,
  onClear,
  onCommit,
  placeholder = 'Search…',
  icon = 'search',
}) {
  return (
    <div className="search-bar">
      <span className="search-bar-icon">
        <Icon name={icon} size="md" />
      </span>
      <input
        type="text"
        className="search-bar-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        // onCommit fires when the search is "finished" — used to record a
        // recent search without saving on every keystroke.
        onKeyDown={(e) => { if (e.key === 'Enter') onCommit?.(value); }}
        onBlur={() => onCommit?.(value)}
      />
      {value && (
        <button
          type="button"
          className="search-bar-clear"
          onClick={onClear}
          aria-label="Clear search"
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}
