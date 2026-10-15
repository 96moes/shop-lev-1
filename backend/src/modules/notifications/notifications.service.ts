import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../../database/entities/notification.entity.js';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  data?: Record<string, unknown> | null;
}

export interface NotificationList {
  items: Notification[];
  unreadCount: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  /**
   * Records a notification.
   *
   * Never throws on failure: a notification is a side effect of another action,
   * so a problem here must not fail the action that triggered it.
   */
  async create(input: CreateNotificationInput): Promise<Notification | null> {
    try {
      const notification = this.notificationsRepository.create({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        data: input.data ?? null,
      });
      return await this.notificationsRepository.save(notification);
    } catch {
      return null;
    }
  }

  async listForUser(
    userId: string,
    unreadOnly = false,
  ): Promise<NotificationList> {
    const [items, unreadCount] = await Promise.all([
      this.notificationsRepository.find({
        where: unreadOnly ? { userId, isRead: false } : { userId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.notificationsRepository.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { items, unreadCount };
  }

  /** Marks one notification read, scoped to its owner. */
  async markRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }

    return notification;
  }

  /** Marks every unread notification for the user as read. */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { updated: result.affected ?? 0 };
  }
}
