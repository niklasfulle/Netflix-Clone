import { UserRole } from "@prisma/client";

import { currentRole } from "@/lib/auth";

export async function isCurrentUserAdmin(): Promise<boolean> {
  const role = await currentRole();
  return role === UserRole.ADMIN;
}
