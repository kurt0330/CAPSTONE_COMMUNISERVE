// PATH: /src/app/customer/(authenticated)/providers/[id]/page.js
// M5 / M4 — Provider profile as seen by a customer. Server Component.
//
// Identity and reviews come from SECURITY DEFINER functions (safe columns
// only); skills and files are read directly under RLS, which restricts them
// to approved providers.

import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signDocuments } from '@/lib/documents';
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

  const [{ data: providerRows }, { data: skills }, { data: files }, { data: reviews }, { data: serviceRows }, { data: reviewAvatars }, { data: docRow }, { data: galleryRows }] =
    await Promise.all([
      // identity + photo, nickname and the "on a job for another customer" flag
      supabase.rpc('get_provider_directory', { p_provider_id: providerId }),
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
      supabase.rpc('get_review_avatars', { p_provider_id: providerId }),
      // RLS: readable for approved providers only
      supabase.from('providers').select('resume_path, resume_name').eq('provider_id', providerId).maybeSingle(),
      // RLS: visible for approved providers
      supabase
        .from('provider_gallery')
        .select('image_id, file_path, caption')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false }),
    ]);

  if (!providerRows?.[0]) return <NotFound />;
  // Résumé and certificates are in a private bucket: hand the page 1-hour
  // signed links (service role, since the viewer is not the owner).
  const signed = await signDocuments(createAdminClient(), [
    docRow?.resume_path,
    ...(files ?? []).map((f) => f.file_path),
  ]);

  const provider = {
    ...providerRows[0],
    occupied: providerRows[0].is_occupied,
    resume: docRow?.resume_path && signed[docRow.resume_path]
      ? { name: docRow.resume_name ?? 'Résumé', url: signed[docRow.resume_path] }
      : null,
  };

  const galleryBucket = supabase.storage.from('provider-gallery');
  const gallery = (galleryRows ?? []).map((g) => ({
    image_id: g.image_id,
    caption:  g.caption,
    url:      galleryBucket.getPublicUrl(g.file_path).data.publicUrl,
  }));

  const avatarByRating = Object.fromEntries((reviewAvatars ?? []).map((r) => [r.rating_id, r.avatar_url]));

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
      gallery={gallery}
      files={(files ?? []).map((f) => ({ ...f, url: signed[f.file_path] ?? null }))}
      reviews={(reviews ?? []).map((r) => ({ ...r, avatar_url: avatarByRating[r.rating_id] ?? null }))}
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
