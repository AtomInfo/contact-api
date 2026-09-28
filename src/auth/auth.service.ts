import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../prisma/client';
import { AUTH_CONFIG, type AuthConfig } from './auth.config';
import type {
  AccessTokenPayload,
  AuthenticatedAdmin,
  AuthTokens,
} from './auth.types';
import { normalizeEmail, verifyPassword } from './password';

const REFRESH_TOKEN_BYTES = 48;

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const invalidCredentials = () =>
  new UnauthorizedException('Invalid email or password.');
const invalidRefreshToken = () =>
  new UnauthorizedException('Invalid or expired refresh token.');
const invalidAccessToken = () =>
  new UnauthorizedException('Invalid or expired access token.');

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  async login(email: string, password: string): Promise<AuthTokens> {
    const admin = await prisma.admin.findUnique({
      where: { email: normalizeEmail(email) },
    });

    // Always run the bcrypt comparison so unknown emails aren't faster to reject.
    const passwordMatches = await verifyPassword(password, admin?.passwordHash);
    if (!admin || !passwordMatches || !admin.isActive) {
      throw invalidCredentials();
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(admin);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await prisma.adminRefreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
      include: { admin: true },
    });

    if (!stored) throw invalidRefreshToken();

    if (stored.revokedAt) {
      // A rotated-out token is being replayed, so it may have been stolen.
      // Revoke every active session for this admin.
      await this.revokeAllSessions(stored.adminId);
      throw invalidRefreshToken();
    }

    if (stored.expiresAt <= new Date() || !stored.admin.isActive) {
      throw invalidRefreshToken();
    }

    // Conditional revoke so two concurrent refreshes can't both succeed.
    const { count } = await prisma.adminRefreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw invalidRefreshToken();

    return this.issueTokens(stored.admin);
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.adminRefreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin || !admin.isActive) throw invalidAccessToken();

    return admin;
  }

  async validateAccessToken(token: string): Promise<AuthenticatedAdmin> {
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw invalidAccessToken();
    }

    // Look the admin up so deactivation takes effect before the token expires.
    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, isActive: true },
    });
    if (!admin || !admin.isActive) throw invalidAccessToken();

    return { id: admin.id, email: admin.email };
  }

  private async issueTokens(admin: {
    id: string;
    email: string;
  }): Promise<AuthTokens> {
    const payload: AccessTokenPayload = { sub: admin.id, email: admin.email };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    await prisma.adminRefreshToken.create({
      data: {
        adminId: admin.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + this.config.refreshTokenTtlMs),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.accessTokenTtlSeconds,
    };
  }

  private async revokeAllSessions(adminId: string): Promise<void> {
    await prisma.adminRefreshToken.updateMany({
      where: { adminId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
