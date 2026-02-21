import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService, PrismaService],
})
export class LibraryModule {}
