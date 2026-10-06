// PATH: /src/components/shared/ConfirmDialog.jsx
// The app's confirmation modal for destructive actions (remove a skill,
// delete a photo, remove a certificate, decline a request). Replaces
// window.confirm(): a white rounded card with a clear Cancel button and a
// red confirm button.
//
//   const { confirm, dialog } = useConfirmDialog();
//   ...
//   if (!(await confirm({ title: 'Remove this photo?', message: '…' }))) return;
//   ...
//   return <>{…}{dialog}</>;
//
// Accessibility: role="alertdialog", labelled and described; focus starts on
// Cancel (the safe choice), is kept inside the dialog, and returns to the
// control that opened it. Escape or a tap on the backdrop cancels.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import Icon from '@/components/ui/Icon';

export function useConfirmDialog() {
  const [request, setRequest] = useState(null);   // { title, message, confirmLabel, cancelLabel, resolve }

  const confirm = useCallback(
    (options) => new Promise((resolve) => setRequest({ ...options, resolve })),
    []
  );

  const settle = useCallback((answer) => {
    setRequest((current) => { current?.resolve(answer); return null; });
  }, []);

  const dialog = request ? (
    <ConfirmDialog
      title={request.title}
      message={request.message}
      confirmLabel={request.confirmLabel}
      cancelLabel={request.cancelLabel}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null;

  return { confirm, dialog };
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const cardRef   = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    cancelRef.current?.focus();

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onCancel?.(); return; }
      if (e.key !== 'Tab') return;
      // Keep focus inside the dialog.
      const items = cardRef.current?.querySelectorAll('button');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);

    // Stop the page behind from scrolling while the dialog is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, [onCancel]);

  // Rendered at the end of <body> so no card, tab panel or transform can clip it.
  return createPortal(
    <div
      className="confirm-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div
        ref={cardRef}
        className="confirm-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={message ? 'confirm-message' : undefined}
      >
        <span className="confirm-icon" aria-hidden="true">
          <Icon name="warning" size="lg" />
        </span>
        <h2 className="confirm-title" id="confirm-title">{title}</h2>
        {message && <p className="confirm-message" id="confirm-message">{message}</p>}

        <div className="confirm-actions">
          <button ref={cancelRef} type="button" className="btn-ghost-app" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-danger-app" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
