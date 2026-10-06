// PATH: /src/app/provider/(authenticated)/requests/page.js
// M4 — incoming job requests for the signed-in provider. Server Component.

import { createServerClient } from '@/lib/supabase/server';
import EmptyState from '@/components/shared/EmptyState';
import ProviderRequestsClient from '@/components/provider/ProviderRequestsClient';

export const metadata = { title: 'My Requests — CommuniServe Provider' };

export default async function ProviderRequestsPage() {
  const supabase = createServerClient();

  const [{ data, error }, { data: avatars }] = await Promise.all([
    supabase.rpc('get_provider_jobs'),
    supabase.rpc('get_job_avatars'),
  ]);

  if (error) {
    console.error('[provider/requests] Load failed:', error.message);
    return (
      <div className="app-page">
        <h2 className="app-page-title">My Requests</h2>
        <EmptyState
          icon="warning"
          tone="danger"
          title="Could not load your requests"
          hint="Please refresh the page and try again."
        />
      </div>
    );
  }

  const avatarByJob = Object.fromEntries((avatars ?? []).map((a) => [a.job_id, a.customer_avatar_url]));
  const requests = (data ?? []).map((r) => ({ ...r, customer_avatar_url: avatarByJob[r.job_id] ?? null }));

  return <ProviderRequestsClient requests={requests} />;
}
