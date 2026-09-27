// PATH: /src/components/admin/ApprovedTable.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import SPDetailsModal from '@/components/admin/SPDetailsModal';
import Icon from '@/components/ui/Icon';

export default function ApprovedTable({ onStatsChange }) {
  const [providers,   setProviders]  = useState([]);
  const [loading,      setLoading]    = useState(true);
  const [error,        setError]      = useState(null);
  const [search,       setSearch]     = useState('');
  const [tradeFilter, setTradeFilter]= useState('');
  const [selected,     setSelected]   = useState(null);

  const fetchApproved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/providers?status=Approved');
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.message);
      setProviders(json.data);
      onStatsChange?.({ approved: json.count });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onStatsChange]);

  useEffect(() => { 
    fetchApproved(); 
  }, []);

  // ── Real-time listener: Catches newly approved SPs and adds them to the top of the list ──
  useEffect(() => {
    const handleNewApproval = (e) => {
      const { status, record } = e.detail;
      
      // If the signal says "Approved" and contains the person's record, add them!
      if (status === 'Approved' && record) {
        setProviders(prev => [
          { ...record, admin_status: 'Approved', updated_at: new Date().toISOString() }, 
          ...prev
        ]);
      }
    };

    window.addEventListener('sp-status-updated', handleNewApproval);
    return () => window.removeEventListener('sp-status-updated', handleNewApproval);
  }, []);

  const filtered = providers.filter((sp) => {
    const nameMatch  = sp.full_name?.toLowerCase().includes(search.toLowerCase());
    const tradeMatch = !tradeFilter || sp.trade === tradeFilter;
    return nameMatch && tradeMatch;
  });

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--cs-text-soft)', display: 'flex',
          }}><Icon name="search" size="sm" /></span>
          <input
            type="text"
            placeholder="Search approved SPs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 32px',
              border: '1px solid var(--cs-border-strong)', borderRadius: 10,
              fontSize: 13, fontFamily: 'var(--cs-font)', outline: 'none',
            }}
          />
        </div>
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          style={{
            flex: '0 0 240px',             
            padding: '8px 12px',
            border: '1px solid var(--cs-border-strong)',
            borderRadius: 10, 
            fontSize: 13, 
            fontFamily: 'var(--cs-font)',
            color: 'var(--cs-text-muted)', 
            cursor: 'pointer', 
            outline: 'none',
            backgroundColor: '#fff',
          }}
        >
          <option value="">All Trades</option>
          {['Carpenter', 'Electrician', 'Kasambahay'].map((t) => (
           
            <option key={t} value={t}>
              {`\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0${t}`}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={fetchApproved}
          style={{
            padding: '8px 14px', background: 'var(--cs-primary-tint)',
            border: '1px solid var(--cs-border-strong)', borderRadius: 10,
            fontSize: 13, fontWeight: 600, color: 'var(--cs-primary)',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Icon name="refresh" size="sm" /> Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: 'var(--cs-bg)' }}>
              {['#', 'Full Name', 'Trade / Skill', 'Barangay', 'Date Approved', 'Rating', 'Actions'].map((h) => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  color: 'var(--cs-primary)', fontWeight: 700, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  borderBottom: '2px solid var(--cs-border)', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={7} rows={5} />}
            {!loading && error && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--cs-danger)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="warning" size="sm" /> {error}
                </span>
              </td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--cs-text-soft)' }}>
                No approved service providers yet.
              </td></tr>
            )}
            {!loading && !error && filtered.map((sp, idx) => (
              <tr key={sp.provider_id} style={{ borderBottom: '1px solid var(--cs-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cs-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = ''}
              >
                <td style={{ padding: '12px 14px', color: 'var(--cs-text-soft)', fontSize: 12 }}>{idx + 1}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{sp.full_name}</td>
                <td style={{ padding: '12px 14px' }}>
                  <TradePill trade={sp.trade} />
                </td>
                <td style={{ padding: '12px 14px' }}>{sp.barangay ?? '—'}</td>
                <td style={{ padding: '12px 14px' }}>{formatDate(sp.date_submitted)}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--cs-text)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    {Array.from({ length: Math.round(sp.average_rating ?? 0) }, (_, i) => (
                      <Icon key={i} name="star" size="xs" style={{ color: 'var(--cs-star)' }} />
                    ))}
                    <span style={{ marginLeft: 4 }}>{sp.average_rating ?? '0.00'}</span>
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <ActionBtn label="View" color="var(--cs-primary)" onClick={() => setSelected(sp)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <SPDetailsModal
          provider={selected}
          onClose={() => setSelected(null)}
          readOnly
        />
      )}
    </>
  );
}

// ── Shared Utilities ──
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Check if TradePill component has already been updated to handle trades.
function TradePill({ trade }) {
  return (
    <span style={{
      display: 'inline-block',
      background: 'var(--cs-primary-tint)', color: 'var(--cs-primary)',
      fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20, letterSpacing: '0.3px',
    }}>
      {trade ?? '—'}
    </span>
  );
}

function ActionBtn({ label, color, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: color, color: '#fff', border: 'none',
        padding: '5px 13px', borderRadius: 8,
        fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, transition: 'opacity 0.2s',
      }}
    >
      {label}
    </button>
  );
}

function SkeletonRows({ cols, rows }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} style={{ padding: '14px 14px' }}>
          <div style={{
            height: 14, borderRadius: 4,
            background: 'linear-gradient(90deg, var(--cs-border) 25%, var(--cs-border) 50%, var(--cs-border) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }} />
        </td>
      ))}
    </tr>
  ));
}