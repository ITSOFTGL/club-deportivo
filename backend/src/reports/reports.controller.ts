import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.COLLECTOR,
  )
  @ApiOperation({ summary: 'Estadísticas del dashboard / reportes' })
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get('export/payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  exportPayments() {
    return this.reportsService.getPaymentsExport();
  }

  @Get('export/teachers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  exportTeachers() {
    return this.reportsService.getTeachersExport();
  }

  @Get('export/categories-students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  exportCategoriesStudents(
    @Query('categoryId') categoryId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getCategoriesStudentsExport(
      categoryId,
      branchId,
    );
  }

  @Get('export/parents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  exportParents(
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reportsService.getParentsContactsExport(
      search,
      branchId,
      categoryId,
    );
  }

  @Get('export/membership')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  exportMembership(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reportsService.getPaymentsMembershipExport({
      from,
      to,
      branchId,
      categoryId,
    });
  }
}
