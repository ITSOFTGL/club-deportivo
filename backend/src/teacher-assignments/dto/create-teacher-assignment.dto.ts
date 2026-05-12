import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateTeacherAssignmentDto {
  @IsString()
  teacherId!: string;

  @IsString()
  categoryShiftId!: string;

  @IsOptional()
  @IsBoolean()
  isLeadTeacher?: boolean;

  @IsOptional()
  @IsString()
  role?: string;
}