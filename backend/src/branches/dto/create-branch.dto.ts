// backend/src/branches/dto/create-branch.dto.ts
import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  name!: string;

  @IsString()
  location!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;  // ← Agrega esta línea
}