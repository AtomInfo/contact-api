import { loadAuthConfig } from './auth.config';

const SECRET = 'x'.repeat(32);

describe('loadAuthConfig', () => {
  it('should apply default token lifetimes', () => {
    expect(loadAuthConfig({ ADMIN_JWT_SECRET: SECRET })).toEqual({
      jwtSecret: SECRET,
      accessTokenTtlSeconds: 900,
      refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
    });
  });

  it('should read custom token lifetimes', () => {
    expect(
      loadAuthConfig({
        ADMIN_JWT_SECRET: SECRET,
        ADMIN_ACCESS_TOKEN_TTL_SECONDS: '300',
        ADMIN_REFRESH_TOKEN_TTL_DAYS: '30',
      }),
    ).toMatchObject({
      accessTokenTtlSeconds: 300,
      refreshTokenTtlMs: 30 * 24 * 60 * 60 * 1000,
    });
  });

  it.each([
    ['missing', undefined],
    ['too short', 'x'.repeat(31)],
  ])('should throw when ADMIN_JWT_SECRET is %s', (_label, secret) => {
    expect(() => loadAuthConfig({ ADMIN_JWT_SECRET: secret })).toThrow(
      /ADMIN_JWT_SECRET/,
    );
  });

  it.each(['0', '-5', '1.5', 'abc'])(
    'should throw on an invalid access token lifetime of %s',
    (value) => {
      expect(() =>
        loadAuthConfig({
          ADMIN_JWT_SECRET: SECRET,
          ADMIN_ACCESS_TOKEN_TTL_SECONDS: value,
        }),
      ).toThrow(/ADMIN_ACCESS_TOKEN_TTL_SECONDS/);
    },
  );
});
