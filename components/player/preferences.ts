export type PlayerMode = 'watch' | 'categorize';

// Keep the existing watch keys so current viewer preferences remain intact.
export const PLAYER_PREFERENCE_KEYS = {
  watch: {
    volume: 'videoVolume', muted: 'videoMuted', rate: 'videoPlaybackRate', autoplay: 'playerAutoplayNext',
  },
  categorize: {
    volume: 'videoAnalysis:volume', muted: 'videoAnalysis:muted', rate: 'videoAnalysis:playbackRate', autoplay: 'videoAnalysis:autoplayNext',
  },
} as const;
