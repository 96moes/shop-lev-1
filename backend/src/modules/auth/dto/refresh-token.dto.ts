import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'A refresh token previously issued by this API.' })
  @IsString({ message: 'توکن تازه‌سازی باید متن باشد' })
  @MinLength(10, { message: 'توکن تازه‌سازی کوتاه‌تر از حد مجاز است' })
  refreshToken: string;
}
