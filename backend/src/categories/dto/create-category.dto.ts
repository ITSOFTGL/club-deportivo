// backend/src/categories/dto/create-category.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { CategoryType } from '@prisma/client';
import { Type } from 'class-transformer';

export class ShiftCapacityDto {
  @IsString()
  shiftId!: string;

  @IsNumber()
  @Min(1)
  capacity!: number;
}

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  groupLabel?: string;

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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  branchId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftCapacityDto)
  shifts?: ShiftCapacityDto[];
}