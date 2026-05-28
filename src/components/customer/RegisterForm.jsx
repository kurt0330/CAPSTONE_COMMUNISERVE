// PATH: /src/components/customer/RegisterForm.jsx
// Full customer registration form with Custom Resend OTP verification phase.
// Phase 1: form fields → trigger custom send-otp API (Resend)
// Phase 2: OTP input → verify-otp API (creates user DB rows) → establish session → dashboard

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ── Anini-y barangay list (complete) ──────────────────────────────────────
const BARANGAYS = [
  'Aluyan', 'Bagumbayan', 'Barangay 1 (Pob.)', 'Barangay 2 (Pob.)',
  'Barangay 3 (Pob.)', 'Barangay 4 (Pob.)', 'Barangay 5 (Pob.)',
  'Barangay 6 (Pob.)', 'Barangay 7 (Pob.)', 'Biga-a', 'Bugasong',
  'Carataya', 'Casit-an', 'Dag-ang', 'Igbaras', 'Igpulong', 'Igtiig',
  'Igtuba', 'Katipunan', 'Lantangan', 'Magsaysay', 'Pang-itan', 'Patria',
  'San Joaquin', 'Sion (Pob.)', 'Tigbaluan', 'Tig-Apog-apog',
  'Tubod-Dugaya', 'Tubod-Kamping',
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
    return (
      <div style={styles.pageWrap}>

        {/* Branding */}
        <div style={styles.brandBlock}>
          <h1 style={styles.brandTitle}>COMMUNISERVE</h1>
          <p style={styles.brandSub}>
            Find trusted local service providers in Anini-y, Antique.
          </p>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Create a Resident Account</h2>
          <p style={styles.cardSub}>
            Register to search and hire verified local workers.
          </p>

          {error && <ErrorBanner message={error} />}

          <form onSubmit={handleRegister} style={styles.form}>

            <Field label="Full Name" required>
              <input
                type="text"
                value={fields.full_name}
                onChange={set('full_name')}
                placeholder="e.g. Maria Santos"
                required
                autoComplete="name"
                style={styles.input}
                onFocus={focusInput}
                onBlur={blurInput}
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
                style={styles.input}
                onFocus={focusInput}
                onBlur={blurInput}
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
                style={styles.input}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </Field>

            <Field label="Barangay" required>
              <select
                value={fields.barangay}
                onChange={set('barangay')}
                required
                style={{ ...styles.input, cursor: 'pointer' }}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                <option value="">— Select your barangay —</option>
                {BARANGAYS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>

            <Field label="Password" required>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={fields.password}
                  onChange={set('password')}
                  placeholder="Minimum 8 characters"
                  required
                  autoComplete="new-password"
                  style={{ ...styles.input, paddingRight: 44 }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={styles.eyeBtn}
                >
                  {showPwd ? '🙈' : '👁'}
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
                style={{
                  ...styles.input,
                  borderColor: fields.confirmPassword
                    ? fields.confirmPassword === fields.password
                      ? '#1D9E75'
                      : '#E24B4A'
                    : '#ddd',
                }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
              {fields.confirmPassword && fields.confirmPassword === fields.password && (
                <span style={styles.matchOk}>✓ Passwords match</span>
              )}
              {fields.confirmPassword && fields.confirmPassword !== fields.password && (
                <span style={styles.matchErr}>✗ Passwords do not match</span>
              )}
            </Field>

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.submitBtn, background: loading ? '#999' : '#0504AA' }}
            >
              {loading
                ? <><Spinner /> Creating account…</>
                : 'Create Account & Verify Email →'
              }
            </button>

          </form>

          <p style={styles.switchLink}>
            Are you a service provider?{' '}
            <a href="/register/provider" style={styles.link}>Apply here →</a>
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
      <div style={styles.pageWrap}>
        <div style={{ ...styles.card, maxWidth: 420, textAlign: 'center' }}>

          <div style={styles.otpIcon}>📧</div>
          <h2 style={styles.cardTitle}>Check Your Email</h2>
          <p style={styles.cardSub}>
            We sent a <strong>6-digit verification code</strong> to:
            <br />
            <strong style={{ color: '#0504AA' }}>{regEmail}</strong>
          </p>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 24 }}>
            Check your inbox (and spam folder). The code expires in 10 minutes.
          </p>

          {error && <ErrorBanner message={error} />}
          {resentMsg && (
            <div style={styles.resentMsg}>{resentMsg}</div>
          )}

          <form onSubmit={handleVerifyOtp} style={styles.form}>

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
                style={{
                  ...styles.input,
                  fontSize:      22,
                  textAlign:     'center',
                  letterSpacing: 10,
                  fontWeight:    700,
                }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.submitBtn, background: loading ? '#999' : '#1D9E75' }}
            >
              {loading
                ? <><Spinner /> Verifying…</>
                : 'Verify & Enter Dashboard →'
              }
            </button>

          </form>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={styles.resendBtn}
          >
            {resending ? 'Sending…' : "Didn't receive a code? Resend →"}
          </button>

          <p style={{ marginTop: 16, fontSize: 12, color: '#aaa' }}>
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => { setPhase('form'); setOtpCode(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#0504AA', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
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
      <div style={styles.pageWrap}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 40px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <h2 style={{ ...styles.cardTitle, color: '#1D9E75' }}>Email Verified!</h2>
          <p style={styles.cardSub}>Redirecting you to your dashboard…</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#aaa', fontSize: 13 }}>
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
    <div style={styles.fieldWrap}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.req}> *</span>}
      </label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div style={styles.errorBanner}>
      ⚠ {message}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
      ⟳
    </span>
  );
}

