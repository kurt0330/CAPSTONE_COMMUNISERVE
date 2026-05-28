// PATH: /src/app/auth/login/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import RegisterForm from '@/components/customer/RegisterForm'; 

export default function UnifiedAuthPage() {
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
  const [showPwd, setShowPwd] = useState(false); // 🟢 NEW: State for toggling password visibility
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

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
  return (
    <div style={{ backgroundColor: '#f4f7ff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative' }}>
      
      <Link href="/" className="back-home-btn">
        &larr; Back to Home
      </Link>

      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; }
        
        .back-home-btn {
          position: absolute;
          top: 30px;
          left: 40px;
          text-decoration: none;
          color: #0504AA;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 1000;
          transition: transform 0.2s;
        }
        .back-home-btn:hover {
          transform: translateX(-5px);
        }

        .auth-container {
          background-color: #fff;
          border-radius: 20px;
          box-shadow: 0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 900px;
          min-height: 700px;
        }

        .form-container {
          position: absolute;
          top: 0;
          height: 100%;
          transition: all 0.6s ease-in-out;
          overflow-y: auto;
          padding: 40px;
        }
        
        .form-container::-webkit-scrollbar { width: 0; }

        .sign-in-container {
          left: 0;
          width: 50%;
          z-index: 2;
        }
        .auth-container.right-panel-active .sign-in-container {
          transform: translateX(100%);
        }

        .sign-up-container {
          left: 0;
          width: 50%;
          opacity: 0;
          z-index: 1;
        }
        .auth-container.right-panel-active .sign-up-container {
          transform: translateX(100%);
          opacity: 1;
          z-index: 5;
          animation: show 0.6s;
        }

        @keyframes show {
          0%, 49.99% { opacity: 0; z-index: 1; }
          50%, 100% { opacity: 1; z-index: 5; }
        }

        .overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.6s ease-in-out;
          z-index: 100;
        }
        .auth-container.right-panel-active .overlay-container {
          transform: translateX(-100%);
        }

        .overlay {
          background: linear-gradient(135deg, #0504AA 0%, #0a08e6 100%);
          color: #FFFFFF;
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
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
          padding: 0 40px;
          text-align: center;
          top: 0;
          height: 100%;
          width: 50%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }

        .overlay-left {
          transform: translateX(-20%);
        }
        .auth-container.right-panel-active .overlay-left {
          transform: translateX(0);
        }

        .overlay-right {
          right: 0;
          transform: translateX(0);
        }
        .auth-container.right-panel-active .overlay-right {
          transform: translateX(20%);
        }

        .ghost-btn {
          background-color: transparent;
          border-color: #FFFFFF;
          color: #FFFFFF;
          border: 2px solid #FFFFFF;
          border-radius: 8px;
          padding: 12px 36px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s;
          margin-top: 20px;
        }
        .ghost-btn:hover {
          transform: scale(1.05);
          background-color: rgba(255,255,255,0.1);
        }

        @media (max-width: 768px) {
          .back-home-btn { top: 20px; left: 20px; } 
          .auth-container { min-height: 100vh; border-radius: 0; display: flex; flex-direction: column; }
          .overlay-container { display: none; }
          .form-container { width: 100%; position: relative; opacity: 1; transform: none !important; animation: none !important; }
          .sign-up-container { display: ${isRightPanelActive ? 'block' : 'none'}; z-index: 10; }
          .sign-in-container { display: ${isRightPanelActive ? 'none' : 'block'}; z-index: 10; }
          .mobile-toggle { display: block !important; margin: 20px auto; text-align: center; }
        }
        .mobile-toggle { display: none; background: none; border: none; color: #0504AA; font-weight: bold; text-decoration: underline; cursor: pointer; }
      `}} />

      <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`}>
        
        {/* ── CUSTOMER SIGN UP PANEL ── */}
        <div className="form-container sign-up-container">
          
          <img 
            src="/logos/communiserve-icon.png" 
            alt="CommuniServe Logo" 
            style={{ position: 'absolute', top: '90px', right: '20px', height: '60px', objectFit: 'contain', zIndex: 10 }} 
          />

          <div style={{ marginTop: '30px', marginInline: '-20px' }}>
             <RegisterForm />
          </div>
          
          <button className="mobile-toggle" onClick={() => setIsRightPanelActive(false)}>
            Already have an account? Sign in.
          </button>
        </div>

        {/* ── UNIFIED SIGN IN PANEL ── */}
        <div className="form-container sign-in-container">
          
          <img 
            src="/logos/communiserve-icon.png" 
            alt="CommuniServe Logo" 
            style={{ position: 'absolute', top: '170px', right: '200px', height: '70px', objectFit: 'contain', zIndex: 10 }} 
          />

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: '350px', margin: '0 auto' }}>
            <h1 style={{ color: '#0504AA', margin: '0 0 10px 0', fontSize: '32px', fontWeight: '800' }}>Sign In</h1>
            <p style={{ color: '#666', marginBottom: '30px', fontSize: '15px' }}>Access your CommuniServe account</p>
            
            {error && (
              <div style={{ background: '#fff5f5', border: '1.5px solid #E24B4A', borderRadius: 8, padding: '11px 14px', marginBottom: 16, fontSize: 13, color: '#E24B4A', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  style={{ padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }}
                />
              </div>

              {/* 🟢 NEW: Password field with toggle button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPwd ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    style={{ 
                      padding: '12px 14px', 
                      paddingRight: '44px', // Extra padding for the icon
                      border: '1px solid #ddd', 
                      borderRadius: 8, 
                      fontSize: 14, 
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#aaa',
                      padding: 0
                    }}
                  >
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                style={{ marginTop: 8, padding: '14px', background: loading ? '#999' : '#0504AA', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
              >
                {loading ? 'Authenticating...' : 'Sign In →'}
              </button>
            </form>

            <button className="mobile-toggle" onClick={() => setIsRightPanelActive(true)}>
              New to CommuniServe? Sign up.
            </button>
          </div>
        </div>

        {/* ── THE GRADIENT OVERLAY THAT SLIDES ── */}
        <div className="overlay-container">
          <div className="overlay">
            
            <div className="overlay-panel overlay-left">
              <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>Welcome Back!</h1>
              <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
                Already have an account? Sign in to access your unified dashboard and connect with local providers.
              </p>
              <button className="ghost-btn" onClick={() => setIsRightPanelActive(false)}>
                Go to Sign In
              </button>
            </div>

            <div className="overlay-panel overlay-right">
              <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>New to CommuniServe?</h1>
              <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
                Create a free customer account to easily find and hire verified workers in Anini-y.
              </p>
              <button className="ghost-btn" onClick={() => setIsRightPanelActive(true)}>
                Sign Up as Customer
              </button>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}