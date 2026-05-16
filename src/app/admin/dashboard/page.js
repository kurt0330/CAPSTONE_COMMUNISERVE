// PATH: /src/app/admin/dashboard/page.js
// Role: Main admin dashboard page — stat cards + tabbed pending/approved tables.
// Server Component: fetches initial counts server-side, tables load client-side via API.

import DashboardClient from '@/components/admin/DashboardClient';
import { createServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'Dashboard — CommuniServe Admin' };

export default async function AdminDashboardPage() {
  const supabase = createServerClient();

  // ── Server-side stat prefetch (fast — counts only, no heavy joins) ──
  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: clientCount },
  ] = await Promise.all([
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('admin_status', 'Pending'),
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('admin_status', 'Approved'),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
  ]);

  const stats = {
    pending:  pendingCount  ?? 0,
    approved: approvedCount ?? 0,
    clients:  clientCount   ?? 0,
  };

  return <DashboardClient initialStats={stats} />;
}