import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import type { Order } from './order.entity.js';
import type { Product } from './product.entity.js';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne('Order', 'items', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Relation<Order>;

  /** Nullable so line items survive product deletion (SET NULL). */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne('Product', 'orderItems', {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'productId' })
  product: Relation<Product> | null;

  /** Snapshot of the product name at purchase time. */
  @Column({ type: 'varchar', length: 200 })
  productName: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  unitPrice: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  lineTotal: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
