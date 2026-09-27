// PATH: /src/components/shared/Sheet.jsx
// Bottom sheet on phones, centred dialog from 768px up (styles in
// app-shell.css). Closes on the ✕ button, the backdrop, or Escape.

'use client';

import { useEffect } from 'react';
import Icon from '@/components/ui/Icon';

export default function Sheet({ title, onClose, children, labelledBy = 'sheet-title' }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    // Stop the page behind the sheet from scrolling.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <h2 className="sheet-title" id={labelledBy}>{title}</h2>
          <button type="button" className="app-topbar-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size="sm" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
