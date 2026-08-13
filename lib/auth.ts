import { auth } from '@/auth';

export const currentUser = async () => {
  const session = await auth()
  return session?.user?.isBlocked || session?.user?.isRevoked
    ? undefined
    : session?.user
}

export const currentRole = async () => {
  const user = await currentUser()
  return user?.role
}
