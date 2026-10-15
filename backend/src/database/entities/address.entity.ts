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
import type { Order } from './order.entity.js';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255 })
  line1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  line2: string | null;

  @Column({ type: 'varchar', length: 120 })
  city: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  postalCode: string | null;

  /** ISO 3166-1 alpha-2 code. */
  @Column({ type: 'varchar', length: 2, default: 'US' })
  country: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne('User', 'addresses', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @OneToMany('Order', 'shippingAddress')
  orders: Relation<Order[]>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
