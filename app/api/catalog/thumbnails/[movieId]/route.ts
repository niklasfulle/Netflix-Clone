import { db } from '@/lib/db';

type Params = { movieId: string };

const INLINE_IMAGE_PATTERN = /^data:(image\/(?:avif|gif|jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/;
const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400';

export async function GET(
  request: Request,
  context: { params: Promise<Params> },
): Promise<Response> {
  const { movieId } = await context.params;
  const movie = await db.movie.findUnique({
    where: { id: movieId },
    select: { thumbnailUrl: true },
  });

  if (!movie?.thumbnailUrl) {
    return new Response(null, { status: 404 });
  }

  const inlineImage = INLINE_IMAGE_PATTERN.exec(movie.thumbnailUrl);
  if (inlineImage) {
    return new Response(Buffer.from(inlineImage[2], 'base64'), {
      headers: {
        'Cache-Control': CACHE_CONTROL,
        'Content-Type': inlineImage[1],
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  if (movie.thumbnailUrl.startsWith('/') || /^https?:\/\//i.test(movie.thumbnailUrl)) {
    return Response.redirect(new URL(movie.thumbnailUrl, request.url), 307);
  }

  return new Response(null, { status: 415 });
}
