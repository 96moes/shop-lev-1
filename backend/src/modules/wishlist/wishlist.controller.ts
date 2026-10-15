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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Wishlist } from '../../database/entities/wishlist.entity.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.types.js';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto.js';
import { WishlistService } from './wishlist.service.js';

@ApiTags('wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'List your saved products.' })
  list(@CurrentUser() user: AuthUser): Promise<Wishlist[]> {
    return this.wishlistService.listForUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a product to your wishlist.' })
  add(
    @CurrentUser() user: AuthUser,
    @Body() dto: AddWishlistItemDto,
  ): Promise<Wishlist> {
    return this.wishlistService.add(user.id, dto.productId);
  }

  @Delete('product/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product from your wishlist.' })
  async removeByProduct(
    @CurrentUser() user: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    await this.wishlistService.removeByProduct(user.id, productId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a wishlist entry by id.' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.wishlistService.remove(user.id, id);
  }
}