// ── Input focus/blur handlers ─────────────────────────────────────────────
function focusInput(e) { e.target.style.borderColor = '#0504AA'; }
function blurInput(e)  { e.target.style.borderColor = '#ddd'; }

// ════════════════════════════════════════════════════════════════
//  STYLES — const objects per architectural standard
// ════════════════════════════════════════════════════════════════
const styles = {
  pageWrap: {
    minHeight:      '100vh',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    background:     '#f0f0f0',
    fontFamily:     'Arial, sans-serif',
    padding:        '40px 24px',
  },
  brandBlock: {
    textAlign:    'center',
    marginBottom: 28,
  },
  brandTitle: {
    fontSize:      28,
    fontWeight:    700,
    color:         '#0504AA',
    letterSpacing: 1.5,
    margin:        '0 0 4px',
  },
  brandSub: {
    fontSize: 13,
    color:    '#777',
    margin:   0,
  },
  card: {
    background:   '#fff',
    borderRadius: 12,
    padding:      '36px 40px',
    width:        '100%',
    maxWidth:     480,
    boxShadow:    '0 4px 24px rgba(0,0,0,0.10)',
  },
  cardTitle: {
    fontSize:   18,
    fontWeight: 700,
    color:      '#111',
    margin:     '0 0 6px',
  },
  cardSub: {
    fontSize:     13,
    color:        '#777',
    margin:       '0 0 24px',
    lineHeight:   1.6,
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           18,
  },
  fieldWrap: {
    display:       'flex',
    flexDirection: 'column',
    gap:           6,
  },
  label: {
    fontSize:      12,
    fontWeight:    700,
    color:         '#333',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  req: {
    color:      '#E24B4A',
    fontWeight: 700,
  },
  input: {
    padding:      '10px 14px',
    border:       '1px solid #ddd',
    borderRadius: 8,
    fontSize:     14,
    fontFamily:   'Arial, sans-serif',
    outline:      'none',
    width:        '100%',
    boxSizing:    'border-box',
    transition:   'border-color 0.2s',
    background:   '#fff',
  },
  eyeBtn: {
    position:   'absolute',
    right:      12,
    top:        '50%',
    transform:  'translateY(-50%)',
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    fontSize:   14,
    color:      '#aaa',
    padding:    0,
  },
  matchOk: {
    fontSize:   11,
    color:      '#1D9E75',
    fontWeight: 600,
    marginTop:  2,
    display:    'block',
  },
  matchErr: {
    fontSize:   11,
    color:      '#E24B4A',
    fontWeight: 600,
    marginTop:  2,
    display:    'block',
  },
  submitBtn: {
    marginTop:      8,
    padding:        '13px',
    color:          '#fff',
    border:         'none',
    borderRadius:   8,
    fontSize:       15,
    fontWeight:     700,
    cursor:         'pointer',
    fontFamily:     'Arial, sans-serif',
    transition:     'background 0.2s',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    width:          '100%',
  },
  errorBanner: {
    background:   '#fff5f5',
    border:       '1.5px solid #E24B4A',
    borderRadius: 8,
    padding:      '11px 14px',
    marginBottom: 16,
    fontSize:     13,
    color:        '#E24B4A',
    fontWeight:   600,
    lineHeight:   1.5,
  },
  otpIcon: {
    fontSize:     48,
    marginBottom: 16,
  },
  resentMsg: {
    background:   '#e6f7f1',
    border:       '1px solid #1D9E75',
    borderRadius: 8,
    padding:      '9px 14px',
    marginBottom: 14,
    fontSize:     13,
    color:        '#1D9E75',
    fontWeight:   600,
  },
  resendBtn: {
    marginTop:      16,
    background:     'none',
    border:         'none',
    color:          '#0504AA',
    fontSize:       13,
    fontWeight:     600,
    cursor:         'pointer',
    textDecoration: 'underline',
    fontFamily:     'Arial, sans-serif',
  },
  switchLink: {
    marginTop:  14,
    fontSize:   12,
    color:      '#aaa',
    textAlign:  'center',
  },
  link: {
    color:          '#0504AA',
    fontWeight:     600,
    textDecoration: 'none',
  },
};