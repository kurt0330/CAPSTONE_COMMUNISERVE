// PATH: /src/app/auth/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    // ── 1. Supabase Auth Sign-in ──
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    // ── 2. Fetch User Role & Onboarding Status ──
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

    // ── 3. Traffic Controller (Routing Matrix) ──
    if (userData.role === 'Admin') {
      router.push('/admin/dashboard');
    } else if (userData.role === 'Provider') {
      if (!userData.onboarding_complete) {
        router.push('/provider/onboarding'); // First-time login
      } else {
        router.push('/provider/dashboard'); // Returning user
      }
    } else if (userData.role === 'Customer') {
      router.push('/customer/dashboard'); // Future Sprint
    } else {
      setError('Unrecognized user role.');
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '40px 44px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        
        {/* ── Logo / Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, background: '#0504AA', borderRadius: 8, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>C</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>CommuniServe Portal</h1>
          <p style={{ fontSize: 13, color: '#777', margin: 0 }}>Sign in to access your dashboard</p>
        </div>

        {/* ── Error Message ── */}
        {error && (
          <div style={{ background: '#fff5f5', border: '1.5px solid #E24B4A', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#E24B4A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── Login Form ── */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>EMAIL ADDRESS</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }} 
              onFocus={(e) => e.target.style.borderColor = '#0504AA'} 
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>PASSWORD</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#0504AA'} 
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ marginTop: 8, padding: '12px', background: loading ? '#999' : '#0504AA', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Authenticating...' : 'Sign In →'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
        Not registered yet? <br />
        <a href="/register/provider" style={{ color: '#0504AA', fontWeight: 600, textDecoration: 'none' }}>Apply as a Service Provider</a>
      </p>
    </div>
  );
}