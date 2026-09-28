import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

jest.mock('../prisma/client', () => ({ prisma: {} }));

describe('AuthController', () => {
  const tokens = {
    accessToken: 'access',
    refreshToken: 'refresh',
    tokenType: 'Bearer' as const,
    expiresIn: 900,
  };
  let auth: jest.Mocked<
    Pick<AuthService, 'login' | 'refresh' | 'logout' | 'getProfile'>
  >;
  let controller: AuthController;

  beforeEach(() => {
    auth = {
      login: jest.fn().mockResolvedValue(tokens),
      refresh: jest.fn().mockResolvedValue(tokens),
      logout: jest.fn().mockResolvedValue(undefined),
      getProfile: jest.fn(),
    };
    controller = new AuthController(auth as unknown as AuthService);
  });

  it('should log in with the submitted credentials', async () => {
    await expect(
      controller.login({ email: 'admin@example.com', password: 'secret' }),
    ).resolves.toEqual(tokens);
    expect(auth.login).toHaveBeenCalledWith('admin@example.com', 'secret');
  });

  it('should refresh with the submitted refresh token', async () => {
    await expect(controller.refresh({ refreshToken: 'r' })).resolves.toEqual(
      tokens,
    );
    expect(auth.refresh).toHaveBeenCalledWith('r');
  });

  it('should log out with the submitted refresh token', async () => {
    await controller.logout({ refreshToken: 'r' });
    expect(auth.logout).toHaveBeenCalledWith('r');
  });

  it('should return the profile of the authenticated admin', async () => {
    const profile = { id: 'admin-1', email: 'admin@example.com' };
    auth.getProfile.mockResolvedValue(profile as any);

    await expect(
      controller.me({ id: 'admin-1', email: 'admin@example.com' }),
    ).resolves.toEqual(profile);
    expect(auth.getProfile).toHaveBeenCalledWith('admin-1');
  });

  it('should guard only the me route', () => {
    const guardsOf = (method: keyof AuthController) =>
      Reflect.getMetadata(
        GUARDS_METADATA,
        Object.getOwnPropertyDescriptor(AuthController.prototype, method)!
          .value,
      ) as unknown[] | undefined;

    expect(guardsOf('me')).toEqual([AdminAuthGuard]);
    expect(guardsOf('login')).toBeUndefined();
    expect(guardsOf('refresh')).toBeUndefined();
    expect(guardsOf('logout')).toBeUndefined();
  });
});
