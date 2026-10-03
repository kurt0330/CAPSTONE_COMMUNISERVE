// PATH: /src/components/admin/AdminSidebar.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';

const NAV_ITEMS = [
  { label: 'Dashboard',        href: '/admin/dashboard',    icon: 'dashboard' },
  { label: 'Service Providers',href: '/admin/providers',    icon: 'users' },
  { label: 'Skill Assessments',href: '/admin/assessments',  icon: 'clipboard' },
  // ── Removed Clients nav item here as Admin only manages service providers ──
  { label: 'Settings',         href: '/admin/settings',     icon: 'settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 230, flexShrink: 0,
      background: '#fff',
      borderRight: '1px solid var(--cs-border)',
      padding: '24px 0',
      position: 'sticky',
      top: 90,
      height: 'calc(100vh - 90px)',
      overflowY: 'auto',
    }}>

      <p style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '1.2px', color: 'var(--cs-text-soft)',
        padding: '0 22px 6px', margin: '0 0 8px',
      }}>
        Navigation
      </p>

      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display:        'flex',
              alignItems:     'center',
              gap:            12,
              padding:        '10px 22px',
              fontSize:       13.5,
              fontWeight:     600,
              color:          isActive ? 'var(--cs-primary)' : 'var(--cs-text-muted)',
              textDecoration: 'none',
              borderLeft:     isActive ? '3px solid var(--cs-primary)' : '3px solid transparent',
              background:     isActive ? 'var(--cs-primary-tint)' : 'transparent',
              transition:     'all 0.2s',
            }}>
              <span style={{ display: 'flex', justifyContent: 'center', width: 18 }}><Icon name={icon} size="sm" /></span>
              {label}
            </Link>
          );
        })}
      </nav>

      <p style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '1.2px', color: 'var(--cs-text-soft)',
        padding: '0 22px 6px', margin: '24px 0 0',
      }}>
        System
      </p>

      {/* Plain <a>, NOT <Link>: production builds prefetch every <Link> in the
          viewport, and prefetching this route handler runs signOut() — it was
          killing the admin session the moment the sidebar rendered. */}
      <a href="/auth/logout" style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 22px', fontSize: 13.5, fontWeight: 600,
        color: 'var(--cs-danger)', textDecoration: 'none', transition: 'all 0.2s'
      }}>
        <span style={{ display: 'flex', justifyContent: 'center', width: 18 }}><Icon name="logout" size="sm" /></span>
        Sign Out
      </a>
    </aside>
  );
}