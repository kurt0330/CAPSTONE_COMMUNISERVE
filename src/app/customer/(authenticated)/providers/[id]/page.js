// PATH: /src/app/customer/(authenticated)/providers/[id]/page.js
// M5 / M4 — Provider profile as seen by a customer. Server Component.
//
// Identity and reviews come from SECURITY DEFINER functions (safe columns
// only); skills and files are read directly under RLS, which restricts them
// to approved providers.

import { createServerClient } from '@/lib/supabase/server';
import AppTopBar from '@/components/shared/AppTopBar';
import EmptyState from '@/components/shared/EmptyState';
import ProviderProfileClient from '@/components/customer/ProviderProfileClient';

export const metadata = { title: 'Service Provider — CommuniServe' };

export default async function ProviderProfilePage({ params }) {
  const providerId = Number(params.id);
  const supabase = createServerClient();

  if (!Number.isFinite(providerId)) {
    return <NotFound />;
  }

  const [{ data: providerRows }, { data: skills }, { data: files }, { data: reviews }, { data: serviceRows }] =
    await Promise.all([
      supabase.rpc('get_approved_providers', { p_provider_id: providerId }),
      supabase
        .from('skills')
        .select('skill_id, skill_name, description, years_experience')
        .eq('provider_id', providerId)
        .order('years_experience', { ascending: false }),
      supabase
        .from('provider_files')
        .select('file_id, file_type, file_path, original_name')
        .eq('provider_id', providerId)
        .eq('file_type', 'certificate'),
      supabase.rpc('get_provider_reviews', { p_provider_id: providerId }),
      // RLS returns only active services of approved providers.
      supabase
        .from('provider_services')
        .select('provider_service_id, price, service_catalog(service_name, description, price_unit, sort_order)')
        .eq('provider_id', providerId)
        .eq('is_active', true),
    ]);

  const provider = providerRows?.[0];
  if (!provider) return <NotFound />;

  const services = (serviceRows ?? [])
    .map(({ provider_service_id, price, service_catalog: c }) => ({
      provider_service_id,
      price:        Number(price),
      service_name: c?.service_name,
      description:  c?.description,
      price_unit:   c?.price_unit,
      sort_order:   c?.sort_order ?? 0,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <ProviderProfileClient
      provider={provider}
      services={services}
      skills={skills ?? []}
      files={files ?? []}
      reviews={reviews ?? []}
    />
  );
}

function NotFound() {
  return (
    <div className="app-page">
      <AppTopBar title="Provider" backHref="/customer/search" />
      <EmptyState
        icon="search"
        title="Provider not found"
        hint="This provider may not be approved yet, or is no longer listed."
      />
    </div>
  );
}
