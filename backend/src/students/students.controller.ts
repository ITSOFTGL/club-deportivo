// backend/src/students/students.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  create(@Body() createStudentDto: CreateStudentDto, @CurrentUser() actor: AuthUser) {
    return this.studentsService.create(createStudentDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @Get()
  findAll(
    @CurrentUser() actor: AuthUser,
    @Query('categoryIds') categoryIds?: string,
  ) {
    if (actor.role === UserRole.PARENT) {
      return this.studentsService.findByParent(actor.id);
    }
    if (actor.role === UserRole.TEACHER) {
      return this.studentsService.findByTeacher(actor.id);
    }
    if (categoryIds) {
      return this.studentsService.findByCategoryIds(
        categoryIds.split(',').filter(Boolean),
      );
    }
    return this.studentsService.findAll();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.studentsService.findOne(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto, @CurrentUser() actor: AuthUser) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.studentsService.remove(id);
  }
}