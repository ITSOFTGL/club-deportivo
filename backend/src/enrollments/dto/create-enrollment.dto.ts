import { IsString, IsEnum, IsOptional } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @IsString()
  studentId!: string;

  @IsString()
  categoryShiftId!: string;

  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;

  @IsString()
  enrolledBy!: string;
}