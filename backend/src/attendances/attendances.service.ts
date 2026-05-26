import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BatchAttendanceDto } from './dto/batch-attendance.dto';
import { AttendanceStatus, PaymentStatus } from '@prisma/client';

function localDayRange(dateInput: string | Date): { start: Date; end: Date } {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split('-').map(Number);
    return {
      start: new Date(y, m - 1, d, 0, 0, 0, 0),
      end: new Date(y, m - 1, d, 23, 59, 59, 999),
    };
  }
  const day = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

@Injectable()
export class AttendancesService {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.prisma;
  }

  private todayRange() {
    return localDayRange(new Date());
  }

  async create(createDto: CreateAttendanceDto) {
    if (createDto.studentId) {
      return this.registerForStudent({
        studentId: createDto.studentId,
        shiftId: createDto.shiftId,
        status: createDto.status ?? AttendanceStatus.PENDING,
        verifiedBy: createDto.verifiedBy,
        observations: createDto.observations,
      });
    }

    if (!createDto.reservationId || !createDto.userId) {
      throw new BadRequestException(
        'reservationId y userId son requeridos, o envía studentId',
      );
    }

    return this.prisma.attendance.create({
      data: {
        reservationId: createDto.reservationId,
        shiftId: createDto.shiftId,
        userId: createDto.userId,
        status: createDto.status ?? AttendanceStatus.PENDING,
        checkInTime: createDto.checkInTime
          ? new Date(createDto.checkInTime)
          : undefined,
        checkOutTime: createDto.checkOutTime
          ? new Date(createDto.checkOutTime)
          : undefined,
        observations: createDto.observations,
        verifiedBy: createDto.verifiedBy,
      },
      include: {
        reservation: true,
        shift: true,
        user: true,
        student: true,
      },
    });
  }

  async registerForStudent(params: {
    studentId: string;
    shiftId: string;
    status: AttendanceStatus;
    verifiedBy?: string;
    observations?: string;
  }) {
    const student = await this.prisma.student.findUnique({
      where: { id: params.studentId },
    });
    if (!student) throw new NotFoundException('Alumno no encontrado');

    const { start, end } = this.todayRange();

    const existing = await this.prisma.attendance.findFirst({
      where: {
        studentId: params.studentId,
        shiftId: params.shiftId,
        createdAt: { gte: start, lte: end },
      },
    });

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: params.status,
          verifiedBy: params.verifiedBy,
          observations: params.observations,
          checkInTime:
            params.status === AttendanceStatus.PRESENT ||
            params.status === AttendanceStatus.LATE
              ? new Date()
              : undefined,
        },
        include: { student: true, shift: true, user: true },
      });
    }

    let reservation = await this.prisma.reservation.findFirst({
      where: { shiftId: params.shiftId, userId: student.parentId },
    });

    if (!reservation) {
      reservation = await this.prisma.reservation.create({
        data: {
          shiftId: params.shiftId,
          userId: student.parentId,
          amount: 0,
          discount: 0,
          finalAmount: 0,
          status: PaymentStatus.PAID,
        },
      });
    }

    return this.prisma.attendance.create({
      data: {
        reservationId: reservation.id,
        shiftId: params.shiftId,
        userId: student.parentId,
        studentId: params.studentId,
        status: params.status,
        verifiedBy: params.verifiedBy,
        observations: params.observations,
        checkInTime:
          params.status === AttendanceStatus.PRESENT ||
          params.status === AttendanceStatus.LATE
            ? new Date()
            : undefined,
      },
      include: { student: true, shift: true, user: true },
    });
  }

  async saveBatch(dto: BatchAttendanceDto) {
    const results: Awaited<ReturnType<typeof this.registerForStudent>>[] = [];
    for (const record of dto.records) {
      const saved = await this.registerForStudent({
        studentId: record.studentId,
        shiftId: dto.shiftId,
        status: record.status,
        verifiedBy: dto.verifiedBy,
        observations: record.observations,
      });
      results.push(saved);
    }
    return { saved: results.length, records: results };
  }

  async findByDateAndStudent(date: string, studentId: string) {
    const { start, end } = localDayRange(date);

    return this.prisma.attendance.findFirst({
      where: {
        studentId,
        createdAt: { gte: start, lte: end },
      },
      include: { student: true, shift: true },
    });
  }

  async findAll() {
    return this.prisma.attendance.findMany({
      include: {
        reservation: true,
        shift: true,
        user: true,
        student: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.attendance.findMany({
      where: { userId },
      include: { reservation: true, shift: true, student: true },
    });
  }

  async findByShift(shiftId: string) {
    return this.prisma.attendance.findMany({
      where: { shiftId },
      include: { reservation: true, user: true, student: true },
    });
  }

  async findByDate(date: string | Date) {
    const { start, end } = localDayRange(date);

    return this.prisma.attendance.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        reservation: true,
        shift: true,
        user: true,
        student: { include: { category: true } },
      },
    });
  }

  async findOne(id: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        reservation: true,
        shift: true,
        user: true,
        student: true,
      },
    });
    if (!attendance) throw new NotFoundException('Asistencia no encontrada');
    return attendance;
  }

  async markPresent(id: string, actorId: string) {
    await this.findOne(id);
    return this.prisma.attendance.update({
      where: { id },
      data: {
        status: AttendanceStatus.PRESENT,
        checkInTime: new Date(),
        verifiedBy: actorId,
      },
      include: { student: true, shift: true },
    });
  }

  async markAbsent(id: string) {
    await this.findOne(id);
    return this.prisma.attendance.update({
      where: { id },
      data: { status: AttendanceStatus.ABSENT },
      include: { student: true, shift: true },
    });
  }

  async markLate(id: string) {
    await this.findOne(id);
    return this.prisma.attendance.update({
      where: { id },
      data: { status: AttendanceStatus.LATE, checkInTime: new Date() },
      include: { student: true, shift: true },
    });
  }

  async update(id: string, updateDto: UpdateAttendanceDto) {
    await this.findOne(id);
    return this.prisma.attendance.update({
      where: { id },
      data: updateDto,
      include: { student: true, shift: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.attendance.delete({ where: { id } });
  }
}
