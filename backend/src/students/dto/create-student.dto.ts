// backend/src/students/dto/create-student.dto.ts
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { Gender, BloodType } from '@prisma/client';

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
  @IsNumber()
  shoeSize?: number;

  @IsOptional()
  @IsString()
  shirtSize?: string;

  @IsOptional()
  @IsString()
  pantsSize?: string;

  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  school?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @IsString()
  branchId!: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  monthlyFeeOverride?: number;

  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;
}