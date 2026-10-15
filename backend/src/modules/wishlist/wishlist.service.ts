import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity.js';
import { Wishlist } from '../../database/entities/wishlist.entity.js';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  /** The caller's saved products, most recent first. */
  listForUser(userId: string): Promise<Wishlist[]> {
    return this.wishlistRepository.find({
      where: { userId },
      relations: { product: { images: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async add(userId: string, productId: string): Promise<Wishlist> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }

    const existing = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });
    if (existing) {
      throw new ConflictException('این محصول از قبل در فهرست علاقه‌مندی‌های شماست');
    }

    const entry = await this.wishlistRepository.save(
      this.wishlistRepository.create({ userId, productId }),
    );

    return this.findOneOwned(userId, entry.id);
  }

  /** Removes a saved product by product id (the UI knows the product, not the row). */
  async removeByProduct(userId: string, productId: string): Promise<void> {
    const entry = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });
    if (!entry) {
      throw new NotFoundException('این محصول در فهرست علاقه‌مندی‌های شما نیست');
    }
    await this.wishlistRepository.remove(entry);
  }

  async remove(userId: string, id: string): Promise<void> {
    const entry = await this.findOneOwned(userId, id);
    await this.wishlistRepository.remove(entry);
  }

  async isSaved(userId: string, productId: string): Promise<boolean> {
    const count = await this.wishlistRepository.count({
      where: { userId, productId },
    });
    return count > 0;
  }

  /** Scoped lookup so one customer cannot delete another's entry. */
  private async findOneOwned(userId: string, id: string): Promise<Wishlist> {
    const entry = await this.wishlistRepository.findOne({
      where: { id, userId },
      relations: { product: { images: true } },
    });
    if (!entry) {
      throw new NotFoundException('قلم علاقه‌مندی یافت نشد');
    }
    return entry;
  }
}
