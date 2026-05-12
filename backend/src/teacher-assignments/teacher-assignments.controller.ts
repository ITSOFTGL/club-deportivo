import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';

@Controller('teacher-assignments')
export class TeacherAssignmentsController {
  constructor(private readonly teacherAssignmentsService: TeacherAssignmentsService) {}

  @Post()
  create(@Body() createTeacherAssignmentDto: CreateTeacherAssignmentDto) {
    return this.teacherAssignmentsService.create(createTeacherAssignmentDto);
  }

  @Get()
  findAll() {
    return this.teacherAssignmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teacherAssignmentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeacherAssignmentDto: UpdateTeacherAssignmentDto) {
    return this.teacherAssignmentsService.update(+id, updateTeacherAssignmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teacherAssignmentsService.remove(+id);
  }
}
