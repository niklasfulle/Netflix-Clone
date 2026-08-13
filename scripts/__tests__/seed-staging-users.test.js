/** @jest-environment node */

jest.mock("bcrypt", () => ({ hash: jest.fn() }));
jest.mock("@prisma/client", () => ({ PrismaClient: jest.fn() }));

const {
  PASSWORD_ROUNDS,
  readSeedAccounts,
  seedStagingUsers,
} = require("../seed-staging-users");

const environment = {
  DEPLOYMENT_ENVIRONMENT: "staging",
  E2E_USER_EMAIL: "VIEWER@EXAMPLE.TEST",
  E2E_USER_PASSWORD: "viewer-password-123",
  E2E_ADMIN_EMAIL: "ADMIN@EXAMPLE.TEST",
  E2E_ADMIN_PASSWORD: "admin-password-123",
};

function createDatabase() {
  const transaction = {
    user: {
      upsert: jest.fn()
        .mockResolvedValueOnce({ id: "viewer-id" })
        .mockResolvedValueOnce({ id: "admin-id" }),
    },
    profil: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: "profile-id" }),
    },
    twoFactorConfirmation: { deleteMany: jest.fn() },
    mfaAuthenticator: { deleteMany: jest.fn() },
    mfaRecoveryCode: { deleteMany: jest.fn() },
    twoFactorToken: { deleteMany: jest.fn() },
    authRateLimit: { deleteMany: jest.fn() },
  };

  return {
    transaction,
    db: {
      $queryRaw: jest.fn().mockResolvedValue([
        { database_name: "netflix_staging" },
      ]),
      $transaction: jest.fn(async (callback) => callback(transaction)),
    },
  };
}

describe("staging user seed", () => {
  it("normalizes the two configured accounts without exposing implementation defaults", () => {
    expect(readSeedAccounts(environment)).toEqual([
      expect.objectContaining({ email: "viewer@example.test", role: "USER" }),
      expect.objectContaining({ email: "admin@example.test", role: "ADMIN" }),
    ]);
  });

  it("rejects production and non-staging databases before changing users", async () => {
    const { db } = createDatabase();
    await expect(seedStagingUsers({
      db,
      environment: { ...environment, DEPLOYMENT_ENVIRONMENT: "production" },
    })).rejects.toThrow("only be seeded in the staging environment");
    expect(db.$queryRaw).not.toHaveBeenCalled();

    db.$queryRaw.mockResolvedValue([{ database_name: "netflix" }]);
    await expect(seedStagingUsers({ db, environment })).rejects.toThrow(
      "only be seeded into a staging database",
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("upserts verified user and admin accounts, disables MFA, and creates profiles", async () => {
    const { db, transaction } = createDatabase();
    const hashPassword = jest.fn(async (password) => `hashed:${password}`);
    const verifiedAt = new Date("2026-08-11T20:00:00.000Z");

    await expect(seedStagingUsers({
      db,
      environment,
      hashPassword,
      now: () => verifiedAt,
    })).resolves.toEqual({ seededUsers: 2 });

    expect(hashPassword).toHaveBeenCalledTimes(2);
    expect(hashPassword).toHaveBeenCalledWith("viewer-password-123", PASSWORD_ROUNDS);
    expect(transaction.user.upsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { email: "viewer@example.test" },
      create: expect.objectContaining({
        role: "USER",
        emailVerified: verifiedAt,
        isTwoFactorEnabled: false,
      }),
    }));
    expect(transaction.user.upsert).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { email: "admin@example.test" },
      update: expect.objectContaining({ role: "ADMIN", isBlocked: false }),
    }));
    expect(transaction.mfaAuthenticator.deleteMany).toHaveBeenCalledTimes(2);
    expect(transaction.authRateLimit.deleteMany).toHaveBeenCalledTimes(1);
    expect(transaction.profil.create).toHaveBeenCalledTimes(2);
  });

  it("requires distinct accounts with passwords that satisfy the application policy", () => {
    expect(() => readSeedAccounts({
      ...environment,
      E2E_USER_PASSWORD: "too-short",
    })).toThrow("at least 12 characters");
    expect(() => readSeedAccounts({
      ...environment,
      E2E_ADMIN_EMAIL: environment.E2E_USER_EMAIL,
    })).toThrow("different email addresses");
  });
});
