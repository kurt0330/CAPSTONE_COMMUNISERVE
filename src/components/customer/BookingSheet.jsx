// PATH: /src/components/customer/BookingSheet.jsx
// Booking sheet opened from a provider's Services tab.
//   service = { provider_service_id, service_name, price, price_unit, … }
//     → fixed booking: the price is fixed, the customer adds details
//   service = null
//     → Custom Service: description + proposed price; a Panday
//       (Carpenter) bid must also pick Arawan or Pakyawan.

'use client';

import { useState } from 'react';

import Sheet      from '@/components/shared/Sheet';
import PriceInput from '@/components/shared/PriceInput';
import Icon       from '@/components/ui/Icon';

import { createJobRequest } from '@/actions/jobActions';
import { BARANGAYS, PAYMENT_STRUCTURES, TRADE_ICONS } from '@/lib/constants';
import { formatPeso } from '@/lib/format';

export default function BookingSheet({ provider, service, onClose, onBooked }) {
  const isCustom   = !service;
  const isPanday   = provider.trade_category === 'Carpenter';

  const [description, setDescription] = useState('');
  const [price,       setPrice]       = useState('');
  const [structure,   setStructure]   = useState('');
  const [street,      setStreet]      = useState('');
  const [barangay,    setBarangay]    = useState(provider.barangay ?? '');
  const [sending,     setSending]     = useState(false);
  const [error,       setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (isCustom) {
      if (!description.trim()) return setError('Please describe the work you need.');
      if (!(Number(price) > 0)) return setError('Please enter your proposed price.');
      if (isPanday && !structure) return setError('Choose Arawan or Pakyawan for this bid.');
    }

    setSending(true);
    const result = await createJobRequest({
      providerId:        provider.provider_id,
      requestType:       isCustom ? 'custom' : 'fixed',
      providerServiceId: service?.provider_service_id,
      description,
      street,
      barangay,
      proposedPrice:     isCustom ? Number(price) : undefined,
      paymentStructure:  isCustom && isPanday ? structure : undefined,
    });
    setSending(false);

    if (result.success) onBooked?.(isCustom ? 'custom' : 'fixed');
    else setError(result.error ?? 'Could not send your request.');
  }

  return (
    <Sheet title={isCustom ? 'Request a Custom Service' : 'Book this Service'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-stack">

        {/* What is being booked */}
        <div className="sheet-summary">
          <span className="icon-badge">
            <Icon name={isCustom ? 'message' : (TRADE_ICONS[provider.trade_category] ?? 'toolbox')} size="lg" />
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="service-card-name">{isCustom ? 'Custom Service' : service.service_name}</p>
            <p className="service-card-desc" style={{ margin: 0 }}>
              {provider.full_name} · {provider.trade_category}
            </p>
            {!isCustom && (
              <span className="service-price">
                {formatPeso(service.price)}
                <span className="service-price-unit">{service.price_unit}</span>
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="app-alert" role="alert" style={{ margin: 0 }}>
            <Icon name="warning" size="md" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="bk-desc">
            {isCustom ? 'Describe the work you need *' : 'Notes for the provider (optional)'}
          </label>
          <textarea
            id="bk-desc"
            className="profile-edit-input"
            rows={isCustom ? 4 : 3}
            maxLength={1000}
            placeholder={isCustom
              ? 'e.g. Replace 3 rotten floor boards in the kitchen and repaint.'
              : 'e.g. Best time to come, what to bring, gate code.'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {isCustom && isPanday && (
          <div>
            <span className="field-label">How should the Panday be paid? *</span>
            <div className="option-grid" role="radiogroup" aria-label="Payment structure">
              {Object.entries(PAYMENT_STRUCTURES).map(([key, opt]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={structure === key}
                  className={`option-card${structure === key ? ' active' : ''}`}
                  onClick={() => setStructure(key)}
                >
                  <span className="option-radio" aria-hidden="true" />
                  <span>
                    <span className="option-title">{opt.label}</span>
                    <span className="option-sub">{opt.short}</span>
                    <span className="option-detail">{opt.detail}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="field-hint">Pandays don&apos;t charge by the hour.</p>
          </div>
        )}

        {isCustom && (
          <div>
            <label className="field-label" htmlFor="bk-price">
              Your proposed price *
              {isPanday && structure && ` (${PAYMENT_STRUCTURES[structure].unit})`}
            </label>
            <PriceInput id="bk-price" value={price} onChange={setPrice} label="Proposed price" />
            <p className="field-hint">The provider can accept, decline, or send a counter-offer.</p>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="bk-street">Street or purok (optional)</label>
          <input
            id="bk-street"
            className="profile-edit-input"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="bk-brgy">Barangay *</label>
          <select
            id="bk-brgy"
            className="profile-edit-input"
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            required
          >
            <option value="">— Select barangay —</option>
            {BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <button type="submit" className="btn-primary-app btn-block" disabled={sending}>
          {sending
            ? 'Sending…'
            : isCustom ? 'Send Offer' : `Book · ${formatPeso(service.price)}`}
        </button>
      </form>
    </Sheet>
  );
}
