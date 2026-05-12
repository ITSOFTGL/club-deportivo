import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TeacherProfilesService } from './teacher-profiles.service';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';

@Controller('teacher-profiles')
export class TeacherProfilesController {
  constructor(private readonly teacherProfilesService: TeacherProfilesService) {}

  @Post()
  create(@Body() createTeacherProfileDto: CreateTeacherProfileDto) {
    return this.teacherProfilesService.create(createTeacherProfileDto);
  }

  @Get()
  findAll() {
    return this.teacherProfilesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teacherProfilesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeacherProfileDto: UpdateTeacherProfileDto) {
    return this.teacherProfilesService.update(+id, updateTeacherProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teacherProfilesService.remove(+id);
  }
}
