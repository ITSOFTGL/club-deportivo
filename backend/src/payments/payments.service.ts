import {

  BadRequestException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { PaymentStatus, PaymentMethod, UserRole } from '@prisma/client';

import * as QRCode from 'qrcode';

import * as fs from 'fs';

import * as path from 'path';

import { CreatePaymentDto } from './dto/create-payment.dto';

import {
  addCalendarMonths,
  parseLocalDateInput,
  toLocalDateKey,
} from '../common/utils/membership.util';
import { getStudentMonthlyFee } from '../common/utils/student-fee.util';
import { isValidImageUpload, persistUpload } from '../common/utils/upload-image.util';



@Injectable()

export class PaymentsService {

  private readonly uploadsDir = path.join(process.cwd(), 'uploads');



  constructor(private readonly prismaService: PrismaService) {}



  private get prisma() {

    return this.prismaService.prisma;

  }



  getClubPaymentConfig() {

    const apiBase =

      process.env.API_PUBLIC_URL ||

      process.env.NEXT_PUBLIC_API_URL ||

      'http://localhost:3001';



    const uploaded = path.join(this.uploadsDir, 'payment-qr.png');

    if (fs.existsSync(uploaded)) {

      return { paymentQrUrl: `${apiBase}/uploads/payment-qr.png` };

    }



    const envUrl =

      process.env.PAYMENT_QR_URL ||

      process.env.NEXT_PUBLIC_PAYMENT_QR_URL ||

      '';



    if (envUrl) return { paymentQrUrl: envUrl };



    return { paymentQrUrl: '/images/payment-qr.png' };

  }



  savePaymentQrFile(file?: {
    buffer?: Buffer;
    path?: string;
    mimetype?: string;
    originalname?: string;
  }) {
    if (!file) {
      throw new BadRequestException('No se recibió ninguna imagen.');
    }
    if (!isValidImageUpload(file)) {
      throw new BadRequestException(
        'No se pudo procesar la imagen. Use JPG, PNG o WEBP (máx. 25 MB).',
      );
    }

    fs.mkdirSync(this.uploadsDir, { recursive: true });
    persistUpload(file, this.uploadsDir, 'payment-qr.png');

    return this.getClubPaymentConfig();
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



  private async resolveReservationUserId(student: {

    parentId: string | null;

  }): Promise<string> {

    if (student.parentId) return student.parentId;



    const staff = await this.prisma.user.findFirst({

      where: {

        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR] },

        status: 'ACTIVE',

      },

      orderBy: { createdAt: 'asc' },

    });

    if (staff) return staff.id;



    throw new BadRequestException(

      'No hay usuario del staff para registrar el pago. Contacte al administrador.',

    );

  }



  private async createMembershipReservation(

    student: { parentId: string | null; categoryId: string },

    finalAmount: number,

  ) {

    const userId = await this.resolveReservationUserId(student);

    const shiftId = await this.resolveShiftId(student.categoryId);

    return this.prisma.reservation.create({

      data: {

        shiftId,

        userId,

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



  async getStudentPaidUntil(studentId: string): Promise<Date | null> {

    const lastPayment = await this.prisma.payment.findFirst({

      where: {

        students: { some: { id: studentId } },

        status: PaymentStatus.PAID,

        expiresAt: { not: null },

      },

      orderBy: { expiresAt: 'desc' },

      select: { expiresAt: true },

    });

    return lastPayment?.expiresAt ?? null;

  }



  private parseExtendFromFromNotes(notes?: string | null): string | null {

    if (!notes) return null;

    const match = notes.match(/baseExpiry:(\d{4}-\d{2}-\d{2})/);

    return match?.[1] ?? null;

  }



  private buildNotes(

    dto: CreatePaymentDto,

    extendFromKey: string,

  ): string | undefined {

    const parts: string[] = [];

    if (dto.notes?.trim()) parts.push(dto.notes.trim());

    parts.push(`baseExpiry:${extendFromKey}`);

    if (dto.proofUrl) parts.push(`Comprobante: ${dto.proofUrl}`);

    return parts.length ? parts.join('\n') : undefined;

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

    const paidAt = dto.paymentDate

      ? parseLocalDateInput(dto.paymentDate)

      : parseLocalDateInput(new Date());



    const currentPaidUntil = await this.getStudentPaidUntil(dto.studentId);

    const enrollmentAnchor = parseLocalDateInput(
      student.enrollmentDate ?? student.createdAt,
    );

    const extendFrom = dto.extendFromDate

      ? parseLocalDateInput(dto.extendFromDate)

      : currentPaidUntil ?? enrollmentAnchor;



    const extendFromKey = dto.extendFromDate
      ? dto.extendFromDate.split('T')[0]
      : currentPaidUntil
        ? toLocalDateKey(parseLocalDateInput(currentPaidUntil))
        : toLocalDateKey(enrollmentAnchor);



    const expiresAt = addCalendarMonths(extendFrom, months);



    const monthlyFee = getStudentMonthlyFee(student);

    const suggestedAmount = this.computeAmount(monthlyFee, months, 0);

    const finalAmount = dto.amount ?? suggestedAmount;

    const categoryBase = (student.category?.monthlyPrice ?? 0) * months;
    const discountRecorded = Math.max(
      0,
      Math.round((categoryBase - finalAmount) * 100) / 100,
    );



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

        discount: discountRecorded,

        total: finalAmount,

        method: dto.method || PaymentMethod.CASH,

        status:

          dto.status ??

          (isPendingProof ? PaymentStatus.PENDING : PaymentStatus.PAID),

        paymentDate: isPendingProof ? undefined : paidAt,

        expiresAt: isPendingProof ? undefined : expiresAt,

        monthsCovered: months,

        paidUntilMonth: isPendingProof ? undefined : expiresAt,

        notes: this.buildNotes(dto, extendFromKey),

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

        extendFrom,

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



    const paidAt = parseLocalDateInput(new Date());

    const months = payment.monthsCovered || 1;

    const studentId = payment.students[0]?.id;



    const storedBase = this.parseExtendFromFromNotes(payment.notes);

    let extendFrom: Date;

    if (storedBase) {

      extendFrom = parseLocalDateInput(storedBase);

    } else if (studentId) {

      const currentPaidUntil = await this.getStudentPaidUntil(studentId);

      const st = await this.prisma.student.findUnique({

        where: { id: studentId },

      });

      const enrollmentAnchor = st

        ? parseLocalDateInput(st.enrollmentDate ?? st.createdAt)

        : paidAt;

      extendFrom = currentPaidUntil ?? enrollmentAnchor;

    } else {

      extendFrom = paidAt;

    }



    const expiresAt = addCalendarMonths(extendFrom, months);



    const updated = await this.prisma.payment.update({

      where: { id },

      data: {

        status: PaymentStatus.PAID,

        paymentDate: paidAt,

        expiresAt,

        paidUntilMonth: expiresAt,

      },

      include: { students: true },

    });



    if (studentId) {

      await this.extendPaymentHistory(

        studentId,

        updated.total,

        paidAt,

        months,

        extendFrom,

      );

    }



    return updated;

  }



  private async extendPaymentHistory(

    studentId: string,

    amount: number,

    paidAt: Date,

    months: number,

    extendFrom: Date,

  ) {

    const amountPerMonth = amount / months;

    for (let i = 0; i < months; i++) {

      const month = new Date(

        extendFrom.getFullYear(),

        extendFrom.getMonth() + i,

        1,

        12,

        0,

        0,

        0,

      );

      const dueDate = addCalendarMonths(extendFrom, i + 1);



      await this.prisma.paymentHistory.upsert({

        where: {

          studentId_month: {

            studentId,

            month,

          },

        },

        create: {

          studentId,

          month,

          amount: amountPerMonth,

          status: 'PAID',

          dueDate,

          paidDate: paidAt,

        },

        update: {

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

      include: {

        students: {

          include: {

            category: true,

            parent: true,

            guardians: { where: { isPrimary: true, isActive: true }, take: 1 },

          },

        },

      },

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


