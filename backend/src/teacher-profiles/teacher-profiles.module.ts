import { Module } from '@nestjs/common';
import { TeacherProfilesService } from './teacher-profiles.service';
import { TeacherProfilesController } from './teacher-profiles.controller';

@Module({
  controllers: [TeacherProfilesController],
  providers: [TeacherProfilesService],
})
export class TeacherProfilesModule {}
