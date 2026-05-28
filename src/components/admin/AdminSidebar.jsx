// PATH: /src/components/admin/AdminSidebar.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Dashboard',        href: '/admin/dashboard',    icon: '📊' },
  { label: 'Service Providers',href: '/admin/providers',    icon: '👥' },
  { label: 'Skill Assessments',href: '/admin/assessments',  icon: '📋' },
  // ── Removed Clients nav item here as Admin only manages service providers ──
  { label: 'Settings',         href: '/admin/settings',     icon: '⚙️' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 230, flexShrink: 0,
      background: '#fff',
      borderRight: '1px solid #e0e0e0',
      padding: '24px 0',
      position: 'sticky',
      top: 90,
      height: 'calc(100vh - 90px)',
      overflowY: 'auto',
    }}>

      <p style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '1.2px', color: '#aaa',
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
              color:          isActive ? '#0504AA' : '#444',
              textDecoration: 'none',
              borderLeft:     isActive ? '3px solid #0504AA' : '3px solid transparent',
              background:     isActive ? '#eef0ff' : 'transparent',
              transition:     'all 0.2s',
            }}>
              <span style={{ fontSize: 16, width: 18, textAlign: 'center' }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <p style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '1.2px', color: '#aaa',
        padding: '0 22px 6px', margin: '24px 0 0',
      }}>
        System
      </p>

      <Link href="/auth/logout" style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 22px', fontSize: 13.5, fontWeight: 600,
        color: '#E24B4A', textDecoration: 'none', transition: 'all 0.2s'
      }}>
        <span style={{ fontSize: 16, width: 18, textAlign: 'center' }}>🚪</span>
        Sign Out
      </Link>
    </aside>
  );
}