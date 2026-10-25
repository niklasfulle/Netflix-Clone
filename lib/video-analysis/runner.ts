import { analysisSampleTimes, type FrameTags, type Observation } from './contracts';
import { ANALYSIS_FRAME_OFFSET_SECONDS } from './profile';

export type IndexedObservation = Observation & { index: number };

export async function analyzeVideoSegments(input: {
  duration: number;
  previous: IndexedObservation[];
  capture(seconds: number): Promise<Buffer>;
  classify(frames: Buffer[]): Promise<FrameTags>;
  checkpoint(): Promise<void>;
  save(observation: IndexedObservation, processed: number, total: number): Promise<void>;
  progress(processed: number, total: number): Promise<void>;
}) {
  const times = analysisSampleTimes(input.duration);
  const observations = new Map(input.previous.map(observation => [observation.index, observation]));
  await input.progress(observations.size, times.length);
  for (let index = 0; index < times.length; index++) {
    await input.checkpoint();
    if (observations.has(index)) continue;
    const atSeconds = times[index];
    const positions = [...new Set([-ANALYSIS_FRAME_OFFSET_SECONDS, 0, ANALYSIS_FRAME_OFFSET_SECONDS].map(offset => Math.max(0, Math.min(input.duration - Math.min(0.05, input.duration / 100), atSeconds + offset))))];
    const frames: Buffer[] = [];
    for (const position of positions) {
      await input.checkpoint();
      frames.push(await input.capture(position));
    }
    const tags = await input.classify(frames);
    await input.checkpoint();
    const observation = { index, atSeconds, tags };
    await input.save(observation, observations.size + 1, times.length);
    observations.set(index, observation);
    await input.progress(observations.size, times.length);
  }
  return [...observations.values()].sort((a, b) => a.index - b.index);
}
