import { Injectable } from '@nestjs/common';

import { NotificationType } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    linkUrl?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl,
      },
    });
  }

  async findMine(userId: string) {
    const notifications =
      await this.prisma.notification.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

    return this.alertService.success(
      'Notificações encontradas.',
      notifications,
    );
  }

  async countUnread(userId: string) {
    const total = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return this.alertService.success(
      'Total de notificações não lidas.',
      {
        total,
      },
    );
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification =
      await this.prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
        },
      });

    return this.alertService.success(
      'Notificação marcada como lida.',
      notification,
    );
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return this.alertService.success(
      'Todas as notificações foram marcadas como lidas.',
    );
  }
}