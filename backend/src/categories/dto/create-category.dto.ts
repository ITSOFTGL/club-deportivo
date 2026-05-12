import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { CategoryType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @IsNumber()
  @Min(0)
  monthlyPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAge?: number;

  @IsOptional()
  @IsBoolean()
  requiresEquipment?: boolean;

  @IsString()
  branchId!: string;
}