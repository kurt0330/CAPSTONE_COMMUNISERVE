// PATH: /src/app/customer/(authenticated)/layout.js
// Auth guard for all /customer/(authenticated)/* routes.
// Pattern mirrors /provider/(authenticated)/layout.js exactly.
// Verifies: session exists + role = 'Customer' + email confirmed.

import { redirect }           from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { createClient }       from '@supabase/supabase-js';
import PortalShell            from '@/components/shared/PortalShell';

// Shared customer/provider portal styles. Imported here (not in the root
// layout) so admin and public routes never load them.
import '@/styles/app-shell.css';

export const metadata = {
  title: 'My Dashboard — CommuniServe',
};

export default async function CustomerAuthLayout({ children }) {

  // ── Gate 1: Active session ────────────────────────────────────────────
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect('/auth/login');

  // ── Gate 2: Email must be confirmed ──────────────────────────────────
  // Supabase sets email_confirmed_at once the OTP is verified.
  if (!user.email_confirmed_at) redirect('/auth/login');

  // ── Gate 3: Role must be Customer ─────────────────────────────────────
  const { data: publicUser } = await supabase
    .from('users')
    .select('user_id, full_name, barangay, role, avatar_url')
    .eq('auth_id', user.id)
    .single();

  if (!publicUser || publicUser.role !== 'Customer') redirect('/auth/login');

  // ── Gate 4: customers row must exist (service role for safety) ────────
  const adminSupa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: customerRow } = await adminSupa
    .from('customers')
    .select('customer_id')
    .eq('user_id', publicUser.user_id)
    .single();

  if (!customerRow) redirect('/auth/login');

  // ── All gates passed ──────────────────────────────────────────────────
  // Requests with a reply or status change from a provider since this
  // customer last opened My Requests (the tab's notification badge).
  const { data: newsCount } = await supabase.rpc('get_request_news_count');

  const initials = publicUser.full_name
    ?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'C';

  return (
    <PortalShell
      portalLabel="Resident Portal"
      homeHref="/customer/dashboard"
      navItems={NAV_ITEMS}
      userName={publicUser.full_name}
      userSub={publicUser.barangay}
      initials={initials}
      logoutHref="/customer/logout"
      avatarUrl={publicUser.avatar_url}
      profileHref="/customer/profile"
      newsHref="/customer/requests"
      newsCount={newsCount ?? 0}
    >
      {children}
    </PortalShell>
  );
}

const NAV_ITEMS = [
  { label: 'Dashboard',       shortLabel: 'Home',     href: '/customer/dashboard', icon: 'home' },
  { label: 'Find a Provider', shortLabel: 'Search',   href: '/customer/search',    icon: 'search', alsoActiveOn: ['/customer/providers'] },
  { label: 'My Requests',     shortLabel: 'Requests', href: '/customer/requests',  icon: 'clipboard' },
];