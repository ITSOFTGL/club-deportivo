import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendancesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateAttendanceDto) {
    return this.prismaService.prisma.attendance.create({
      data: {
        reservationId: createDto.reservationId,
        shiftId: createDto.shiftId,
        userId: createDto.userId,
        status: createDto.status ?? AttendanceStatus.PENDING,
        checkInTime: createDto.checkInTime ? new Date(createDto.checkInTime) : undefined,
        checkOutTime: createDto.checkOutTime ? new Date(createDto.checkOutTime) : undefined,
      },
      include: { reservation: true, shift: true, user: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.attendance.findMany({
      include: { reservation: true, shift: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prismaService.prisma.attendance.findMany({
      where: { userId },
      include: { reservation: true, shift: true },
    });
  }

  async findByShift(shiftId: string) {
    return this.prismaService.prisma.attendance.findMany({
      where: { shiftId },
      include: { reservation: true, user: true },
    });
  }

  async findByDate(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.prismaService.prisma.attendance.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      include: { reservation: true, shift: true, user: true },
    });
  }

  async findOne(id: string) {
    const attendance = await this.prismaService.prisma.attendance.findUnique({
      where: { id },
      include: { reservation: true, shift: true, user: true },
    });
    if (!attendance) throw new NotFoundException('Asistencia no encontrada');
    return attendance;
  }

  async markPresent(id: string, actorId: string) {
    await this.findOne(id);
    return this.prismaService.prisma.attendance.update({
      where: { id },
      data: {
        status: AttendanceStatus.PRESENT,
        checkInTime: new Date(),
        verifiedBy: actorId,
      },
    });
  }

  async markAbsent(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.attendance.update({
      where: { id },
      data: { status: AttendanceStatus.ABSENT },
    });
  }

  async markLate(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.attendance.update({
      where: { id },
      data: { status: AttendanceStatus.LATE },
    });
  }

  async update(id: string, updateDto: UpdateAttendanceDto) {
    await this.findOne(id);
    return this.prismaService.prisma.attendance.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.attendance.delete({ where: { id } });
  }
}