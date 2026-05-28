// PATH: /src/app/admin/dashboard/page.js
import DashboardClient from '@/components/admin/DashboardClient';
import { createServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'Dashboard — CommuniServe Admin' };

export default async function AdminDashboardPage() {
  const supabase = createServerClient();

  // ── Server-side stat prefetch (Counts pending/approved AND breaks down approved by trade) ──
  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: carpenterCount },
    { count: electricianCount },
    { count: kasambahayCount },
  ] = await Promise.all([
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('admin_status', 'Pending'),
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('admin_status', 'Approved'),
    // Fetch breakdown for the pie chart
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('admin_status', 'Approved').eq('trade_category', 'Carpenter'),
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('admin_status', 'Approved').eq('trade_category', 'Electrician'),
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('admin_status', 'Approved').eq('trade_category', 'Kasambahay'),
  ]);

  const stats = {
    pending:  pendingCount  ?? 0,
    approved: approvedCount ?? 0,
    trades: {
      Carpenter: carpenterCount ?? 0,
      Electrician: electricianCount ?? 0,
      Kasambahay: kasambahayCount ?? 0,
    }
  };

  return <DashboardClient initialStats={stats} />;
}