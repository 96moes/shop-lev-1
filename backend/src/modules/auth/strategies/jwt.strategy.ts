import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service.js';
import type { AccessTokenPayload, AuthUser } from '../auth.types.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev_jwt_secret_change_me',
    });
  }

  /**
   * Re-reads the user on every request so deactivated accounts lose access
   * immediately rather than when their access token happens to expire.
   */
  async validate(payload: AccessTokenPayload): Promise<AuthUser> {
    const user = await this.usersService.findPublicById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('حساب کاربری فعال نیست');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
