// PATH: /src/components/shared/PriceInput.jsx
// ₱-prefixed amount field. Uses inputMode="decimal" so phones open the
// number pad; the value stays a string until the caller parses it.

'use client';

export default function PriceInput({ value, onChange, label, id, placeholder = '0', required = false, disabled = false }) {
  return (
    <div className="price-input">
      <span className="price-input-prefix" aria-hidden="true">₱</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="1"
        max="1000000"
        step="0.01"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}
