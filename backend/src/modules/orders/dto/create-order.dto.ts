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
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({ example: '+1 555 0100' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ example: '12 Analytical Engine Way' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  line1: string;

  @ApiPropertyOptional({ example: 'Apt 4' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @ApiProperty({ example: 'London' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city: string;

  @ApiPropertyOptional({ example: 'Greater London' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiPropertyOptional({ example: 'EC1A' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'US', default: 'US' })
  @IsOptional()
  @IsString()
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
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @ApiPropertyOptional({ example: 'Leave with the concierge.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
