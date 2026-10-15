import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import type { Product } from './product.entity.js';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  altText: string | null;

  /** Display order within a product's gallery. */
  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne('Product', 'images', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Relation<Product>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
