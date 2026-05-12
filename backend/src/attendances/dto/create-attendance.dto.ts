import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @IsString()
  reservationId!: string;

  @IsString()
  shiftId!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @IsOptional()
  @IsDateString()
  checkOutTime?: string;
}