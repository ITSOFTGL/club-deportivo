import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @ValidateIf((o) => !o.studentId)
  @IsString()
  reservationId?: string;

  @IsString()
  shiftId!: string;

  @ValidateIf((o) => !o.studentId)
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  verifiedBy?: string;
}
