// PATH: /src/app/page.js
'use client'; 

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isCustomerView, setIsCustomerView] = useState(false);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        body { margin: 0; padding: 0; overflow-x: hidden; } 
        
        /* ── Header Navigation (Dynamic Colors Handled Inline) ── */
        .header-layer {
          border-bottom: 1px solid rgba(5, 4, 170, 0.1);
          width: 100%;
          position: relative;
          z-index: 10;
          transition: background-color 0.7s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 5%;
          max-width: 1200px;
          margin: 0 auto;
        }
        .header-logo {
          font-size: 1.75rem; /* Zoomed in size */
          font-weight: 800;
          color: #0504AA; /* Deep blue complements both yellow and light blue */
          text-decoration: none;
          letter-spacing: -0.5px;
        }
        .header-nav {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        
        /* Buttons */
        .btn-solid {
          background-color: #0504AA;
          color: white;
          padding: 14px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.125rem;
          transition: background 0.2s, transform 0.2s;
          display: inline-block;
        }
        .btn-solid:hover {
          background-color: #040388;
          transform: translateY(-2px);
        }
        .btn-outline {
          background-color: transparent;
          color: #0504AA;
          padding: 14px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.125rem;
          border: 2px solid #0504AA;
          transition: background 0.2s, color 0.2s, transform 0.2s;
          display: inline-block;
        }
        .btn-outline:hover {
          background-color: #0504AA;
          color: white;
          transform: translateY(-2px);
        }

        /* ── Sliding Track Layout ── */
        .slider-viewport {
          width: 100%;
          overflow: hidden;
          background-color: #ffffff;
        }
        .slider-track {
          display: flex;
          width: 200vw; 
          transition: transform 0.7s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .slider-panel {
          width: 100vw; 
          display: flex;
          justify-content: center;
          /* Subtle background match for panels to blend with the header */
          transition: background-color 0.7s ease;
        }
        .panel-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 100px 5%;
          max-width: 1200px;
          width: 100%;
          gap: 60px;
        }

        /* ── Hero Content (Zoomed / Bigger as requested) ── */
        .hero-text-content {
          flex: 1;
          max-width: 550px;
        }
        .hero-title {
          font-size: 4rem; /* Restored the BIG original feel */
          font-weight: 800;
          color: #111827;
          line-height: 1.1;
          margin-bottom: 24px;
        }
        .hero-subtitle {
          font-size: 1.25rem; /* Zoomed in */
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        /* ── Graphics & Cards (Tilted & Zoomed) ── */
        .hero-graphic {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        
        /* 🔴 THE CARD DESIGN (Tilted & Scaled Up) */
        .css-id-card {
          background: white;
          border-radius: 20px;
          padding: 32px; /* Bigger padding */
          width: 100%;
          max-width: 420px; /* Bigger card */
          box-shadow: 0 25px 50px rgba(5, 4, 170, 0.1);
          border: 1px solid #f3f4f6;
          position: relative;
          transform: rotate(3deg); /* 🔴 Restored the slight tilt */
          transition: transform 0.3s ease;
        }
        .css-id-card:hover {
          transform: rotate(0deg) scale(1.02); /* Straightens out when hovered */
        }
        
        .card-header {
          display: flex;
          gap: 20px;
          align-items: center;
          margin-bottom: 28px;
        }
        .avatar-circle {
          width: 75px; /* Bigger avatar */
          height: 75px;
          border-radius: 50%;
          background: #f4f7ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px; /* Bigger emoji */
        }
        .card-title {
          margin: 0;
          font-size: 1.5rem; /* Bigger name */
          color: #111827;
          font-weight: 700;
        }
        .card-role {
          margin: 4px 0 10px 0;
          color: #6b7280;
          font-size: 1.05rem;
        }
        
        /* Badges */
        .verified-badge {
          display: inline-block;
          background: #e6f7f1;
          color: #1D9E75;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .customer-badge {
          background: #eef0ff;
          color: #0504AA;
        }
        
        /* Card Lines */
        .card-lines {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mock-line {
          height: 10px;
          background: #f3f4f6;
          border-radius: 5px;
          width: 100%;
        }
        .mock-line.short { width: 60%; }
        
        /* Floating Accent */
        .floating-accent {
          position: absolute;
          right: -25px;
          bottom: 40px;
          background: white;
          padding: 16px 24px;
          border-radius: 14px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.08);
          font-weight: 700;
          font-size: 1.1rem;
          color: #111827;
          transform: rotate(-2deg); /* Counter-tilt for the badge */
        }

        /* ── The Sliding Toggle Switch Button ── */
        .switch-view-btn {
          margin-top: 50px;
          background: transparent;
          border: 2px dashed #0504AA;
          color: #0504AA;
          padding: 16px 28px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          max-width: 420px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .switch-view-btn:hover {
          background: #0504AA;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(5,4,170, 0.2);
        }

        /* Mobile Adjustments */
        @media (max-width: 900px) {
          .panel-content {
            flex-direction: column;
            text-align: center;
            padding: 60px 5%;
          }
          .hero-title { font-size: 2.75rem; }
          .css-id-card { transform: rotate(0deg); max-width: 100%; }
          .floating-accent { right: 0; bottom: -15px; }
        }
      `}} />

      {/* ── STATIC HEADER WITH DYNAMIC COLOR ── */}
      {/* Light Yellow (#fff8e6) for Provider, Light Blue (#f4f7ff) for Customer */}
      <div 
        className="header-layer" 
        style={{ backgroundColor: isCustomerView ? '#f4f7ff' : '#fff8e6' }}
      >
        <header className="landing-header">
          <Link href="/" className="header-logo">
            COMMUNISERVE
          </Link>
          <nav className="header-nav">
            <a href="/manual/index.html" target="_blank" rel="noopener noreferrer" className="btn-outline">
              User Manual
            </a>
            <Link href="/auth/login" className="btn-solid">
              Login
            </Link>
          </nav>
        </header>
      </div>

      {/* ── SLIDING VIEWPORT ── */}
      <div className="slider-viewport">
        <main 
          className="slider-track"
          style={{ transform: isCustomerView ? 'translateX(-50%)' : 'translateX(0)' }}
        >
          
          {/* =========================================
              PANEL 1: SERVICE PROVIDER (LABORER) VIEW
              Theme: Light Yellow Tinted Section
          ========================================= */}
          <div className="slider-panel" style={{ backgroundColor: '#fffcf2' }}>
            <div className="panel-content">
              
              <div className="hero-text-content">
                <h1 className="hero-title">
                  Get Certified. Get Hired. Grow Your Local Trade.
                </h1>
                <p className="hero-subtitle">
                  Skip the struggle of finding clients through word-of-mouth. Join the official municipal workforce registry, complete your National ID check, and let local residents find and hire you safely and easily.
                </p>
                <Link href="/register/provider" className="btn-solid">
                  Apply as a Provider
                </Link>
              </div>

              <div className="hero-graphic">
                {/* ID CARD (TILTED) */}
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

                <button 
                  className="switch-view-btn" 
                  onClick={() => setIsCustomerView(true)}
                >
                  <span>Looking to hire someone?</span>
                  <span>➔</span>
                </button>
              </div>

            </div>
          </div>

          {/* =========================================
              PANEL 2: CUSTOMER VIEW
              Theme: Light Blue Tinted Section
          ========================================= */}
          <div className="slider-panel" style={{ backgroundColor: '#fcfdff' }}>
            <div className="panel-content">
              
              <div className="hero-text-content">
                <h1 className="hero-title">
                  Need a Hand? Hire with Confidence.
                </h1>
                <p className="hero-subtitle">
                  Take the guesswork out of finding service providers. Easily filter skilled workers by their exact trade, read honest ratings from your fellow neighbors, and support our local workforce safely.
                </p>
                <Link href="/auth/login?mode=signup" className="btn-solid">
                  Sign Up as a Customer
                </Link>
              </div>

              <div className="hero-graphic">
                {/* ID CARD (TILTED OPPOSITE WAY FOR FLAIR) */}
                <div className="css-id-card">
                  <div className="card-header">
                    <div className="avatar-circle" style={{ background: '#fff8e6' }}>🔍</div>
                    <div>
                      <h3 className="card-title">Search Services</h3>
                      <p className="card-role">Access 50+ Local Trades</p>
                      <div className="verified-badge customer-badge">
                        📍 Anini-y, Antique
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-lines">
                    <div className="mock-line"></div>
                    <div className="mock-line short"></div>
                    <div className="mock-line" style={{ width: '80%' }}></div>
                  </div>

                  <div className="floating-accent" style={{ bottom: '70px', right: '-35px', transform: 'rotate(2deg)' }}>
                    ✅ Request Sent!
                  </div>
                </div>

                <button 
                  className="switch-view-btn" 
                  onClick={() => setIsCustomerView(false)}
                >
                  <span>⬅</span>
                  <span>I want to offer my services</span>
                </button>
              </div>

            </div>
          </div>

        </main>
      </div>

    </div>
  );
}