import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      logBackendAction('api_current_profil_no_user', {}, 'error');
      return Response.json(null, { status: 404 })
    }

    const profil = await db.profil.findFirst({
      where: {
        userId: user.id,
        inUse: true
      }
    })

    if (!profil) {
      logBackendAction('api_current_profil_no_profil', { userId: user.id }, 'error');
      return Response.json(null, { status: 404 })
    }

    db.$disconnect()
    logBackendAction('api_current_profil_success', { userId: user.id, profilId: profil.id }, 'info');
    return Response.json(profil, { status: 200 })
  } catch (error) {
    logBackendAction('api_current_profil_error', { error: String(error) }, 'error');
    console.log(error)
    return Response.json(null, { status: 400 })
  }
}
