import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UploadController } from './upload.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController, UploadController],
})
export class UsersModule {}
