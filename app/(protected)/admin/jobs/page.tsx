import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { JobOperationsDashboard } from '@/components/admin/JobOperationsDashboard';

export default function JobOperationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <AdminPageHeader
        title="Job Operations"
        description="Monitor durable background work, worker health, retries, cancellations, and audit evidence."
      />
      <JobOperationsDashboard />
    </div>
  );
}
