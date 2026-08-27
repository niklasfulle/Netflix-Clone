export type WorkerHeartbeatState = 'STARTING' | 'ACTIVE' | 'DRAINING' | 'STOPPED' | 'FAILED';

type HeartbeatRecord = {
  id: 'primary';
  instanceToken: string;
  state: WorkerHeartbeatState;
  startedAt: Date;
  heartbeatAt: Date;
  stoppedAt: Date | null;
};

export interface WorkerHeartbeatDatabase {
  jobWorkerHeartbeat: {
    upsert(arguments_: {
      where: { id: 'primary' };
      create: HeartbeatRecord;
      update: Omit<HeartbeatRecord, 'id'>;
    }): Promise<unknown>;
    updateMany(arguments_: {
      where: { id: 'primary'; instanceToken: string };
      data: Partial<Pick<HeartbeatRecord, 'state' | 'heartbeatAt' | 'stoppedAt'>>;
    }): Promise<{ count: number }>;
  };
}

export function createWorkerHeartbeat({
  database,
  instanceToken,
  now = () => new Date(),
}: {
  database: WorkerHeartbeatDatabase;
  instanceToken: string;
  now?: () => Date;
}) {
  const ownedWhere = { id: 'primary' as const, instanceToken };

  async function update(
    data: Partial<Pick<HeartbeatRecord, 'state' | 'heartbeatAt' | 'stoppedAt'>>,
  ): Promise<boolean> {
    const result = await database.jobWorkerHeartbeat.updateMany({
      where: ownedWhere,
      data,
    });
    return result.count === 1;
  }

  return {
    async markStarting(): Promise<void> {
      const timestamp = now();
      await database.jobWorkerHeartbeat.upsert({
        where: { id: 'primary' },
        create: {
          id: 'primary',
          instanceToken,
          state: 'STARTING',
          startedAt: timestamp,
          heartbeatAt: timestamp,
          stoppedAt: null,
        },
        update: {
          instanceToken,
          state: 'STARTING',
          startedAt: timestamp,
          heartbeatAt: timestamp,
          stoppedAt: null,
        },
      });
    },

    markActive: () => update({ state: 'ACTIVE', heartbeatAt: now(), stoppedAt: null }),
    beat: () => update({ heartbeatAt: now() }),
    markDraining: () => update({ state: 'DRAINING', heartbeatAt: now() }),
    markStopped: () => {
      const timestamp = now();
      return update({ state: 'STOPPED', heartbeatAt: timestamp, stoppedAt: timestamp });
    },
    markFailed: () => {
      const timestamp = now();
      return update({ state: 'FAILED', heartbeatAt: timestamp, stoppedAt: timestamp });
    },
  };
}
