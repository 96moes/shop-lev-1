import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Product, UserRole } from '../../database/entities/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService, type PaginatedProducts } from './products.service.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with search, filtering and paging.' })
  @ApiResponse({ status: 200, description: 'Paginated product list.' })
  findAll(@Query() query: QueryProductsDto): Promise<PaginatedProducts> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single product.' })
  @ApiResponse({ status: 404, description: 'محصول یافت نشد.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product (admin only).' })
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (admin only).' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (admin only).' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.productsService.remove(id);
  }
}
