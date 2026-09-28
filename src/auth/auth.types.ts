import type { Request } from 'express';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  admin?: AuthenticatedAdmin;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
