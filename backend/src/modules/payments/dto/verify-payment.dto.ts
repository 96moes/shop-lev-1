import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaymentMethod } from '../../../database/entities/payment.entity.js';

export class VerifyPaymentDto {
  @ApiProperty({ format: 'uuid', description: 'Order being paid for.' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.COD })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({
    description:
      'Stripe PaymentIntent id, or PayPal order id. Not used for COD.',
    example: 'pi_3Abc123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Stripe client secret, when the client needs it confirmed.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  clientSecret?: string;
}
