import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Lighting' })
  @IsString({ message: 'نام محصول باید متن باشد' })
  @MinLength(2, { message: 'نام محصول کوتاه‌تر از حد مجاز است' })
  @MaxLength(120, { message: 'نام محصول بلندتر از حد مجاز است' })
  name: string;

  @ApiPropertyOptional({
    description: 'Defaults to a slug derived from the name.',
    example: 'lighting',
  })
  @IsOptional()
  @IsString({ message: 'نامک باید متن باشد' })
  @MaxLength(140, { message: 'نامک بلندتر از حد مجاز است' })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'توضیحات باید متن باشد' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/lighting.jpg' })
  @IsOptional()
  @IsString({ message: 'نشانی تصویر باید متن باشد' })
  @MaxLength(500, { message: 'نشانی تصویر بلندتر از حد مجاز است' })
  imageUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعال بودن باید درست یا غلط باشد' })
  isActive?: boolean;
}
