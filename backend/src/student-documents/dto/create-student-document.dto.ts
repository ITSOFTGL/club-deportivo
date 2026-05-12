import { IsString, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class CreateStudentDocumentDto {
  @IsString()
  studentId!: string;

  @IsString()
  type!: string;

  @IsString()
  url!: string;

  @IsString()
  fileName!: string;

  @IsInt()
  fileSize!: number;

  @IsString()
  mimeType!: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}