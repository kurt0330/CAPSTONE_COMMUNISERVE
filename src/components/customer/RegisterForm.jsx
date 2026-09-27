// PATH: /src/components/customer/RegisterForm.jsx
// Full customer registration form with Custom Resend OTP verification phase.
// Phase 1: form fields → trigger custom send-otp API (Resend)
// Phase 2: OTP input → verify-otp API (creates user DB rows) → establish session → dashboard
//
// Styling note: presentation moved from inline style objects to
// /src/styles/register-customer.css so the screen can use real media queries
// and scale from phone to desktop. The registration/OTP logic below is
// unchanged.

'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import '@/styles/register-customer.css';

// ── Anini-y barangay list (complete) ──────────────────────────────────────
const BARANGAYS = [
  'Bayo Grande',
  'Bayo Pequeño',
  'Butuan',
  'Casay',
  'Casay Viejo',
  'Iba',
  'Igbarabatuan',
  'Igpalge',
  'Igtumarom',
  'Lisub A',
  'Lisub B',
  'Mabuyong',
  'Magdalena',
  'Nasuli C',
  'Nato',
  'Poblacion',
  'Sagua',
  'Salvacion',
  'San Francisco',
  'San Ramon',
  'San Roque',
  'Tagaytay',
  'Talisayan'
];

