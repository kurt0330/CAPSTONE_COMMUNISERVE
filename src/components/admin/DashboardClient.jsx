// PATH: /src/components/admin/DashboardClient.jsx
// Role: Client shell for the dashboard — renders stat cards and tab state.
// Receives pre-fetched counts from the Server Component above.
// Tables fetch their own data via /api/admin/providers.

'use client';

import { useState } from 'react';
import PendingTable  from '@/components/admin/PendingTable';
import ApprovedTable from '@/components/admin/ApprovedTable';

const STAT_CONFIG = [
  { key: 'pending',  label: 'Pending Requests', icon: '⏳', color: '#e6a817', bg: '#fff8e6' },
  { key: 'approved', label: 'Approved SPs',      icon: '✅', color: '#1D9E75', bg: '#e6f7f1' },
  { key: 'clients',  label: 'Registered Clients',icon: '👤', color: '#0504AA', bg: '#eef0ff' },
];

export default function DashboardClient({ initialStats }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats]         = useState(initialStats);

  // Called by PendingTable/ApprovedTable after approve/reject
  // so the stat cards update without a full page reload
  function refreshStats(patch) {
    setStats((prev) => ({ ...prev, ...patch }));
  }

  return (
    <>
      {/* ── Page Title ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0504AA', margin: '0 0 2px' }}>
          Dashboard
        </h2>
        <p style={{ fontSize: 13, color: '#777', margin: 0 }}>
          Welcome back, <strong>Admin</strong>. Here's what needs your attention.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16, marginBottom: 28,
      }}>
        {STAT_CONFIG.map(({ key, label, icon, color, bg }) => (
          <div key={key} style={{
            background: '#fff', borderRadius: 10,
            padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderLeft: `4px solid ${color}`,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 10,
              background: bg, color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#222', lineHeight: 1 }}>
                {stats[key]}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontWeight: 600 }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Card ── */}
      <div style={{
        background: '#fff', borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
      }}>

        {/* Tab Headers */}
        <div style={{
          display: 'flex', gap: 4,
          padding: '16px 20px 0',
          borderBottom: '2px solid #e8e8e8',
        }}>
          {[
            { key: 'pending',  label: `Pending Requests`, badge: stats.pending },
            { key: 'approved', label: 'Approved SPs' },
          ].map(({ key, label, badge }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              style={{
                padding: '8px 18px',
                fontSize: 13.5, fontWeight: 600,
                color: activeTab === key ? '#0504AA' : '#777',
                background: 'transparent', border: 'none',
                borderBottom: activeTab === key ? '3px solid #0504AA' : '3px solid transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {label}
              {badge > 0 && (
                <span style={{
                  background: '#E24B4A', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 7px', borderRadius: 20, lineHeight: 1.6,
                }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: 20 }}>
          {activeTab === 'pending'  && <PendingTable  onStatsChange={refreshStats} />}
          {activeTab === 'approved' && <ApprovedTable onStatsChange={refreshStats} />}
        </div>

      </div>
    </>
  );
}