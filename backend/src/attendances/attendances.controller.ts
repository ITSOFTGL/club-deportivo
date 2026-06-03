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
import { AttendancesService } from './attendances.service';
import { AttendancesReportsService } from './attendances-reports.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { BatchAttendanceDto } from './dto/batch-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
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
  constructor(
    private readonly attendancesService: AttendancesService,
    private readonly reportsService: AttendancesReportsService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Crear registro de asistencia' })
  create(
    @Body() createDto: CreateAttendanceDto,
    @CurrentUser() actor: AuthUser,
  ) {
    if (!createDto.verifiedBy) {
      createDto.verifiedBy = actor.id;
    }
    return this.attendancesService.create(createDto);
  }

  @Post('batch')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Guardar lista de asistencia del día' })
  saveBatch(
    @Body() dto: BatchAttendanceDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.attendancesService.saveBatch({
      ...dto,
      verifiedBy: dto.verifiedBy || actor.id,
    });
  }

  @Get('report/monthly')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Reporte mensual de asistencia por categoría' })
  monthlyReport(
    @CurrentUser() actor: AuthUser,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('categoryId') categoryId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const now = new Date();
    const y = year ? parseInt(year, 10) : now.getFullYear();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    return this.reportsService.getMonthlyReport(
      actor,
      y,
      m,
      categoryId,
      branchId,
    );
  }

  @Get('report/absences')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Buscar inasistencias por alumno' })
  absenceSearch(
    @CurrentUser() actor: AuthUser,
    @Query('search') search?: string,
    @Query('studentId') studentId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('categoryId') categoryId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const now = new Date();
    const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return this.reportsService.searchAbsences(actor, {
      search,
      studentId,
      from: from ?? defaultFrom,
      to: to ?? defaultTo,
      categoryId,
      branchId,
    });
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.COLLECTOR,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Obtener asistencias' })
  findAll(
    @CurrentUser() actor: AuthUser,
    @Query('date') date?: string,
    @Query('studentId') studentId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('shiftId') shiftId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (actor.role === UserRole.PARENT) {
      return this.reportsService.findForParent(actor.id, {
        from,
        to,
        studentId,
      });
    }

    if (date && studentId) {
      return this.attendancesService.findByDateAndStudent(date, studentId);
    }
    if (date && shiftId) {
      return this.attendancesService.findByShift(shiftId, date);
    }
    if (date) {
      const tid =
        actor.role === UserRole.TEACHER ? actor.id : teacherId;
      return this.attendancesService.findByDate(date, tid);
    }
    if (actor.role === UserRole.TEACHER) {
      return this.attendancesService.findByDate(
        new Date().toISOString().split('T')[0],
        actor.id,
      );
    }
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
    return this.attendancesService.findByDate(date);
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
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar asistencia' })
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}
