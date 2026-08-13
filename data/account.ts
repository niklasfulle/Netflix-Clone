import { db } from '@/lib/db';

export const getAccountByUserId = async (userId: string) => {
  try {
    const account = await db.account.findFirst({
      where: { userId, provider: { not: 'passkey' } }
    })

    return account
  } catch {
    return null
  }
}
