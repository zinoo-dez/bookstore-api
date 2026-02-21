import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'List current user notifications' })
  listMyNotifications(
    @Request() req: { user: { sub: string } },
    @Query() dto: ListNotificationsDto,
  ) {
    return this.notificationsService.listForUser(req.user.sub, dto);
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'Get unread notifications count for current user' })
  unreadCount(@Request() req: { user: { sub: string } }) {
    return this.notificationsService.getUnreadCount(req.user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.sub, id);
  }

  @Patch('me/read-all')
  @ApiOperation({ summary: 'Mark all current user notifications as read' })
  markAllRead(@Request() req: { user: { sub: string } }) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  remove(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.notificationsService.remove(req.user.sub, id);
  }

  @Post('announcements')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Broadcast announcement to all users (admin)' })
  announce(@Body() dto: CreateAnnouncementDto) {
    return this.notificationsService.createAnnouncementForAllUsers(dto);
  }
}
