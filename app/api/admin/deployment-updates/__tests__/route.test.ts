/** @jest-environment node */

jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/deployment-update-policy', () => ({
  deploymentUpdatePolicy: {
    read: jest.fn(),
    setAutomaticReload: jest.fn(),
  },
}));

const audit = {
  correlationId: 'correlation-1',
  denied: jest.fn(),
  failed: jest.fn(),
  succeeded: jest.fn(),
};
jest.mock('@/lib/admin-mutation-audit', () => ({
  adminMutationAudit: { begin: jest.fn(() => audit) },
}));

import { currentUser } from '@/lib/auth';
import { deploymentUpdatePolicy } from '@/lib/deployment-update-policy';
import { GET, PATCH } from '../route';

const mockedCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockedRead = deploymentUpdatePolicy.read as jest.Mock;
const mockedSetAutomaticReload = deploymentUpdatePolicy.setAutomaticReload as jest.Mock;

describe('admin deployment update policy route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects policy reads from non-administrators', async () => {
    mockedCurrentUser.mockResolvedValue(undefined);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mockedRead).not.toHaveBeenCalled();
  });

  it('returns the uncached global policy to administrators', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as never);
    mockedRead.mockResolvedValue({ automaticReloadEnabled: false });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    await expect(response.json()).resolves.toEqual({ automaticReloadEnabled: false });
  });

  it('rejects invalid policy mutations', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as never);
    const request = new Request('http://localhost/api/admin/deployment-updates', {
      method: 'PATCH',
      body: JSON.stringify({ automaticReloadEnabled: 'yes' }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    expect(mockedSetAutomaticReload).not.toHaveBeenCalled();
    expect(audit.failed).toHaveBeenCalledTimes(1);
  });

  it('persists and audits a global administrator change', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as never);
    mockedSetAutomaticReload.mockResolvedValue({ automaticReloadEnabled: false });
    const request = new Request('http://localhost/api/admin/deployment-updates', {
      method: 'PATCH',
      body: JSON.stringify({ automaticReloadEnabled: false }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(mockedSetAutomaticReload).toHaveBeenCalledWith(false);
    expect(audit.succeeded).toHaveBeenCalledWith(expect.objectContaining({
      target: { type: 'deployment', id: 'global-update-policy' },
      metadata: expect.objectContaining({ operation: 'automatic_reload_disabled' }),
    }));
    await expect(response.json()).resolves.toMatchObject({
      automaticReloadEnabled: false,
      correlationId: 'correlation-1',
    });
  });
});
