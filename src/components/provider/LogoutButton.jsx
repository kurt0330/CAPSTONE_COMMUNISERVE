// PATH: /src/components/provider/LogoutButton.jsx
// Role: Client logout button component with spam protection and clean style extraction.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handleLogout() {
    if (isLoggingOut) return; // Prevent double-clicks instantly
    setIsLoggingOut(true);
    router.push('/provider/logout'); 
  }

  return (
    <button 
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      style={{ 
        ...buttonStyle,
        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
        opacity: isLoggingOut ? 0.5 : 1
      }}
    >
      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}

// ── Shared styles matching your exact design values ──────────────────────────
const buttonStyle = {
  color:          'rgba(255,255,255,0.75)',
  background:     'transparent',
  fontSize:       12,
  fontWeight:     600,
  textDecoration: 'none',
  padding:        '6px 12px',
  borderRadius:   6,
  border:         '1px solid rgba(255,255,255,0.25)',
  marginLeft:     10,
  transition:     'opacity 0.2s, background 0.2s',
};