import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findMine(
    @Req() req: any,
  ) {
    return this.notificationService.findMine(
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  countUnread(
    @Req() req: any,
  ) {
    return this.notificationService.countUnread(
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markAsRead(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.notificationService.markAsRead(
      req.user.userId,
      id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  markAllAsRead(
    @Req() req: any,
  ) {
    return this.notificationService.markAllAsRead(
      req.user.userId,
    );
  }
}