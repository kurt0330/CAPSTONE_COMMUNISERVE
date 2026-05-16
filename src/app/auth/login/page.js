// PATH: /src/app/auth/login/page.js
// Role: Admin login page — email/password auth via Supabase Auth.
// Strict Agile scope: Admin login only. Customer/Provider signup is a future sprint.
// On success → redirects to /admin/dashboard.
// On failure → shows inline error message (no page reload).

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email,       setEmail]      = useState('');
  const [password,    setPassword]   = useState('');
  const [error,       setError]      = useState('');
  const [loading,     setLoading]    = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    // ── Step 1: Supabase Auth sign-in ─────────────────────────────────
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    // ── Step 2: Confirm this auth user has Admin role in public.users ──
    // Mirrors login_process.php hybrid gate logic exactly.
    const { data: publicUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', authData.user.id)
      .single();

    if (roleError || !publicUser) {
      await supabase.auth.signOut();
      setError('Account not found in the system. Contact your administrator.');
      setLoading(false);
      return;
    }

    if (publicUser.role !== 'Admin') {
      await supabase.auth.signOut();
      setError('Access denied. This portal is for LGU Admins only.');
      setLoading(false);
      return;
    }

    // ── Step 3: Auth confirmed, role confirmed → go to dashboard ──────
    router.push('/admin/dashboard');
    router.refresh(); // force server components to re-read the new session
  }

  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      backgroundColor: '#f0f0f0',
      fontFamily:      'Arial, sans-serif',
      padding:         24,
    }}>

      {/* ── Branding ── */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 700,
          color: '#0504AA', letterSpacing: 1.5, margin: '0 0 6px',
        }}>
          COMMUNISERVE
        </h1>
        <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
          LGU Admin Portal — Anini-y, Antique
        </p>
      </div>

      {/* ── Card ── */}
      <div style={{
        background:   '#fff',
        borderRadius: 12,
        padding:      '36px 40px',
        width:        '100%',
        maxWidth:     420,
        boxShadow:    '0 4px 24px rgba(0,0,0,0.10)',
      }}>
        <h2 style={{
          fontSize: 18, fontWeight: 700,
          color: '#111', margin: '0 0 6px',
        }}>
          Sign In
        </h2>
        <p style={{ fontSize: 13, color: '#777', margin: '0 0 24px' }}>
          Enter your administrator credentials to continue.
        </p>

        {/* ── Error banner ── */}
        {error && (
          <div style={{
            background:   '#fff5f5',
            border:       '1.5px solid #E24B4A',
            borderRadius: 8,
            padding:      '10px 14px',
            marginBottom: 20,
            fontSize:     13,
            color:        '#E24B4A',
            fontWeight:   600,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@communiserve.com"
              style={{
                padding:      '10px 14px',
                border:       '1px solid #ddd',
                borderRadius: 8,
                fontSize:     14,
                fontFamily:   'Arial, sans-serif',
                outline:      'none',
                transition:   'border-color 0.2s',
              }}
              onFocus={(e)  => e.target.style.borderColor = '#0504AA'}
              onBlur={(e)   => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                padding:      '10px 14px',
                border:       '1px solid #ddd',
                borderRadius: 8,
                fontSize:     14,
                fontFamily:   'Arial, sans-serif',
                outline:      'none',
                transition:   'border-color 0.2s',
              }}
              onFocus={(e)  => e.target.style.borderColor = '#0504AA'}
              onBlur={(e)   => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop:    8,
              padding:      '12px',
              background:   loading ? '#999' : '#0504AA',
              color:        '#fff',
              border:       'none',
              borderRadius: 8,
              fontSize:     15,
              fontWeight:   700,
              cursor:       loading ? 'not-allowed' : 'pointer',
              fontFamily:   'Arial, sans-serif',
              transition:   'background 0.2s',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              gap:          8,
            }}
          >
            {loading && (
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
                ⟳
              </span>
            )}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

        </form>

      </div>

      {/* ── Footer note ── */}
      <p style={{ marginTop: 24, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
        This portal is restricted to authorized LGU personnel only.<br />
        Provider registration →{' '}
        <a href="/register/provider" style={{ color: '#0504AA', fontWeight: 600 }}>
          communiserve.com/register/provider
        </a>
      </p>

    </div>
  );
}