export default function RegisterForm() {
  const router = useRouter();

  // ── Phase control ─────────────────────────────────────────────────────
  const [phase,   setPhase]  = useState('form');   // 'form' | 'otp' | 'done'
  const [regEmail,setRegEmail]= useState('');

  // ── Form fields ───────────────────────────────────────────────────────
  const [fields, setFields] = useState({
    full_name:      '',
    email:          '',
    password:       '',
    confirmPassword:'',
    contact_number: '',
    barangay:       '',
  });

  // ── OTP ───────────────────────────────────────────────────────────────
  const [otpCode,  setOtpCode]  = useState('');

  // ── UI state ──────────────────────────────────────────────────────────
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
  const [resending,setResending]= useState(false);
  const [resentMsg,setResentMsg]= useState('');

  // ── Helpers ───────────────────────────────────────────────────────────
  const set = (key) => (e) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Phase 1: Trigger Resend OTP ───────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!fields.full_name.trim()) return setError('Full name is required.');
    if (!fields.barangay) return setError('Please select your barangay.');
    if (fields.password.length < 8) return setError('Password must be at least 8 characters.');
    if (fields.password !== fields.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);

    try {
      // Call our custom Resend OTP Trigger Route
      const res = await fetch('/api/customer/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fields.email.trim() })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to send verification code.');
        setLoading(false);
        return;
      }

      // Success! Move to OTP phase
      setRegEmail(fields.email.trim());
      setPhase('otp');
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Phase 2: Verify OTP & Create Account ──────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');

    if (otpCode.trim().length !== 6) {
      return setError('Please enter the 6-digit code sent to your email.');
    }

    setLoading(true);

    try {
      // 1. Send all data to our custom verify route to build the account
      const res = await fetch('/api/customer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail,
          otp: otpCode,
          password: fields.password,
          fullName: fields.full_name.trim(),
          contactNumber: fields.contact_number.trim(),
          barangay: fields.barangay
        })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Invalid code or registration failed.');
        setLoading(false);
        return;
      }

      // 2. Account is successfully created on the backend!
      // Now we just log them in on the frontend to create their active browser session.
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: regEmail,
        password: fields.password
      });

      if (signInError) {
        setError('Account verified, but auto-login failed. Please sign in manually.');
        setLoading(false);
        return;
      }

      // 3. Complete and redirect
      setPhase('done');
      router.push('/customer/dashboard');
      router.refresh();

    } catch (err) {
      setError('A network error occurred while verifying.');
      setLoading(false);
    }
  }

  // ── Resend OTP ────────────────────────────────────────────────────────
  async function handleResend() {
    setResending(true);
    setResentMsg('');
    setError('');

    try {
      const res = await fetch('/api/customer/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail })
      });

      const data = await res.json();

      if (data.success) {
        setResentMsg('A new code has been sent to your email.');
      } else {
        setError(data.message || 'Could not resend. Please try again.');
      }
    } catch (err) {
      setError('Network error while resending.');
    } finally {
      setResending(false);
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  PHASE: FORM
  // ════════════════════════════════════════════════════════════════
  if (phase === 'form') {
    const confirmState = !fields.confirmPassword
      ? ''
      : (fields.confirmPassword === fields.password ? ' rc-input--ok' : ' rc-input--err');

    return (
      <div className="rc-wrap">

        {/* Branding */}
        <div className="rc-brand">
          <h1 className="rc-brand-title">COMMUNISERVE</h1>
          <p className="rc-brand-sub">
            Find trusted local service providers in Anini-y, Antique.
          </p>
        </div>

        {/* Card */}
        <div className="rc-card">
          <h2 className="rc-card-title">Create a Resident Account</h2>
          <p className="rc-card-sub">
            Register to search and hire verified local workers.
          </p>

          {error && <ErrorBanner message={error} />}

          <form onSubmit={handleRegister} className="rc-form">

            <Field label="Full Name" required>
              <input
                type="text"
                value={fields.full_name}
                onChange={set('full_name')}
                placeholder="e.g. Maria Santos"
                required
                autoComplete="name"
                className="rc-input"
              />
            </Field>

            <Field label="Email Address" required>
              <input
                type="email"
                value={fields.email}
                onChange={set('email')}
                placeholder="yourname@email.com"
                required
                autoComplete="email"
                className="rc-input"
              />
            </Field>

            <Field label="Contact Number">
              <input
                type="tel"
                value={fields.contact_number}
                onChange={set('contact_number')}
                placeholder="09XXXXXXXXX"
                maxLength={11}
                autoComplete="tel"
                className="rc-input"
              />
            </Field>

            <Field label="Barangay" required>
              <select
                value={fields.barangay}
                onChange={set('barangay')}
                required
                className="rc-input rc-input--select"
              >
                <option value="">— Select your barangay —</option>
                {BARANGAYS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>

            <Field label="Password" required>
              <div className="rc-pwd-wrap">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={fields.password}
                  onChange={set('password')}
                  placeholder="Minimum 8 characters"
                  required
                  autoComplete="new-password"
                  className="rc-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="rc-eye"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPwd ? 'eye-off' : 'eye'} size="md" />
                </button>
              </div>
            </Field>

            <Field label="Confirm Password" required>
              <input
                type={showPwd ? 'text' : 'password'}
                value={fields.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                className={`rc-input${confirmState}`}
              />
              {fields.confirmPassword && fields.confirmPassword === fields.password && (
                <span className="rc-match-ok"><Icon name="check" size="xs" style={{ marginRight: 4 }} />Passwords match</span>
              )}
              {fields.confirmPassword && fields.confirmPassword !== fields.password && (
                <span className="rc-match-err"><Icon name="close" size="xs" style={{ marginRight: 4 }} />Passwords do not match</span>
              )}
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="rc-submit"
            >
              {loading
                ? <><Spinner /> Creating account…</>
                : <>Create Account &amp; Verify Email <Icon name="arrow-right" size="sm" /></>
              }
            </button>

          </form>

          <p className="rc-switch">
            Are you a service provider?{' '}
            <a href="/register/provider" className="rc-link">Apply here <Icon name="arrow-right" size="xs" /></a>
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  PHASE: OTP
  // ════════════════════════════════════════════════════════════════
  if (phase === 'otp') {
    return (
      <div className="rc-wrap">
        <div className="rc-card rc-card--narrow">

          <div className="rc-otp-icon" style={{ color: 'var(--sp-blue)' }}><Icon name="mail" size="2xl" /></div>
          <h2 className="rc-card-title">Check Your Email</h2>
          <p className="rc-card-sub">
            We sent a <strong>6-digit verification code</strong> to:
            <br />
            <strong className="rc-email">{regEmail}</strong>
          </p>
          <p className="rc-note">
            Check your inbox (and spam folder). The code expires in 10 minutes.
          </p>

          {error && <ErrorBanner message={error} />}
          {resentMsg && (
            <div className="rc-resent">{resentMsg}</div>
          )}

          <form onSubmit={handleVerifyOtp} className="rc-form">

            <Field label="Verification Code" required>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="_ _ _ _ _ _"
                required
                autoComplete="one-time-code"
                className="rc-input rc-input--otp"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="rc-submit rc-submit--verify"
            >
              {loading
                ? <><Spinner /> Verifying…</>
                : <>Verify &amp; Enter Dashboard <Icon name="arrow-right" size="sm" /></>
              }
            </button>

          </form>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="rc-resend"
          >
            {resending ? 'Sending…' : <>Didn&apos;t receive a code? Resend <Icon name="arrow-right" size="xs" /></>}
          </button>

          <p className="rc-switch">
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => { setPhase('form'); setOtpCode(''); setError(''); }}
              className="rc-textbtn"
            >
              Go back
            </button>
          </p>

        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  PHASE: DONE (brief flash before redirect)
  // ════════════════════════════════════════════════════════════════
  if (phase === 'done') {
    return (
      <div className="rc-wrap">
        <div className="rc-card rc-card--center">
          <div className="rc-done-icon" style={{ color: 'var(--sp-teal)' }}><Icon name="check-circle" size="2xl" /></div>
          <h2 className="rc-card-title rc-card-title--success">Email Verified!</h2>
          <p className="rc-card-sub">Redirecting you to your dashboard…</p>
          <div className="rc-loading-row">
            <Spinner /> Loading…
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ════════════════════════════════════════════════════════════════
//  REUSABLE SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════

function Field({ label, required, children }) {
  return (
    <div className="rc-field">
      <label className="rc-label">
        {label}
        {required && <span className="rc-req"> *</span>}
      </label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rc-error">
      <Icon name="warning" size="sm" style={{ marginRight: 6 }} />{message}
    </div>
  );
}

function Spinner() {
  return (
    <span className="rc-spinner">
      ⟳
    </span>
  );
}
