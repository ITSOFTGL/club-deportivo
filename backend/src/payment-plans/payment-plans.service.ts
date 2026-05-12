import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';
import { UpdatePaymentPlanDto } from './dto/update-payment-plan.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class PaymentPlansService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreatePaymentPlanDto) {
    const student = await this.prismaService.prisma.student.findUnique({
      where: { id: createDto.studentId },
      include: { category: true },
    });
    if (!student) throw new NotFoundException('Alumno no encontrado');

    const originalAmount = student.category.monthlyPrice * createDto.monthsCount;
    const discountAmount = originalAmount * (createDto.discountPercent / 100);
    const finalAmount = originalAmount - discountAmount;

    const qrData = JSON.stringify({
      studentId: student.id,
      studentName: `${student.name} ${student.lastName}`,
      monthsCount: createDto.monthsCount,
      discountPercent: createDto.discountPercent,
      originalAmount,
      finalAmount,
    });

    const qrCode = await QRCode.toDataURL(qrData);

    return this.prismaService.prisma.paymentPlan.create({
      data: {
        studentId: createDto.studentId,
        type: createDto.type,
        monthsCount: createDto.monthsCount,
        discountPercent: createDto.discountPercent,
        discountAmount,
        originalAmount,
        finalAmount,
        qrCode,
        qrGeneratedAt: new Date(),
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
      include: { student: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.paymentPlan.findMany({
      include: { student: true },
    });
  }

  async findByStudent(studentId: string) {
    return this.prismaService.prisma.paymentPlan.findMany({
      where: { studentId },
      include: { student: true },
    });
  }

  async findOne(id: string) {
    const plan = await this.prismaService.prisma.paymentPlan.findUnique({
      where: { id },
      include: { student: true, installments: true },
    });
    if (!plan) throw new NotFoundException('Plan de pago no encontrado');
    return plan;
  }

  async markAsPaid(id: string) {
    const plan = await this.findOne(id);
    if (plan.status === 'PAID') throw new Error('Plan ya pagado');

    return this.prismaService.prisma.paymentPlan.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }

  async update(id: string, updateDto: UpdatePaymentPlanDto) {
    await this.findOne(id);
    return this.prismaService.prisma.paymentPlan.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.paymentPlan.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}