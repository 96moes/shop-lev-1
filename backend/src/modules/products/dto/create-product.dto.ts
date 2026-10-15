import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Payload for creating a product.
 *
 * The decorators are enforced by the global `ValidationPipe` configured in
 * `src/common/configure-app.ts`.
 */
export class CreateProductDto {
  @IsString({ message: 'نام محصول باید متن باشد' })
  @MinLength(2, { message: 'نام محصول کوتاه‌تر از حد مجاز است' })
  @MaxLength(200, { message: 'نام محصول بلندتر از حد مجاز است' })
  name: string;

  @IsOptional()
  @IsString({ message: 'نامک باید متن باشد' })
  @MaxLength(220, { message: 'نامک بلندتر از حد مجاز است' })
  slug?: string;

  @IsOptional()
  @IsString({ message: 'توضیحات باید متن باشد' })
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'قیمت باید یک عدد باشد' })
  @Min(0, { message: 'قیمت کمتر از حد مجاز است' })
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'قیمت پیش از تخفیف باید یک عدد باشد' })
  @Min(0, { message: 'قیمت پیش از تخفیف کمتر از حد مجاز است' })
  compareAtPrice?: number;

  @IsOptional()
  @IsString({ message: 'کد کالا باید متن باشد' })
  @MaxLength(100, { message: 'کد کالا بلندتر از حد مجاز است' })
  sku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'موجودی باید یک عدد صحیح باشد' })
  @Min(0, { message: 'موجودی کمتر از حد مجاز است' })
  stock?: number;

  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعال بودن باید درست یا غلط باشد' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'ویژه بودن باید درست یا غلط باشد' })
  isFeatured?: boolean;

  @IsOptional()
  @IsUUID('all', { message: 'شناسه وارد‌شده معتبر نیست' })
  categoryId?: string;
}
