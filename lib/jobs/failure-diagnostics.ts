// Only fixed diagnostics cross the job/log UI boundary; raw errors stay private.
export const JOB_FAILURE_MESSAGES = {
  INVALID_LEASE_TTL: 'The job requested an invalid lease duration. Update the background worker.',
  OperationalLeaseUnavailableError: 'Another protected operation is already running. Retry after it finishes.',
  OperationalLeaseLostError: 'The operation lost its execution lease before completion.',
  FILESYSTEM_ACCESS_DENIED: 'The worker cannot access a required file or directory. Check ownership and permissions.',
  FILESYSTEM_READ_ONLY: 'The worker cannot write to a required directory because it is read-only.',
  FILESYSTEM_NO_SPACE: 'The worker cannot write because the filesystem has no free space.',
  FILESYSTEM_NOT_FOUND: 'A required file or directory is missing.',
  ScheduledBackupBusyError: 'A previous backup request is still pending. Check the host backup service.',
  BackupVerificationStatusError: 'The backup status file is unreadable or invalid. Check the host backup service.',
  BACKUP_POLL_TIMEOUT: 'The host did not finish the backup request in time. Check the host backup service.',
  BACKUP_FAILED: 'The host reported that backup creation failed. Check the host backup service.',
  BACKUP_TIMEOUT: 'Backup creation exceeded its time limit.',
  LOCK_TIMEOUT: 'Another backup operation held the backup lock for too long.',
  VERIFICATION_FAILED: 'The backup was created but its restore verification failed.',
} as const;

const filesystemDiagnostics: Record<string, string> = {
  EACCES: 'FILESYSTEM_ACCESS_DENIED', EPERM: 'FILESYSTEM_ACCESS_DENIED',
  EROFS: 'FILESYSTEM_READ_ONLY', ENOSPC: 'FILESYSTEM_NO_SPACE', ENOENT: 'FILESYSTEM_NOT_FOUND',
};

export function jobFailureMessage(diagnostic: string) {
  return Object.hasOwn(JOB_FAILURE_MESSAGES, diagnostic) ? JOB_FAILURE_MESSAGES[diagnostic as keyof typeof JOB_FAILURE_MESSAGES] : undefined;
}

export function storedJobDiagnostic(errorCode: string, errorMessage?: string | null): string {
  if (jobFailureMessage(errorCode)) return errorCode;
  if (errorMessage === 'Operational lease TTL must be between 5000 and 900000 milliseconds') return 'INVALID_LEASE_TTL';
  const filesystem = /^(EACCES|EPERM|EROFS|ENOSPC|ENOENT):/.exec(errorMessage ?? '');
  return filesystem ? filesystemDiagnostics[filesystem[1]] : errorCode;
}

export function jobFailureDetails(error: unknown) {
  const value: { code?: unknown; diagnosticCode?: unknown } = error && typeof error === 'object' ? error : {};
  let errorCode = error instanceof Error ? error.name.slice(0, 80) : 'UnknownError';
  if (typeof value.diagnosticCode === 'string' && jobFailureMessage(value.diagnosticCode)) errorCode = value.diagnosticCode;
  else if (typeof value.code === 'string' && Object.hasOwn(filesystemDiagnostics, value.code)) errorCode = filesystemDiagnostics[value.code];
  const errorMessage = (error instanceof Error ? error.message : 'Background job failed').slice(0, 512);
  return { errorCode: storedJobDiagnostic(errorCode, errorMessage), errorMessage };
}
