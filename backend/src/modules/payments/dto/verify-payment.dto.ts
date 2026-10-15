import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaymentMethod } from '../../../database/entities/payment.entity.js';

export class VerifyPaymentDto {
  @ApiProperty({ format: 'uuid', description: 'Order being paid for.' })
  @IsUUID('all', { message: 'شناسه وارد‌شده معتبر نیست' })
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.COD })
  @IsEnum(PaymentMethod, { message: 'مقدار وارد‌شده معتبر نیست' })
  method: PaymentMethod;

  @ApiPropertyOptional({
    description:
      'Stripe PaymentIntent id, or PayPal order id. Not used for COD.',
    example: 'pi_3Abc123',
  })
  @IsOptional()
  @IsString({ message: 'شناسه تراکنش باید متن باشد' })
  @MaxLength(255, { message: 'شناسه تراکنش بلندتر از حد مجاز است' })
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Stripe client secret, when the client needs it confirmed.',
  })
  @IsOptional()
  @IsString({ message: 'کلید پرداخت باید متن باشد' })
  @MaxLength(500, { message: 'کلید پرداخت بلندتر از حد مجاز است' })
  clientSecret?: string;
}
