import { ApiProperty } from '@nestjs/swagger';
import {
  PaymentMethod,
  PaymentStatus,
} from '../../../database/entities/payment.entity.js';

export class PaymentResultDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  orderId: string;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ example: '76.50' })
  amount: string;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ nullable: true })
  transactionId: string | null;

  @ApiProperty({ description: 'Human-readable outcome for the client.' })
  message: string;
}
