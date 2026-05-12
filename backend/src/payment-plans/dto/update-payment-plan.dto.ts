import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentPlanDto } from './create-payment-plan.dto';

export class UpdatePaymentPlanDto extends PartialType(CreatePaymentPlanDto) {}
