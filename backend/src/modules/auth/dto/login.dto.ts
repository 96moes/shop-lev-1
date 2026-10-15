import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail({}, { message: 'ایمیل وارد‌شده معتبر نیست' })
  @MaxLength(255, { message: 'ایمیل بلندتر از حد مجاز است' })
  email: string;

  @ApiProperty({ example: 's3cret-pass' })
  @IsString({ message: 'گذرواژه باید متن باشد' })
  @MinLength(1, { message: 'گذرواژه کوتاه‌تر از حد مجاز است' })
  @MaxLength(72, { message: 'گذرواژه بلندتر از حد مجاز است' })
  password: string;
}
