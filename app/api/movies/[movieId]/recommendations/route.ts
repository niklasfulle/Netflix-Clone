import { currentUser } from '@/lib/auth';
import { videoRecommendations } from '@/lib/recommendations/service';

export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(_request: Request, context: { params: Promise<{ movieId: string }> }) {
  const user = await currentUser();
  if (!user?.id) return json({ error: 'UNAUTHORIZED' }, 401);
  const { movieId } = await context.params;
  if (!/^[A-Za-z0-9_-]{1,191}$/.test(movieId)) return json({ error: 'NOT_FOUND' }, 404);
  try {
    const items = await videoRecommendations(movieId);
    return items ? json({ items }) : json({ error: 'NOT_FOUND' }, 404);
  } catch { return json({ error: 'RECOMMENDATIONS_UNAVAILABLE' }, 503); }
}
