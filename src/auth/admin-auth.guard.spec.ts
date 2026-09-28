import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import type { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';

jest.mock('../prisma/client', () => ({ prisma: {} }));

const contextFor = (request: Partial<AuthenticatedRequest>) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('AdminAuthGuard', () => {
  const admin = { id: 'admin-1', email: 'admin@example.com' };
  let validateAccessToken: jest.Mock;
  let guard: AdminAuthGuard;

  beforeEach(() => {
    validateAccessToken = jest.fn().mockResolvedValue(admin);
    guard = new AdminAuthGuard({
      validateAccessToken,
    } as unknown as AuthService);
  });

  it('should allow a valid bearer token and attach the admin to the request', async () => {
    const request: Partial<AuthenticatedRequest> = {
      headers: { authorization: 'Bearer abc.def.ghi' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(validateAccessToken).toHaveBeenCalledWith('abc.def.ghi');
    expect(request.admin).toEqual(admin);
  });

  it('should accept a lowercase bearer scheme', async () => {
    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'bearer abc.def.ghi' } }),
      ),
    ).resolves.toBe(true);
  });

  it.each([
    ['no Authorization header', undefined],
    ['a non-bearer scheme', 'Basic dXNlcjpwYXNz'],
    ['an empty bearer token', 'Bearer '],
  ])('should reject %s', async (_label, authorization) => {
    await expect(
      guard.canActivate(contextFor({ headers: { authorization } })),
    ).rejects.toThrow(UnauthorizedException);
    expect(validateAccessToken).not.toHaveBeenCalled();
  });

  it('should propagate rejection of an invalid token', async () => {
    validateAccessToken.mockRejectedValue(new UnauthorizedException());

    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer forged' } }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
