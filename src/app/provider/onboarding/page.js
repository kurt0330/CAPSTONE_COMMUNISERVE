// PATH: /src/app/provider/onboarding/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderOnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hardcoded default to check against reuse
  const TEMP_PASSWORD_DEFAULT = 'CommuniServe@2025!';

  // ── Strength indicator helper ─────────────────────────────────────────
  function passwordStrength(pwd) {
    if (!pwd) return null;
    if (pwd.length < 8) return { label: 'Too short', color: '#E24B4A', width: '25%' };
    
    const hasUpper  = /[A-Z]/.test(pwd);
    const hasLower  = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
    
    const score = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
    
    if (score <= 1) return { label: 'Weak',   color: '#E24B4A', width: '25%' };
    if (score === 2) return { label: 'Fair',   color: '#e6a817', width: '50%' };
    if (score === 3) return { label: 'Good',   color: '#1D9E75', width: '75%' };
    return                   { label: 'Strong', color: '#0504AA', width: '100%' };
  }

  const strength = passwordStrength(newPassword);

  function validatePassword() {
    if (newPassword.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(newPassword)) return 'Password must contain at least one uppercase letter (A-Z).';
    if (!/[a-z]/.test(newPassword)) return 'Password must contain at least one lowercase letter (a-z).';
    if (!/\d/.test(newPassword)) return 'Password must contain at least one number (0-9).';
    if (!/[^A-Za-z0-9]/.test(newPassword)) return 'Password must contain at least one special character (e.g., !, @, #, $, %).';
    if (newPassword !== confirm) return 'Passwords do not match. Please try again.';
    if (newPassword === TEMP_PASSWORD_DEFAULT) return 'You must choose a new password different from your temporary one.';
    return null;
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setError('');

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Call the API route to change password and update onboarding flag
      const res = await fetch('/api/provider/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      
      const apiResponse = await res.json();

      if (!apiResponse?.success) {
        setError(`Profile update failed: ${apiResponse?.error || apiResponse?.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      // Success — show the checkmark briefly, then redirect to the clean URL
      setLoading(false);
      setStep(3);
      setTimeout(() => {
        router.push('/provider/dashboard'); 
        router.refresh();
      }, 2500);

    } catch (err) {
      setError('A network error occurred. Please contact support.');
      setLoading(false);
    }
  }

  // ── STEP 1: Welcome Screen ──
  if (step === 1) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', fontFamily: 'Arial, sans-serif', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '40px 44px', width: '100%', maxWidth: 500, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0504AA', margin: '0 0 10px' }}>Welcome to CommuniServe!</h1>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 28px' }}>Your service provider application has been approved by the PESO Office of Anini-y. Before you access your dashboard, you need to complete a quick one-time account setup.</p>
          <button onClick={() => setStep(2)} style={{ width: '100%', padding: '13px', background: '#0504AA', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Set Up My Account →
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 2: Password Change Form ──
  if (step === 2) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', fontFamily: 'Arial, sans-serif', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '36px 40px', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#111' }}>Set Your Permanent Password</h3>
          <p style={{ fontSize: 13, color: '#777', margin: '0 0 20px' }}>Your temporary password will no longer work after this step.</p>
          
          {error && <div style={{ background: '#fff5f5', border: '1.5px solid #E24B4A', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#E24B4A', fontWeight: 600 }}>⚠ {error}</div>}

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* New Password Input Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>NEW PASSWORD</label>
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ background: 'none', border: 'none', color: '#0504AA', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
              <input 
                type={showPwd ? 'text' : 'password'} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} 
              />
              
              {/* Dynamic Strength Bar Graphic */}
              {strength && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: '#777' }}>Password Security:</span>
                    <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: strength.width, height: '100%', background: strength.color, transition: 'width 0.3s ease-in-out' }} />
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#888', lineHeight: 1.4 }}>
                    Must have 8+ characters with uppercase, lowercase, numbers, and symbols.
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Input Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>CONFIRM NEW PASSWORD</label>
              <input 
                type={showPwd ? 'text' : 'password'} 
                value={confirm} 
                onChange={(e) => setConfirm(e.target.value)} 
                required 
                style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} 
              />
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: 8, padding: '13px', background: loading ? '#999' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving...' : 'Confirm Password & Enter Dashboard →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── STEP 3: Success Screen ──
  if (step === 3) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '48px 44px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          <div style={{ fontSize: 40, margin: '0 auto 20px' }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1D9E75', margin: '0 0 10px' }}>Account Setup Complete!</h2>
          <p style={{ fontSize: 14, color: '#777' }}>Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}