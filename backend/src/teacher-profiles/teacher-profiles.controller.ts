import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TeacherProfilesService } from './teacher-profiles.service';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('teacher-profiles')
@ApiBearerAuth()
@Controller('teacher-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherProfilesController {
  constructor(private readonly teacherProfilesService: TeacherProfilesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear perfil de profesor' })
  create(@Body() createDto: CreateTeacherProfileDto) {
    return this.teacherProfilesService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Obtener todos los perfiles' })
  findAll() {
    return this.teacherProfilesService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener perfil por usuario' })
  findByUser(@Param('userId') userId: string) {
    return this.teacherProfilesService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil por ID' })
  findOne(@Param('id') id: string) {
    return this.teacherProfilesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar perfil' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTeacherProfileDto) {
    return this.teacherProfilesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar perfil' })
  remove(@Param('id') id: string) {
    return this.teacherProfilesService.remove(id);
  }
}