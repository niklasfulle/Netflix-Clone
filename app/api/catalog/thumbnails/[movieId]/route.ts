import { promises as fs } from 'node:fs';
import path from 'node:path';

import { db } from '@/lib/db';

type Params = { movieId: string };

const INLINE_IMAGE_PATTERN = /^data:(image\/(?:avif|gif|jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/;
const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400';
const PUBLIC_FOLDER = path.resolve(process.cwd(), 'public');
const IMAGE_CONTENT_TYPES = new Map([
  ['.avif', 'image/avif'],
  ['.gif', 'image/gif'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
]);

function resolvePublicImage(publicUrl: string): { filePath: string; contentType: string } | null {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(publicUrl);
  } catch {
    return null;
  }

  const filePath = path.resolve(PUBLIC_FOLDER, `.${decodedPath}`);
  const relativePath = path.relative(PUBLIC_FOLDER, filePath);
  const contentType = IMAGE_CONTENT_TYPES.get(path.extname(filePath).toLowerCase());
  if (
    !contentType
    || relativePath === ''
    || relativePath === '..'
    || relativePath.startsWith(`..${path.sep}`)
    || path.isAbsolute(relativePath)
  ) {
    return null;
  }

  return { filePath, contentType };
}

async function servePublicImage(publicUrl: string): Promise<Response> {
  const image = resolvePublicImage(publicUrl);
  if (!image) return new Response(null, { status: 415 });

  try {
    const bytes = await fs.readFile(/* turbopackIgnore: true */ image.filePath);
    return new Response(bytes, {
      headers: {
        'Cache-Control': CACHE_CONTROL,
        'Content-Type': image.contentType,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

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

  if (movie.thumbnailUrl.startsWith('/')) {
    return servePublicImage(movie.thumbnailUrl);
  }

  if (/^https?:\/\//i.test(movie.thumbnailUrl)) {
    return Response.redirect(new URL(movie.thumbnailUrl, request.url), 307);
  }

  return new Response(null, { status: 415 });
}
