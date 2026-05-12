import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('attendances')
@ApiBearerAuth()
@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Crear registro de asistencia' })
  create(@Body() createDto: CreateAttendanceDto) {
    return this.attendancesService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Obtener todas las asistencias' })
  findAll() {
    return this.attendancesService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Asistencias por usuario' })
  findByUser(@Param('userId') userId: string) {
    return this.attendancesService.findByUser(userId);
  }

  @Get('shift/:shiftId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Asistencias por turno' })
  findByShift(@Param('shiftId') shiftId: string) {
    return this.attendancesService.findByShift(shiftId);
  }

  @Get('date/:date')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Asistencias por fecha' })
  findByDate(@Param('date') date: string) {
    return this.attendancesService.findByDate(new Date(date));
  }

  @Patch(':id/mark-present')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Marcar como presente' })
  markPresent(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.attendancesService.markPresent(id, actor.id);
  }

  @Patch(':id/mark-absent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Marcar como ausente' })
  markAbsent(@Param('id') id: string) {
    return this.attendancesService.markAbsent(id);
  }

  @Patch(':id/mark-late')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Marcar como tardanza' })
  markLate(@Param('id') id: string) {
    return this.attendancesService.markLate(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener asistencia por ID' })
  findOne(@Param('id') id: string) {
    return this.attendancesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Actualizar asistencia' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar asistencia' })
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}