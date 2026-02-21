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
    @Request() req: any,
    @Query('status') status?: ReadingStatus,
    @Query('bookId') bookId?: string,
  ) {
    return this.readingService.getMyBooks(req.user.sub, status, bookId);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get current user reading sessions' })
  @ApiQuery({ name: 'month', required: false, type: String, description: 'YYYY-MM' })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Reading sessions retrieved successfully',
  })
  getMySessions(
    @Request() req: any,
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
    @Request() req: any,
    @Param('bookId') bookId: string,
    @Body() dto: CreateReadingItemDto,
  ) {
    return this.readingService.addBook(req.user.sub, bookId, dto);
  }

  @Post(':bookId/sessions')
  @ApiOperation({ summary: 'Create a reading session for a tracked or existing book' })
  @ApiResponse({
    status: 201,
    description: 'Reading session created successfully',
  })
  addSession(
    @Request() req: any,
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
    @Request() req: any,
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
    @Request() req: any,
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
    @Request() req: any,
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
    @Request() req: any,
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
  removeBook(@Request() req: any, @Param('bookId') bookId: string) {
    return this.readingService.removeBook(req.user.sub, bookId);
  }
}
