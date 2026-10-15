import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { User } from './user.entity.js';

export enum NotificationType {
  ORDER = 'order',
  PAYMENT = 'payment',
  PROMOTION = 'promotion',
  ACCOUNT = 'account',
  SYSTEM = 'system',
}

/**
 * In-app message for a customer or admin.
 *
 * Notifications are recorded when something happens (an order is placed, a
 * payment settles) and surfaced through the API; read state is tracked per row.
 */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne('User', 'notifications', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  /** Optional link the UI can navigate to, e.g. `/orders/<id>`. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  link: string | null;

  /** Free-form extra data (order id, payment id, ...). */
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
