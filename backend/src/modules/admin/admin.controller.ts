import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../database/entities/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdminService } from './admin.service.js';
import { DashboardStatsDto } from './dto/dashboard-stats.dto.js';
import { QueryProductsDto } from '../products/dto/query-products.dto.js';
import { UpdateAdminOrderStatusDto } from './dto/update-admin-order-status.dto.js';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Reporting dashboard figures (admin only).' })
  stats(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }

  @Get('customers')
  @ApiOperation({ summary: 'List customer accounts (admin only).' })
  customers() {
    return this.adminService.listCustomers();
  }

  @Get('products')
  @ApiOperation({ summary: 'List products, including inactive catalog entries (admin only).' })
  products(@Query() query: QueryProductsDto) {
    return this.adminService.listProducts(query);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List recent orders for administration (admin only).' })
  orders() {
    return this.adminService.listOrders();
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Advance or cancel an order (admin only).' })
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto);
  }
}
