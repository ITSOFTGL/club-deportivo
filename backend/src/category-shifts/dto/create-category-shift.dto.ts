import { IsString, IsNumber, IsBoolean, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateCategoryShiftDto {
  @IsString()
  categoryId!: string;

  @IsString()
  branchId!: string;

  @IsString()
  shiftId!: string;

  @IsString()
  name!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsString()
  daysOfWeek!: string;

  @IsNumber()
  @Min(1)
  totalCapacity!: number;

  @IsNumber()
  @Min(0)
  monthlyPrice!: number;

  @IsDateString()
  enrollmentEnd!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}