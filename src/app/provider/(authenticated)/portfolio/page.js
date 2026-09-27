// PATH: /src/app/provider/(authenticated)/portfolio/page.js
// M3 — the provider's own portfolio. Server Component.
// The (authenticated) layout has already proven this user is an approved
// provider, so this page only has to resolve which provider they are.

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import EmptyState from '@/components/shared/EmptyState';
import PortfolioClient from '@/components/provider/PortfolioClient';

export const metadata = { title: 'My Portfolio — CommuniServe Provider' };

export default async function ProviderPortfolioPage() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: publicUser } = await supabase
    .from('users')
    .select('user_id, full_name, barangay')
    .eq('auth_id', user.id)
    .single();

  if (!publicUser) redirect('/auth/login');

  const { data: providerRow } = await supabase
    .from('providers')
    .select('provider_id, trade_category, bio, average_rating')
    .eq('user_id', publicUser.user_id)
    .single();

  if (!providerRow) {
    return (
      <div className="app-page">
        <h2 className="app-page-title">My Portfolio</h2>
        <EmptyState
          icon="warning"
          tone="danger"
          title="Provider record not found"
          hint="Please contact the PESO office."
        />
      </div>
    );
  }

  const [{ data: skills }, { data: files }, { data: reviews }, { data: catalog }, { data: myServices }] = await Promise.all([
    supabase
      .from('skills')
      .select('skill_id, skill_name, description, years_experience')
      .eq('provider_id', providerRow.provider_id)
      .order('years_experience', { ascending: false }),
    supabase
      .from('provider_files')
      .select('file_id, file_type, file_path, original_name')
      .eq('provider_id', providerRow.provider_id)
      .eq('file_type', 'certificate'),
    supabase.rpc('get_provider_reviews', { p_provider_id: providerRow.provider_id }),
    supabase
      .from('service_catalog')
      .select('catalog_id, service_name, description, price_unit, sort_order')
      .eq('trade_category', providerRow.trade_category)
      .eq('is_active', true)
      .order('sort_order'),
    // "Providers manage own services" lets them see inactive rows too.
    supabase
      .from('provider_services')
      .select('provider_service_id, catalog_id, price, is_active')
      .eq('provider_id', providerRow.provider_id),
  ]);

  const provider = {
    provider_id:    providerRow.provider_id,
    full_name:      publicUser.full_name,
    trade_category: providerRow.trade_category,
    barangay:       publicUser.barangay,
    bio:            providerRow.bio,
    average_rating: providerRow.average_rating,
    review_count:   reviews?.length ?? 0,
    id_verified:    true, // the layout already gated on admin_status = 'Approved'
  };

  return (
    <PortfolioClient
      provider={provider}
      skills={skills ?? []}
      files={files ?? []}
      reviews={reviews ?? []}
      catalog={catalog ?? []}
      myServices={myServices ?? []}
    />
  );
}
