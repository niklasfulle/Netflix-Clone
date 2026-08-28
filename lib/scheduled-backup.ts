import { constants as fsConstants, promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_REQUEST_PATH = '/backup-status/scheduled/request.json';

export type ScheduledBackupRequest = {
  schemaVersion: 1;
  requestId: string;
  requestedAt: string;
  environment: 'staging' | 'production';
};

export class ScheduledBackupRequestError extends Error {
  constructor() {
    super('Scheduled backup request is invalid');
    this.name = 'ScheduledBackupRequestError';
  }
}

export class ScheduledBackupBusyError extends Error {
  constructor() {
    super('A scheduled backup request is already pending');
    this.name = 'ScheduledBackupBusyError';
  }
}

function validateRequest(request: ScheduledBackupRequest): void {
  if (
    request.schemaVersion !== 1
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.requestId)
    || Number.isNaN(Date.parse(request.requestedAt))
    || !['staging', 'production'].includes(request.environment)
  ) {
    throw new ScheduledBackupRequestError();
  }
}

export async function requestScheduledBackup(
  request: ScheduledBackupRequest,
  requestPath = process.env.SCHEDULED_BACKUP_REQUEST_PATH || DEFAULT_REQUEST_PATH,
): Promise<void> {
  validateRequest(request);
  const directory = path.dirname(requestPath);
  const temporaryPath = `${requestPath}.${request.requestId}.tmp`;
  await fs.mkdir(directory, { recursive: true, mode: 0o750 });

  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(request)}\n`, {
      encoding: 'utf8',
      mode: 0o640,
      flag: 'wx',
    });
    await fs.link(temporaryPath, requestPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new ScheduledBackupBusyError();
    }
    throw error;
  } finally {
    await fs.rm(temporaryPath, { force: true });
  }

  await fs.access(requestPath, fsConstants.R_OK);
}
