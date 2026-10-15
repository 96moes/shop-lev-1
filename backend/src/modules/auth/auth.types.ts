import { UserRole } from '../../database/entities/user.entity.js';

/** Authenticated principal attached to the request by `JwtStrategy`. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

/** Payload carried inside the signed access token. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}
