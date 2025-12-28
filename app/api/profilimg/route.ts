import { logBackendAction } from '@/lib/logger';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const profilImgs = await db.profilImg.findMany()
    db.$disconnect()

    logBackendAction('api_profilimg_route_success', {}, 'info');
    return Response.json(profilImgs, { status: 200 })
  } catch (error) {
    logBackendAction('api_profilimg_route_error', { error: String(error) }, 'error');
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}