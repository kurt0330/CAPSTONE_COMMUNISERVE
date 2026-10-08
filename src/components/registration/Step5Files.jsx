// PATH: /src/components/registration/Step5Files.jsx
// Replaces: #step-5 panel in SP/html/form1.html
// Props: fields, setFields, files, setFiles, children (NavRow with submit button)
// Schema: provider_files.file_type
//         ('national_id','national_id_back','photo','secondary_id','certificate')
//
// National ID: the provider enters the ID card number AND uploads a photo of
// the front and the back of the card, directly under the number. The number
// is stored in T-provider_identity (UNIQUE); the PESO admin checks it and the
// two photos before approving the account.
//
// Photos are resized to JPEG in the browser before they are attached, so the
// whole submission stays small enough to send on mobile data.

'use client';

import { useState } from 'react';
import { NATIONAL_ID_PIN_LENGTH } from '@/lib/constants';
import { compressJpeg } from '@/lib/uploads';
import Icon from '@/components/ui/Icon';

// ── Upload zone config — fileType matches provider_files.file_type exactly ──
const ID_ZONES = [
  {
    key:      'file_national_id',
    fileType: 'national_id',
    icon:     'id-card',
    title:    'National ID — Front',
    hint:     'The side with your photo and name',
    required: true,
    accept:   '.jpg,.jpeg,.png',
    maxSide:  1600,
  },
  {
    key:      'file_national_id_back',
    fileType: 'national_id_back',
    icon:     'id-card',
    title:    'National ID — Back',
    hint:     'The side with the QR code',
    required: true,
    accept:   '.jpg,.jpeg,.png',
    maxSide:  1600,
  },
];

const DOC_ZONES = [
  {
    key:      'file_photo',
    fileType: 'photo',
    icon:     'camera',
    title:    '2×2 ID Photo',
    hint:     'Recent photo, white background',
    required: true,
    accept:   '.jpg,.jpeg,.png',
    maxSide:  1000,
  },
  {
    key:      'file_certificate',
    fileType: 'certificate',
    icon:     'certificate',
    title:    'Trade Certificate / TESDA NC',
    hint:     'TESDA NC or any trade qualification (optional)',
    required: false,
    accept:   '.jpg,.jpeg,.png,.pdf',
    maxSide:  1600,
  },
];

const ZONES = [...ID_ZONES, ...DOC_ZONES];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per chosen file — mirrors registerProvider.js

