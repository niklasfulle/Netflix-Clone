/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node CLI */
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const PASSWORD_ROUNDS = 10;

function readRequired(environment, key) {
  const rawValue = environment[key];
  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    throw new Error(`Missing required staging seed setting: ${key}`);
  }

  const value = rawValue.trim();
  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    return value.slice(1, -1);
  }

  return value;
}

function readSeedAccounts(environment) {
  const accounts = [
    {
      email: readRequired(environment, "E2E_USER_EMAIL").toLowerCase(),
      password: readRequired(environment, "E2E_USER_PASSWORD"),
      role: "USER",
      name: "Staging User",
      profileName: "Test profile",
    },
    {
      email: readRequired(environment, "E2E_ADMIN_EMAIL").toLowerCase(),
      password: readRequired(environment, "E2E_ADMIN_PASSWORD"),
      role: "ADMIN",
      name: "Staging Admin",
      profileName: "Admin profile",
    },
  ];

  for (const account of accounts) {
    if (account.password.length < 12) {
      throw new Error(`${account.role} staging password must contain at least 12 characters`);
    }
  }

  if (accounts[0].email === accounts[1].email) {
    throw new Error("Staging user and administrator must use different email addresses");
  }

  return accounts;
}

async function seedStagingUsers({
  db,
  environment = process.env,
  hashPassword = bcrypt.hash,
  now = () => new Date(),
}) {
  if (readRequired(environment, "DEPLOYMENT_ENVIRONMENT") !== "staging") {
    throw new Error("Staging users can only be seeded in the staging environment");
  }

  const databaseRows = await db.$queryRaw`
    SELECT lower(current_database()) AS database_name
  `;
  const databaseName = String(databaseRows[0]?.database_name ?? "");
  if (!databaseName.includes("stage") && !databaseName.includes("staging")) {
    throw new Error("Staging users can only be seeded into a staging database");
  }

  const accounts = readSeedAccounts(environment);
  const preparedAccounts = await Promise.all(
    accounts.map(async (account) => ({
      ...account,
      hashedPassword: await hashPassword(account.password, PASSWORD_ROUNDS),
    })),
  );

  await db.$transaction(async (transaction) => {
    // Staging deployments must leave the deterministic E2E accounts immediately usable,
    // including after a previous browser run exhausted a shared IP or identity budget.
    await transaction.authRateLimit.deleteMany();

    for (const account of preparedAccounts) {
      const user = await transaction.user.upsert({
        where: { email: account.email },
        create: {
          email: account.email,
          name: account.name,
          hashedPassword: account.hashedPassword,
          emailVerified: now(),
          role: account.role,
          isBlocked: false,
          isTwoFactorEnabled: false,
        },
        update: {
          name: account.name,
          hashedPassword: account.hashedPassword,
          emailVerified: now(),
          role: account.role,
          isBlocked: false,
          blockedAt: null,
          blockedUntil: null,
          blockedReason: null,
          isTwoFactorEnabled: false,
        },
      });

      await Promise.all([
        transaction.twoFactorConfirmation.deleteMany({ where: { userId: user.id } }),
        transaction.mfaAuthenticator.deleteMany({ where: { userId: user.id } }),
        transaction.mfaRecoveryCode.deleteMany({ where: { userId: user.id } }),
        transaction.twoFactorToken.deleteMany({ where: { userId: user.id } }),
      ]);

      const existingProfile = await transaction.profil.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!existingProfile) {
        await transaction.profil.create({
          data: {
            userId: user.id,
            name: account.profileName,
            favoriteIds: [],
            inUse: false,
          },
        });
      }
    }
  });

  return { seededUsers: preparedAccounts.length };
}

async function main() {
  const db = new PrismaClient();
  try {
    const result = await seedStagingUsers({ db });
    console.log(`Seeded ${result.seededUsers} staging users`);
  } finally {
    await db.$disconnect();
  }
}

async function runMain() {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Staging user seed failed");
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runMain(); // NOSONAR -- This CommonJS entry point cannot use top-level await.
}

module.exports = {
  PASSWORD_ROUNDS,
  readSeedAccounts,
  seedStagingUsers,
};
