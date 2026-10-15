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
import type { User } from './user.entity.js';
import type { Address } from './address.entity.js';
import type { Coupon } from './coupon.entity.js';
import type { OrderItem } from './order-item.entity.js';
import type { Payment } from './payment.entity.js';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human-readable, unique reference exposed to customers. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  orderNumber: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne('User', 'orders', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Index()
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  /** Sum of line items before discount and shipping. */
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  discount: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  shippingFee: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  tax: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total: string;

  @Column({ type: 'uuid', nullable: true })
  shippingAddressId: string | null;

  @ManyToOne('Address', 'orders', {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'shippingAddressId' })
  shippingAddress: Relation<Address> | null;

  /**
   * Snapshot of the delivery address at purchase time. Stored on the order so a
   * past order still shows where it was sent even if the customer later edits or
   * deletes the saved address.
   */
  @Column({ type: 'varchar', length: 100 })
  shippingFullName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  shippingPhone: string | null;

  @Column({ type: 'varchar', length: 255 })
  shippingLine1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shippingLine2: string | null;

  @Column({ type: 'varchar', length: 120 })
  shippingCity: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  shippingState: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  shippingPostalCode: string | null;

  @Column({ type: 'varchar', length: 2, default: 'US' })
  shippingCountry: string;

  @Column({ type: 'uuid', nullable: true })
  couponId: string | null;

  @ManyToOne('Coupon', 'orders', {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'couponId' })
  coupon: Relation<Coupon> | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  placedAt: Date | null;

  @OneToMany('OrderItem', 'order')
  items: Relation<OrderItem[]>;

  @OneToMany('Payment', 'order')
  payments: Relation<Payment[]>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
