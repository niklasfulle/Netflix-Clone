/** @jest-environment node */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import {
  createAbortSafeWebStream,
  createVideoStreamResponse,
  getVideoContentType,
  parseVideoRange,
} from '../video-stream';

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

  describe('file-backed responses', () => {
    let temporaryDirectory: string;
    let videoPath: string;

    beforeEach(() => {
      temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'netflix-video-stream-'));
      videoPath = path.join(temporaryDirectory, 'fixture.mp4');
      fs.writeFileSync(videoPath, Buffer.from('0123456789'));
    });

    afterEach(() => {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    });

    it('serves complete files without the unsafe Node toWeb adapter', async () => {
      const unsafeAdapter = jest.spyOn(Readable, 'toWeb').mockImplementation(() => {
        throw new Error('Readable.toWeb must not be used for file responses');
      });

      try {
        const response = createVideoStreamResponse(videoPath, null);
        await expect(response.text()).resolves.toBe('0123456789');
        expect(unsafeAdapter).not.toHaveBeenCalled();
      } finally {
        unsafeAdapter.mockRestore();
      }
    });

    it('preserves range response bodies and headers', async () => {
      const response = createVideoStreamResponse(videoPath, 'bytes=2-5');

      expect(response.status).toBe(206);
      expect(response.headers.get('content-range')).toBe('bytes 2-5/10');
      expect(response.headers.get('content-length')).toBe('4');
      await expect(response.text()).resolves.toBe('2345');
    });

    it('destroys the source when a consumer cancels during a pending read', async () => {
      const source = new Readable({
        read() {
          setTimeout(() => {
            if (!this.destroyed) this.push(Buffer.from('late chunk'));
          }, 10);
        },
      });
      const reader = createAbortSafeWebStream(source).getReader();
      const pendingRead = reader.read();

      await reader.cancel();

      await expect(pendingRead).resolves.toEqual({ done: true, value: undefined });
      expect(source.destroyed).toBe(true);
    });
  });
});
