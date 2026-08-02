import { backendLogStore, sanitizeLogDetails } from '@/lib/log-store';

type LogLevel = 'info' | 'warn' | 'error';

function filterDetails(level: LogLevel, action: string, details: Record<string, unknown>) {
  const sanitized = sanitizeLogDetails(details);
  if (level === 'error') {
    return { action, ...sanitized };
  }
  const base: Record<string, unknown> = { action };
  if (sanitized.userId) base.userId = sanitized.userId;
  if (sanitized.userEmail) base.userEmail = sanitized.userEmail;
  if (sanitized.email) base.email = sanitized.email;
  if (sanitized.role) base.role = sanitized.role;
  if (sanitized.movieId) base.movieId = sanitized.movieId;
  const values = sanitized.values as Record<string, unknown> | undefined;
  if (values?.movieName) base.movieName = values.movieName;
  return base;
}

export function logBackendAction(action: string, details: Record<string, unknown>, level: LogLevel = 'info') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    ...filterDetails(level, action, details),
  };
  void backendLogStore.write(logEntry);
}
