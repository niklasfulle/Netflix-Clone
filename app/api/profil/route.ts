import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
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
    return Response.json(profiles, { status: 200 })
  } catch {
    logBackendAction('api_profil_route_error', {}, 'error');
    return Response.json(null, { status: 400 })
  }
}
