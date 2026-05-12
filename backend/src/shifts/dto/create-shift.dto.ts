import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateShiftDto {
  @IsString()
  name!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}