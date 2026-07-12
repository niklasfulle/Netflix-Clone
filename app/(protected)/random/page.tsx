"use client";
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';

import { updateWatchTime } from '@/actions/watch/update-watch-time';
import useRandom from '@/hooks/useRandom';

export default function RandomPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const _prevVideoEl = useRef<HTMLVideoElement | null>(null);

  const attachVolumeHandlers = (el: HTMLVideoElement | null) => {
    // detach previous
    if (_prevVideoEl.current && _prevVideoEl.current !== el) {
      const old = _prevVideoEl.current as any;
      const fn = old.__onVolumeChange;
      if (fn) old.removeEventListener('volumechange', fn);
      try {
        delete old.__onVolumeChange;
      } catch (e) {}
    }

    if (!el) {
      _prevVideoEl.current = null;
      videoRef.current = null;
      return;
    }

    try {
      const savedVolume = localStorage.getItem('videoVolume');
      const savedMuted = localStorage.getItem('videoMuted');

      if (savedVolume !== null) {
        const vol = parseFloat(savedVolume);
        if (!Number.isNaN(vol)) el.volume = Math.min(1, Math.max(0, vol));
      }
      if (savedMuted !== null) {
        el.muted = savedMuted === 'true';
      }
    } catch (e) {
      // ignore localStorage errors
    }

    const onVolumeChange = () => {
      try {
        localStorage.setItem('videoVolume', String(el.volume));
        localStorage.setItem('videoMuted', String(el.muted));
      } catch (e) {
        // ignore
      }
    };

    el.addEventListener('volumechange', onVolumeChange);
    (el as any).__onVolumeChange = onVolumeChange;

    _prevVideoEl.current = el;
    videoRef.current = el;
  };
  const router = useRouter();
  const { data: movie } = useRandom();

  if (movie == undefined) {
    return null;
  }

  async function setMovieWatchTime() {
    const video = document.getElementById("videoElement") as HTMLVideoElement;
    updateWatchTime({
      movieId: movie?.id,
      watchTime: Math.round(video.currentTime),
    });
  }

  return (
    <div className="w-screen h-screen bg-black">
      <nav className="fixed top-8 sm:top-0 z-10 flex flex-row items-center w-full gap-8 p-4 bg-black bg-opacity-70">
        <AiOutlineArrowLeft
          className="text-white cursor-pointer"
          size={40}
          onClick={() => {
            setMovieWatchTime();
            router.push("/");
          }}
        />
        <p className="font-bold text-white text-1xl md:text-3xl">
          <span className="pr-3 font-light">Watching:</span>
          {movie?.title}
        </p>
      </nav>
      <video
          id="videoElement"
          autoPlay
          controls
          className="w-full h-full"
          ref={attachVolumeHandlers}
          poster={movie.thumbnailUrl}
          onTimeUpdate={() => {
            // Auto-save alle 10 Sekunden
            if (videoRef.current && Math.floor(videoRef.current.currentTime) % 10 === 0) {
              setMovieWatchTime();
            }
          }}
        >
          <source src={`/api/video/${movie.id}`} type="video/mp4" />
          <track kind="captions"></track>
        </video>
    </div>
  );
}
