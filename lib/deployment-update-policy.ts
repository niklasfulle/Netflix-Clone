import { db } from '@/lib/db';

export type DeploymentUpdatePolicyState = Readonly<{
  automaticReloadEnabled: boolean;
}>;

type StoredPolicy = {
  automaticReloadEnabled: boolean;
};

type DeploymentUpdatePolicyRepository = {
  find(): Promise<StoredPolicy | null>;
  save(automaticReloadEnabled: boolean): Promise<StoredPolicy>;
};

export const DEFAULT_DEPLOYMENT_UPDATE_POLICY: DeploymentUpdatePolicyState = {
  automaticReloadEnabled: true,
};

export function createDeploymentUpdatePolicy(repository: DeploymentUpdatePolicyRepository) {
  return {
    async read(): Promise<DeploymentUpdatePolicyState> {
      const stored = await repository.find();
      return stored ?? DEFAULT_DEPLOYMENT_UPDATE_POLICY;
    },

    async setAutomaticReload(
      automaticReloadEnabled: boolean,
    ): Promise<DeploymentUpdatePolicyState> {
      return repository.save(automaticReloadEnabled);
    },
  };
}

export const deploymentUpdatePolicy = createDeploymentUpdatePolicy({
  find: () => db.deploymentUpdatePolicy.findUnique({
    where: { id: 'global' },
    select: { automaticReloadEnabled: true },
  }),
  save: (automaticReloadEnabled) => db.deploymentUpdatePolicy.upsert({
    where: { id: 'global' },
    create: { id: 'global', automaticReloadEnabled },
    update: { automaticReloadEnabled },
    select: { automaticReloadEnabled: true },
  }),
});
