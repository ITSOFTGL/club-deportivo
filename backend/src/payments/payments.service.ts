import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import * as QRCode from 'qrcode';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.prisma;
  }

  getClubPaymentConfig() {
    return {
      paymentQrUrl:
        process.env.PAYMENT_QR_URL ||
        process.env.NEXT_PUBLIC_PAYMENT_QR_URL ||
        '',
    };
  }

  private async resolveShiftId(categoryId: string): Promise<string> {
    const categoryShift = await this.prisma.categoryShift.findFirst({
      where: { categoryId, isActive: true },
      select: { shiftId: true },
    });
    if (categoryShift?.shiftId) return categoryShift.shiftId;

    const anyShift = await this.prisma.shift.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!anyShift) {
      throw new BadRequestException(
        'Configure al menos un turno activo para registrar pagos',
      );
    }
    return anyShift.id;
  }

  private async createMembershipReservation(
    student: { parentId: string; categoryId: string },
    finalAmount: number,
  ) {
    const shiftId = await this.resolveShiftId(student.categoryId);
    return this.prisma.reservation.create({
      data: {
        shiftId,
        userId: student.parentId,
        amount: finalAmount,
        discount: 0,
        finalAmount,
        status: PaymentStatus.PAID,
      },
    });
  }

  private computeAmount(
    monthlyPrice: number,
    months: number,
    discountPercent: number,
  ) {
    const base = monthlyPrice * months;
    const discount = (base * discountPercent) / 100;
    return Math.round((base - discount) * 100) / 100;
  }

  async generateQR(studentId: string, amount: number) {
    const student = await this.prisma.student.findUnique({
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
      clubQrUrl: this.getClubPaymentConfig().paymentQrUrl,
    };
  }

  async create(dto: CreatePaymentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: { category: true },
    });
    if (!student) throw new NotFoundException('Alumno no encontrado');

    const months = dto.monthsCovered ?? 1;
    const paidAt = dto.paymentDate ? new Date(dto.paymentDate) : new Date();
    const expiresAt = new Date(paidAt);
    expiresAt.setDate(expiresAt.getDate() + 30 * months);

    const discountPercent = student.discountPercent ?? 0;
    const suggestedAmount = this.computeAmount(
      student.category.monthlyPrice,
      months,
      discountPercent,
    );
    const finalAmount = dto.amount ?? suggestedAmount;

    const isPendingProof =
      dto.method === PaymentMethod.QR && dto.status === PaymentStatus.PENDING;

    const reservation = await this.createMembershipReservation(
      student,
      finalAmount,
    );

    const payment = await this.prisma.payment.create({
      data: {
        reservationId: reservation.id,
        amount: finalAmount,
        discount: (student.category.monthlyPrice * months * discountPercent) / 100,
        total: finalAmount,
        method: dto.method || PaymentMethod.CASH,
        status:
          dto.status ??
          (isPendingProof ? PaymentStatus.PENDING : PaymentStatus.PAID),
        paymentDate: isPendingProof ? undefined : paidAt,
        expiresAt: isPendingProof ? undefined : expiresAt,
        monthsCovered: months,
        paidUntilMonth: isPendingProof
          ? undefined
          : new Date(paidAt.getFullYear(), paidAt.getMonth() + months, 1),
        notes: dto.proofUrl
          ? `${dto.notes || ''}\nComprobante: ${dto.proofUrl}`.trim()
          : dto.notes,
        students: {
          connect: { id: dto.studentId },
        },
      },
    });

    if (!isPendingProof) {
      await this.extendPaymentHistory(
        dto.studentId,
        finalAmount,
        paidAt,
        months,
        expiresAt,
      );
    }

    return payment;
  }

  async verify(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { students: true },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status === PaymentStatus.PAID) return payment;

    const paidAt = new Date();
    const months = payment.monthsCovered || 1;
    const expiresAt = new Date(paidAt);
    expiresAt.setDate(expiresAt.getDate() + 30 * months);

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paymentDate: paidAt,
        expiresAt,
        paidUntilMonth: new Date(
          paidAt.getFullYear(),
          paidAt.getMonth() + months,
          1,
        ),
      },
      include: { students: true },
    });

    const studentId = updated.students[0]?.id;
    if (studentId) {
      await this.extendPaymentHistory(
        studentId,
        updated.total,
        paidAt,
        months,
        expiresAt,
      );
    }

    return updated;
  }

  private async extendPaymentHistory(
    studentId: string,
    amount: number,
    paidAt: Date,
    months: number,
    membershipExpiresAt: Date,
  ) {
    const amountPerMonth = amount / months;
    for (let i = 0; i < months; i++) {
      const month = new Date(paidAt.getFullYear(), paidAt.getMonth() + i, 1);
      const dueDate =
        i === months - 1
          ? membershipExpiresAt
          : new Date(paidAt.getFullYear(), paidAt.getMonth() + i + 1, paidAt.getDate());

      await this.prisma.paymentHistory.create({
        data: {
          studentId,
          month,
          amount: amountPerMonth,
          status: 'PAID',
          dueDate,
          paidDate: paidAt,
        },
      });
    }
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: { students: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStudent(studentId: string) {
    const [history, lastPayment] = await Promise.all([
      this.prisma.paymentHistory.findMany({
        where: { studentId },
        orderBy: { dueDate: 'desc' },
      }),
      this.prisma.payment.findFirst({
        where: {
          students: { some: { id: studentId } },
          status: PaymentStatus.PAID,
        },
        orderBy: { expiresAt: 'desc' },
      }),
    ]);

    return {
      history,
      paidUntil: lastPayment?.expiresAt ?? null,
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { students: true },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return payment;
  }
}
