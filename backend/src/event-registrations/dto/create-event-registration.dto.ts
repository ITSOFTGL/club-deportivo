import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateEventRegistrationDto {
  @IsString()
  eventId!: string;

  @IsString()
  studentId!: string;

  @IsOptional()
  @IsNumber()
  jerseyNumber?: number;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}