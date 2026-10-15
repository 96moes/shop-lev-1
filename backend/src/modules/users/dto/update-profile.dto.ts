import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Fields a customer may change on their own profile. */
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ada' })
  @IsOptional()
  @IsString({ message: 'نام باید متن باشد' })
  @MinLength(1, { message: 'نام کوتاه‌تر از حد مجاز است' })
  @MaxLength(100, { message: 'نام بلندتر از حد مجاز است' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Lovelace' })
  @IsOptional()
  @IsString({ message: 'نام خانوادگی باید متن باشد' })
  @MinLength(1, { message: 'نام خانوادگی کوتاه‌تر از حد مجاز است' })
  @MaxLength(100, { message: 'نام خانوادگی بلندتر از حد مجاز است' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+1 555 0100' })
  @IsOptional()
  @IsString({ message: 'شماره تماس باید متن باشد' })
  @MaxLength(50, { message: 'شماره تماس بلندتر از حد مجاز است' })
  phone?: string;
}
