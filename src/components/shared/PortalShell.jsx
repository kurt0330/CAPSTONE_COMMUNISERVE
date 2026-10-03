// PATH: /src/components/shared/PortalShell.jsx
// Visual chrome shared by the customer and provider portals: white top
// header, pill navigation on desktop, and a fixed bottom tab bar on phones.
//
// Each portal's (authenticated)/layout.js still runs its own auth gates
// and passes in its own nav items, identity and logout route — only the
// presentation is shared here.

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Icon from '@/components/ui/Icon';
import LogoutButton from '@/components/shared/LogoutButton';
import { useJobRealtime } from '@/hooks/useJobRealtime';

export default function PortalShell({
  portalLabel,
  homeHref,
  navItems = [],
  userName,
  userSub,
  initials,
  headerExtra,
  logoutHref,
  children,
}) {
  const pathname = usePathname();

  // Live job/offer updates on every portal page (requests list, negotiation
  // thread, dashboard counts) — the shell wraps them all.
  useJobRealtime();

  // A nav item is active on its own route, its sub-routes, and any extra
  // prefixes it claims (e.g. Search stays lit on /customer/providers/[id]).
  const activeHref = navItems.find(({ href, alsoActiveOn = [] }) =>
    [href, ...alsoActiveOn].some((p) => pathname === p || pathname.startsWith(`${p}/`))
  )?.href;
  const isActive = (href) => href === activeHref;

  return (
    <div className="portal-shell">

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
                className={`portal-nav-link${isActive(href) ? ' active' : ''}`}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                <Icon name={icon} size="sm" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="portal-user">
            {headerExtra}
            <div className="portal-user-meta">
              <p className="portal-user-name">{userName}</p>
              {userSub && <p className="portal-user-sub">{userSub}</p>}
            </div>
            <div className="portal-avatar" title={userName}>{initials}</div>
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
            className={`portal-tab-link${isActive(href) ? ' active' : ''}`}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon name={icon} size="lg" />
            {shortLabel ?? label}
          </Link>
        ))}
      </nav>

    </div>
  );
}
