import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity.js';
import { Review } from '../../database/entities/review.entity.js';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto.js';
import { QueryReviewsDto } from './dto/query-reviews.dto.js';

export interface ProductReviews {
  items: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Mean rating across all reviews for the product, to 1 decimal place. */
  averageRating: number;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  /** Public listing for a product. */
  async listForProduct(
    productId: string,
    query: QueryReviewsDto,
  ): Promise<ProductReviews> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [items, total] = await this.reviewsRepository.findAndCount({
      where: { productId },
      relations: { user: false },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const aggregate = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.productId = :productId', { productId })
      .getRawOne<{ average: string | null }>();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      averageRating: aggregate?.average
        ? Math.round(Number(aggregate.average) * 10) / 10
        : 0,
    };
  }

  async create(userId: string, productId: string, dto: CreateReviewDto): Promise<Review> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.reviewsRepository.findOne({
      where: { userId, productId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    const review = this.reviewsRepository.create({
      userId,
      productId,
      rating: dto.rating,
      title: dto.title ?? null,
      comment: dto.comment ?? null,
    });

    return this.reviewsRepository.save(review);
  }

  /** Updates a review, refusing to touch someone else's. */
  async update(userId: string, id: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.findByIdOwned(userId, id);

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.title !== undefined) review.title = dto.title ?? null;
    if (dto.comment !== undefined) review.comment = dto.comment ?? null;

    return this.reviewsRepository.save(review);
  }

  async remove(userId: string, id: string): Promise<void> {
    const review = await this.findByIdOwned(userId, id);
    await this.reviewsRepository.remove(review);
  }

  /** Admin moderation: hide or restore a review. */
  async setApproved(id: string, isApproved: boolean): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    review.isApproved = isApproved;
    return this.reviewsRepository.save(review);
  }

  /** The caller's own reviews, newest first. */
  listForUser(userId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Loads a review only if it belongs to the user, so ids cannot be guessed to
   * modify someone else's content.
   */
  private async findByIdOwned(userId: string, id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only manage your own reviews');
    }

    return review;
  }
}
