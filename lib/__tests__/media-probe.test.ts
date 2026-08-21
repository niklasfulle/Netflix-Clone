/** @jest-environment node */

import { createFfprobe } from '../media-probe';
import { MediaProbeFailure } from '../media-integrity-resources';

describe('ffprobe adapter', () => {
  it('returns only the bounded media facts used by the integrity scanner', async () => {
    const run = jest.fn().mockResolvedValue({
      stdout: JSON.stringify({
        format: { duration: '61.25', format_name: 'mov,mp4,m4a,3gp,3g2,mj2' },
        streams: [
          { codec_type: 'video', codec_name: 'h264', tags: { private: 'ignored' } },
          { codec_type: 'audio', codec_name: 'aac' },
          { codec_type: 'subtitle', codec_name: 'subrip' },
        ],
      }),
    });
    const probe = createFfprobe({ run });

    await expect(probe('catalog/movie.mp4', 2_000)).resolves.toEqual({
      durationSeconds: 61.25,
      container: 'mov,mp4,m4a,3gp,3g2,mj2',
      streams: [
        { type: 'video', codec: 'h264' },
        { type: 'audio', codec: 'aac' },
        { type: 'other', codec: 'subrip' },
      ],
    });
    expect(run).toHaveBeenCalledWith(expect.objectContaining({
      filePath: 'catalog/movie.mp4',
      timeoutMs: 2_000,
    }));
  });

  it.each([
    [Object.assign(new Error('timed out at C:\\private\\movie.mp4'), { killed: true }), 'TIMEOUT'],
    [new Error('failed at C:\\private\\movie.mp4'), 'EXECUTION_FAILED'],
    [Object.assign(new Error('too much output'), { code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' }), 'INVALID_OUTPUT'],
  ] as const)('maps process failures without retaining error details', async (error, reason) => {
    const probe = createFfprobe({ run: jest.fn().mockRejectedValue(error) });

    await expect(probe('catalog/movie.mp4')).rejects.toEqual(new MediaProbeFailure(reason));
  });

  it('rejects malformed or unbounded output as invalid', async () => {
    const malformed = createFfprobe({ run: jest.fn().mockResolvedValue({ stdout: '{' }) });
    const oversized = createFfprobe({
      run: jest.fn().mockResolvedValue({ stdout: 'x'.repeat(1_000_001) }),
    });

    await expect(malformed('movie.mp4')).rejects.toEqual(new MediaProbeFailure('INVALID_OUTPUT'));
    await expect(oversized('movie.mp4')).rejects.toEqual(new MediaProbeFailure('INVALID_OUTPUT'));
  });
});
