import { db } from '@/lib/db';
import {
  createJobAdministrationService,
  type JobAdministrationDatabase,
} from '@/lib/jobs/administration';

export const backgroundJobAdministration = createJobAdministrationService({
  database: db as unknown as JobAdministrationDatabase,
});
