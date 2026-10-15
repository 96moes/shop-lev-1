import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity.js';
import { slugify } from '../../common/slugify.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import type { ProductSort, QueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SORT_CLAUSES: Record<ProductSort, [string, 'ASC' | 'DESC']> = {
  newest: ['product.createdAt', 'DESC'],
  price_asc: ['product.price', 'ASC'],
  price_desc: ['product.price', 'DESC'],
  name_asc: ['product.name', 'ASC'],
  name_desc: ['product.name', 'DESC'],
};

/** Formats a numeric price for the `numeric` column. */
function toPriceString(value: number): string {
  return value.toFixed(2);
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  /** Search + filter + paginate the public catalog. */
  async findAll(
    query: QueryProductsDto,
    includeInactive = false,
  ): Promise<PaginatedProducts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images');

    if (!includeInactive) {
      qb.andWhere('product.isActive = true');
    }

    if (query.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    const [sortColumn, sortDirection] = SORT_CLAUSES[query.sort ?? 'newest'];
    qb.orderBy(sortColumn, sortDirection).addOrderBy('images.sortOrder', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: string, includeInactive = false): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true, images: true },
    });
    if (!product || (!includeInactive && !product.isActive)) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = slugify(dto.slug ?? dto.name);
    await this.assertSlugAvailable(slug);

    const product = this.productsRepository.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      price: toPriceString(dto.price),
      compareAtPrice:
        dto.compareAtPrice === undefined
          ? null
          : toPriceString(dto.compareAtPrice),
      sku: dto.sku ?? null,
      stock: dto.stock ?? 0,
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
      categoryId: dto.categoryId ?? null,
    });

    const saved = await this.productsRepository.save(product);
    return this.findById(saved.id, true);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id, true);

    if (dto.slug !== undefined || dto.name !== undefined) {
      const slug = slugify(dto.slug ?? dto.name ?? product.name);
      if (slug !== product.slug) {
        await this.assertSlugAvailable(slug);
        product.slug = slug;
      }
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) {
      product.description = dto.description ?? null;
    }
    if (dto.price !== undefined) product.price = toPriceString(dto.price);
    if (dto.compareAtPrice !== undefined) {
      product.compareAtPrice =
        dto.compareAtPrice === null
          ? null
          : toPriceString(dto.compareAtPrice);
    }
    if (dto.sku !== undefined) product.sku = dto.sku ?? null;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) product.isFeatured = dto.isFeatured;
    if (dto.categoryId !== undefined) {
      product.categoryId = dto.categoryId ?? null;
    }

    await this.productsRepository.save(product);
    return this.findById(id, true);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findById(id, true);
    await this.productsRepository.remove(product);
  }

  private async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.productsRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`A product with slug "${slug}" already exists`);
    }
  }
}
