import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import * as QRCode from 'qrcode';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async generateQR(studentId: string, amount: number) {
    const student = await this.prismaService.prisma.student.findUnique({
      where: { id: studentId },
      include: { category: true },
    });
    if (!student) throw new NotFoundException('Alumno no encontrado');

    const paymentData = {
      studentId,
      studentName: `${student.name} ${student.lastName}`,
      amount,
      concept: `Mensualidad ${student.category.name}`,
      date: new Date().toISOString(),
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(paymentData));
    
    return {
      qrCode,
      paymentData,
      expiresIn: '24h',
    };
  }

  async create(dto: CreatePaymentDto) {
    const student = await this.prismaService.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Alumno no encontrado');

    const currentMonth = new Date();
    currentMonth.setDate(1);

    const payment = await this.prismaService.prisma.payment.create({
      data: {
        reservationId: `PAY-${Date.now()}`,
        amount: dto.amount,
        total: dto.amount,
        method: dto.method || PaymentMethod.QR,
        status: PaymentStatus.PAID,
        paymentDate: new Date(),
        monthsCovered: 1,
        paidUntilMonth: currentMonth,
        students: {
          connect: { id: dto.studentId },
        },
      },
    });

    await this.prismaService.prisma.paymentHistory.create({
      data: {
        studentId: dto.studentId,
        month: currentMonth,
        amount: dto.amount,
        status: 'PAID',
        dueDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 5),
        paidDate: new Date(),
      },
    });

    return payment;
  }

  async findAll() {
    return this.prismaService.prisma.payment.findMany({
      include: { students: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStudent(studentId: string) {
    return this.prismaService.prisma.paymentHistory.findMany({
      where: { studentId },
      orderBy: { month: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prismaService.prisma.payment.findUnique({
      where: { id },
      include: { students: true },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return payment;
  }
}