import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  studentId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  monthsCovered?: number;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  /** Fecha de vencimiento actual desde la cual sumar meses (mes calendario). */
  @IsOptional()
  @IsDateString()
  extendFromDate?: string;

  @IsOptional()
  @IsString()
  proofUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
