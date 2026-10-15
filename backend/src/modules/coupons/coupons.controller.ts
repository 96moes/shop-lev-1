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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Coupon, UserRole } from '../../database/entities/index.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CouponsService } from './coupons.service.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';
import { ValidateCouponDto } from './dto/validate-coupon.dto.js';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check whether a coupon applies to an order subtotal.',
  })
  async validate(@Body() dto: ValidateCouponDto) {
    const result = await this.couponsService.evaluateCode(dto.code, dto.subtotal);

    return {
      valid: result.valid,
      reason: result.reason,
      discount: result.discount,
      code: result.coupon?.code ?? dto.code.toUpperCase(),
      description: result.coupon?.description ?? null,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List coupons (admin only).' })
  findAll(): Promise<Coupon[]> {
    return this.couponsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a coupon (admin only).' })
  create(@Body() dto: CreateCouponDto): Promise<Coupon> {
    return this.couponsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a coupon (admin only).' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ): Promise<Coupon> {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a coupon (admin only).' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.couponsService.remove(id);
  }
}
