import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { ListInquiriesDto } from './dto/list-inquiries.dto';
import { AddInquiryMessageDto } from './dto/add-inquiry-message.dto';
import { AddInternalNoteDto } from './dto/add-internal-note.dto';
import { AssignInquiryDto } from './dto/assign-inquiry.dto';
import { EscalateInquiryDto } from './dto/escalate-inquiry.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';
import { InquiryOverviewDto } from './dto/inquiry-overview.dto';
import { ListInquiryTemplatesDto } from './dto/list-inquiry-templates.dto';
import { CreateInquiryTemplateDto } from './dto/create-inquiry-template.dto';
import { UpdateInquiryTemplateDto } from './dto/update-inquiry-template.dto';

type AuthenticatedRequest = {
  user: {
    sub: string;
    role?: string;
    permissions?: string[];
  };
};

@ApiTags('inquiries')
@Controller('inquiries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer inquiry' })
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateInquiryDto) {
    return this.inquiriesService.createInquiry(req.user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List inquiries by RBAC + scope' })
  list(@Request() req: AuthenticatedRequest, @Query() dto: ListInquiriesDto) {
    return this.inquiriesService.listInquiries(req.user, dto);
  }

  @Get('overview')
  @ApiOperation({
    summary:
      'Admin overview of inquiry workflow and staff solve performance',
  })
  getOverview(
    @Request() req: AuthenticatedRequest,
    @Query() dto: InquiryOverviewDto,
  ) {
    return this.inquiriesService.getOverview(req.user, dto.days);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List shared inquiry quick-reply templates' })
  listTemplates(
    @Request() req: AuthenticatedRequest,
    @Query() dto: ListInquiryTemplatesDto,
  ) {
    return this.inquiriesService.listQuickReplyTemplates(req.user, dto.type);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create shared inquiry quick-reply template' })
  createTemplate(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateInquiryTemplateDto,
  ) {
    return this.inquiriesService.createQuickReplyTemplate(req.user, dto);
  }

  @Patch('templates/:templateId')
  @ApiOperation({ summary: 'Update shared inquiry quick-reply template' })
  updateTemplate(
    @Request() req: AuthenticatedRequest,
    @Param('templateId') templateId: string,
    @Body() dto: UpdateInquiryTemplateDto,
  ) {
    return this.inquiriesService.updateQuickReplyTemplate(
      req.user,
      templateId,
      dto,
    );
  }

  @Post('templates/:templateId/delete')
  @ApiOperation({ summary: 'Delete shared inquiry quick-reply template' })
  deleteTemplate(
    @Request() req: AuthenticatedRequest,
    @Param('templateId') templateId: string,
  ) {
    return this.inquiriesService.deleteQuickReplyTemplate(req.user, templateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inquiry detail by RBAC + scope' })
  getOne(@Request() req: AuthenticatedRequest, @Param('id') inquiryId: string) {
    return this.inquiriesService.getInquiry(req.user, inquiryId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Append inquiry message' })
  addMessage(
    @Request() req: AuthenticatedRequest,
    @Param('id') inquiryId: string,
    @Body() dto: AddInquiryMessageDto,
  ) {
    return this.inquiriesService.addMessage(req.user, inquiryId, dto);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add internal note (staff only)' })
  addInternalNote(
    @Request() req: AuthenticatedRequest,
    @Param('id') inquiryId: string,
    @Body() dto: AddInternalNoteDto,
  ) {
    return this.inquiriesService.addInternalNote(req.user, inquiryId, dto);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign inquiry to staff profile' })
  assign(
    @Request() req: AuthenticatedRequest,
    @Param('id') inquiryId: string,
    @Body() dto: AssignInquiryDto,
  ) {
    return this.inquiriesService.assignInquiry(req.user, inquiryId, dto);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalate inquiry to another department' })
  escalate(
    @Request() req: AuthenticatedRequest,
    @Param('id') inquiryId: string,
    @Body() dto: EscalateInquiryDto,
  ) {
    return this.inquiriesService.escalateInquiry(req.user, inquiryId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update inquiry status' })
  updateStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id') inquiryId: string,
    @Body() dto: UpdateInquiryStatusDto,
  ) {
    return this.inquiriesService.updateStatus(req.user, inquiryId, dto);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'List inquiry audit log entries' })
  listAudit(
    @Request() req: AuthenticatedRequest,
    @Param('id') inquiryId: string,
  ) {
    return this.inquiriesService.listAudit(req.user, inquiryId);
  }
}
