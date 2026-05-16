// PATH: /src/app/page.js
// Role: Temporary landing page placeholder — Sprint testing phase only.
// Replace this with the real Landing Page UI in a future sprint.

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      fontFamily:     'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      gap: 16,
    }}>
      <h1 style={{ color: '#0504AA', margin: 0 }}>COMMUNISERVE</h1>
      <p style={{ color: '#555', margin: 0 }}>Landing Page — Placeholder</p>
      <Link
        href="/register/provider"
        style={{
          marginTop:       8,
          padding:         '12px 28px',
          backgroundColor: '#0504AA',
          color:           '#fff',
          borderRadius:    8,
          textDecoration:  'none',
          fontWeight:      700,
          fontSize:        14,
        }}
      >
        Go to Provider Registration →
      </Link>
    </div>
  );
}