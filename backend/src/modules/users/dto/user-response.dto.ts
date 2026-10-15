import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import type { UserRole } from '../../../database/entities/user.entity.js';

/**
 * Shape of a user returned by the API. Never includes the password hash.
 */
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'customer@example.com' })
  email: string;

  @ApiProperty({ example: 'Ada' })
  firstName: string;

  @ApiProperty({ example: 'Lovelace' })
  lastName: string;

  @ApiProperty({ nullable: true, example: '+1 555 0100' })
  phone: string | null;

  @ApiProperty({ enum: ['customer', 'admin'], example: 'customer' })
  role: UserRole;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @Exclude()
  password?: string;
}
