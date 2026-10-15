import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../database/entities/order.entity.js';
import { OrderItem } from '../../database/entities/order-item.entity.js';
import { Product } from '../../database/entities/product.entity.js';
import { User, UserRole } from '../../database/entities/user.entity.js';
import { PUBLIC_USER_SELECT } from '../../common/public-select.js';
import type { DashboardStatsDto } from './dto/dashboard-stats.dto.js';

/** Below this stock level a product is surfaced as needing attention. */
const LOW_STOCK_THRESHOLD = 5;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Reporting queries for the admin dashboard.
 *
 * Aggregation is done in SQL rather than by loading rows into memory, so the
 * dashboard stays fast as the store grows.
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [
      orderTotals,
      totalCustomers,
      totalProducts,
      pendingOrders,
      ordersByStatus,
      topProducts,
      salesByDay,
      lowStock,
    ] = await Promise.all([
      this.orderTotals(),
      this.usersRepository.count({ where: { role: UserRole.CUSTOMER } }),
      this.productsRepository.count(),
      this.ordersRepository.count({ where: { status: OrderStatus.PENDING } }),
      this.ordersByStatus(),
      this.topProducts(),
      this.salesByDay(14),
      this.lowStock(),
    ]);

    const { totalRevenue, totalOrders } = orderTotals;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue:
        totalOrders > 0 ? round2(totalRevenue / totalOrders) : 0,
      totalCustomers,
      totalProducts,
      pendingOrders,
      ordersByStatus,
      topProducts,
      salesByDay,
      lowStock,
    };
  }

  /**
   * Revenue counts orders that were actually paid for, so unpaid carts and
   * cancelled orders do not inflate the figure.
   */
  private async orderTotals(): Promise<{
    totalRevenue: number;
    totalOrders: number;
  }> {
    const row = await this.ordersRepository
      .createQueryBuilder('order')
      .select('COUNT(*)', 'totalOrders')
      .addSelect(
        `COALESCE(SUM(CASE WHEN "order"."status" IN (:...paid) THEN "order"."total" ELSE 0 END), 0)`,
        'totalRevenue',
      )
      .setParameter('paid', [
        OrderStatus.PAID,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
      ])
      .getRawOne<{ totalOrders: string; totalRevenue: string }>();

    return {
      totalOrders: Number(row?.totalOrders ?? 0),
      totalRevenue: round2(Number(row?.totalRevenue ?? 0)),
    };
  }

  private async ordersByStatus(): Promise<Record<string, number>> {
    const rows = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany<{ status: string; count: string }>();

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = Number(row.count);
    }
    return result;
  }

  /** Best sellers by units, with revenue from the captured line prices. */
  private async topProducts(): Promise<
    { productId: string; name: string; unitsSold: number; revenue: number }[]
  > {
    const rows = await this.orderItemsRepository
      .createQueryBuilder('item')
      .select('item.productId', 'productId')
      .addSelect('item.productName', 'name')
      .addSelect('SUM(item.quantity)', 'unitsSold')
      .addSelect('SUM(item.lineTotal)', 'revenue')
      .innerJoin('item.order', 'order')
      .where('order.status IN (:...paid)', {
        paid: [
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
        ],
      })
      .andWhere('item.productId IS NOT NULL')
      .groupBy('item.productId')
      .addGroupBy('item.productName')
      .orderBy('"unitsSold"', 'DESC')
      .limit(5)
      .getRawMany<{
        productId: string;
        name: string;
        unitsSold: string;
        revenue: string;
      }>();

    return rows.map((row) => ({
      productId: row.productId,
      name: row.name,
      unitsSold: Number(row.unitsSold),
      revenue: round2(Number(row.revenue)),
    }));
  }

  /** Orders and revenue per day, including days with no orders. */
  private async salesByDay(
    days: number,
  ): Promise<{ date: string; orders: number; revenue: number }[]> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const rows = await this.ordersRepository
      .createQueryBuilder('order')
      .select(`TO_CHAR("order"."createdAt", 'YYYY-MM-DD')`, 'date')
      .addSelect('COUNT(*)', 'orders')
      .addSelect('COALESCE(SUM("order"."total"), 0)', 'revenue')
      .where('"order"."createdAt" >= :since', { since })
      .groupBy(`TO_CHAR("order"."createdAt", 'YYYY-MM-DD')`)
      .getRawMany<{ date: string; orders: string; revenue: string }>();

    const byDate = new Map(
      rows.map((row) => [
        row.date,
        { orders: Number(row.orders), revenue: round2(Number(row.revenue)) },
      ]),
    );

    // Fill gaps so the chart has a continuous axis.
    const series: { date: string; orders: number; revenue: number }[] = [];
    for (let i = 0; i < days; i++) {
      const day = new Date(since);
      day.setDate(since.getDate() + i);
      const key = day.toISOString().slice(0, 10);
      series.push({
        date: key,
        orders: byDate.get(key)?.orders ?? 0,
        revenue: byDate.get(key)?.revenue ?? 0,
      });
    }

    return series;
  }

  private async lowStock(): Promise<
    { id: string; name: string; stock: number }[]
  > {
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .select(['product.id', 'product.name', 'product.stock'])
      .where('product.stock <= :threshold', { threshold: LOW_STOCK_THRESHOLD })
      .andWhere('product.isActive = true')
      .orderBy('product.stock', 'ASC')
      .limit(10)
      .getMany();

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
    }));
  }

  /**
   * Customer accounts, newest first, for the admin list.
   *
   * Selects public columns explicitly: returning the entity would serialise the
   * bcrypt password hash to the client.
   */
  listCustomers(): Promise<User[]> {
    return this.usersRepository.find({
      select: PUBLIC_USER_SELECT,
      where: { role: UserRole.CUSTOMER },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
