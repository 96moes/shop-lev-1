import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @Type(() => Number)
  @IsInt({ message: 'امتیاز باید یک عدد صحیح باشد' })
  @Min(1, { message: 'امتیاز کمتر از حد مجاز است' })
  @Max(5, { message: 'امتیاز بیشتر از حد مجاز است' })
  rating: number;

  @ApiPropertyOptional({ example: 'Solid build' })
  @IsOptional()
  @IsString({ message: 'عنوان باید متن باشد' })
  @MaxLength(200, { message: 'عنوان بلندتر از حد مجاز است' })
  title?: string;

  @ApiPropertyOptional({ example: 'Arrived quickly and feels sturdy.' })
  @IsOptional()
  @IsString({ message: 'متن دیدگاه باید متن باشد' })
  @MaxLength(2000, { message: 'متن دیدگاه بلندتر از حد مجاز است' })
  comment?: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'امتیاز باید یک عدد صحیح باشد' })
  @Min(1, { message: 'امتیاز کمتر از حد مجاز است' })
  @Max(5, { message: 'امتیاز بیشتر از حد مجاز است' })
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'عنوان باید متن باشد' })
  @MaxLength(200, { message: 'عنوان بلندتر از حد مجاز است' })
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'متن دیدگاه باید متن باشد' })
  @MaxLength(2000, { message: 'متن دیدگاه بلندتر از حد مجاز است' })
  comment?: string;
}
