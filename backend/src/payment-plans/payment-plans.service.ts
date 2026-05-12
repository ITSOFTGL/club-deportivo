import { Injectable } from '@nestjs/common';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';
import { UpdatePaymentPlanDto } from './dto/update-payment-plan.dto';

@Injectable()
export class PaymentPlansService {
  create(createPaymentPlanDto: CreatePaymentPlanDto) {
    return 'This action adds a new paymentPlan';
  }

  findAll() {
    return `This action returns all paymentPlans`;
  }

  findOne(id: number) {
    return `This action returns a #${id} paymentPlan`;
  }

  update(id: number, updatePaymentPlanDto: UpdatePaymentPlanDto) {
    return `This action updates a #${id} paymentPlan`;
  }

  remove(id: number) {
    return `This action removes a #${id} paymentPlan`;
  }
}
