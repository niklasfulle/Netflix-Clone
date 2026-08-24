/** @jest-environment node */

const mockPublisher = {
  start: jest.fn(),
  stop: jest.fn(),
  send: jest.fn(),
};
const mockCreateSubmissionService = jest.fn();

jest.mock('server-only', () => ({}));
jest.mock('pg-boss', () => ({
  PgBoss: jest.fn(() => mockPublisher),
}));
jest.mock('@/lib/db', () => ({ db: {} }));
jest.mock('@/lib/jobs/control', () => ({
  createJobControlService: jest.fn(() => ({
    get: jest.fn(),
    cancel: jest.fn(),
  })),
}));
jest.mock('@/lib/jobs/submission', () => ({
  createJobSubmissionService: (...args: unknown[]) => mockCreateSubmissionService(...args),
}));

describe('background job runtime', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockPublisher.start.mockResolvedValue(mockPublisher);
    mockPublisher.stop.mockResolvedValue(undefined);
    mockPublisher.send.mockResolvedValue('queue-job-1');
    mockCreateSubmissionService.mockImplementation(({ publisher }) => ({
      submit: (value: unknown) => publisher.send('test.queue', value, {}),
    }));
  });

  it('starts the pg-boss publisher once before sending jobs', async () => {
    const { backgroundJobSubmission } = await import('@/lib/jobs/runtime');

    await Promise.all([
      backgroundJobSubmission.submit({ request: 1 }),
      backgroundJobSubmission.submit({ request: 2 }),
    ]);

    expect(mockPublisher.start).toHaveBeenCalledTimes(1);
    expect(mockPublisher.send).toHaveBeenCalledTimes(2);
    expect(mockPublisher.start.mock.invocationCallOrder[0])
      .toBeLessThan(mockPublisher.send.mock.invocationCallOrder[0]);
  });

  it('allows a later request to retry after publisher startup fails', async () => {
    mockPublisher.start
      .mockRejectedValueOnce(new Error('queue startup failed'))
      .mockResolvedValueOnce(mockPublisher);
    const { backgroundJobSubmission } = await import('@/lib/jobs/runtime');

    await expect(backgroundJobSubmission.submit({ request: 1 }))
      .rejects.toThrow('queue startup failed');
    await expect(backgroundJobSubmission.submit({ request: 2 }))
      .resolves.toBe('queue-job-1');

    expect(mockPublisher.start).toHaveBeenCalledTimes(2);
    expect(mockPublisher.stop).toHaveBeenCalledTimes(1);
  });
});
