import type { User } from "@prisma/client";

import { db } from "@/lib/db";

type BlockableUser = Pick<User, "id" | "isBlocked" | "blockedUntil">;

export async function hasActiveUserBlock(
  user: BlockableUser,
  database: typeof db = db,
  now = new Date(),
): Promise<boolean> {
  if (!user.isBlocked) return false;
  if (!user.blockedUntil || user.blockedUntil > now) return true;

  await database.user.update({
    where: { id: user.id },
    data: {
      isBlocked: false,
      blockedAt: null,
      blockedUntil: null,
      blockedReason: null,
    },
  });
  return false;
}
