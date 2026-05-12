import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { UpdateEventRegistrationDto } from './dto/update-event-registration.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class EventRegistrationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateEventRegistrationDto) {
    const event = await this.prismaService.prisma.event.findUnique({
      where: { id: createDto.eventId },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    const qrData = JSON.stringify({
      eventId: event.id,
      eventTitle: event.title,
      studentId: createDto.studentId,
    });

    const qrCode = await QRCode.toDataURL(qrData);

    return this.prismaService.prisma.eventRegistration.create({
      data: {
        eventId: createDto.eventId,
        studentId: createDto.studentId,
        status: 'PENDING',
        jerseyNumber: createDto.jerseyNumber,
        position: createDto.position,
        notes: createDto.notes,
        registeredAt: new Date(),
        qrCode,
      },
      include: { event: true, student: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.eventRegistration.findMany({
      include: { event: true, student: true },
    });
  }

  async findByEvent(eventId: string) {
    return this.prismaService.prisma.eventRegistration.findMany({
      where: { eventId },
      include: { student: true },
    });
  }

  async findByStudent(studentId: string) {
    return this.prismaService.prisma.eventRegistration.findMany({
      where: { studentId },
      include: { event: true },
    });
  }

  async findOne(id: string) {
    const registration = await this.prismaService.prisma.eventRegistration.findUnique({
      where: { id },
      include: { event: true, student: true },
    });
    if (!registration) throw new NotFoundException('Inscripción no encontrada');
    return registration;
  }

  async confirm(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.eventRegistration.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });
  }

  async markAsPaid(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.eventRegistration.update({
      where: { id },
      data: { status: 'PAID' },
    });
  }

  async scanQR(qrCode: string) {
    const registration = await this.prismaService.prisma.eventRegistration.findFirst({
      where: { qrCode },
    });
    if (!registration) throw new NotFoundException('QR inválido');

    return this.prismaService.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { qrScanned: true, qrScannedAt: new Date() },
    });
  }

  async update(id: string, updateDto: UpdateEventRegistrationDto) {
    await this.findOne(id);
    return this.prismaService.prisma.eventRegistration.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.eventRegistration.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
}