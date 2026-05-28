// PATH: /src/app/page.js

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        body { margin: 0; padding: 0; }
        
        /* ── Header Navigation ── */
        /* 🔴 NEW: The "Layer" wrapper for the header background */
        .header-layer {
          background-color: #f4f7ff; /* Soft theme blue to match the brand */
          border-bottom: 1px solid #e0e7ff;
          width: 100%;
        }
        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 5%;
          max-width: 1200px;
          margin: 0 auto;
        }
        .header-logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0504AA;
          text-decoration: none;
          letter-spacing: -0.5px;
        }
        .header-nav {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .btn-nav-login {
          color: #4b5563;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 10px 16px;
          border-radius: 8px;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .btn-nav-login:hover {
          background-color: #e5eaf5;
          color: #111827;
        }
        .btn-nav-signup {
          background-color: #ffffff;
          color: #0504AA;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          transition: background-color 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .btn-nav-signup:hover {
          background-color: #f9fafb;
        }

        /* ── Hero Layout ── */
        .hero-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 5% 80px 5%;
          gap: 60px;
          min-height: calc(100vh - 100px);
        }
        
        /* Left Column: Typography & Buttons */
        .hero-text-content {
          flex: 1;
          max-width: 600px;
        }
        .hero-title {
          font-size: 4rem;
          font-weight: 800;
          color: #111827; 
          line-height: 1.1;
          margin: 0 0 24px 0;
          letter-spacing: -0.02em;
        }
        .hero-subtitle {
          font-size: 1.25rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0 0 40px 0;
        }
        
        /* Primary Body Button */
        .btn-solid {
          background-color: #0504AA;
          color: #ffffff;
          padding: 16px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          display: inline-block;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 14px rgba(5, 4, 170, 0.25);
        }
        .btn-solid:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(5, 4, 170, 0.35);
          background-color: #040388;
        }

        /* Right Column: Pure CSS Graphic */
        .hero-graphic {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        
        /* The "Verified ID" Card Art */
        .css-id-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #f3f4f6;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transform: rotate(2deg);
        }
        .css-id-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 8px;
          background: #0504AA;
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        .avatar-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f3f4f6;
          border: 3px solid #0504AA;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
        }
        .card-title { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #111827; }
        .card-role { margin: 0; font-size: 15px; color: #6b7280; font-weight: 500; }
        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #dcfce7;
          color: #166534;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          margin-top: 12px;
        }
        .card-lines { display: flex; flex-direction: column; gap: 16px; }
        .mock-line { height: 10px; background: #f3f4f6; border-radius: 8px; }
        .mock-line.short { width: 60%; }
        
        /* Floating decoration piece */
        .floating-accent {
          position: absolute;
          bottom: -20px;
          right: -20px;
          background: #0504AA;
          color: white;
          padding: 16px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 10px 25px rgba(5, 4, 170, 0.3);
          border: 2px solid white;
        }

        /* Mobile Adjustments */
        @media (max-width: 960px) {
          .hero-container {
            flex-direction: column;
            text-align: center;
            padding-top: 20px;
            gap: 40px;
          }
          .hero-text-content { padding-right: 0; }
          .hero-title { font-size: 3rem; }
          .css-id-card { transform: rotate(0); }
        }
        @media (max-width: 480px) {
          .header-logo { font-size: 1.2rem; }
          .btn-nav-signup { display: none; }
        }
      `}} />

      {/* ── Custom Landing Page Header with the New Layer Wrapper ── */}
      <div className="header-layer">
        <header className="landing-header">
          <Link href="/" className="header-logo">
            COMMUNISERVE
          </Link>
          <div className="header-nav">
            <Link href="/auth/login" className="btn-nav-login">
              Log in
            </Link>
            <Link href="/auth/login?mode=signup" className="btn-nav-signup">Sign up</Link>
          </div>
        </header>
      </div>

      {/* ── Hero Section ── */}
      <main className="hero-container">
        
        {/* Left Side: Text and Single Primary Button */}
        <div className="hero-text-content">
          <h1 className="hero-title">
            Find Trusted Local Workers in Anini-y.
          </h1>
          <p className="hero-subtitle">
            Skip the guesswork. CommuniServe is the official LGU platform connecting you with National ID-verified carpenters, electricians, and household helpers right in your municipality.
          </p>
          
          <Link href="/register/provider" className="btn-solid">
            Apply as a Provider
          </Link>
        </div>

        {/* Right Side: Verified ID CSS Graphic */}
        <div className="hero-graphic">
          <div className="css-id-card">
            <div className="card-header">
              <div className="avatar-circle">👷</div>
              <div>
                <h3 className="card-title">Juan Dela Cruz</h3>
                <p className="card-role">Local Carpenter</p>
                <div className="verified-badge">
                  ✓ LGU Verified
                </div>
              </div>
            </div>
            
            <div className="card-lines">
              <div className="mock-line"></div>
              <div className="mock-line short"></div>
              <div className="mock-line" style={{ width: '80%' }}></div>
            </div>

            <div className="floating-accent">
              ⭐ 5.0 Rating
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}