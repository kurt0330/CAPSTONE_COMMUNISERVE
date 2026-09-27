// PATH: /src/components/admin/DashboardClient.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PendingTable  from '@/components/admin/PendingTable';
import ApprovedTable from '@/components/admin/ApprovedTable';
import ProviderPieChart from '@/components/admin/ProviderPieChart';
import Icon from '@/components/ui/Icon';

const STAT_CONFIG = [
  { key: 'pending',  label: 'Pending Requests', icon: 'hourglass', color: 'var(--cs-warning)', bg: 'var(--cs-warning-tint)' },
  { key: 'approved', label: 'Approved SPs',      icon: 'check-circle', color: 'var(--cs-success)', bg: 'var(--cs-success-tint)' },
];

export default function DashboardClient({ initialStats }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats]         = useState(initialStats);

  function refreshStats(patch) {
    setStats((prev) => ({ ...prev, ...patch }));
    router.refresh();
  }

  // ── Real-time listener: Instantly updates the Pie Chart and Counter Badges ──
  useEffect(() => {
    const handleLiveStats = (e) => {
      const { status, record } = e.detail;

      if (status === 'Approved' && record) {
        setStats((prev) => {
          // 1. Get the worker's profession (trade)
          const tradeName = record.trade_category || record.trade; 
          const currentTrades = prev.trades || {};

          // 2. Instantly update the numbers in memory for the pie chart
          return {
            ...prev,
            pending: Math.max(0, prev.pending - 1),
            approved: prev.approved + 1,
            trades: {
              ...currentTrades,
              [tradeName]: (currentTrades[tradeName] || 0) + 1
            }
          };
        });
      }
      
      // If rejected, just decrease the pending count
      if (status === 'Rejected') {
        setStats((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1)
        }));
      }
    };

    window.addEventListener('sp-status-updated', handleLiveStats);
    return () => window.removeEventListener('sp-status-updated', handleLiveStats);
  }, []);

  return (
    <>
      {/* ── Page Title ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cs-text)', margin: '0 0 6px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--cs-text-muted)', fontSize: 14, margin: 0 }}>
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
              borderRadius: 16, 
              padding: '24px 28px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 24, 
              flex: 1,
              boxShadow: '0 0 0 1px var(--cs-border), var(--cs-shadow-sm)' 
            }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={icon} size="xl" />
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--cs-text-muted)', letterSpacing: '0.5px' }}>
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
          borderRadius: 16, 
          padding: '24px 32px', 
          display: 'flex', 
          alignItems: 'center', 
          boxShadow: '0 0 0 1px var(--cs-border), var(--cs-shadow-sm)' 
        }}>
          <ProviderPieChart data={stats.trades} />
        </div>

      </div>

      {/* ── Main Content Area ── */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 0 0 1px var(--cs-border), var(--cs-shadow-sm)', minHeight: 400, overflow: 'hidden' }}>
        
        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 24, padding: '0 20px',
          borderBottom: '1px solid var(--cs-border)',
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
                color: activeTab === key ? 'var(--cs-primary)' : 'var(--cs-text-muted)',
                background: 'transparent', border: 'none',
                borderBottom: activeTab === key ? '3px solid var(--cs-primary)' : '3px solid transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {label}
              {badge > 0 && (
                <span style={{
                  background: 'var(--cs-danger)', color: '#fff',
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