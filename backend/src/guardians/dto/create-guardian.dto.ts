import {
  IsString,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { GuardianRelationship } from '@prisma/client';
import { IsStrongPassword } from '../../common/validators/is-strong-password.validator';

export class CreateGuardianDto {
  @IsString()
  studentId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalStudentIds?: string[];

  @IsString()
  name!: string;

  @IsString()
  lastName!: string;

  @IsString()
  documentId!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEnum(GuardianRelationship)
  relationship!: GuardianRelationship;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  createUserAccount?: boolean;

  @ValidateIf((o) => o.createUserAccount === true)
  @IsString()
  @IsStrongPassword()
  password?: string;
}
