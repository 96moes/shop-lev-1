import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DiscountType } from '../../../database/entities/coupon.entity.js';

export class CreateCouponDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString({ message: 'کد تخفیف باید متن باشد' })
  @MinLength(3, { message: 'کد تخفیف کوتاه‌تر از حد مجاز است' })
  @MaxLength(50, { message: 'کد تخفیف بلندتر از حد مجاز است' })
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'توضیحات باید متن باشد' })
  description?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType, { message: 'مقدار وارد‌شده معتبر نیست' })
  discountType: DiscountType;

  @ApiProperty({
    description: 'Percentage (0-100) or a fixed amount, per discountType.',
    example: 10,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'مقدار تخفیف باید یک عدد باشد' })
  @Min(0, { message: 'مقدار تخفیف کمتر از حد مجاز است' })
  discountValue: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'حداقل مبلغ سفارش باید یک عدد باشد' })
  @Min(0, { message: 'حداقل مبلغ سفارش کمتر از حد مجاز است' })
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Caps a percentage discount.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'سقف تخفیف باید یک عدد باشد' })
  @Min(0, { message: 'سقف تخفیف کمتر از حد مجاز است' })
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Null means unlimited.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'سقف تعداد استفاده باید یک عدد صحیح باشد' })
  @Min(1, { message: 'سقف تعداد استفاده کمتر از حد مجاز است' })
  usageLimit?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsString({ message: 'تاریخ شروع باید متن باشد' })
  startsAt?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsString({ message: 'تاریخ پایان باید متن باشد' })
  expiresAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعال بودن باید درست یا غلط باشد' })
  isActive?: boolean;
}
