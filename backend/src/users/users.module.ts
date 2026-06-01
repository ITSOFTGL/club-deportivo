import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersLegacyController } from './users-legacy.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, UsersLegacyController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
