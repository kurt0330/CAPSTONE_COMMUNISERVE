// PATH: /src/components/customer/SearchClient.jsx
// Interactive half of /customer/search. Receives the approved-provider
// directory from the server component and filters it in the browser —
// Anini-y has 23 barangays and a small registry, so client-side filtering
// avoids a round trip per keystroke.

'use client';

import { useEffect, useMemo, useState } from 'react';

import SearchBar                from '@/components/shared/SearchBar';
import ChipList                 from '@/components/shared/ChipList';
import EmptyState               from '@/components/shared/EmptyState';
import ProviderSearchResultCard from '@/components/customer/ProviderSearchResultCard';
import Icon                     from '@/components/ui/Icon';

import { TRADE_CATEGORIES, TRADE_ICONS, BARANGAYS } from '@/lib/constants';

const RECENT_KEY = 'communiserve_recent_searches';

const CATEGORY_TILES = [
  { value: 'All', label: 'All Services', icon: 'dashboard' },
  ...TRADE_CATEGORIES.map((t) => ({ value: t, label: t, icon: TRADE_ICONS[t] })),
];

export default function SearchClient({ providers = [] }) {
  const [query,    setQuery]    = useState('');
  const [trade,    setTrade]    = useState('All');
  const [barangay, setBarangay] = useState('All');
  const [recent,   setRecent]   = useState([]);

  // Recent searches are a per-device convenience, so they live in
  // localStorage rather than the database. Guarded because private windows
  // and blocked site data make these calls throw.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) setRecent(JSON.parse(saved));
    } catch {}
  }, []);

  function rememberSearch(term) {
    const clean = term.trim();
    if (!clean) return;
    setRecent((prev) => {
      const next = [clean, ...prev.filter((r) => r !== clean)].slice(0, 5);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function forgetSearch(term) {
    setRecent((prev) => {
      const next = prev.filter((r) => r !== term);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function clearRecent() {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch {}
  }

  const isBrowsing = !query.trim() && trade === 'All' && barangay === 'All';

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    return providers.filter((p) => {
      const matchesQuery =
        !q ||
        p.full_name?.toLowerCase().includes(q) ||
        p.trade_category?.toLowerCase().includes(q) ||
        p.barangay?.toLowerCase().includes(q);

      const matchesTrade    = trade    === 'All' || p.trade_category === trade;
      const matchesBarangay = barangay === 'All' || p.barangay       === barangay;

      return matchesQuery && matchesTrade && matchesBarangay;
    });
  }, [providers, query, trade, barangay]);

  return (
    <div className="app-page">

      <h2 className="app-page-title">Find a Provider</h2>
      <p className="app-page-sub">
        All providers listed here are verified by the Anini-y LGU.
      </p>

      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={() => setQuery('')}
        onCommit={rememberSearch}
        placeholder="Search for a service or provider…"
      />

      {recent.length > 0 && (
        <>
          <div className="section-row">
            <h3 className="section-title">Recent Search</h3>
            <button type="button" className="section-link" onClick={clearRecent}>
              Clear All
            </button>
          </div>
          <ChipList
            items={recent}
            onSelect={(item) => setQuery(item)}
            onDismiss={forgetSearch}
          />
        </>
      )}

      {/* ── Categories double as the trade filter ── */}
      <div className="section-row">
        <h3 className="section-title">Popular Categories</h3>
      </div>
      <div className="category-grid">
        {CATEGORY_TILES.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            className={`category-tile${trade === value ? ' active' : ''}`}
            onClick={() => setTrade(value)}
            aria-pressed={trade === value}
          >
            <Icon name={icon} size="xl" />
            {label}
          </button>
        ))}
      </div>

      <div className="section-row">
        <h3 className="section-title">
          {isBrowsing
            ? `All Providers (${results.length})`
            : `${results.length} ${results.length === 1 ? 'provider' : 'providers'} found`}
        </h3>
        <select
          className="filter-select"
          value={barangay}
          onChange={(e) => setBarangay(e.target.value)}
          aria-label="Filter by barangay"
        >
          <option value="All">All barangays</option>
          {BARANGAYS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon="search"
          title={providers.length === 0 ? 'No providers listed yet' : 'No providers match your search'}
          hint={
            providers.length === 0
              ? 'Providers appear here once the LGU approves their application.'
              : 'Try a different trade, barangay, or clear your filters.'
          }
        />
      ) : (
        <div className="card-grid card-grid--search">
          {results.map((provider) => (
            <ProviderSearchResultCard
              key={provider.provider_id}
              provider={provider}
            />
          ))}
        </div>
      )}

    </div>
  );
}
