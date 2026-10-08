// PATH: /src/app/provider/(authenticated)/layout.js
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import PortalShell from '@/components/shared/PortalShell';
import Icon from '@/components/ui/Icon';

// Shared customer/provider portal styles. Imported here (not in the root
// layout) so admin and public routes never load them.
import '@/styles/app-shell.css';

export const metadata = {
  title: 'Provider Dashboard — CommuniServe',
};

export default async function AuthenticatedProviderLayout({ children }) {
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // 1. Fetch from public.users
  const { data: publicUser, error: userError } = await supabase
    .from('users')
    .select('user_id, full_name, role, onboarding_complete, avatar_url')
    .eq('auth_id', user.id)
    .single();

  if (userError || !publicUser || publicUser.role !== 'Provider') {
    redirect('/auth/login');
  }

  // 2. Kick them back to onboarding if they skipped it
  if (!publicUser.onboarding_complete) {
    redirect('/provider/onboarding'); 
  }

  // 3. Verify provider approval using service role (bypasses RLS limits for checking status)
  const adminSupa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: providerRow, error: provError } = await adminSupa
    .from('providers')
    .select('admin_status, trade_category, average_rating')
    .eq('user_id', publicUser.user_id)
    .single();

  if (provError || !providerRow || providerRow.admin_status !== 'Approved') {
    redirect('/auth/login');
  }

  const initials = publicUser.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'SP';

  // New requests and customer replies since this provider last opened
  // My Requests (the tab's notification badge).
  const { data: newsCount } = await supabase.rpc('get_request_news_count');

  const ratingChip = (
    <span className="portal-chip" title="Your average rating">
      <Icon name="star" size="sm" />
      {Number(providerRow.average_rating ?? 0).toFixed(2)}
    </span>
  );

  return (
    <PortalShell
      portalLabel="Provider Portal"
      homeHref="/provider/dashboard"
      navItems={NAV_ITEMS}
      userName={publicUser.full_name}
      userSub={providerRow.trade_category}
      initials={initials}
      headerExtra={ratingChip}
      logoutHref="/provider/logout"
      avatarUrl={publicUser.avatar_url}
      profileHref="/provider/portfolio"
      newsHref="/provider/requests"
      newsCount={newsCount ?? 0}
    >
      {children}
    </PortalShell>
  );
}

const NAV_ITEMS = [
  { label: 'Dashboard',    shortLabel: 'Home',      href: '/provider/dashboard', icon: 'home' },
  { label: 'My Requests',  shortLabel: 'Requests',  href: '/provider/requests',  icon: 'clipboard' },
  { label: 'My Portfolio', shortLabel: 'Portfolio', href: '/provider/portfolio', icon: 'briefcase' },
];