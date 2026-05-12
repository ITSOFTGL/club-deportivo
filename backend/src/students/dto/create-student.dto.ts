import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateStudentDto {
  @IsString()
  name!: string;

  @IsString()
  lastName!: string;

  @IsDateString()
  birthDate!: string;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @IsString()
  parentId!: string;

  @IsString()
  branchId!: string;

  @IsString()
  categoryId!: string;
}