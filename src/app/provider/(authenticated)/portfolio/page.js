// PATH: /src/app/provider/(authenticated)/portfolio/page.js
// M3 — the provider's own portfolio, which is also their profile editor.
// Server Component. The (authenticated) layout has already proven this user
// is an approved provider, so this page only has to resolve which one.

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { signDocuments } from '@/lib/documents';
import EmptyState from '@/components/shared/EmptyState';
import PortfolioClient from '@/components/provider/PortfolioClient';

export const metadata = { title: 'My Portfolio — CommuniServe Provider' };

export default async function ProviderPortfolioPage() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: publicUser } = await supabase
    .from('users')
    .select('user_id, full_name, barangay, nickname, avatar_url')
    .eq('auth_id', user.id)
    .single();

  if (!publicUser) redirect('/auth/login');

  const { data: providerRow } = await supabase
    .from('providers')
    .select('provider_id, trade_category, bio, average_rating, resume_path, resume_name')
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

  const providerId = providerRow.provider_id;

  const [
    { data: skills }, { data: certRows }, { data: galleryRows }, { data: reviews },
    { data: catalog }, { data: myServices }, { data: reviewAvatars },
  ] = await Promise.all([
    supabase
      .from('skills')
      .select('skill_id, skill_name, description, years_experience')
      .eq('provider_id', providerId)
      .order('years_experience', { ascending: false }),
    supabase
      .from('provider_files')
      .select('file_id, file_path, original_name')
      .eq('provider_id', providerId)
      .eq('file_type', 'certificate')
      .order('file_id'),
    supabase
      .from('provider_gallery')
      .select('image_id, file_path, caption')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false }),
    supabase.rpc('get_provider_reviews', { p_provider_id: providerId }),
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
      .eq('provider_id', providerId),
    supabase.rpc('get_review_avatars', { p_provider_id: providerId }),
  ]);

  // Résumé + certificates sit in a private bucket: the provider's own files
  // can be signed with their session (storage RLS: own folder).
  const signed = await signDocuments(supabase, [
    providerRow.resume_path,
    ...(certRows ?? []).map((c) => c.file_path),
  ]);

  const galleryBucket = supabase.storage.from('provider-gallery');
  const avatarByRating = Object.fromEntries((reviewAvatars ?? []).map((r) => [r.rating_id, r.avatar_url]));

  const provider = {
    provider_id:    providerId,
    full_name:      publicUser.full_name,
    nickname:       publicUser.nickname,
    avatar_url:     publicUser.avatar_url,
    trade_category: providerRow.trade_category,
    barangay:       publicUser.barangay,
    bio:            providerRow.bio,
    average_rating: providerRow.average_rating,
    id_verified:    true, // the layout already gated on admin_status = 'Approved'
  };

  return (
    <PortfolioClient
      authId={user.id}
      provider={provider}
      skills={skills ?? []}
      resume={providerRow.resume_path
        ? { name: providerRow.resume_name ?? 'Résumé', url: signed[providerRow.resume_path] ?? null }
        : null}
      certificates={(certRows ?? []).map((c) => ({
        file_id: c.file_id,
        name:    c.original_name,
        url:     signed[c.file_path] ?? null,
      }))}
      gallery={(galleryRows ?? []).map((g) => ({
        image_id: g.image_id,
        caption:  g.caption,
        url:      galleryBucket.getPublicUrl(g.file_path).data.publicUrl,
      }))}
      reviews={(reviews ?? []).map((r) => ({ ...r, avatar_url: avatarByRating[r.rating_id] ?? null }))}
      catalog={catalog ?? []}
      myServices={myServices ?? []}
    />
  );
}
