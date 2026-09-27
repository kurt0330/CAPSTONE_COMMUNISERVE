// PATH: /src/components/provider/ServicesPricingEditor.jsx
// "Services & Pricing" tab of the provider's portfolio.
// Lists every pre-set service for the provider's trade; each one can be
// switched on with a fixed price. Custom Service is always on and is
// negotiated per request, so it has no price here.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import ServiceCard  from '@/components/shared/ServiceCard';
import ToggleSwitch from '@/components/shared/ToggleSwitch';
import PriceInput   from '@/components/shared/PriceInput';
import Icon         from '@/components/ui/Icon';

import { saveProviderService } from '@/actions/providerActions';
import { TRADE_ICONS } from '@/lib/constants';

export default function ServicesPricingEditor({ providerId, tradeCategory, catalog = [], myServices = [] }) {
  const router = useRouter();
  const tradeIcon = TRADE_ICONS[tradeCategory] ?? 'toolbox';
  const activeCount = myServices.filter((s) => s.is_active).length;

  return (
    <>
      <p className="tab-panel-heading">
        Services &amp; Pricing <span className="tab-panel-count">({activeCount} active)</span>
      </p>
      <p className="tab-panel-text" style={{ marginBottom: 14 }}>
        Switch on the {tradeCategory} services you offer and set a fixed price. Residents book these
        directly — you only need to accept or decline.
      </p>

      <div className="service-list">
        {catalog.map((item) => (
          <ServiceRow
            key={item.catalog_id}
            item={item}
            icon={tradeIcon}
            providerId={providerId}
            existing={myServices.find((s) => s.catalog_id === item.catalog_id)}
            onSaved={() => router.refresh()}
          />
        ))}

        <ServiceCard
          custom
          name="Custom Service"
          description={tradeCategory === 'Carpenter'
            ? 'Always available. Residents describe the job and bid an Arawan (daily) or Pakyawan (per-project) price; you accept, decline or counter.'
            : 'Always available. Residents describe the job and propose a price; you accept, decline or counter.'}
          priceNote="Negotiated per request"
        />
      </div>
    </>
  );
}

function ServiceRow({ item, icon, providerId, existing, onSaved }) {
  const [active, setActive] = useState(existing?.is_active ?? false);
  const [price,  setPrice]  = useState(existing ? String(Number(existing.price)) : '');
  const [status, setStatus] = useState('');   // '' | 'saving' | 'saved' | error text

  const savedPrice = existing ? Number(existing.price) : null;
  const dirty = active !== (existing?.is_active ?? false)
    || (active && Number(price) !== savedPrice);

  async function save(nextActive = active) {
    if (nextActive && !(Number(price) > 0)) {
      setStatus('Enter a price first.');
      return;
    }
    setStatus('saving');
    const result = await saveProviderService({
      providerId,
      catalogId: item.catalog_id,
      price: Number(price),
      isActive: nextActive,
    });
    if (!result.success) { setStatus(result.error); return; }
    setStatus('saved');
    onSaved?.();
  }

  function toggle(next) {
    setActive(next);
    setStatus('');
    // Switching an already-saved service off takes effect immediately.
    if (!next && existing?.is_active) save(false);
  }

  return (
    <ServiceCard
      icon={icon}
      name={item.service_name}
      description={item.description}
      off={!active}
    >
      <div className="service-edit-row">
        <ToggleSwitch on={active} onToggle={toggle} label={`Offer ${item.service_name}`} />

        {active && (
          <>
            <PriceInput
              value={price}
              onChange={(v) => { setPrice(v); setStatus(''); }}
              label={`Price for ${item.service_name}`}
            />
            <span className="service-price-unit" style={{ marginLeft: 0 }}>{item.price_unit}</span>
            <button
              type="button"
              className="btn-primary-app btn-sm"
              onClick={() => save(true)}
              disabled={!dirty || status === 'saving'}
            >
              {status === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </>
        )}

        {!active && <span className="service-edit-status">Not offered</span>}

        {status === 'saved' && !dirty && (
          <span className="service-edit-status service-edit-status--saved icon-text">
            <Icon name="check" size="xs" /> Saved
          </span>
        )}
        {status && status !== 'saving' && status !== 'saved' && (
          <span className="service-edit-status" style={{ color: 'var(--cs-danger)' }}>{status}</span>
        )}
      </div>
    </ServiceCard>
  );
}
