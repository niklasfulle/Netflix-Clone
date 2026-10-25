import { Prisma } from '@prisma/client';
import { currentUser } from '@/lib/auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { createVideoExample, updateVideoExample, deleteVideoExample, VideoExampleError } from '@/lib/video-examples/validation';
import { readVideoExamples, saveVideoExample, removeVideoExample } from '@/lib/video-examples/service';

export const dynamic = 'force-dynamic';
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
function failure(error: unknown) {
  if (error instanceof VideoExampleError) return json({ error: error.code }, error.status);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return json({ error: 'EXAMPLE_CONFLICT' }, 409);
  return json({ error: 'EXAMPLES_UNAVAILABLE' }, 503);
}

export async function GET(request: Request) {
  const actor = await currentUser();
  if (actor?.role !== 'ADMIN') return json({ error: 'FORBIDDEN' }, 403);
  const movieId = new URL(request.url).searchParams.get('movieId');
  if (!movieId || movieId.length > 191) return json({ error: 'INVALID_INPUT' }, 400);
  try { return json(await readVideoExamples(movieId)); }
  catch (error) { return failure(error); }
}

async function write(request: Request, update: boolean) {
  const audit = adminMutationAudit.begin(update ? 'video.example.update' : 'video.example.create');
  const actor = await currentUser();
  if (!actor?.id || actor.role !== 'ADMIN') { await audit.denied(); return json({ error: 'FORBIDDEN' }, 403); }
  const body = await request.json().catch(() => null);
  const parsed = update ? updateVideoExample.safeParse(body) : createVideoExample.safeParse(body);
  if (!parsed.success) { await audit.failed(); return json({ error: 'INVALID_INPUT' }, 400); }
  try {
    const result = await saveVideoExample(parsed.data, actor.id);
    await audit.succeeded({ target: { type: 'video_example', id: result.id }, metadata: { labelCount: parsed.data.labels.length } });
    return json(result, update ? 200 : 201);
  } catch (error) { await audit.failed(); return failure(error); }
}
export async function POST(request: Request) { return write(request, false); }
export async function PATCH(request: Request) { return write(request, true); }

export async function DELETE(request: Request) {
  const audit = adminMutationAudit.begin('video.example.delete');
  const actor = await currentUser();
  if (actor?.role !== 'ADMIN') { await audit.denied(); return json({ error: 'FORBIDDEN' }, 403); }
  const parsed = deleteVideoExample.safeParse(await request.json().catch(() => null));
  if (!parsed.success) { await audit.failed(); return json({ error: 'INVALID_INPUT' }, 400); }
  try {
    await removeVideoExample(parsed.data.id, parsed.data.version);
    await audit.succeeded({ target: { type: 'video_example', id: parsed.data.id } });
    return json({ success: true });
  } catch (error) { await audit.failed(); return failure(error); }
}
