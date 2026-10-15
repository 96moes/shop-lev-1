import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Checks whether a coupon applies to a prospective order total. */
export class ValidateCouponDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Order subtotal to evaluate against.', example: 120 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ description: 'Ignored; reserved for future rules.' })
  @IsOptional()
  @IsString()
  userId?: string;
}
