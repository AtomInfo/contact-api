import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();


// Use CommonJS require to load the runtime client synchronously.
// Prefer the local generated client (compiled into `dist/generated/prisma`),
// but fall back to the installed runtime in `node_modules` when the generated
// client is an ES module and cannot be `require`d in a CommonJS runtime (such
// as Vercel's default Node setup).
// Prefer the local generated client (repo-relative) which we generate during
// install/build. If it's not present or fails to load, fall back to the
// installed runtime in `node_modules`.
let PrismaPkg: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PrismaPkg = require('../../generated/prisma/client');
} catch (e) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PrismaPkg = require('@prisma/client');
}

const adapter = process.env.DATABASE_URL
  ? new PrismaPg({ connectionString: process.env.DATABASE_URL })
  : undefined;

// Create Prisma client. If DATABASE_URL is not set (common during build),
// create the client without adapter to avoid failing installs/builds.
export const prisma = adapter
  ? new PrismaPkg.PrismaClient({ adapter })
  : new PrismaPkg.PrismaClient();

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    'DATABASE_URL not set. Prisma client created without adapter; database calls will fail at runtime if attempted.',
  );
}

process.on('SIGINT', async () => {
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
});
