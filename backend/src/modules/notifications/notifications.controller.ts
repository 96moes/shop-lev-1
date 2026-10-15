import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Notification } from '../../database/entities/notification.entity.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.types.js';
import { QueryNotificationsDto } from './dto/query-notifications.dto.js';
import {
  NotificationsService,
  type NotificationList,
} from './notifications.service.js';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List the caller’s notifications.' })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryNotificationsDto,
  ): Promise<NotificationList> {
    return this.notificationsService.listForUser(user.id, query.unreadOnly);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read.' })
  markRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Notification> {
    return this.notificationsService.markRead(user.id, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read.' })
  markAllRead(@CurrentUser() user: AuthUser): Promise<{ updated: number }> {
    return this.notificationsService.markAllRead(user.id);
  }
}
