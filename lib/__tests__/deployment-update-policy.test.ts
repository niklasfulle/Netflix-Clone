import {
  createDeploymentUpdatePolicy,
  DEFAULT_DEPLOYMENT_UPDATE_POLICY,
} from '@/lib/deployment-update-policy';

describe('deployment update policy', () => {
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
