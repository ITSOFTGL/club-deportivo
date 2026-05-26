import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, Min } from 'class-validator';
import { EventType, EventStatus } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(EventType)
  type!: EventType;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsDateString()
  registrationStart?: string;

  @IsDateString()
  registrationEnd!: string;

  @IsNumber()
  @Min(0)
  cost!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earlyBirdCost?: number;

  @IsOptional()
  @IsDateString()
  earlyBirdDate?: string;

  @IsString()
  location!: string;

  @IsOptional()
  @IsString()
  venueName?: string;

  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;
}