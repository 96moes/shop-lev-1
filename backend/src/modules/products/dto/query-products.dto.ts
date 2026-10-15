import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PRODUCT_SORT_OPTIONS = [
  'newest',
  'price_asc',
  'price_desc',
  'name_asc',
  'name_desc',
] as const;

export type ProductSort = (typeof PRODUCT_SORT_OPTIONS)[number];

/** Filters accepted by `GET /api/products`. */
export class QueryProductsDto {
  @ApiPropertyOptional({ description: 'Case-insensitive search on name/description.' })
  @IsOptional()
  @IsString({ message: 'عبارت جست‌وجو باید متن باشد' })
  @MaxLength(200, { message: 'عبارت جست‌وجو بلندتر از حد مجاز است' })
  search?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all', { message: 'شناسه وارد‌شده معتبر نیست' })
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Inclusive minimum price.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'کمترین قیمت باید یک عدد باشد' })
  @Min(0, { message: 'کمترین قیمت کمتر از حد مجاز است' })
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Inclusive maximum price.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'بیشترین قیمت باید یک عدد باشد' })
  @Min(0, { message: 'بیشترین قیمت کمتر از حد مجاز است' })
  maxPrice?: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'شماره صفحه باید یک عدد صحیح باشد' })
  @Min(1, { message: 'شماره صفحه کمتر از حد مجاز است' })
  page?: number;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'تعداد در هر صفحه باید یک عدد صحیح باشد' })
  @Min(1, { message: 'تعداد در هر صفحه کمتر از حد مجاز است' })
  @Max(100, { message: 'تعداد در هر صفحه بیشتر از حد مجاز است' })
  limit?: number;

  @ApiPropertyOptional({ enum: PRODUCT_SORT_OPTIONS, default: 'newest' })
  @IsOptional()
  @IsIn(PRODUCT_SORT_OPTIONS, { message: 'ترتیب نمایش مقدار انتخابی در آن مجاز نیست' })
  sort?: ProductSort;
}
