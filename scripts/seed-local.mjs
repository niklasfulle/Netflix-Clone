import { PrismaClient } from '@prisma/client';
import { assertLocalDatabase, localAccounts, seedLocal } from './seed-local.js';

try {
  const db = new PrismaClient();
  try {
    if (process.argv.includes('--credentials')) {
      await assertLocalDatabase(db, process.env);
      for (const { email, password } of localAccounts(process.env)) console.log(`${email}: ${password}`);
    } else {
      console.log('Local demo seed complete:', await seedLocal({ db }));
    }
  } finally {
    await db.$disconnect();
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
