export type TransferPreview = {
  database: string;
  snapshotId: string;
  createdAt: string;
  existingMovies: number;
  counts: Record<string, number>;
  mediaFiles: number;
  mediaSeconds: number;
};

export type TransferJob = {
  id: string;
  operation: 'export' | 'import';
  state: 'queued' | 'running' | 'succeeded' | 'failed';
  phase: 'queued' | 'exporting' | 'preparing' | 'stopping' | 'importing' | 'restarting' | 'completed' | 'failed';
  percent: number;
  createdAt: string;
  updatedAt: string;
  restartCompleted: boolean;
  backupAvailable?: boolean;
  diagnostic?: string;
};

export type TransferOverview = {
  environment: string;
  available: boolean;
  canImport: boolean;
  jobs: TransferJob[];
};
