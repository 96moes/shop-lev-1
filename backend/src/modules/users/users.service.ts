import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity.js';
import { PUBLIC_USER_SELECT } from '../../common/public-select.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

/** Columns safe to return to clients — the password hash is never selected. */
const PUBLIC_SELECT = PUBLIC_USER_SELECT;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    data: CreateUserDto & { password: string; role?: UserRole },
  ): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email.toLowerCase(),
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      role: data.role ?? UserRole.CUSTOMER,
    });

    return this.usersRepository.save(user);
  }

  /**
   * Loads a user including the password hash. Only for authentication flows —
   * never expose the result directly.
   */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * Loads the stored refresh token hash and its issue time. Both columns are
   * `select: false`, so they must be requested explicitly.
   */
  findWithRefreshTokenHash(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.refreshTokenHash', 'user.refreshTokenIssuedAt'])
      .where('user.id = :id', { id })
      .getOne();
  }

  /** Stores (or clears) the hash of the user's current refresh token. */
  async setRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.usersRepository.update(
      { id },
      { refreshTokenHash: hash, refreshTokenIssuedAt: hash ? new Date() : null },
    );
  }

  /**
   * Atomically replaces the refresh token only if the stored issue time still
   * matches the one that was verified.
   *
   * Guards against two concurrent refreshes both succeeding with the same
   * token: the loser's `WHERE` clause no longer matches and it gets `false`.
   */
  async replaceRefreshToken(
    id: string,
    expectedIssuedAt: Date,
    hash: string,
    issuedAt: Date,
  ): Promise<boolean> {
    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ refreshTokenHash: hash, refreshTokenIssuedAt: issuedAt })
      .where('id = :id', { id })
      .andWhere('"refreshTokenIssuedAt" = :expectedIssuedAt', {
        expectedIssuedAt,
      })
      .execute();

    return result.affected === 1;
  }

  /** Public projection of a user, with the password hash stripped. */
  async findPublicById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      select: PUBLIC_SELECT,
      where: { id },
    });
  }

  async updateProfile(id: string, changes: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    // Only assign provided fields so omitted ones keep their stored value.
    if (changes.firstName !== undefined) user.firstName = changes.firstName;
    if (changes.lastName !== undefined) user.lastName = changes.lastName;
    if (changes.phone !== undefined) user.phone = changes.phone;

    await this.usersRepository.save(user);

    const updated = await this.findPublicById(id);
    if (!updated) {
      throw new NotFoundException('کاربر یافت نشد');
    }
    return updated;
  }
}
