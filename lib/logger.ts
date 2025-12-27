import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'backend.log');

export function logBackendAction(action: string, details: Record<string, any>) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    ...details,
  };
  fs.appendFileSync(LOG_FILE_PATH, JSON.stringify(logEntry) + '\n', 'utf8');
}
