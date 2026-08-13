type PasskeySignInInput = {
  provider: string;
  providerAccountId: string;
  userId: string;
};

type PasskeySignInDependencies = {
  findAccount(provider: string, providerAccountId: string): Promise<unknown>;
  hasManagementGrant(userId: string): Promise<boolean>;
};

export async function isPasskeySignInAllowed(
  input: PasskeySignInInput,
  dependencies: PasskeySignInDependencies,
): Promise<boolean> {
  if (input.provider !== 'passkey') return true;
  const existingAccount = await dependencies.findAccount(
    input.provider,
    input.providerAccountId,
  );
  return Boolean(existingAccount || (await dependencies.hasManagementGrant(input.userId)));
}
