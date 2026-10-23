import {
  createDeploymentUpdatePolicy,
  deploymentUpdatePolicy,
  DEFAULT_DEPLOYMENT_UPDATE_POLICY,
} from '@/lib/deployment-update-policy';
import { db } from '@/lib/db';

jest.mock('@/lib/db', () => ({ db: { deploymentUpdatePolicy: { findUnique: jest.fn(), upsert: jest.fn() } } }));

describe('deployment update policy', () => {
  it('loads and updates the global policy through the production storage adapter', async () => {
    jest.mocked(db.deploymentUpdatePolicy.findUnique).mockResolvedValue({ automaticReloadEnabled: false } as never);
    jest.mocked(db.deploymentUpdatePolicy.upsert).mockResolvedValue({ automaticReloadEnabled: true } as never);
    await expect(deploymentUpdatePolicy.read()).resolves.toEqual({ automaticReloadEnabled: false });
    await expect(deploymentUpdatePolicy.setAutomaticReload(true)).resolves.toEqual({ automaticReloadEnabled: true });
    expect(db.deploymentUpdatePolicy.findUnique).toHaveBeenCalledWith({ where: { id: 'global' }, select: { automaticReloadEnabled: true } });
    expect(db.deploymentUpdatePolicy.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'global' }, create: { id: 'global', automaticReloadEnabled: true }, update: { automaticReloadEnabled: true } }));
  });
  it('defaults automatic reloads to enabled before an administrator changes them', async () => {
    const policy = createDeploymentUpdatePolicy({
      find: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    });

    await expect(policy.read()).resolves.toEqual(DEFAULT_DEPLOYMENT_UPDATE_POLICY);
  });

  it('returns the globally persisted policy', async () => {
    const policy = createDeploymentUpdatePolicy({
      find: jest.fn().mockResolvedValue({ automaticReloadEnabled: false }),
      save: jest.fn(),
    });

    await expect(policy.read()).resolves.toEqual({ automaticReloadEnabled: false });
  });

  it('persists and returns an administrator change', async () => {
    const save = jest.fn().mockResolvedValue({ automaticReloadEnabled: false });
    const policy = createDeploymentUpdatePolicy({
      find: jest.fn(),
      save,
    });

    await expect(policy.setAutomaticReload(false)).resolves.toEqual({
      automaticReloadEnabled: false,
    });
    expect(save).toHaveBeenCalledWith(false);
  });
});
