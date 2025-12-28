import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      logBackendAction('api_profil_route_no_user', {}, 'error');
      return Response.json(null, { status: 404 })
    }

    const profiles = await db.profil.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    db.$disconnect()
    logBackendAction('api_profil_route_success', { userId: user.id }, 'info');
    return Response.json(profiles, { status: 200 })
  } catch (error) {
    logBackendAction('api_profil_route_error', { error: String(error) }, 'error');
    console.log(error)
    return Response.json(null, { status: 400 })
  }
}
