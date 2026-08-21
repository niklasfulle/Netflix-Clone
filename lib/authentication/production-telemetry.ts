import { randomUUID } from 'node:crypto';

import { backendLogStore } from '@/lib/log-store';
import { APP_VERSION } from '@/lib/version';

import { createAuthenticationTelemetry } from './telemetry';

export const authenticationTelemetry = createAuthenticationTelemetry({
  write: (record) => {
    void backendLogStore.write(record);
  },
  now: () => new Date(),
  randomUUID,
  environment: process.env.DEPLOYMENT_ENVIRONMENT ?? process.env.NODE_ENV ?? 'unknown',
  version: APP_VERSION,
});
