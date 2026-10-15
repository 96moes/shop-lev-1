import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../database/entities/user.entity.js';

export const ROLES_KEY = 'roles';

/** Declares which roles may access a route, enforced by `RolesGuard`. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
