import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import type { Category } from './category.entity.js';
import type { ProductImage } from './product-image.entity.js';
import type { CartItem } from './cart-item.entity.js';
import type { OrderItem } from './order-item.entity.js';
import type { Review } from './review.entity.js';
import type { Wishlist } from './wishlist.entity.js';

/**
 * Relation targets are given as strings and related types are imported with
 * `import type`, so no runtime import cycle exists between entities (Node's ESM
 * loader rejects those with "Cannot access X before initialization").
 */
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 220 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Stored in the major currency unit (USD). */
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: string;

  /** Optional "was" price, used to display discounts. */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  compareAtPrice: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ type: 'integer', default: 0 })
  stock: number;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne('Category', 'products', {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Relation<Category> | null;

  @OneToMany('ProductImage', 'product')
  images: Relation<ProductImage[]>;

  @OneToMany('CartItem', 'product')
  cartItems: Relation<CartItem[]>;

  @OneToMany('OrderItem', 'product')
  orderItems: Relation<OrderItem[]>;

  @OneToMany('Review', 'product')
  reviews: Relation<Review[]>;

  @OneToMany('Wishlist', 'product')
  wishlists: Relation<Wishlist[]>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
