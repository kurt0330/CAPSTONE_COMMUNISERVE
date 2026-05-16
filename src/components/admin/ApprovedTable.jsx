// PATH: /src/components/admin/ApprovedTable.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import SPDetailsModal from '@/components/admin/SPDetailsModal';

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
            transform: 'translateY(-50%)', color: '#aaa', fontSize: 14,
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search approved SPs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              border: '1px solid #ddd', borderRadius: 6,
              fontSize: 13, fontFamily: 'Arial, sans-serif', outline: 'none',
            }}
          />
        </div>
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          style={{
            padding: '8px 12px', border: '1px solid #ddd',
            borderRadius: 6, fontSize: 13, fontFamily: 'Arial, sans-serif',
            color: '#444', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">All Trades</option>
          {['Carpenter', 'Electrician', 'Kasambahay', 'Nanny', 'Other'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={fetchApproved}
          style={{
            padding: '8px 14px', background: '#eef0ff',
            border: '1px solid #c0c4f7', borderRadius: 6,
            fontSize: 13, fontWeight: 600, color: '#0504AA',
            cursor: 'pointer',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#f4f6ff' }}>
              {['#', 'Full Name', 'Trade / Skill', 'Barangay', 'Date Approved', 'Rating', 'Actions'].map((h) => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  color: '#0504AA', fontWeight: 700, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  borderBottom: '2px solid #dce0f5', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={7} rows={5} />}
            {!loading && error && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#E24B4A' }}>
                ⚠ {error}
              </td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                No approved service providers yet.
              </td></tr>
            )}
            {!loading && !error && filtered.map((sp, idx) => (
              <tr key={sp.provider_id} style={{ borderBottom: '1px solid #f0f0f0' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fafbff'}
                onMouseLeave={(e) => e.currentTarget.style.background = ''}
              >
                <td style={{ padding: '12px 14px', color: '#aaa', fontSize: 12 }}>{idx + 1}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{sp.full_name}</td>
                <td style={{ padding: '12px 14px' }}>
                  <TradePill trade={sp.trade} />
                </td>
                <td style={{ padding: '12px 14px' }}>{sp.barangay ?? '—'}</td>
                <td style={{ padding: '12px 14px' }}>{formatDate(sp.date_submitted)}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontWeight: 700, color: '#e6a817' }}>
                    {'★'.repeat(Math.round(sp.average_rating ?? 0))} {sp.average_rating ?? '0.00'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <ActionBtn label="View" color="#0504AA" onClick={() => setSelected(sp)} />
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
      background: '#eef0ff', color: '#0504AA',
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
        padding: '5px 13px', borderRadius: 5,
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
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }} />
        </td>
      ))}
    </tr>
  ));
}