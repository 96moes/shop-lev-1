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
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Inclusive minimum price.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Inclusive maximum price.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: PRODUCT_SORT_OPTIONS, default: 'newest' })
  @IsOptional()
  @IsIn(PRODUCT_SORT_OPTIONS)
  sort?: ProductSort;
}
