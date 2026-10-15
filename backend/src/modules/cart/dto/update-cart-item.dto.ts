import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ minimum: 1, maximum: 99 })
  @Type(() => Number)
  @IsInt({ message: 'تعداد باید یک عدد صحیح باشد' })
  @Min(1, { message: 'تعداد کمتر از حد مجاز است' })
  @Max(99, { message: 'تعداد بیشتر از حد مجاز است' })
  quantity: number;
}
