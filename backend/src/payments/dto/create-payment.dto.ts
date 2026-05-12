import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  studentId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}