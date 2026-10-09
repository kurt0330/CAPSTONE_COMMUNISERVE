// PATH: /src/app/auth/login/page.js
'use client';

import { useState, useEffect, Suspense } from 'react';
import Icon from '@/components/ui/Icon';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import RegisterForm from '@/components/customer/RegisterForm';
import EmailInput from '@/components/ui/EmailInput';
import { completeEmail } from '@/lib/email';

// useSearchParams() opts the subtree into client-side rendering, so Next.js
// requires it to sit inside a Suspense boundary — without one the production
// build fails to prerender this route.
export default function UnifiedAuthPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <UnifiedAuthContent />
    </Suspense>
  );
}

function AuthLoadingFallback() {
  return (
    <div style={{ backgroundColor: '#f4f7ff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0504AA', fontWeight: 700 }}>
      Loading…
    </div>
  );
}

function UnifiedAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ── SLIDING PANEL STATE ──
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsRightPanelActive(true);
    }
  }, [searchParams]);

  // ── UNIFIED LOGIN LOGIC ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false); // toggles password visibility
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    // "juan" → "juan@gmail.com" (covers pressing Enter while still in the field)
    const fullEmail = completeEmail(email);
    if (fullEmail !== email) setEmail(fullEmail);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: fullEmail, password });

    if (authError) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, onboarding_complete')
      .eq('auth_id', authData.user.id)
      .single();

    if (userError || !userData) {
      setError('User profile not found. Please contact support.');
      setLoading(false);
      return;
    }

    if (userData.role === 'Admin') {
      router.push('/admin/dashboard');
    } else if (userData.role === 'Provider') {
      if (!userData.onboarding_complete) {
        router.push('/provider/onboarding');
      } else {
        router.push('/provider/dashboard');
      }
    } else if (userData.role === 'Customer') {
      if (!authData.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setError(
          'Your email address has not been verified yet. ' +
          'Please check your inbox for the 6-digit confirmation code, ' +
          'then complete registration at /register/customer.'
        );
        setLoading(false);
        return;
      }
      router.push('/customer/dashboard');
    } else {
      setError('Unrecognized user role.');
      setLoading(false);
      return;
    }

    router.refresh();
  }

  // ── RENDER SLIDING UI ──
  // Desktop: a blue panel slides across a frosted-glass card while the two
  // forms cross-fade. Its inner edge is masked so it dissolves into the glass
  // instead of ending in a hard line. Phones: one form at a time, no panel.
  return (
    <div className="auth-page">

      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; }

        .auth-page {
          --auth-blue: #0504AA;
          --auth-ink: #14143a;
          --auth-muted: #5d6280;
          --auth-line: rgba(5, 4, 170, 0.16);
          --auth-ease: cubic-bezier(0.65, 0, 0.35, 1);
          --auth-dur: 0.95s;
          --auth-fade: 120px;
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
          color: var(--auth-ink);
          background:
            radial-gradient(60% 55% at 10% 8%, rgba(5, 4, 170, 0.16), transparent 70%),
            radial-gradient(45% 45% at 92% 94%, rgba(184, 123, 46, 0.16), transparent 70%),
            radial-gradient(40% 40% at 88% 6%, rgba(59, 59, 201, 0.14), transparent 70%),
            #eef1ff;
        }

        /* Soft colour shapes behind the card — they are what the glass blurs.
           Blue and warm brown, the landing page's resident and provider sides. */
        .auth-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .auth-orb--a {
          width: 420px; height: 420px;
          left: calc(50% - 640px); top: calc(50% - 480px);
          background: radial-gradient(circle at 35% 35%, #6f6dff, #0504AA 72%);
          opacity: 0.5;
        }
        .auth-orb--b {
          width: 300px; height: 300px;
          left: calc(50% + 310px); top: calc(50% + 180px);
          background: radial-gradient(circle at 35% 35%, #ecc98f, #a9742c 75%);
          opacity: 0.55;
        }
        .auth-orb--c {
          width: 170px; height: 170px;
          left: calc(50% - 570px); top: calc(50% + 210px);
          background: radial-gradient(circle at 35% 35%, #f3dcae, #c08a3e 75%);
          opacity: 0.5;
        }

        /* ── The glass card ── */
        .auth-container {
          position: relative;
          z-index: 1;
          overflow: hidden;
          width: 100%;
          max-width: 960px;
          min-height: 760px;
          border-radius: 24px;
          container-type: inline-size;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            0 30px 60px -22px rgba(5, 4, 170, 0.3),
            0 8px 24px rgba(20, 20, 58, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.85);
        }
        @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .auth-container {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.52));
            -webkit-backdrop-filter: blur(26px) saturate(160%);
            backdrop-filter: blur(26px) saturate(160%);
          }
        }

        /* ── Forms: both sit on the left and travel right together; only the
              one in use is visible, and they cross-fade on the way ── */
        .form-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 46%;
          height: 100%;
          padding: 30px 40px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          z-index: 1;
          transition:
            transform var(--auth-dur) var(--auth-ease),
            opacity 0.4s ease,
            visibility 0s linear var(--auth-dur);
        }
        .form-container { scrollbar-width: thin; scrollbar-color: rgba(5, 4, 170, 0.25) transparent; }

        .auth-container.right-panel-active .form-container {
          transform: translateX(117.3913%);
        }
        .auth-container:not(.right-panel-active) .sign-in-container,
        .auth-container.right-panel-active .sign-up-container {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          z-index: 5;
          transition:
            transform var(--auth-dur) var(--auth-ease),
            opacity 0.55s ease 0.38s,
            visibility 0s;
        }

        /* ── Wordmark row ── */
        .auth-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-shrink: 0;
        }
        .auth-brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          text-decoration: none;
          color: var(--auth-blue);
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 1.6px;
        }
        .auth-brand img {
          height: 30px;
          width: auto;
          mix-blend-mode: multiply;
        }
        .auth-home {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 44px;
          padding: 0 4px;
          text-decoration: none;
          color: var(--auth-muted);
          font-size: 13px;
          font-weight: 600;
          transition: color 0.2s;
        }
        .auth-home:hover { color: var(--auth-blue); }

        .auth-form-body {
          width: 100%;
          max-width: 350px;
          margin: auto;
          padding: 24px 0;
        }
        .auth-title {
          margin: 0 0 8px;
          color: var(--auth-blue);
          font-size: 32px;
          font-weight: 800;
        }
        .auth-sub {
          margin: 0 0 28px;
          color: var(--auth-muted);
          font-size: 15px;
        }
        .auth-error {
          background: rgba(255, 245, 245, 0.9);
          border: 1.5px solid #E24B4A;
          border-radius: 10px;
          padding: 11px 14px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #C93B3A;
          font-weight: 600;
        }
        .auth-form { display: flex; flex-direction: column; gap: 16px; }
        .auth-field { display: flex; flex-direction: column; gap: 6px; }
        .auth-label { font-size: 13px; font-weight: 700; color: #3a3d57; }
        .auth-pwd { position: relative; }

        /* Glass inputs — shared by the sign-in fields and the sign-up form */
        .auth-input,
        .auth-container .rc-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--auth-line);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.66);
          color: var(--auth-ink);
          font-size: 16px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .auth-input:focus,
        .auth-container .rc-input:focus {
          border-color: var(--auth-blue);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 0 0 3px rgba(5, 4, 170, 0.14);
        }
        .auth-container .rc-input--ok  { border-color: var(--sp-teal, #1D9E75); }
        .auth-container .rc-input--err { border-color: var(--sp-red, #E24B4A); }
        .auth-input--pwd { padding-right: 48px; }

        .auth-eye {
          position: absolute;
          top: 50%;
          right: 2px;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #8a8fa8;
          cursor: pointer;
        }

        .auth-submit,
        .auth-container .rc-submit {
          border-radius: 10px;
          box-shadow: 0 10px 22px -10px rgba(5, 4, 170, 0.6);
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .auth-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          padding: 14px;
          background: var(--auth-blue);
          color: #fff;
          border: none;
          font-family: inherit;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }
        .auth-submit:hover:not(:disabled),
        .auth-container .rc-submit:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .auth-submit:disabled {
          background: #999;
          box-shadow: none;
          cursor: not-allowed;
        }
        .auth-container .rc-submit:disabled { box-shadow: none; }

        /* The sign-up form brings its own page wrapper and white card; inside
           the glass card it sits flat, and the wordmark row replaces its brand. */
        .auth-container .rc-wrap {
          min-height: 0;
          display: block;
          padding: 0;
          background: transparent;
          font-family: inherit;
        }
        .auth-container .rc-brand { display: none; }
        .auth-container .rc-card {
          max-width: 400px;
          margin: 0 auto;
          padding: 0;
          background: transparent;
          box-shadow: none;
        }
        .auth-container .rc-card-title { color: var(--auth-blue); font-size: 24px; font-weight: 800; }
        .auth-container .rc-card-sub   { color: var(--auth-muted); }
        .auth-container .rc-switch     { color: var(--auth-muted); }
        .auth-container .rc-form       { gap: 10px; }
        .auth-container .rc-input      { min-height: 44px; padding-top: 10px; padding-bottom: 10px; }
        .auth-container .rc-pwd-wrap .rc-input { padding-right: 48px; }
        .auth-container .rc-eye {
          right: 2px;
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .auth-container .rc-card-sub   { margin-bottom: 16px; }
        .auth-signup-body { margin: auto 0; padding: 4px 0 0; }
        .sign-up-container { padding-top: 20px; padding-bottom: 20px; }

        /* ── The blue panel that slides ── */
        .overlay-container {
          position: absolute;
          top: 0;
          left: 46%;
          width: calc(54% + var(--auth-fade));
          height: 100%;
          overflow: hidden;
          z-index: 100;
          /* Both side edges dissolve. The panel is one fade-width wider than
             its half of the card, so the outer fade always sits outside the
             card and only the inner edge is seen fading. */
          -webkit-mask-image: linear-gradient(to right,
            transparent 0,
            rgba(0, 0, 0, 0.05) calc(var(--auth-fade) * 0.12),
            rgba(0, 0, 0, 0.24) calc(var(--auth-fade) * 0.34),
            rgba(0, 0, 0, 0.58) calc(var(--auth-fade) * 0.60),
            rgba(0, 0, 0, 0.88) calc(var(--auth-fade) * 0.84),
            #000 var(--auth-fade),
            #000 calc(100% - var(--auth-fade)),
            rgba(0, 0, 0, 0.88) calc(100% - var(--auth-fade) * 0.84),
            rgba(0, 0, 0, 0.58) calc(100% - var(--auth-fade) * 0.60),
            rgba(0, 0, 0, 0.24) calc(100% - var(--auth-fade) * 0.34),
            rgba(0, 0, 0, 0.05) calc(100% - var(--auth-fade) * 0.12),
            transparent 100%);
          mask-image: linear-gradient(to right,
            transparent 0,
            rgba(0, 0, 0, 0.05) calc(var(--auth-fade) * 0.12),
            rgba(0, 0, 0, 0.24) calc(var(--auth-fade) * 0.34),
            rgba(0, 0, 0, 0.58) calc(var(--auth-fade) * 0.60),
            rgba(0, 0, 0, 0.88) calc(var(--auth-fade) * 0.84),
            #000 var(--auth-fade),
            #000 calc(100% - var(--auth-fade)),
            rgba(0, 0, 0, 0.88) calc(100% - var(--auth-fade) * 0.84),
            rgba(0, 0, 0, 0.58) calc(100% - var(--auth-fade) * 0.60),
            rgba(0, 0, 0, 0.24) calc(100% - var(--auth-fade) * 0.34),
            rgba(0, 0, 0, 0.05) calc(100% - var(--auth-fade) * 0.12),
            transparent 100%);
          transition: transform var(--auth-dur) var(--auth-ease);
        }
        .auth-container.right-panel-active .overlay-container {
          transform: translateX(calc(-46cqw - var(--auth-fade)));
        }

        .overlay {
          background:
            radial-gradient(70% 60% at 100% 0%, rgba(126, 124, 255, 0.55), transparent 60%),
            radial-gradient(60% 55% at 0% 100%, rgba(29, 158, 117, 0.3), transparent 62%),
            linear-gradient(135deg, #0504AA 0%, #1412d8 100%);
          color: #FFFFFF;
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          transform: translateX(0);
          transition: transform var(--auth-dur) var(--auth-ease);
        }
        .auth-container.right-panel-active .overlay {
          transform: translateX(50%);
        }

        .overlay-panel {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          top: 0;
          height: 100%;
          width: 50%;
          opacity: 0;
          visibility: hidden;
          transition:
            transform var(--auth-dur) var(--auth-ease),
            opacity 0.4s ease,
            visibility 0s linear var(--auth-dur);
        }
        .overlay-panel h1 { margin: 0 0 16px; font-size: 34px; font-weight: 800; }
        .overlay-panel p  { margin: 0 0 24px; max-width: 320px; font-size: 15px; line-height: 1.6; color: rgba(255, 255, 255, 0.88); }

        /* Each panel keeps its text clear of its own fading edge. */
        .overlay-left {
          padding: 0 calc(var(--auth-fade) + 8px) 0 calc(var(--auth-fade) + 44px);
          transform: translateX(-18%);
        }
        .overlay-right {
          right: 0;
          padding: 0 calc(var(--auth-fade) + 44px) 0 calc(var(--auth-fade) + 8px);
          transform: translateX(0);
        }
        .auth-container.right-panel-active .overlay-left  { transform: translateX(0); }
        .auth-container.right-panel-active .overlay-right { transform: translateX(18%); }
        .auth-container.right-panel-active .overlay-left,
        .auth-container:not(.right-panel-active) .overlay-right {
          opacity: 1;
          visibility: visible;
          transition:
            transform var(--auth-dur) var(--auth-ease),
            opacity 0.55s ease 0.32s,
            visibility 0s;
        }

        .ghost-btn {
          min-height: 46px;
          padding: 12px 34px;
          border: 1.5px solid rgba(255, 255, 255, 0.85);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
          font-family: inherit;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }
        .ghost-btn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.22);
        }

        .mobile-toggle {
          display: none;
          min-height: 44px;
          background: none;
          border: none;
          color: var(--auth-blue);
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
        }

        @keyframes authRise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .form-container { padding: 26px 30px; }
          .overlay-panel h1 { font-size: 28px; }
        }

        /* ── Phones: one full-width form at a time, no sliding panel ── */
        @media (max-width: 768px) {
          .auth-page { padding: 0; align-items: stretch; }
          .auth-orb--a { left: -170px; top: -150px; width: 340px; height: 340px; }
          .auth-orb--b { left: auto; right: -120px; top: auto; bottom: -90px; width: 260px; height: 260px; }
          .auth-orb--c { left: -60px; top: 58%; width: 140px; height: 140px; }
          .auth-container {
            max-width: none;
            min-height: 100vh;
            min-height: 100dvh;
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }
          .overlay-container { display: none; }
          .auth-container .form-container,
          .auth-container.right-panel-active .form-container {
            position: relative;
            width: 100%;
            height: auto;
            min-height: 100vh;
            min-height: 100dvh;
            padding: 16px 20px 28px;
            overflow: visible;
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: none;
            transition: none;
            animation: authRise 0.5s var(--auth-ease) both;
          }
          .auth-container .sign-up-container { display: ${isRightPanelActive ? 'flex' : 'none'}; }
          .auth-container .sign-in-container { display: ${isRightPanelActive ? 'none' : 'flex'}; }
          .mobile-toggle { display: block; margin: 18px auto 0; text-align: center; }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-page { --auth-dur: 0.01s; }
          .form-container,
          .overlay-panel { transition-duration: 0.01s !important; transition-delay: 0s !important; }
          .auth-container .form-container { animation: none !important; }
        }
      `}} />

      <span className="auth-orb auth-orb--a" aria-hidden="true" />
      <span className="auth-orb auth-orb--b" aria-hidden="true" />
      <span className="auth-orb auth-orb--c" aria-hidden="true" />

      <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`}>

        {/* ── CUSTOMER SIGN UP PANEL ── */}
        <div className="form-container sign-up-container">
          <AuthTopRow />

          <div className="auth-signup-body">
            <RegisterForm />

            <button type="button" className="mobile-toggle" onClick={() => setIsRightPanelActive(false)}>
              Already have an account? Sign in.
            </button>
          </div>
        </div>

        {/* ── UNIFIED SIGN IN PANEL ── */}
        <div className="form-container sign-in-container">
          <AuthTopRow />

          <div className="auth-form-body">
            <h1 className="auth-title">Sign In</h1>
            <p className="auth-sub">Access your CommuniServe account</p>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <label htmlFor="login_email" className="auth-label">Email Address</label>
                <EmailInput
                  id="login_email"
                  value={email}
                  onValueChange={setEmail}
                  required
                  className="auth-input"
                />
              </div>

              {/* Password field with visibility toggle */}
              <div className="auth-field">
                <label htmlFor="login_password" className="auth-label">Password</label>
                <div className="auth-pwd">
                  <input
                    id="login_password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="auth-input auth-input--pwd"
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPwd ? 'eye-off' : 'eye'} size="md" />
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? 'Authenticating...' : <>Sign In <Icon name="arrow-right" size="sm" /></>}
              </button>
            </form>

            <button type="button" className="mobile-toggle" onClick={() => setIsRightPanelActive(true)}>
              New to CommuniServe? Sign up.
            </button>
          </div>
        </div>

        {/* ── THE BLUE PANEL THAT SLIDES ── */}
        <div className="overlay-container">
          <div className="overlay">

            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>
                Already have an account? Sign in to access your unified dashboard and connect with local providers.
              </p>
              <button type="button" className="ghost-btn" onClick={() => setIsRightPanelActive(false)}>
                Go to Sign In
              </button>
            </div>

            <div className="overlay-panel overlay-right">
              <h1>New to CommuniServe?</h1>
              <p>
                Create a free customer account to easily find and hire verified workers in Anini-y.
              </p>
              <button type="button" className="ghost-btn" onClick={() => setIsRightPanelActive(true)}>
                Sign Up as Customer
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// Wordmark at the top of each form; it and the quiet link beside it lead home.
function AuthTopRow() {
  return (
    <div className="auth-top">
      <Link href="/" className="auth-brand" aria-label="CommuniServe home">
        <img src="/logos/communiserve-icon.png" alt="" />
        COMMUNISERVE
      </Link>
      <Link href="/" className="auth-home">
        <Icon name="arrow-left" size="sm" />
        Home
      </Link>
    </div>
  );
}
