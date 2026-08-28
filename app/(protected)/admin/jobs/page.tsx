'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { JobOperationsDashboard } from '@/components/admin/JobOperationsDashboard';
import { WeeklyJobSchedulePanel } from '@/components/admin/WeeklyJobSchedulePanel';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function JobOperationsPage() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <AdminPageHeader
        title={t('Job Operations')}
        description={t('Monitor durable background work, worker health, retries, cancellations, and audit evidence.')}
      />
      <WeeklyJobSchedulePanel />
      <JobOperationsDashboard />
    </div>
  );
}