const kb = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function Step5Files({ fields, setFields, files, setFiles, children }) {

  // Per-zone feedback: { key: { text, imgSrc, isOk, isError, isBusy } }
  const [previews, setPreviews] = useState({});

  const setPreview = (zoneKey, value) => setPreviews((prev) => ({ ...prev, [zoneKey]: value }));
  const setFile    = (zoneKey, value) => setFiles((prev) => ({ ...prev, [zoneKey]: value }));

  async function handleFileChange(zoneKey, e) {
    const input = e.target;
    const file = input.files?.[0] ?? null;
    const zone = ZONES.find((z) => z.key === zoneKey);

    if (!file) {
      setFile(zoneKey, null);
      setPreview(zoneKey, null);
      return;
    }

    // ── Client-side size guard (mirrors registerProvider.js) ──
    if (file.size > MAX_BYTES) {
      setFile(zoneKey, null);
      setPreview(zoneKey, { text: 'File too large (max 5 MB)', isError: true });
      input.value = '';
      return;
    }

    // ── Not an image (a PDF certificate): attach as it is ──
    if (!file.type.startsWith('image/')) {
      setFile(zoneKey, file);
      setPreview(zoneKey, { text: `${file.name} (${kb(file.size)})`, isOk: true });
      return;
    }

    // ── Image: resize + re-encode as JPEG, then preview ──
    setPreview(zoneKey, { text: 'Preparing photo…', isBusy: true });
    try {
      const blob = await compressJpeg(file, { maxSide: zone?.maxSide ?? 1600, quality: 0.82 });
      const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      const ready = new File([blob], name, { type: 'image/jpeg' });

      setFile(zoneKey, ready);
      setPreview(zoneKey, {
        imgSrc: URL.createObjectURL(blob),
        text:   `${name} (${kb(ready.size)})`,
        isOk:   true,
      });
    } catch (err) {
      console.error('[Step5Files] Could not read image:', err);
      setFile(zoneKey, null);
      setPreview(zoneKey, { text: 'That image could not be read. Please choose another photo.', isError: true });
      input.value = '';
    }
  }

  // ── National ID card number — digits only, fixed length ──
  const cardNumber = fields.national_id_pin ?? '';
  const cardNumberIsValid = cardNumber.length === NATIONAL_ID_PIN_LENGTH;

  function handleCardNumberChange(e) {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, NATIONAL_ID_PIN_LENGTH);
    setFields((prev) => ({ ...prev, national_id_pin: digitsOnly }));
  }

  function renderZone({ key, icon, title, hint, required, accept }) {
    const preview = previews[key];
    const hasFile = !!files[key];

    return (
      <div key={key} className={`upload-zone${hasFile ? ' file-ok' : ''}`} id={`zone-${key}`}>
        <span className="upload-zone-icon" style={{ color: 'var(--sp-blue)' }}>
          <Icon name={icon} size="xl" />
        </span>
        <p className="upload-zone-title">
          {title} {required && <span className="req">*</span>}
        </p>
        <p className="upload-zone-hint">{hint}</p>

        <label className="btn-file-choose">
          {hasFile ? 'Change File' : 'Choose File'}
          <input
            type="file"
            name={key}
            accept={accept}
            hidden
            onChange={(e) => handleFileChange(key, e)}
          />
        </label>

        {/* Feedback: thumbnail + filename, or a message */}
        {preview?.imgSrc && (
          <img
            src={preview.imgSrc}
            alt={`${title} preview`}
            style={{
              maxHeight: 72,
              maxWidth: '100%',
              borderRadius: 4,
              marginTop: 4,
              border: '1px solid #ccc',
            }}
          />
        )}
        <p
          className="upload-prev-name"
          role="status"
          style={{ color: preview?.isError ? 'var(--sp-red)' : (preview?.isBusy ? '#666' : 'var(--sp-teal)') }}
        >
          {preview?.text && !preview.isBusy && (
            <Icon name={preview.isError ? 'close' : 'check'} size="xs" style={{ marginRight: 4 }} />
          )}
          {preview?.text ?? ''}
        </p>
      </div>
    );
  }

  return (
    <div className="page-container step-panel" id="step-5">

      {/* ══ National ID verification — card number + front and back photos ══ */}
      <div className="section-header"><strong>NATIONAL ID VERIFICATION</strong></div>
      <p className="step-intro-text">
        Enter your <strong>National ID card number</strong> exactly as it appears on your
        PhilSys ID, then upload a clear photo of the <strong>front</strong> and the{' '}
        <strong>back</strong> of the card. The PESO Office checks these against official
        records before approving your account.
      </p>

      <div className="pin-input-group">
        <label htmlFor="national_id_pin" className="pin-label">
          National ID Card Number <span className="req">*</span>
        </label>
        <input
          id="national_id_pin"
          name="national_id_pin"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="pin-input"
          placeholder={`${NATIONAL_ID_PIN_LENGTH}-digit card number`}
          value={cardNumber}
          onChange={handleCardNumberChange}
        />
        <p
          className="pin-hint"
          style={{
            color: cardNumber.length === 0
              ? '#888'
              : (cardNumberIsValid ? 'var(--sp-teal)' : 'var(--sp-red)'),
          }}
        >
          {cardNumber.length === 0
            ? `Digits only — ${NATIONAL_ID_PIN_LENGTH} characters.`
            : (cardNumberIsValid
              ? <><Icon name="check" size="xs" style={{ marginRight: 4 }} />Valid format</>
              : <><Icon name="close" size="xs" style={{ marginRight: 4 }} />Must be exactly {NATIONAL_ID_PIN_LENGTH} digits ({cardNumber.length} entered)</>)}
        </p>
      </div>

      {/* National ID photos — right under the card number */}
      <p className="id-upload-label">
        Photos of your National ID <span className="req">*</span>
      </p>
      <div className="upload-grid">
        {ID_ZONES.map(renderZone)}
      </div>
      <p className="id-upload-note">
        Make sure all four corners are visible and the text is readable.
        Accepted: <strong>JPG, PNG</strong>.
      </p>

      {/* ══ Supporting documents ══ */}
      <div className="section-header"><strong>FILE ATTACHMENT</strong></div>
      <p className="step-intro-text">
        Upload a clear 2×2 photo and, if you have one, a trade certificate.
        Accepted: <strong>JPG, PNG, PDF</strong>. Max: <strong>5 MB per file</strong>.
      </p>

      <div className="upload-grid">
        {DOC_ZONES.map(renderZone)}
      </div>

      {/* ── Certification checkbox ── */}
      <div className="terms-block">
        <label className="terms-check-label">
          <input
            type="checkbox"
            id="terms_agreed"
            checked={!!fields.terms_agreed}
            onChange={(e) =>
              setFields((prev) => ({ ...prev, terms_agreed: e.target.checked }))
            }
            style={{ accentColor: '#0504AA' }}
          />
          I certify that all information I have provided is true and accurate.
          I understand that false information may result in disqualification
          and permanent removal from the CommuniServe registry.
        </label>
      </div>

      {/* NavRow (with submit button) injected by page.js */}
      {children}

      {/* Success state — page.js conditionally renders SuccessBanner instead */}
      <div id="submitSuccess" style={{ display: 'none' }} />
    </div>
  );
}
