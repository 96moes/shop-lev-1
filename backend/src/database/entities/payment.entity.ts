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

export enum PaymentMethod {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  COD = 'cod',
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne('Order', 'payments', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Relation<Order>;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Index()
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: string;

  /** Store currency: Iranian Rial. */
  @Column({ type: 'varchar', length: 10, default: 'IRR' })
  currency: string;

  /** Provider-side identifier (Stripe PaymentIntent, PayPal capture, ...). */
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionId: string | null;

  /** Raw provider payload kept for auditing and support. */
  @Column({ type: 'jsonb', nullable: true })
  providerPayload: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
