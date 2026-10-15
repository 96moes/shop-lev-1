import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity.js';
import { OrderItem } from '../../database/entities/order-item.entity.js';
import { Product } from '../../database/entities/product.entity.js';
import { User } from '../../database/entities/user.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ProductsModule } from '../products/products.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, User]),
    NotificationsModule,
    ProductsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
