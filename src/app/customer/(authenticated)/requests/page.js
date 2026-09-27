// PATH: /src/app/customer/(authenticated)/requests/page.js
// M2 / M4 — the customer's own service requests. Server Component.
// get_my_customer_requests() scopes rows to the signed-in customer.

import { createServerClient } from '@/lib/supabase/server';
import EmptyState from '@/components/shared/EmptyState';
import CustomerRequestsClient from '@/components/customer/CustomerRequestsClient';

export const metadata = { title: 'My Requests — CommuniServe' };

export default async function CustomerRequestsPage() {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc('get_customer_jobs');

  if (error) {
    console.error('[customer/requests] Load failed:', error.message);
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

  return <CustomerRequestsClient requests={data ?? []} />;
}
