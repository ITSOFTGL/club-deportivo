import { IsString, IsNumber, IsEnum, Min } from 'class-validator';

export class CreatePaymentPlanDto {
  @IsString()
  studentId!: string;

  @IsEnum(['SINGLE', 'QUARTERLY', 'SEMESTRAL', 'ANNUAL'])
  type!: string;

  @IsNumber()
  @Min(1)
  monthsCount!: number;

  @IsNumber()
  @Min(0)
  discountPercent!: number;

  @IsNumber()
  @Min(0)
  finalAmount!: number;
}