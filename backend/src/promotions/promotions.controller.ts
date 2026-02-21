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
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ListPromotionsDto } from './dto/list-promotions.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionsService } from './promotions.service';

type AuthenticatedRequest = {
  user: {
    sub: string;
  };
};

@ApiTags('admin-promotions')
@Controller('admin/promotions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'List promotions' })
  list(
    @Request() req: AuthenticatedRequest,
    @Query() query: ListPromotionsDto,
  ) {
    return this.promotionsService.list(req.user.sub, query.activeOnly);
  }

  @Post()
  @Permissions('finance.payout.manage')
  @ApiOperation({ summary: 'Create promotion' })
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.promotionsService.create(req.user.sub, dto);
  }

  @Patch(':id')
  @Permissions('finance.payout.manage')
  @ApiOperation({ summary: 'Update promotion' })
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @Permissions('finance.payout.manage')
  @ApiOperation({ summary: 'Delete promotion' })
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.promotionsService.remove(req.user.sub, id);
  }
}
