import { execFile, type ExecFileException } from 'node:child_process';

import {
  MediaProbeFailure,
  type MediaProbeResult,
} from '@/lib/media-integrity-resources';

type ProbeProcessInput = {
  filePath: string;
  timeoutMs: number;
};

type ProbeProcessRunner = (input: ProbeProcessInput) => Promise<{ stdout: string }>;

const MAX_OUTPUT_BYTES = 1_000_000;
const MAX_STREAMS = 32;
const FFPROBE_BINARY = '/usr/local/bin/ffprobe';

class FfprobeExecutionError extends Error {
  readonly code: string | undefined;
  readonly killed: boolean | undefined;
  readonly signal: string | undefined;

  constructor(error: ExecFileException) {
    super('ffprobe execution failed', { cause: error });
    this.name = 'FfprobeExecutionError';
    this.code = typeof error.code === 'string' ? error.code : undefined;
    this.killed = error.killed;
    this.signal = error.signal ?? undefined;
  }
}

export function checkFfprobeAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(FFPROBE_BINARY, ['-version'], {
      timeout: 2_000,
      maxBuffer: 64 * 1024,
      windowsHide: true,
    }, (error) => resolve(!error));
  });
}

function runFfprobe({ filePath, timeoutMs }: ProbeProcessInput): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    execFile(FFPROBE_BINARY, [
      '-v', 'error',
      '-show_entries', 'format=duration,format_name:stream=codec_type,codec_name',
      '-of', 'json',
      '--', filePath,
    ], {
      timeout: timeoutMs,
      maxBuffer: MAX_OUTPUT_BYTES,
      windowsHide: true,
      encoding: 'utf8',
    }, (error, stdout) => {
      if (error) {
        reject(new FfprobeExecutionError(error));
        return;
      }
      resolve({ stdout });
    });
  });
}

function boundedString(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.length <= maxLength ? value : null;
}

function parseProbeOutput(stdout: string): MediaProbeResult {
  if (!stdout || Buffer.byteLength(stdout, 'utf8') > MAX_OUTPUT_BYTES) {
    throw new MediaProbeFailure('INVALID_OUTPUT');
  }

  try {
    const parsed = JSON.parse(stdout) as {
      format?: { duration?: unknown; format_name?: unknown };
      streams?: Array<{ codec_type?: unknown; codec_name?: unknown }>;
    };
    if (!parsed.format || !Array.isArray(parsed.streams) || parsed.streams.length > MAX_STREAMS) {
      throw new MediaProbeFailure('INVALID_OUTPUT');
    }

    const rawDuration = Number(parsed.format.duration);
    const durationSeconds = Number.isFinite(rawDuration) && rawDuration >= 0 ? rawDuration : null;
    const container = boundedString(parsed.format.format_name, 200);
    const streams = parsed.streams.map((stream) => {
      const codecType = boundedString(stream.codec_type, 20);
      const codec = boundedString(stream.codec_name, 50);
      if (!codec) throw new MediaProbeFailure('INVALID_OUTPUT');
      const type: MediaProbeResult['streams'][number]['type'] =
        codecType === 'video' || codecType === 'audio' ? codecType : 'other';
      return {
        type,
        codec,
      };
    });

    return { durationSeconds, container, streams };
  } catch (error) {
    if (error instanceof MediaProbeFailure) throw error;
    throw new MediaProbeFailure('INVALID_OUTPUT');
  }
}

export function createFfprobe({ run = runFfprobe }: { run?: ProbeProcessRunner } = {}) {
  return async (filePath: string, timeoutMs = 5_000): Promise<MediaProbeResult> => {
    try {
      const { stdout } = await run({ filePath, timeoutMs });
      return parseProbeOutput(stdout);
    } catch (error) {
      if (error instanceof MediaProbeFailure) throw error;
      const processError = error as NodeJS.ErrnoException & { killed?: boolean; signal?: string };
      if (processError.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
        throw new MediaProbeFailure('INVALID_OUTPUT');
      }
      if (processError.killed || processError.code === 'ETIMEDOUT' || processError.signal === 'SIGTERM') {
        throw new MediaProbeFailure('TIMEOUT');
      }
      throw new MediaProbeFailure('EXECUTION_FAILED');
    }
  };
}
