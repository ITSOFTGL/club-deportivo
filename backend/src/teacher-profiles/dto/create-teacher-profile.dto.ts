import { IsString, IsOptional, IsNumber, IsArray, Min } from 'class-validator';

export class CreateTeacherProfileDto {
  @IsString()
  userId!: string;

  @IsString()
  documentId!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsString()
  cvUrl?: string;
}