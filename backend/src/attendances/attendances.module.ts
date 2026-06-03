import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { AttendancesReportsService } from './attendances-reports.service';

@Module({
  controllers: [AttendancesController],
  providers: [AttendancesService, AttendancesReportsService],
  exports: [AttendancesReportsService],
})
export class AttendancesModule {}
