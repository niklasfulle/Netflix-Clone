import { getVideoContentType, parseVideoRange } from '../video-stream';

describe('video stream helpers', () => {
  describe('parseVideoRange', () => {
    it.each([
      ['bytes=0-99', 1000, { start: 0, end: 99 }],
      ['bytes=500-', 1000, { start: 500, end: 999 }],
      ['bytes=-200', 1000, { start: 800, end: 999 }],
      ['bytes=900-1200', 1000, { start: 900, end: 999 }],
      ['bytes=-2000', 1000, { start: 0, end: 999 }],
    ])('parses %s', (range, size, expected) => {
      expect(parseVideoRange(range, size)).toEqual(expected);
    });

    it.each([
      ['bytes=1000-', 1000],
      ['bytes=200-100', 1000],
      ['bytes=-0', 1000],
      ['bytes=0-1,3-4', 1000],
      ['items=0-10', 1000],
      ['bytes=-', 1000],
      ['bytes=0-1', 0],
    ])('rejects invalid range %s', (range, size) => {
      expect(parseVideoRange(range, size)).toBeNull();
    });
  });

  describe('getVideoContentType', () => {
    it.each([
      ['movie.mp4', 'video/mp4'],
      ['movie.MOV', 'video/quicktime'],
      ['movie.webm', 'video/webm'],
      ['movie.mkv', 'video/x-matroska'],
      ['movie.avi', 'video/x-msvideo'],
      ['movie.unknown', 'application/octet-stream'],
    ])('maps %s to %s', (videoPath, expected) => {
      expect(getVideoContentType(videoPath)).toBe(expected);
    });
  });
});
