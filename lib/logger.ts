import fs from 'node:fs';
import path from 'node:path';

const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'backend.log');

type LogLevel = 'info' | 'warn' | 'error';

function filterDetails(level: LogLevel, action: string, details: Record<string, any>) {
  // Bei error: alles loggen
  if (level === 'error') {
    return { action, ...details };
  }
  // Bei info/warn: nur Basisinfos
  const base: Record<string, any> = { action };
  if (details.userId) base.userId = details.userId;
  if (details.userEmail) base.userEmail = details.userEmail;
  if (details.role) base.role = details.role;
  if (details.movieId) base.movieId = details.movieId;
  if (details.values?.movieName) base.movieName = details.values.movieName;
  return base;
}

export function logBackendAction(action: string, details: Record<string, any>, level: LogLevel = 'info') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    ...filterDetails(level, action, details),
  };
  fs.appendFileSync(LOG_FILE_PATH, JSON.stringify(logEntry) + '\n', 'utf8');
}
