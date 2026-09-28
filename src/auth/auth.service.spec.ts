import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { prisma } from '../prisma/client';
import type { AuthConfig } from './auth.config';
import { AuthService } from './auth.service';

jest.mock('../prisma/client', () => ({
  prisma: {
    admin: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adminRefreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

const SECRET = 'test-secret-that-is-at-least-32-characters';
const config: AuthConfig = {
  jwtSecret: SECRET,
  accessTokenTtlSeconds: 900,
  refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
};

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

const mocked = {
  findAdmin: prisma.admin.findUnique as jest.Mock,
  updateAdmin: prisma.admin.update as jest.Mock,
  findToken: prisma.adminRefreshToken.findUnique as jest.Mock,
  createToken: prisma.adminRefreshToken.create as jest.Mock,
  updateTokens: prisma.adminRefreshToken.updateMany as jest.Mock,
};

describe('AuthService', () => {
  const jwt = new JwtService({
    secret: SECRET,
    signOptions: { expiresIn: config.accessTokenTtlSeconds },
  });
  let service: AuthService;
  let admin: {
    id: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
  };

  beforeAll(async () => {
    admin = {
      id: 'admin-1',
      email: 'admin@example.com',
      // Low cost keeps the test fast; compare() reads the cost from the hash.
      passwordHash: await bcrypt.hash('correct horse battery', 4),
      isActive: true,
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(jwt, config);
    mocked.createToken.mockResolvedValue({});
    mocked.updateTokens.mockResolvedValue({ count: 1 });
  });

  describe('login', () => {
    it('should issue an access token and a stored, hashed refresh token', async () => {
      mocked.findAdmin.mockResolvedValue(admin);

      const tokens = await service.login(
        '  Admin@Example.com ',
        'correct horse battery',
      );

      expect(mocked.findAdmin).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' },
      });
      expect(mocked.updateAdmin).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(tokens).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 900,
      });
      await expect(jwt.verifyAsync(tokens.accessToken)).resolves.toMatchObject({
        sub: 'admin-1',
        email: 'admin@example.com',
      });

      const { data } = mocked.createToken.mock.calls[0][0];
      expect(data.adminId).toBe('admin-1');
      expect(data.tokenHash).toBe(sha256(tokens.refreshToken));
      expect(data.tokenHash).not.toBe(tokens.refreshToken);
      expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject a wrong password', async () => {
      mocked.findAdmin.mockResolvedValue(admin);

      await expect(
        service.login('admin@example.com', 'wrong password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mocked.createToken).not.toHaveBeenCalled();
    });

    it('should reject an unknown email with the same error', async () => {
      mocked.findAdmin.mockResolvedValue(null);

      await expect(
        service.login('nobody@example.com', 'correct horse battery'),
      ).rejects.toThrow('Invalid email or password.');
    });

    it('should reject an inactive admin even with the right password', async () => {
      mocked.findAdmin.mockResolvedValue({ ...admin, isActive: false });

      await expect(
        service.login('admin@example.com', 'correct horse battery'),
      ).rejects.toThrow('Invalid email or password.');
      expect(mocked.createToken).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const storedToken = (overrides: Record<string, unknown> = {}) => ({
      id: 'token-1',
      adminId: 'admin-1',
      tokenHash: sha256('old-refresh'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      admin,
      ...overrides,
    });

    it('should rotate the refresh token and issue new tokens', async () => {
      mocked.findToken.mockResolvedValue(storedToken());

      const tokens = await service.refresh('old-refresh');

      expect(mocked.findToken).toHaveBeenCalledWith({
        where: { tokenHash: sha256('old-refresh') },
        include: { admin: true },
      });
      expect(mocked.updateTokens).toHaveBeenCalledWith({
        where: { id: 'token-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(tokens.refreshToken).not.toBe('old-refresh');
      expect(mocked.createToken).toHaveBeenCalledTimes(1);
    });

    it('should reject an unknown refresh token', async () => {
      mocked.findToken.mockResolvedValue(null);

      await expect(service.refresh('nope')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject an expired refresh token', async () => {
      mocked.findToken.mockResolvedValue(
        storedToken({ expiresAt: new Date(Date.now() - 1) }),
      );

      await expect(service.refresh('old-refresh')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mocked.createToken).not.toHaveBeenCalled();
    });

    it('should reject a refresh token for an inactive admin', async () => {
      mocked.findToken.mockResolvedValue(
        storedToken({ admin: { ...admin, isActive: false } }),
      );

      await expect(service.refresh('old-refresh')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should revoke all sessions when a revoked token is replayed', async () => {
      mocked.findToken.mockResolvedValue(
        storedToken({ revokedAt: new Date() }),
      );

      await expect(service.refresh('old-refresh')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mocked.updateTokens).toHaveBeenCalledWith({
        where: { adminId: 'admin-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(mocked.createToken).not.toHaveBeenCalled();
    });

    it('should reject when a concurrent refresh already rotated the token', async () => {
      mocked.findToken.mockResolvedValue(storedToken());
      mocked.updateTokens.mockResolvedValue({ count: 0 });

      await expect(service.refresh('old-refresh')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mocked.createToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should revoke the matching refresh token', async () => {
      await expect(service.logout('some-refresh')).resolves.toBeUndefined();

      expect(mocked.updateTokens).toHaveBeenCalledWith({
        where: { tokenHash: sha256('some-refresh'), revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('validateAccessToken', () => {
    it('should return the admin for a valid token', async () => {
      const token = await jwt.signAsync({ sub: 'admin-1', email: 'x' });
      mocked.findAdmin.mockResolvedValue(admin);

      await expect(service.validateAccessToken(token)).resolves.toEqual({
        id: 'admin-1',
        email: 'admin@example.com',
      });
    });

    it('should reject a token signed with another secret', async () => {
      const forged = await new JwtService({
        secret: 'some-other-secret-that-is-32-characters',
      }).signAsync({ sub: 'admin-1', email: 'x' });

      await expect(service.validateAccessToken(forged)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mocked.findAdmin).not.toHaveBeenCalled();
    });

    it('should reject an expired token', async () => {
      const expired = await jwt.signAsync(
        { sub: 'admin-1', email: 'x' },
        { expiresIn: -1 },
      );

      await expect(service.validateAccessToken(expired)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it.each([
      ['deleted', null],
      ['deactivated', { id: 'admin-1', email: 'x', isActive: false }],
    ])('should reject a token for a %s admin', async (_label, found) => {
      const token = await jwt.signAsync({ sub: 'admin-1', email: 'x' });
      mocked.findAdmin.mockResolvedValue(found);

      await expect(service.validateAccessToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return the admin profile without the password hash', async () => {
      const profile = {
        id: 'admin-1',
        email: 'admin@example.com',
        isActive: true,
      };
      mocked.findAdmin.mockResolvedValue(profile);

      await expect(service.getProfile('admin-1')).resolves.toEqual(profile);
      const { select } = mocked.findAdmin.mock.calls[0][0];
      expect(select).not.toHaveProperty('passwordHash');
    });

    it('should reject a missing admin', async () => {
      mocked.findAdmin.mockResolvedValue(null);

      await expect(service.getProfile('admin-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
