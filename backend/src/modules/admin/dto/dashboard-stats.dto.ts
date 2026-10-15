import { ApiProperty } from '@nestjs/swagger';

export class TopProductDto {
  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ example: 'Aurora Desk Lamp' })
  name: string;

  @ApiProperty({ description: 'Total units sold.' })
  unitsSold: number;

  @ApiProperty({ description: 'Revenue from this product, to 2 decimals.' })
  revenue: number;
}

export class DailySalesDto {
  @ApiProperty({ example: '2026-10-15' })
  date: string;

  @ApiProperty()
  orders: number;

  @ApiProperty()
  revenue: number;
}

export class LowStockProductDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  stock: number;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Revenue from orders that were paid or delivered.' })
  totalRevenue: number;

  @ApiProperty({ description: 'Number of orders placed.' })
  totalOrders: number;

  @ApiProperty({ description: 'Average order value, to 2 decimals.' })
  averageOrderValue: number;

  @ApiProperty()
  totalCustomers: number;

  @ApiProperty()
  totalProducts: number;

  @ApiProperty()
  pendingOrders: number;

  @ApiProperty({ type: [TopProductDto] })
  topProducts: TopProductDto[];

  @ApiProperty({ type: [DailySalesDto], description: 'Last 14 days.' })
  salesByDay: DailySalesDto[];

  @ApiProperty({ type: [LowStockProductDto], description: 'At or below the threshold.' })
  lowStock: LowStockProductDto[];

  @ApiProperty({ description: 'Orders grouped by status.' })
  ordersByStatus: Record<string, number>;
}
