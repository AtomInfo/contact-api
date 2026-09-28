import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedAdmin, AuthenticatedRequest } from './auth.types';

// Only valid on routes protected by AdminAuthGuard, which sets request.admin.
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAdmin => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.admin!;
  },
);
