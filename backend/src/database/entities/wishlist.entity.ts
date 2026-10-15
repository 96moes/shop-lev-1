import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import type { User } from './user.entity.js';
import type { Product } from './product.entity.js';

/** A customer may save a given product once. */
@Entity('wishlists')
@Unique('UQ_wishlists_user_product', ['userId', 'productId'])
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne('User', 'wishlists', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne('Product', 'wishlists', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Relation<Product>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
