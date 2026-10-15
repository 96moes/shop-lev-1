import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';
import { User, UserRole } from '../../database/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import type { AccessTokenPayload } from './auth.types.js';

/** bcrypt cost factor for passwords. */
const BCRYPT_ROUNDS = 12;

/**
 * Hashes a refresh token for storage and lookup.
 *
 * SHA-256 rather than bcrypt: bcrypt only consumes the first 72 bytes of its
 * input, and JWTs that differ only in their trailing signature bytes would
 * therefore all compare equal — which would let a used token be replayed.
 * Refresh tokens are high-entropy random values, so a fast digest is
 * appropriate (there is nothing to brute-force).
 */
function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto): Promise<{ user: User; tokens: IssuedTokens }> {
    const existing = await this.usersService.findByEmailWithPassword(dto.email);
    if (existing) {
      throw new ConflictException('حسابی با این ایمیل از قبل وجود دارد');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    // Fields are listed explicitly rather than spreading the DTO: spreading a
    // class instance would drop its prototype and leak anything a client sent
    // beyond the validated properties.
    const user = await this.usersService.create({
      email: dto.email,
      password: passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: UserRole.CUSTOMER,
    });

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  /** Verifies credentials and returns the authenticated user. */
  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);

    // Compare against a dummy hash when the user is missing so the response
    // time does not reveal whether an account exists.
    const hash = user?.password ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    const matches = await bcrypt.compare(password, hash);

    if (!user || !matches) {
      throw new UnauthorizedException('ایمیل یا گذرواژه نادرست است');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('این حساب غیرفعال شده است');
    }

    return user;
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: IssuedTokens }> {
    const user = await this.validateCredentials(email, password);
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  /**
   * Rotates a refresh token.
   *
   * The presented token must match the stored hash, and the stored hash is then
   * replaced under an optimistic lock so a token is redeemable exactly once.
   * Without this a leaked or reused refresh token would keep working for its
   * full lifetime, since a valid signature alone would still verify.
   */
  async refresh(refreshToken: string): Promise<{ user: User; tokens: IssuedTokens }> {
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('توکن تازه‌سازی نامعتبر یا منقضی شده است');
    }

    const user = await this.usersService.findWithRefreshTokenHash(payload.sub);
    if (!user?.refreshTokenHash || !user.refreshTokenIssuedAt) {
      throw new UnauthorizedException('توکن تازه‌سازی دیگر معتبر نیست');
    }

    const matches = hashRefreshToken(refreshToken) === user.refreshTokenHash;
    if (!matches) {
      throw new UnauthorizedException('توکن تازه‌سازی دیگر معتبر نیست');
    }

    const tokens = await this.buildTokens(user);
    const issuedAt = new Date();

    const rotated = await this.usersService.replaceRefreshToken(
      user.id,
      user.refreshTokenIssuedAt,
      hashRefreshToken(tokens.refreshToken),
      issuedAt,
    );

    if (!rotated) {
      // Another request redeemed this token first.
      throw new UnauthorizedException('توکن تازه‌سازی دیگر معتبر نیست');
    }

    return { user, tokens };
  }

  /** Clears the stored refresh token so it can no longer be used. */
  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  private get refreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET ?? 'dev_jwt_refresh_secret_change_me';
  }

  private get accessTtlSeconds(): number {
    return Number(process.env.JWT_ACCESS_TTL ?? 900);
  }

  /** Issues a token pair and stores the refresh hash (used at login/register). */
  private async issueTokens(user: User): Promise<IssuedTokens> {
    const tokens = await this.buildTokens(user);

    await this.usersService.setRefreshTokenHash(
      user.id,
      hashRefreshToken(tokens.refreshToken),
    );

    return tokens;
  }

  /** Signs both tokens. Does not touch stored state. */
  private async buildTokens(user: User): Promise<IssuedTokens> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessTtl = this.accessTtlSeconds;
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: accessTtl,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: Number(process.env.JWT_REFRESH_TTL ?? 604_800),
      // A unique id guarantees successive refresh tokens are never byte-equal;
      // `iat` only has second precision, so without this two refreshes inside
      // the same second would produce an identical token.
      jwtid: randomUUID(),
    });

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }
}
