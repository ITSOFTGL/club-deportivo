import { IsString, IsBoolean, IsEmail, IsEnum } from 'class-validator';
import { GuardianRelationship } from '@prisma/client';

export class CreateGuardianDto {
  @IsString()
  studentId!: string;

  @IsString()
  name!: string;

  @IsString()
  lastName!: string;

  @IsString()
  documentId!: string;

  @IsString()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsEnum(GuardianRelationship)
  relationship!: GuardianRelationship;

  @IsBoolean()
  isPrimary?: boolean;
}