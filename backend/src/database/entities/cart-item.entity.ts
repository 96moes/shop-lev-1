import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import type { Cart } from './cart.entity.js';
import type { Product } from './product.entity.js';

/** A product may appear only once per cart; quantity carries the count. */
@Entity('cart_items')
@Unique('UQ_cart_items_cart_product', ['cartId', 'productId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  cartId: string;

  @ManyToOne('Cart', 'items', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cartId' })
  cart: Relation<Cart>;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne('Product', 'cartItems', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Relation<Product>;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  /** Price captured when the item was added, for change detection. */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  unitPrice: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
