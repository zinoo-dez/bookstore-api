import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { ReadingController } from './reading.controller';
import { ReadingAssetsController } from './reading-assets.controller';
import { ReadingService } from './reading.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET')!,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ReadingController, ReadingAssetsController],
  providers: [ReadingService, PrismaService],
})
export class ReadingModule {}
