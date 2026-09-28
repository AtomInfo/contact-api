import * as bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 12;

// A valid hash of a random value, compared against when the email is unknown so
// login takes the same time whether or not the account exists.
const DUMMY_PASSWORD_HASH =
  '$2b$12$oPsnCywkVPXg2u.z8HGVYu4tXdsLVuBV.yB4/Z/87lksPpPFl9OpK';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(
  password: string,
  passwordHash: string | undefined,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash ?? DUMMY_PASSWORD_HASH);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
