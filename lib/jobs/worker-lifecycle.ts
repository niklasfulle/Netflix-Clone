export type WorkerLifecycleState = 'CREATED' | 'STARTING' | 'ACTIVE' | 'DRAINING' | 'STOPPED' | 'FAILED';

type WorkerLifecycleDependencies = {
  queue: {
    start(): Promise<unknown>;
    stop(options: { graceful: true; timeout: number }): Promise<void>;
  };
  registerWork(): Promise<unknown>;
  disconnect(): Promise<void>;
  drainTimeoutMs?: number;
};

export function createWorkerLifecycle({
  queue,
  registerWork,
  disconnect,
  drainTimeoutMs = 90_000,
}: WorkerLifecycleDependencies) {
  let currentState: WorkerLifecycleState = 'CREATED';
  let stopPromise: Promise<void> | null = null;

  return {
    state: () => currentState,

    async start(): Promise<void> {
      if (currentState !== 'CREATED') throw new Error(`Worker cannot start from ${currentState}`);
      currentState = 'STARTING';
      try {
        await queue.start();
        await registerWork();
        currentState = 'ACTIVE';
      } catch (error) {
        currentState = 'FAILED';
        throw error;
      }
    },

    stop(): Promise<void> {
      if (stopPromise) return stopPromise;
      if (currentState !== 'ACTIVE') {
        return Promise.reject(new Error(`Worker cannot drain from ${currentState}`));
      }
      currentState = 'DRAINING';
      stopPromise = (async () => {
        try {
          await queue.stop({ graceful: true, timeout: drainTimeoutMs });
          await disconnect();
          currentState = 'STOPPED';
        } catch (error) {
          currentState = 'FAILED';
          throw error;
        }
      })();
      return stopPromise;
    },
  };
}
