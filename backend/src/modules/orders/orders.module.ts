import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../../database/entities/cart.entity.js';
import { CartItem } from '../../database/entities/cart-item.entity.js';
import { Coupon } from '../../database/entities/coupon.entity.js';
import { Order } from '../../database/entities/order.entity.js';
import { OrderItem } from '../../database/entities/order-item.entity.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Cart, CartItem, Coupon]),
    CouponsModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
