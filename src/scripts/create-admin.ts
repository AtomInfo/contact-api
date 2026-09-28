// Creates an admin, or resets the password of an existing one and reactivates it.
// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... [ADMIN_NAME=...] pnpm admin:create
import { prisma } from '../prisma/client';
import {
  hashPassword,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
} from '../auth/password';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || null;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  const admin = await prisma.admin.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, name, passwordHash },
    update: { passwordHash, isActive: true, ...(name ? { name } : {}) },
  });

  console.log(`Admin ready: ${admin.email} (${admin.id})`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
