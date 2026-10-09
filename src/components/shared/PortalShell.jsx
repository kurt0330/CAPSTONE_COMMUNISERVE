// PATH: /src/components/shared/PortalShell.jsx
// Visual chrome shared by the customer and provider portals: white top
// header, pill navigation on desktop, and a fixed bottom tab bar on phones.
//
// Each portal's (authenticated)/layout.js still runs its own auth gates
// and passes in its own nav items, identity and logout route — only the
// presentation is shared here.

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import Icon from '@/components/ui/Icon';
import Avatar from '@/components/shared/Avatar';
import LogoutButton from '@/components/shared/LogoutButton';
import { useJobRealtime } from '@/hooks/useJobRealtime';
import { markRequestsSeen } from '@/actions/jobActions';

export default function PortalShell({
  portalLabel,
  homeHref,
  navItems = [],
  userName,
  userSub,
  initials,
  headerExtra,
  logoutHref,
  avatarUrl,        // the signed-in user's photo, when they have one
  profileHref,      // where the header avatar leads (the user's profile page)
  newsHref,         // the nav item that carries the notification badge (My Requests)
  newsCount = 0,    // requests with activity from the other side since it was last opened
  theme,            // 'customer' | 'provider' — page background tint, matching the landing page
  children,
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Live job/offer updates on every portal page (requests list, negotiation
  // thread, dashboard counts) — the shell wraps them all.
  useJobRealtime();

  // A nav item is active on its own route, its sub-routes, and any extra
  // prefixes it claims (e.g. Search stays lit on /customer/providers/[id]).
  const activeHref = navItems.find(({ href, alsoActiveOn = [] }) =>
    [href, ...alsoActiveOn].some((p) => pathname === p || pathname.startsWith(`${p}/`))
  )?.href;
  const isActive = (href) => href === activeHref;

  // Notification badge. Opening My Requests is what "reads" the news: the
  // badge is hidden at once on that page, and the moment is saved so only
  // later activity counts. If something new arrives while the page is open,
  // newsCount rises again and this marks it read straight away.
  const onNewsPage = !!newsHref && (pathname === newsHref || pathname.startsWith(`${newsHref}/`));
  const badgeCount = onNewsPage ? 0 : newsCount;

  useEffect(() => {
    if (!onNewsPage || newsCount <= 0) return;
    let cancelled = false;
    markRequestsSeen().then((result) => {
      if (!cancelled && result?.success) router.refresh();
    });
    return () => { cancelled = true; };
  }, [onNewsPage, newsCount, router]);

  const badgeFor = (href) => (href === newsHref && badgeCount > 0 ? <NavBadge count={badgeCount} /> : null);

  return (
    <div className={`portal-shell${theme ? ` portal-shell--${theme}` : ''}`}>

      <header className="portal-header">
        <div className="portal-header-inner">

          <Link href={homeHref} className="portal-brand">
            <img src="/logos/communiserve-icon.png" alt="" className="portal-brand-logo" />
            <span className="portal-brand-name">CommuniServe</span>
            <span className="portal-badge">{portalLabel}</span>
          </Link>

          <nav className="portal-nav" aria-label={`${portalLabel} navigation`}>
            {navItems.map(({ label, href, icon }) => (
              <Link
                key={href}
                href={href}
                className={`portal-nav-link nav-has-badge${isActive(href) ? ' active' : ''}`}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                <Icon name={icon} size="sm" />
                {label}
                {badgeFor(href)}
              </Link>
            ))}
          </nav>

          <div className="portal-user">
            {headerExtra}
            <div className="portal-user-meta">
              <p className="portal-user-name">{userName}</p>
              {userSub && <p className="portal-user-sub">{userSub}</p>}
            </div>
            {profileHref ? (
              <Link
                href={profileHref}
                className={`portal-avatar portal-avatar-link${pathname.startsWith(profileHref) ? ' active' : ''}`}
                aria-label="My profile"
                title="My profile"
              >
                <Avatar src={avatarUrl} name={userName} fallback={initials} />
              </Link>
            ) : (
              <div className="portal-avatar" title={userName}>
                <Avatar src={avatarUrl} name={userName} fallback={initials} />
              </div>
            )}
            <LogoutButton href={logoutHref} />
          </div>

        </div>
      </header>

      <main className="portal-main">{children}</main>

      {/* Phones: thumb-reachable bottom tab bar (hidden ≥ 900px) */}
      <nav className="portal-tabbar" aria-label={`${portalLabel} navigation`}>
        {navItems.map(({ label, shortLabel, href, icon }) => (
          <Link
            key={href}
            href={href}
            className={`portal-tab-link nav-has-badge${isActive(href) ? ' active' : ''}`}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon name={icon} size="lg" />
            {shortLabel ?? label}
            {badgeFor(href)}
          </Link>
        ))}
      </nav>

    </div>
  );
}

/** Small red count at the upper right of a nav tab. */
function NavBadge({ count }) {
  const shown = count > 9 ? '9+' : String(count);
  return (
    <span className="nav-badge" aria-label={`${count} new`}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
