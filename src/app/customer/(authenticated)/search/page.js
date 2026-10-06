// PATH: /src/app/customer/(authenticated)/search/page.js
// M5 — Search & Filtering. Server Component: fetches the approved-provider
// directory, then hands it to a client component for filtering.
//
// Reads go through get_approved_providers(), a SECURITY DEFINER function that
// returns only public-safe columns (see the portal read policies migration).

import { createServerClient } from '@/lib/supabase/server';
import SearchClient from '@/components/customer/SearchClient';
import EmptyState from '@/components/shared/EmptyState';

export const metadata = { title: 'Find a Provider — CommuniServe' };

export default async function CustomerSearchPage() {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc('get_provider_directory', {
    p_provider_id: null,
  });

  if (error) {
    console.error('[customer/search] Load failed:', error.message);
    return (
      <div className="app-page">
        <h2 className="app-page-title">Find a Provider</h2>
        <EmptyState
          icon="warning"
          tone="danger"
          title="Could not load providers"
          hint="Please refresh the page. If this continues, contact the PESO office."
        />
      </div>
    );
  }

  return <SearchClient providers={data ?? []} />;
}
