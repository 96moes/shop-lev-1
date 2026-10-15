import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddWishlistItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'شناسه وارد‌شده معتبر نیست' })
  productId: string;
}
