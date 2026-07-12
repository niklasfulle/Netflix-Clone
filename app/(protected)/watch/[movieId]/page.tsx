"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useRef, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";

import { updateWatchTime } from "@/actions/watch/update-watch-time";
import { addMovieView } from "@/actions/watch/add-movie-view";
import { addToWatchlist } from "@/actions/watch/add-to-watchlist";
import useMovie from "@/hooks/movies/useMovie";

const Watch = () => {
  const movieId = useParams<{ movieId: string }>().movieId;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const { data } = useMovie(movieId);

  const searchParams = useSearchParams();
  const search = searchParams.get("start");
  const from = searchParams.get("from");

  async function setMovieWatchTime() {
    const video = videoRef.current;
    if (video) {
      updateWatchTime({ movieId, watchTime: Math.round(video.currentTime) });
    }
  }

  useEffect(() => {
    if (videoRef.current && data?.watchTime && !search) {
      videoRef.current.currentTime = data.watchTime;
    }
  }, [data?.watchTime, search]);

  // Use a callback ref to restore saved volume/muted and attach listener reliably
  const _prevVideoEl = React.useRef<HTMLVideoElement | null>(null);

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

  useEffect(() => {
    if (movieId) {
      addMovieView({ movieId });
      addToWatchlist({ movieId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-3xl text-white font-bold mb-4">Not found</h1>
          <p className="text-zinc-400 mb-6">The movie or series could not be found.</p>
          <button
            className="bg-red-600 hover:bg-red-800 text-white px-6 py-3 rounded-md font-semibold shadow-md transition-all"
            onClick={() => router.push("/")}
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black">
      <nav className="fixed top-8 sm:top-0 z-10 flex flex-row items-center w-full gap-8 p-4 bg-black bg-opacity-70">
        <FaArrowLeft
          className="text-white cursor-pointer"
          size={40}
          onClick={() => {
            setMovieWatchTime();
            router.push(from || "/");
          }}
        />
        <p className="font-bold text-white text-xl xl:text-3xl flex flex-row">
          <span className="pr-3 font-light">Watching: </span>
          {data?.title}
        </p>
      </nav>
      <video
        id="videoElement"
        autoPlay
        controls
        className="w-full h-full"
        ref={attachVolumeHandlers}
        poster={data.thumbnailUrl}
        onTimeUpdate={() => {
          // Auto-save alle 10 Sekunden
          if (videoRef.current && Math.floor(videoRef.current.currentTime) % 10 === 0) {
            setMovieWatchTime();
          }
        }}
      >
        <source src={`/api/video/${movieId}`} type="video/mp4" />
        <track kind="captions"></track>
      </video>
    </div>
  );
};

export default Watch;