import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@ApiTags('contact')
@Controller('api/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Create contact message' })
  @ApiResponse({ status: 201, description: 'Contact message created' })
  create(@Body() dto: CreateContactDto) {
    return this.contactService.createMessage(dto);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('support.messages.view')
  @ApiOperation({ summary: 'List contact notifications (testing)' })
  list(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 10;
    return this.contactService.listNotifications(parsed);
  }
}
