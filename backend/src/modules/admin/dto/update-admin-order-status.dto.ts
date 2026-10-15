import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../../database/entities/order.entity.js';

export enum AdminOrderStatus {
  PROCESSING = OrderStatus.PROCESSING,
  SHIPPED = OrderStatus.SHIPPED,
  DELIVERED = OrderStatus.DELIVERED,
  CANCELLED = OrderStatus.CANCELLED,
}

export class UpdateAdminOrderStatusDto {
  @ApiProperty({ enum: AdminOrderStatus })
  @IsEnum(AdminOrderStatus, { message: 'مقدار وارد‌شده معتبر نیست' })
  status: OrderStatus;
}
