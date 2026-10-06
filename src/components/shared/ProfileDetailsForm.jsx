// PATH: /src/components/shared/ProfileDetailsForm.jsx
// Inline, on-page editor for the fields a user may change about themselves.
//   provider  → display nickname + professional bio
//   customer  → display nickname + about me + street address + contact number
// One primary action (Save changes), enabled only when something changed.
// Each problem is shown under its own field and tied to it for screen readers.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Icon from '@/components/ui/Icon';
import { NICKNAME_MAX, BIO_MAX, STREET_MAX } from '@/lib/uploads';
import { updateMyProfile } from '@/actions/profileActions';

export default function ProfileDetailsForm({ variant = 'customer', initial = {} }) {
  const router = useRouter();
  const isCustomer = variant === 'customer';

  const clean = (v) => v ?? '';
  const [saved,  setSaved]  = useState({
    nickname:      clean(initial.nickname),
    bio:           clean(initial.bio),
    streetAddress: clean(initial.streetAddress),
    contactNumber: clean(initial.contactNumber),
  });
  const [values, setValues] = useState(saved);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);   // { tone, text }
  const [saving, setSaving] = useState(false);

  const dirty = Object.keys(values).some((k) => values[k] !== saved[k]);

  function set(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    setStatus(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving || !dirty) return;

    setSaving(true);
    setStatus(null);
    const result = await updateMyProfile(values);
    setSaving(false);

    if (result.success) {
      setSaved(values);
      setErrors({});
      setStatus({ tone: 'success', text: 'Your changes are saved.' });
      router.refresh();
    } else {
      setErrors(result.fieldErrors ?? {});
      setStatus({ tone: 'error', text: result.error ?? 'Could not save. Please try again.' });
    }
  }

  const describe = (field, hintId) =>
    [errors[field] && `pf-${field}-error`, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <form onSubmit={handleSubmit} className="form-stack" noValidate>

      <div>
        <label className="field-label" htmlFor="pf-nickname">Display nickname</label>
        <input
          id="pf-nickname"
          className="field-input"
          value={values.nickname}
          maxLength={NICKNAME_MAX}
          onChange={(e) => set('nickname', e.target.value)}
          disabled={saving}
          autoComplete="nickname"
          aria-invalid={!!errors.nickname}
          aria-describedby={describe('nickname', 'pf-nickname-hint')}
        />
        <FieldError id="pf-nickname-error" text={errors.nickname} />
        <p className="field-hint" id="pf-nickname-hint">
          Shown next to your name. Leave it empty to use your full name only.
        </p>
      </div>

      <div>
        <label className="field-label" htmlFor="pf-bio">
          {isCustomer ? 'About me' : 'Professional bio'}
        </label>
        <textarea
          id="pf-bio"
          className="field-input"
          rows={5}
          value={values.bio}
          maxLength={BIO_MAX}
          onChange={(e) => set('bio', e.target.value)}
          disabled={saving}
          aria-invalid={!!errors.bio}
          aria-describedby={describe('bio', 'pf-bio-hint')}
        />
        <FieldError id="pf-bio-error" text={errors.bio} />
        <p className="field-hint field-hint--split" id="pf-bio-hint">
          <span>
            {isCustomer
              ? 'Optional. A few words providers will see when you send a request.'
              : 'Describe your experience and the kind of work you take on.'}
          </span>
          <span className="char-count">{values.bio.length}/{BIO_MAX}</span>
        </p>
      </div>

      {isCustomer && (
        <>
          <div>
            <label className="field-label" htmlFor="pf-street">Street address</label>
            <input
              id="pf-street"
              className="field-input"
              value={values.streetAddress}
              maxLength={STREET_MAX}
              onChange={(e) => set('streetAddress', e.target.value)}
              disabled={saving}
              autoComplete="address-line1"
              aria-invalid={!!errors.streetAddress}
              aria-describedby={describe('streetAddress', 'pf-street-hint')}
            />
            <FieldError id="pf-streetAddress-error" text={errors.streetAddress} />
            <p className="field-hint" id="pf-street-hint">House number, street or purok. Your barangay is set above.</p>
          </div>

          <div>
            <label className="field-label" htmlFor="pf-contact">Contact number</label>
            <input
              id="pf-contact"
              className="field-input"
              type="tel"
              inputMode="numeric"
              value={values.contactNumber}
              maxLength={13}
              onChange={(e) => set('contactNumber', e.target.value)}
              disabled={saving}
              autoComplete="tel"
              aria-invalid={!!errors.contactNumber}
              aria-describedby={describe('contactNumber', 'pf-contact-hint')}
            />
            <FieldError id="pf-contactNumber-error" text={errors.contactNumber} />
            <p className="field-hint" id="pf-contact-hint">11-digit mobile number, for example 09171234567.</p>
          </div>
        </>
      )}

      <div className="form-footer">
        <button type="submit" className="btn-primary-app" disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <p
          className={`form-status${status ? ` form-status--${status.tone}` : ''}`}
          role="status"
          aria-live="polite"
        >
          {status && <Icon name={status.tone === 'success' ? 'check-circle' : 'warning'} size="sm" />}
          {status?.text ?? (dirty ? 'You have unsaved changes.' : '')}
        </p>
      </div>
    </form>
  );
}

function FieldError({ id, text }) {
  if (!text) return null;
  return <p className="field-error" id={id}>{text}</p>;
}
