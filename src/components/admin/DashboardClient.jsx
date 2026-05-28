// PATH: /src/components/admin/DashboardClient.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PendingTable  from '@/components/admin/PendingTable';
import ApprovedTable from '@/components/admin/ApprovedTable';
import ProviderPieChart from '@/components/admin/ProviderPieChart';

const STAT_CONFIG = [
  { key: 'pending',  label: 'Pending Requests', icon: '⏳', color: '#e6a817', bg: '#fff8e6' },
  { key: 'approved', label: 'Approved SPs',      icon: '✅', color: '#1D9E75', bg: '#e6f7f1' },
];

export default function DashboardClient({ initialStats }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats]         = useState(initialStats);

  function refreshStats(patch) {
    setStats((prev) => ({ ...prev, ...patch }));
    router.refresh();
  }

  return (
    <>
      {/* ── Page Title ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
          Monitor system metrics and review new provider applications.
        </p>
      </div>

      {/* ── Repositioned Summary Section Grid ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1.3fr', 
        gap: 24, 
        marginBottom: 32,
        alignItems: 'stretch'
      }}>
        
        {/* Left Column: Stacked Stat Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'space-between' }}>
          {STAT_CONFIG.map(({ key, label, icon, color, bg }) => (
            <div key={key} style={{ 
              background: '#fff', 
              borderRadius: 12, 
              padding: '24px 28px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 24, 
              flex: 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)' 
            }}>
              <div style={{ width: 60, height: 60, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#777', letterSpacing: '0.5px' }}>
                  {label}
                </p>
                <h2 style={{ margin: 0, fontSize: 34, fontWeight: 800, color: color, lineHeight: 1 }}>
                  {stats[key]}
                </h2>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: High-Prominence Analytics Pie Chart Card */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: '24px 32px', 
          display: 'flex', 
          alignItems: 'center', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)' 
        }}>
          <ProviderPieChart data={stats.trades} />
        </div>

      </div>

      {/* ── Main Content Area ── */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', minHeight: 400, overflow: 'hidden' }}>
        
        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 24, padding: '0 20px',
          borderBottom: '1px solid #e8e8e8',
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