"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

import { addMovieView } from "@/actions/watch/add-movie-view";
import { addToWatchlist } from "@/actions/watch/add-to-watchlist";
import { updateWatchTime } from "@/actions/watch/update-watch-time";
import {
  RANDOM_PLAYLIST_STORAGE_KEY,
} from "@/lib/random-playlist";
import type { RandomPlaylist } from "@/lib/random-playlist";
import { getWatchProgressSaveSecond } from "@/lib/watch-progress-save";
import { recordDebug } from "@/lib/debug";

const RandomWatch = () => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedSecondRef = useRef(-1);
  const [playlist, setPlaylist] = useState<RandomPlaylist | null>(null);
  const [currentMovie, setCurrentMovie] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedPlaylist = sessionStorage.getItem(RANDOM_PLAYLIST_STORAGE_KEY);
      recordDebug("player_storage_read", {
        stored: storedPlaylist !== null,
        characters: storedPlaylist?.length ?? 0,
      });
      if (storedPlaylist) {
        const parsedPlaylist = JSON.parse(storedPlaylist) as RandomPlaylist;
        recordDebug("player_playlist_parsed", {
          title: parsedPlaylist.title,
          movieCount: parsedPlaylist.movies?.length ?? 0,
        });
        setPlaylist(parsedPlaylist);
      }
    } catch (error) {
      recordDebug("player_playlist_error", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      });
      try {
        sessionStorage.removeItem(RANDOM_PLAYLIST_STORAGE_KEY);
      } catch {
        recordDebug("player_storage_cleanup_failed");
      }
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const current = playlist?.movies[currentMovie];
  const hasMultiple = (playlist?.movies.length ?? 0) > 1;

  const setMovieWatchTime = () => {
    if (current?.id && videoRef.current) {
      updateWatchTime({
        movieId: current.id,
        watchTime: Math.round(videoRef.current.currentTime),
      });
    }
  };

  const updateMovie = (direction: number) => {
    if (!playlist) return;
    setMovieWatchTime();
    const newIndex = currentMovie + direction;
    if (newIndex >= 0 && newIndex < playlist.movies.length) {
      setCurrentMovie(newIndex);
    }
  };

  useEffect(() => {
    if (current?.id) {
      lastSavedSecondRef.current = -1;
      addMovieView({ movieId: current.id });
      addToWatchlist({ movieId: current.id });
    }
  }, [current?.id]);

  const goBack = () => {
    setMovieWatchTime();
    router.push(playlist?.returnPath || "/");
  };

  if (!isLoaded) {
    return <div className="w-screen h-screen bg-black" />;
  }

  if (!playlist || playlist.movies.length === 0) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold text-white">Playlist not found</h1>
          <button
            type="button"
            className="px-6 py-3 font-semibold text-white transition-all bg-red-600 rounded-md shadow-md hover:bg-red-800"
            onClick={() => router.push("/")}
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black">
      <nav className="fixed top-8 sm:top-0 z-10 flex flex-row items-center w-full gap-3 sm:gap-8 p-4 bg-black bg-opacity-70">
        <FaArrowLeft
          className="text-white cursor-pointer"
          size={40}
          onClick={goBack}
        />
        <p className="player-title-marquee text-xl font-bold text-white xl:text-3xl">
          <span
            className="player-title-marquee-track"
            data-title={`Random ${playlist.title}: ${current?.title ?? ""}`}
          >
            <span className="pr-3 font-light">Random {playlist.title}:</span>
            {current?.title}
          </span>
        </p>
      </nav>

      {hasMultiple && currentMovie > 0 && (
        <button
          type="button"
          aria-label="Previous video"
          className="fixed z-10 -left-1 bottom-[20%] h-10 w-12 xl:h-16 xl:w-20 bg-black rounded-tr-xl rounded-br-xl cursor-pointer flex items-center justify-center border border-white"
          onClick={() => updateMovie(-1)}
        >
          <FaArrowLeft className="text-white" size={26} />
        </button>
      )}

      {hasMultiple && currentMovie < playlist.movies.length - 1 && (
        <button
          type="button"
          aria-label="Next video"
          className="fixed z-10 -right-1 bottom-[20%] h-10 w-12 xl:h-16 xl:w-20 bg-black rounded-tl-xl rounded-bl-xl cursor-pointer flex items-center justify-center border border-white"
          onClick={() => updateMovie(1)}
        >
          <FaArrowRight className="text-white" size={26} />
        </button>
      )}

      {current?.id && (
        <video
          key={current.id}
          id="videoElement"
          autoPlay
          controls
          className="w-full h-full"
          ref={videoRef}
          poster={current.thumbnailUrl}
          onTimeUpdate={() => {
            if (!videoRef.current) return;
            const saveSecond = getWatchProgressSaveSecond(
              videoRef.current.currentTime,
              lastSavedSecondRef.current,
            );
            if (saveSecond !== null) {
              lastSavedSecondRef.current = saveSecond;
              setMovieWatchTime();
            }
          }}
          onEnded={() => updateMovie(1)}
        >
          <source src={`/api/video/${current.id}`} type="video/mp4" />
          <track kind="captions" />
        </video>
      )}
    </div>
  );
};

export default RandomWatch;
