import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ReadingController } from './reading.controller';
import { ReadingService } from './reading.service';

@Module({
  controllers: [ReadingController],
  providers: [ReadingService, PrismaService],
})
export class ReadingModule {}
