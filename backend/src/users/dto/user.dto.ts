import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { UserRole, UserStatus, Gender } from '@prisma/client';
import { IsStrongPassword } from '../../common/validators/is-strong-password.validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsStrongPassword()
  password!: string;

  @IsString()
  name!: string;

  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsString()
  lastName?: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsEnum(Gender)
  gender?: Gender;

  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsDateString()
  birthDate?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class ChangeRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

export class AdminResetPasswordDto {
  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}