// PATH: /src/app/provider/(authenticated)/requests/page.js
// M4 — incoming job requests for the signed-in provider. Server Component.

import { createServerClient } from '@/lib/supabase/server';
import EmptyState from '@/components/shared/EmptyState';
import ProviderRequestsClient from '@/components/provider/ProviderRequestsClient';

export const metadata = { title: 'My Requests — CommuniServe Provider' };

export default async function ProviderRequestsPage() {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc('get_provider_jobs');

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

  return <ProviderRequestsClient requests={data ?? []} />;
}
