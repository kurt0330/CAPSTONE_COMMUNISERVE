// PATH: /src/components/shared/NegotiationPanel.jsx
// Custom Service bidding thread, shared by both portals.
//   - every offer as a message card (mine on the right, theirs on the left)
//   - if it's the viewer's turn: Accept Agreement / Counter-Offer / Decline
//   - otherwise: "Waiting for … to respond"
// respond_to_job_offer() re-checks the turn server-side, so a stale screen
// can't accept an offer that has already been countered.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Icon from '@/components/ui/Icon';
import PriceInput from '@/components/shared/PriceInput';
import { useConfirmDialog } from '@/components/shared/ConfirmDialog';
import { respondToOffer } from '@/actions/jobActions';
import { negotiationState } from '@/lib/negotiation';
import { formatPeso, formatDate } from '@/lib/format';
import { PAYMENT_STRUCTURES } from '@/lib/constants';

export default function NegotiationPanel({ job, viewer, otherPartyName }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const { isOpen, myTurn, offers, latest } = negotiationState(job, viewer);

  const [countering, setCountering] = useState(false);
  const [amount,     setAmount]     = useState('');
  const [note,       setNote]       = useState('');
  const [busy,       setBusy]       = useState(null);   // 'accept' | 'decline' | 'counter'
  const [error,      setError]      = useState('');

  const structure = PAYMENT_STRUCTURES[job.payment_structure];
  const otherLabel = otherPartyName ?? (viewer === 'customer' ? 'the provider' : 'the customer');

  async function act(action) {
    if (action === 'counter') {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) { setError('Enter the amount you want to offer.'); return; }
    }
    if (action === 'decline') {
      const ok = await confirm({
        title: 'Decline this request?',
        message: 'This ends the negotiation. It cannot be reopened.',
        confirmLabel: 'Decline',
        cancelLabel: 'Keep negotiating',
      });
      if (!ok) return;
    }

    setBusy(action);
    setError('');
    const result = await respondToOffer(job.job_id, action, amount, note);
    setBusy(null);

    if (!result.success) { setError(result.error); router.refresh(); return; }
    setCountering(false);
    setAmount('');
    setNote('');
    router.refresh();
  }

  if (!offers.length) return null;

  return (
    <div className="negotiation">
      <div className="offer-thread" aria-label="Offer history">
        {offers.map((o) => {
          const mine = o.offered_by === viewer;
          return (
            <div key={o.offer_id} className={`offer-bubble${mine ? ' offer-bubble--mine' : ''}`}>
              <span className="offer-bubble-meta">
                {mine ? 'You offered' : `${otherLabel} offered`} · {formatDate(o.created_at)}
              </span>
              <span className="offer-bubble-amount">
                {formatPeso(o.amount)}
                {structure && <span className="service-price-unit">{structure.unit}</span>}
              </span>
              {o.note && <span className="offer-bubble-note">{o.note}</span>}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="app-alert" role="alert">
          <Icon name="warning" size="md" />
          <span>{error}</span>
        </div>
      )}

      {isOpen && !myTurn && (
        <p className="negotiation-waiting">
          <Icon name="hourglass" size="sm" />
          Waiting for {otherLabel} to respond to your offer of {formatPeso(latest.amount)}.
        </p>
      )}

      {myTurn && !countering && (
        <div className="negotiation-actions">
          <button type="button" className="btn-accept btn-sm" onClick={() => act('accept')} disabled={!!busy}>
            <Icon name="check" size="sm" />
            {busy === 'accept' ? 'Accepting…' : `Accept Agreement · ${formatPeso(latest.amount)}`}
          </button>
          <button type="button" className="btn-ghost-app btn-sm" onClick={() => setCountering(true)} disabled={!!busy}>
            <Icon name="refresh" size="sm" />
            Counter-Offer
          </button>
          <button type="button" className="btn-reject btn-sm" onClick={() => act('decline')} disabled={!!busy}>
            <Icon name="close" size="sm" />
            {busy === 'decline' ? 'Declining…' : 'Decline'}
          </button>
        </div>
      )}

      {myTurn && countering && (
        <div className="counter-form">
          <label className="field-label" htmlFor={`counter-${job.job_id}`}>
            Your counter-offer{structure ? ` (${structure.label}, ${structure.unit})` : ''}
          </label>
          <PriceInput id={`counter-${job.job_id}`} value={amount} onChange={setAmount} label="Counter-offer amount" />
          <input
            className="profile-edit-input"
            placeholder="Add a short note (optional)"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Note"
          />
          <div className="form-actions">
            <button type="button" className="btn-primary-app btn-sm" onClick={() => act('counter')} disabled={!!busy}>
              {busy === 'counter' ? 'Sending…' : 'Send Counter-Offer'}
            </button>
            <button type="button" className="btn-ghost-app btn-sm" onClick={() => { setCountering(false); setError(''); }} disabled={!!busy}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {dialog}
    </div>
  );
}
