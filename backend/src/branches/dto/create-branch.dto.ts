// backend/src/branches/dto/create-branch.dto.ts
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  ValidateIf,
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  name!: string;

  @IsString()
  location!: string;

  @IsString()
  phone!: string;

  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}