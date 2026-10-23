import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PlaylistDto } from '@/lib/api-types';

export default function PlaylistCover({ movies = [], emptyIcon }: Readonly<{
  movies?: PlaylistDto['movies'];
  emptyIcon?: ReactNode;
}>) {
  const previews = movies.slice(0, movies.length >= 4 ? 4 : 1);
  return (
    <div className={`relative grid aspect-video overflow-hidden bg-zinc-800 ${previews.length === 4 ? 'grid-cols-2 grid-rows-2' : ''}`}>
      {previews.map(movie => (
        <div key={movie.id} className="relative min-h-0">
          <Image src={movie.thumbnailUrl || `/api/catalog/thumbnails/${encodeURIComponent(movie.id ?? '')}`}
            alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
        </div>
      ))}
      {previews.length === 0 && (emptyIcon ?? <ImageIcon className="m-auto h-10 w-10 text-zinc-500" aria-hidden="true" />)}
    </div>
  );
}
