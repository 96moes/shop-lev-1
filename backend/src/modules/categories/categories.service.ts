import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity.js';
import { slugify } from '../../common/slugify.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    await this.assertSlugAvailable(slug);

    const category = this.categoriesRepository.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
    });

    return this.categoriesRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    // Re-derive the slug when the name or slug changes, keeping it unique.
    if (dto.slug !== undefined || dto.name !== undefined) {
      const slug = slugify(dto.slug ?? dto.name ?? category.name);
      if (slug !== category.slug) {
        await this.assertSlugAvailable(slug);
        category.slug = slug;
      }
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) {
      category.description = dto.description ?? null;
    }
    if (dto.imageUrl !== undefined) category.imageUrl = dto.imageUrl ?? null;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findById(id);
    await this.categoriesRepository.remove(category);
  }

  private async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.categoriesRepository.findOne({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`A category with slug "${slug}" already exists`);
    }
  }
}
