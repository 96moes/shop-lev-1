import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import type { Address } from './address.entity.js';
import type { Cart } from './cart.entity.js';
import type { Notification } from './notification.entity.js';
import type { Order } from './order.entity.js';
import type { Review } from './review.entity.js';
import type { Wishlist } from './wishlist.entity.js';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /** bcrypt hash — never the plain password. */
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * bcrypt hash of the user's current refresh token. Stored (rather than
   * trusting any well-signed refresh token) so a token can be revoked on logout
   * and rotated on each refresh. Never selected by default.
   */
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  refreshTokenHash: string | null;

  /**
   * When the stored refresh token was issued. Used as an optimistic-lock token
   * so a refresh can only be redeemed once, even under concurrent requests.
   * Never selected by default.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  refreshTokenIssuedAt: Date | null;

  @OneToMany('Address', 'user')
  addresses: Relation<Address[]>;

  @OneToMany('Cart', 'user')
  carts: Relation<Cart[]>;

  @OneToMany('Order', 'user')
  orders: Relation<Order[]>;

  @OneToMany('Review', 'user')
  reviews: Relation<Review[]>;

  @OneToMany('Wishlist', 'user')
  wishlists: Relation<Wishlist[]>;

  @OneToMany('Notification', 'user')
  notifications: Relation<Notification[]>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
