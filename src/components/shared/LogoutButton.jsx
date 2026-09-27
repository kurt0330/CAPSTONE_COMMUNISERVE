// PATH: /src/components/shared/LogoutButton.jsx
// Portal sign-out button with double-click protection. Shared by the
// customer and provider portals; each passes its own logout route.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

export default function LogoutButton({ href }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handleLogout() {
    if (isLoggingOut) return; // Prevent double-clicks instantly
    setIsLoggingOut(true);
    router.push(href);
  }

  return (
    <button
      type="button"
      className="portal-logout"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label="Sign out"
    >
      <Icon name="logout" size="sm" />
      <span className="portal-logout-label">
        {isLoggingOut ? 'Signing out…' : 'Sign Out'}
      </span>
    </button>
  );
}
