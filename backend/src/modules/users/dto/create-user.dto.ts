import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail({}, { message: 'ایمیل وارد‌شده معتبر نیست' })
  @MaxLength(255, { message: 'ایمیل بلندتر از حد مجاز است' })
  email: string;

  @ApiProperty({ minLength: 8, example: 's3cret-pass' })
  @IsString({ message: 'گذرواژه باید متن باشد' })
  @MinLength(8, { message: 'گذرواژه کوتاه‌تر از حد مجاز است' })
  @MaxLength(72, { message: 'گذرواژه بلندتر از حد مجاز است' })
  password: string;

  @ApiProperty({ example: 'Ada' })
  @IsString({ message: 'نام باید متن باشد' })
  @MinLength(1, { message: 'نام کوتاه‌تر از حد مجاز است' })
  @MaxLength(100, { message: 'نام بلندتر از حد مجاز است' })
  firstName: string;

  @ApiProperty({ example: 'Lovelace' })
  @IsString({ message: 'نام خانوادگی باید متن باشد' })
  @MinLength(1, { message: 'نام خانوادگی کوتاه‌تر از حد مجاز است' })
  @MaxLength(100, { message: 'نام خانوادگی بلندتر از حد مجاز است' })
  lastName: string;

  @ApiPropertyOptional({ example: '+1 555 0100' })
  @IsOptional()
  @IsString({ message: 'شماره تماس باید متن باشد' })
  @MaxLength(50, { message: 'شماره تماس بلندتر از حد مجاز است' })
  phone?: string;
}
