export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

const MIN_SECRET_LENGTH = 32;
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 7;

export interface AuthConfig {
  jwtSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlMs: number;
}

function readPositiveInt(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer, got "${raw}".`);
  }
  return value;
}

// Read lazily (not at import time) so dotenv has already populated process.env.
export function loadAuthConfig(
  env: NodeJS.ProcessEnv = process.env,
): AuthConfig {
  const jwtSecret = env.ADMIN_JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `ADMIN_JWT_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }

  const refreshTokenTtlDays = readPositiveInt(
    env,
    'ADMIN_REFRESH_TOKEN_TTL_DAYS',
    DEFAULT_REFRESH_TOKEN_TTL_DAYS,
  );

  return {
    jwtSecret,
    accessTokenTtlSeconds: readPositiveInt(
      env,
      'ADMIN_ACCESS_TOKEN_TTL_SECONDS',
      DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    ),
    refreshTokenTtlMs: refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  };
}
