import bcrypt from 'bcryptjs';

import { consumeMfaChallenge } from '@/data/mfa';
import { recentAuthenticationGrantRepository } from '@/data/qr-device-pairing';
import { getUserById } from '@/data/user';

import { createRecentAuthenticationService } from './recent-authentication';

export const recentAuthenticationService = createRecentAuthenticationService({
  users: { findById: getUserById },
  passwords: { verify: (password, hash) => bcrypt.compare(password, hash) },
  mfa: { consume: consumeMfaChallenge },
  grants: recentAuthenticationGrantRepository,
  clock: { now: () => new Date() },
});
