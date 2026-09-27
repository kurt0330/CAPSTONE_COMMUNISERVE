// PATH: /src/components/admin/PendingTable.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import SPDetailsModal from '@/components/admin/SPDetailsModal';
import Icon from '@/components/ui/Icon';

export default function PendingTable({ onStatsChange }) {
  const [providers,   setProviders]  = useState([]);
  const [loading,      setLoading]    = useState(true);
  const [error,        setError]      = useState(null);
  const [search,       setSearch]     = useState('');
  const [tradeFilter, setTradeFilter]= useState('');
  const [selected,     setSelected]   = useState(null);  // provider opened in modal
  const [actionState, setActionState]= useState({});    // { [provider_id]: 'approving'|'rejecting'|'done' }

  // ── Fetch ───────────────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/providers?status=Pending');
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.message);
      setProviders(json.data);
      // Bubble the live count up to DashboardClient stat cards
      onStatsChange?.({ pending: json.count });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onStatsChange]);

  useEffect(() => { 
    fetchPending(); 
  }, []);

  // ── Approve / Reject ─────────────────────────────────────────────────
  async function handleAction(providerId, action) {
    setActionState((prev) => ({ ...prev, [providerId]: action === 'approve' ? 'approving' : 'rejecting' }));
    try {
      const mod = await import('@/actions/adminActions');
      const result = action === 'approve'
        ? await mod.approveProvider(providerId)
        : await mod.rejectProvider(providerId);

      if (!result.success) throw new Error(result.error);
      
      // ── BROADCAST REAL-TIME APPROVAL SIGNAL ──
      const approvedRecord = providers.find((p) => p.provider_id !== providerId);
      if (action === 'approve' && approvedRecord) {
        window.dispatchEvent(new CustomEvent('sp-status-updated', {
          detail: { 
            status: 'Approved', 
            record: { ...approvedRecord, trade_category: approvedRecord.trade } 
          }
        }));
      }

      // Remove from list and refresh counts
      setProviders((prev) => prev.filter((p) => p.provider_id !== providerId));
      setSelected(null);
      onStatsChange?.((prev) => ({
        pending:  (prev?.pending  ?? 1) - 1,
        approved: action === 'approve' ? (prev?.approved ?? 0) + 1 : prev?.approved,
      }));
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionState((prev) => ({ ...prev, [providerId]: 'done' }));
    }
  }

  // ── Client-side filter ──
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
            placeholder="Search by name or trade…"
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
          onClick={fetchPending}
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
              {['#', 'Full Name', 'Trade / Skill', 'Barangay', 'Date Submitted', 'ID Attached', 'Actions'].map((h) => (
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
            {loading && (
              <SkeletonRows cols={7} rows={5} />
            )}
            {!loading && error && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--cs-danger)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="warning" size="sm" /> {error}
                </span>
              </td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--cs-text-soft)' }}>
                No pending requests at the moment.
              </td></tr>
            )}
            {!loading && !error && filtered.map((sp, idx) => {
              const busy = actionState[sp.provider_id];
              return (
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
                    <IdBadge attached={!!sp.national_id_front} />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <ActionBtn
                        label="View"
                        color="var(--cs-primary)"
                        onClick={() => setSelected(sp)}
                      />
                      <ActionBtn
                        label={busy === 'approving' ? 'Approving…' : 'Approve'}
                        color="var(--cs-success)"
                        disabled={!!busy}
                        onClick={() => handleAction(sp.provider_id, 'approve')}
                      />
                      <ActionBtn
                        label={busy === 'rejecting' ? 'Rejecting…' : 'Reject'}
                        color="var(--cs-danger)"
                        disabled={!!busy}
                        onClick={() => handleAction(sp.provider_id, 'reject')}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selected && (
        <SPDetailsModal
          provider={selected}
          onClose={() => setSelected(null)}
          onApprove={() => handleAction(selected.provider_id, 'approve')}
          onReject={()  => handleAction(selected.provider_id, 'reject')}
          actionState={actionState[selected?.provider_id]}
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

function IdBadge({ attached }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20,
      background: attached ? 'var(--cs-success-tint)' : 'var(--cs-danger-tint)',
      color:       attached ? 'var(--cs-success)' : 'var(--cs-danger)',
    }}>
      <Icon name={attached ? 'check' : 'close'} size="xs" />
      {attached ? 'Attached' : 'Missing'}
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