"use server"
import { logBackendAction } from '@/lib/logger';
import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export const admin = async () => {
  const role = await currentRole()

  if (role === UserRole.ADMIN) {
    logBackendAction('admin_allowed', { role }, 'info');
    return { success: "Allowed Server Action!" }
  }
  logBackendAction('admin_forbidden', { role }, 'error');
  return { error: "Forbidden Server Action!" }
}