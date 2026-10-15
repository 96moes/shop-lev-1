import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import type { Order } from './order.entity.js';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  /** Percentage (0-100) or fixed amount, depending on `discountType`. */
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  discountValue: string;

  /** Order subtotal required before the coupon applies. */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  minOrderAmount: string;

  /** Caps the discount for percentage coupons. */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: string | null;

  /** Null means unlimited redemptions. */
  @Column({ type: 'integer', nullable: true })
  usageLimit: number | null;

  @Column({ type: 'integer', default: 0 })
  usedCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany('Order', 'coupon')
  orders: Relation<Order[]>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
