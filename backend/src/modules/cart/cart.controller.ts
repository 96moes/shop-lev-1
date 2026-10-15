import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CartService, type CartView } from './cart.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: "Get the current customer's cart." })
  getCart(@CurrentUser() user: AuthUser): Promise<CartView> {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a product to the cart.' })
  addItem(
    @CurrentUser() user: AuthUser,
    @Body() dto: AddCartItemDto,
  ): Promise<CartView> {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Change the quantity of a cart item.' })
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartView> {
    return this.cartService.updateItem(user.id, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove an item from the cart.' })
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CartView> {
    return this.cartService.removeItem(user.id, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Remove every item from the cart.' })
  clear(@CurrentUser() user: AuthUser): Promise<CartView> {
    return this.cartService.clear(user.id);
  }
}
