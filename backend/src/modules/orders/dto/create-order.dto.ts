import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Delivery address supplied at checkout, copied onto the order as a snapshot. */
export class ShippingAddressDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString({ message: 'نام گیرنده باید متن باشد' })
  @MinLength(1, { message: 'نام گیرنده کوتاه‌تر از حد مجاز است' })
  @MaxLength(100, { message: 'نام گیرنده بلندتر از حد مجاز است' })
  fullName: string;

  @ApiPropertyOptional({ example: '+1 555 0100' })
  @IsOptional()
  @IsString({ message: 'شماره تماس باید متن باشد' })
  @MaxLength(50, { message: 'شماره تماس بلندتر از حد مجاز است' })
  phone?: string;

  @ApiProperty({ example: '12 Analytical Engine Way' })
  @IsString({ message: 'نشانی باید متن باشد' })
  @MinLength(1, { message: 'نشانی کوتاه‌تر از حد مجاز است' })
  @MaxLength(255, { message: 'نشانی بلندتر از حد مجاز است' })
  line1: string;

  @ApiPropertyOptional({ example: 'Apt 4' })
  @IsOptional()
  @IsString({ message: 'نشانی تکمیلی باید متن باشد' })
  @MaxLength(255, { message: 'نشانی تکمیلی بلندتر از حد مجاز است' })
  line2?: string;

  @ApiProperty({ example: 'London' })
  @IsString({ message: 'شهر باید متن باشد' })
  @MinLength(1, { message: 'شهر کوتاه‌تر از حد مجاز است' })
  @MaxLength(120, { message: 'شهر بلندتر از حد مجاز است' })
  city: string;

  @ApiPropertyOptional({ example: 'Greater London' })
  @IsOptional()
  @IsString({ message: 'استان باید متن باشد' })
  @MaxLength(120, { message: 'استان بلندتر از حد مجاز است' })
  state?: string;

  @ApiPropertyOptional({ example: 'EC1A' })
  @IsOptional()
  @IsString({ message: 'کد پستی باید متن باشد' })
  @MaxLength(30, { message: 'کد پستی بلندتر از حد مجاز است' })
  postalCode?: string;

  @ApiPropertyOptional({ example: 'US', default: 'US' })
  @IsOptional()
  @IsString({ message: 'کشور باید متن باشد' })
  @Length(2, 2)
  country?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({ example: 'WELCOME10' })
  @IsOptional()
  @IsString({ message: 'کد تخفیف باید متن باشد' })
  @MaxLength(50, { message: 'کد تخفیف بلندتر از حد مجاز است' })
  couponCode?: string;

  @ApiPropertyOptional({ example: 'Leave with the concierge.' })
  @IsOptional()
  @IsString({ message: 'توضیحات سفارش باید متن باشد' })
  @MaxLength(1000, { message: 'توضیحات سفارش بلندتر از حد مجاز است' })
  notes?: string;
}
