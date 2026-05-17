// PATH: /src/app/admin/assessments/page.js
// Server Component shell — passes data to AssessmentsClient

import AssessmentsClient from '@/components/admin/AssessmentsClient';

export const metadata = { title: 'Skill Assessments — CommuniServe Admin' };

export default function AssessmentsPage() {
  // Data fetching happens client-side in AssessmentsClient
  // so the admin can create/edit without full page reloads
  return <AssessmentsClient />;
}