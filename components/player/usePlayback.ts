"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useSWRConfig } from 'swr';
import type { CatalogItemDto } from '@/lib/catalog';
import { addMovieView } from '@/actions/watch/add-movie-view';
import { addToWatchlist } from '@/actions/watch/add-to-watchlist';
import { updateWatchTime } from '@/actions/watch/update-watch-time';
import { getWatchProgressSaveSecond } from '@/lib/watch-progress-save';

// Each mounted playback session owns exactly one video and its progress writes.
export function usePlayback(movieId: string, videoRef: RefObject<HTMLVideoElement | null>, resumeTime?: number, recordProgress = true) {
  const { mutate } = useSWRConfig();
  const restored = useRef(false);
  const lastSaved = useRef(-1);
  const saveQueue = useRef(Promise.resolve());
  const progressFailed = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [waiting, setWaiting] = useState(true);
  const [ready, setReady] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState(false);
  const [progressError, setProgressError] = useState(false);

  const saveProgress = useCallback((video: HTMLVideoElement | null, force = true) => {
    if (!recordProgress || !video || video.readyState < 1 || !Number.isFinite(video.currentTime)) return;
    const second = force ? Math.round(video.currentTime) : getWatchProgressSaveSecond(video.currentTime, lastSaved.current);
    if (second === null || second === lastSaved.current) return;
    lastSaved.current = second;
    const reportFailure = (failed: boolean) => {
      if (progressFailed.current !== failed) { progressFailed.current = failed; setProgressError(failed); }
    };
    saveQueue.current = saveQueue.current.then(async () => {
      const result = await updateWatchTime({ movieId, watchTime: second });
      reportFailure(Boolean(result?.error));
      if (!result?.error) {
        await mutate<CatalogItemDto>(`/api/movies/${encodeURIComponent(movieId)}`,
          current => current ? { ...current, watchTime: second } : current, { revalidate: false });
      }
    }).catch(() => { reportFailure(true); lastSaved.current = -1; });
  }, [movieId, mutate, recordProgress]);

  const restore = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 1 || resumeTime === undefined || restored.current) return;
    restored.current = true;
    // Completed titles restart instead of immediately advancing to the next title.
    if (Number.isFinite(resumeTime) && resumeTime > 0 && resumeTime < video.duration - 1) {
      video.currentTime = resumeTime;
      setTime(resumeTime);
    }
  }, [resumeTime, videoRef]);

  useEffect(restore, [restore]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const savedVolume = localStorage.getItem('videoVolume');
      const savedMuted = localStorage.getItem('videoMuted');
      const savedRate = Number(localStorage.getItem('videoPlaybackRate'));
      if (savedVolume !== null && Number.isFinite(Number(savedVolume))) video.volume = Math.min(1, Math.max(0, Number(savedVolume)));
      video.muted = savedMuted === 'true';
      if ([0.5, 0.75, 1, 1.25, 1.5, 2].includes(savedRate)) video.playbackRate = savedRate;
    } catch { /* Playback also works when browser storage is unavailable. */ }
    setVolume(video.volume);
    setMuted(video.muted);
    setRate(video.playbackRate);
    if (recordProgress) {
      void Promise.resolve(addMovieView({ movieId })).catch(() => undefined);
      void Promise.resolve(addToWatchlist({ movieId })).catch(() => undefined);
    }
    const hidden = () => { if (document.visibilityState === 'hidden') saveProgress(video); };
    const leaving = () => saveProgress(video);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', leaving);
    return () => {
      saveProgress(video);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', leaving);
    };
  }, [movieId, saveProgress, videoRef, recordProgress]);

  const play = async () => {
    const video = videoRef.current;
    if (!video) return;
    try { await video.play(); } catch { setPlaying(false); setWaiting(false); }
  };
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) void play(); else video.pause();
  };
  const seek = (second: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    restored.current = true;
    video.currentTime = Math.max(0, Math.min(video.duration, second));
    setTime(video.currentTime);
    setEnded(false);
  };
  const changeVolume = (value: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = Math.min(1, Math.max(0, value));
    videoRef.current.muted = value === 0;
  };
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.volume === 0) video.volume = 0.5;
    video.muted = !video.muted;
  };
  const changeRate = (value: number) => {
    if (videoRef.current) videoRef.current.playbackRate = value;
  };
  const retry = () => {
    setError(false); setWaiting(true); setReady(false); restored.current = false;
    videoRef.current?.load();
    void play();
  };

  const events = {
    onLoadedMetadata: () => {
      const video = videoRef.current;
      if (!video) return;
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setReady(true); setWaiting(false); restore();
    },
    onDurationChange: () => {
      const value = videoRef.current?.duration;
      if (value !== undefined && Number.isFinite(value)) setDuration(value);
    },
    onTimeUpdate: () => {
      if (!videoRef.current) return;
      setTime(videoRef.current.currentTime); saveProgress(videoRef.current, false);
    },
    onProgress: () => {
      const video = videoRef.current;
      if (video?.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));
    },
    onPlay: () => { setPlaying(true); setEnded(false); },
    onPlaying: () => { setPlaying(true); setWaiting(false); setError(false); },
    onPause: () => { setPlaying(false); saveProgress(videoRef.current); },
    onWaiting: () => setWaiting(true),
    onSeeking: () => setWaiting(true),
    onSeeked: () => { setWaiting(false); setTime(videoRef.current?.currentTime ?? 0); },
    onCanPlay: () => setWaiting(false),
    onError: () => { setError(true); setWaiting(false); setPlaying(false); },
    onEnded: () => { setEnded(true); setPlaying(false); saveProgress(videoRef.current); },
    onVolumeChange: () => {
      const video = videoRef.current;
      if (!video) return;
      setVolume(video.volume); setMuted(video.muted);
      try { localStorage.setItem('videoVolume', String(video.volume)); localStorage.setItem('videoMuted', String(video.muted)); } catch { /* Optional preference. */ }
    },
    onRateChange: () => {
      if (!videoRef.current) return;
      setRate(videoRef.current.playbackRate);
      try { localStorage.setItem('videoPlaybackRate', String(videoRef.current.playbackRate)); } catch { /* Optional preference. */ }
    },
  };
  return { playing, time, duration, buffered, volume, muted, rate, waiting, ready, ended, error, progressError,
    togglePlay, play, seek, changeVolume, toggleMute, changeRate, retry, commitProgress: () => saveProgress(videoRef.current), events };
}
