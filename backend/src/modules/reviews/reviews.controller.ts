import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Review, UserRole } from '../../database/entities/index.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto.js';
import { QueryReviewsDto } from './dto/query-reviews.dto.js';
import { ReviewsService, type ProductReviews } from './reviews.service.js';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'List reviews and the average rating for a product.' })
  listForProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: QueryReviewsDto,
  ): Promise<ProductReviews> {
    return this.reviewsService.listForProduct(productId, query);
  }

  @Post('products/:productId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review a product (one review per customer).' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<Review> {
    return this.reviewsService.create(user.id, productId, dto);
  }

  @Get('reviews/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List your own reviews.' })
  listMine(@CurrentUser() user: AuthUser): Promise<Review[]> {
    return this.reviewsService.listForUser(user.id);
  }

  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update one of your reviews.' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<Review> {
    return this.reviewsService.update(user.id, id, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete one of your reviews.' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.reviewsService.remove(user.id, id);
  }

  @Patch('reviews/:id/approval')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or hide a review (admin only).' })
  setApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('approved', ParseBoolPipe) approved: boolean,
  ): Promise<Review> {
    return this.reviewsService.setApproved(id, approved);
  }
}
