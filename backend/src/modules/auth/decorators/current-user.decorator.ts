import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../auth.types.js';

/**
 * Injects the authenticated user into a handler parameter.
 *
 * ```ts
 * findAll(@CurrentUser() user: AuthUser) { ... }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
