import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('teacher-assignments')
@ApiBearerAuth()
@Controller('teacher-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherAssignmentsController {
  constructor(private readonly teacherAssignmentsService: TeacherAssignmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Asignar profesor a categoría' })
  create(@Body() createDto: CreateTeacherAssignmentDto) {
    return this.teacherAssignmentsService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Obtener todas las asignaciones' })
  findAll() {
    return this.teacherAssignmentsService.findAll();
  }

  @Get('category-shift/:categoryShiftId')
  @ApiOperation({ summary: 'Asignaciones por categoría/turno' })
  findByCategoryShift(@Param('categoryShiftId') categoryShiftId: string) {
    return this.teacherAssignmentsService.findByCategoryShift(categoryShiftId);
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Asignaciones por profesor' })
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.teacherAssignmentsService.findByTeacher(teacherId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener asignación por ID' })
  findOne(@Param('id') id: string) {
    return this.teacherAssignmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar asignación' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTeacherAssignmentDto) {
    return this.teacherAssignmentsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar asignación' })
  remove(@Param('id') id: string) {
    return this.teacherAssignmentsService.remove(id);
  }
}