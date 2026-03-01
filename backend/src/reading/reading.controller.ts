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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReadingStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReadingService } from './reading.service';
import { CreateReadingItemDto } from './dto/create-reading-item.dto';
import { UpdateReadingStatusDto } from './dto/update-reading-status.dto';
import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';
import { UpdateReadingGoalDto } from './dto/update-reading-goal.dto';
import { CreateReadingSessionDto } from './dto/create-reading-session.dto';
import { UpdateReadingSessionDto } from './dto/update-reading-session.dto';
import { UpdateEbookProgressDto } from './dto/update-ebook-progress.dto';
import { CreateEbookBookmarkDto } from './dto/create-ebook-bookmark.dto';
import { CreateEbookNoteDto } from './dto/create-ebook-note.dto';
import { UpdateEbookNoteDto } from './dto/update-ebook-note.dto';
import { CreateEbookHighlightDto } from './dto/create-ebook-highlight.dto';

type AuthenticatedRequest = {
  user: {
    sub: string;
  };
};

@ApiTags('reading')
@Controller('reading')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user tracked books' })
  @ApiQuery({ name: 'status', required: false, enum: ReadingStatus })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Tracked books retrieved successfully',
  })
  getMyBooks(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: ReadingStatus,
    @Query('bookId') bookId?: string,
  ) {
    return this.readingService.getMyBooks(req.user.sub, status, bookId);
  }

  @Get('ebooks')
  @ApiOperation({ summary: 'Get eBooks unlocked for current user' })
  @ApiResponse({
    status: 200,
    description: 'Unlocked eBooks retrieved successfully',
  })
  getMyEbooks(@Request() req: AuthenticatedRequest) {
    return this.readingService.getMyEbooks(req.user.sub);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get current user reading sessions' })
  @ApiQuery({
    name: 'month',
    required: false,
    type: String,
    description: 'YYYY-MM',
  })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Reading sessions retrieved successfully',
  })
  getMySessions(
    @Request() req: AuthenticatedRequest,
    @Query('month') month?: string,
    @Query('bookId') bookId?: string,
  ) {
    return this.readingService.getMySessions(req.user.sub, month, bookId);
  }

  @Post(':bookId')
  @ApiOperation({ summary: 'Track a book in My Books' })
  @ApiResponse({
    status: 201,
    description: 'Book tracking created/updated successfully',
  })
  addBook(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @Body() dto: CreateReadingItemDto,
  ) {
    return this.readingService.addBook(req.user.sub, bookId, dto);
  }

  @Post(':bookId/sessions')
  @ApiOperation({
    summary: 'Create a reading session for a tracked or existing book',
  })
  @ApiResponse({
    status: 201,
    description: 'Reading session created successfully',
  })
  addSession(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @Body() dto: CreateReadingSessionDto,
  ) {
    return this.readingService.addSession(req.user.sub, bookId, dto);
  }

  @Patch('sessions/:sessionId')
  @ApiOperation({ summary: 'Update an existing reading session' })
  @ApiResponse({
    status: 200,
    description: 'Reading session updated successfully',
  })
  updateSession(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateReadingSessionDto,
  ) {
    return this.readingService.updateSession(req.user.sub, sessionId, dto);
  }

  @Patch(':bookId/status')
  @ApiOperation({ summary: 'Update reading status for a tracked book' })
  @ApiResponse({
    status: 200,
    description: 'Reading status updated successfully',
  })
  updateStatus(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @Body() dto: UpdateReadingStatusDto,
  ) {
    return this.readingService.updateStatus(req.user.sub, bookId, dto);
  }

  @Patch(':bookId/progress')
  @ApiOperation({ summary: 'Update reading progress for a tracked book' })
  @ApiResponse({
    status: 200,
    description: 'Reading progress updated successfully',
  })
  updateProgress(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @Body() dto: UpdateReadingProgressDto,
  ) {
    return this.readingService.updateProgress(req.user.sub, bookId, dto);
  }

  @Patch(':bookId/goal')
  @ApiOperation({
    summary: 'Set daily reading goal (pages/day) for a tracked book',
  })
  @ApiResponse({ status: 200, description: 'Daily goal updated successfully' })
  updateDailyGoal(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @Body() dto: UpdateReadingGoalDto,
  ) {
    return this.readingService.updateDailyGoal(req.user.sub, bookId, dto);
  }

  @Delete(':bookId')
  @ApiOperation({ summary: 'Remove a tracked book from My Books' })
  @ApiResponse({
    status: 200,
    description: 'Tracked book removed successfully',
  })
  removeBook(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
  ) {
    return this.readingService.removeBook(req.user.sub, bookId);
  }

  @Get('ebook/:bookId/open')
  @ApiOperation({
    summary: 'Get short-lived secure access for a purchased eBook',
  })
  @ApiResponse({
    status: 200,
    description: 'Signed access token issued successfully',
  })
  openEbook(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
  ) {
    return this.readingService.openEbook(req.user.sub, bookId);
  }

  @Get('ebook/:bookId/state')
  @ApiOperation({
    summary:
      'Get reader state (progress, bookmarks, notes, highlights) for a purchased eBook',
  })
  getEbookState(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
  ) {
    return this.readingService.getEbookState(req.user.sub, bookId);
  }

  @Patch('ebook/:bookId/progress')
  @ApiOperation({ summary: 'Update eBook progress for the current user' })
  updateEbookProgress(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @Body() dto: UpdateEbookProgressDto,
  ) {
    return this.readingService.updateEbookProgress(req.user.sub, bookId, dto);
  }

  @Post('ebook/:bookId/bookmarks')
  @ApiOperation({ summary: 'Create bookmark in eBook reader' })
  createEbookBookmark(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @Body() dto: CreateEbookBookmarkDto,
  ) {
    return this.readingService.createEbookBookmark(req.user.sub, bookId, dto);
  }

  @Delete('ebook/bookmarks/:bookmarkId')
  @ApiOperation({ summary: 'Delete bookmark in eBook reader' })
  deleteEbookBookmark(
    @Request() req: AuthenticatedRequest,
    @Param('bookmarkId') bookmarkId: string,
  ) {
    return this.readingService.deleteEbookBookmark(req.user.sub, bookmarkId);
  }

  @Post('ebook/:bookId/notes')
  @ApiOperation({ summary: 'Create note in eBook reader' })
  createEbookNote(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @Body() dto: CreateEbookNoteDto,
  ) {
    return this.readingService.createEbookNote(req.user.sub, bookId, dto);
  }

  @Patch('ebook/notes/:noteId')
  @ApiOperation({ summary: 'Update note in eBook reader' })
  updateEbookNote(
    @Request() req: AuthenticatedRequest,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateEbookNoteDto,
  ) {
    return this.readingService.updateEbookNote(req.user.sub, noteId, dto);
  }

  @Delete('ebook/notes/:noteId')
  @ApiOperation({ summary: 'Delete note in eBook reader' })
  deleteEbookNote(
    @Request() req: AuthenticatedRequest,
    @Param('noteId') noteId: string,
  ) {
    return this.readingService.deleteEbookNote(req.user.sub, noteId);
  }

  @Post('ebook/:bookId/highlights')
  @ApiOperation({ summary: 'Create highlight in eBook reader' })
  createEbookHighlight(
    @Request() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @Body() dto: CreateEbookHighlightDto,
  ) {
    return this.readingService.createEbookHighlight(req.user.sub, bookId, dto);
  }

  @Delete('ebook/highlights/:highlightId')
  @ApiOperation({ summary: 'Delete highlight in eBook reader' })
  deleteEbookHighlight(
    @Request() req: AuthenticatedRequest,
    @Param('highlightId') highlightId: string,
  ) {
    return this.readingService.deleteEbookHighlight(req.user.sub, highlightId);
  }
}
