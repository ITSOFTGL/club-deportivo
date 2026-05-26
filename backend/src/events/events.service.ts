import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateEventDto) {
    return this.prismaService.prisma.event.create({
      data: {
        title: createDto.title,
        description: createDto.description || undefined,
        type: createDto.type,
        categoryId: createDto.categoryId || undefined,
        branchId: createDto.branchId || undefined,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        registrationStart: createDto.registrationStart
          ? new Date(createDto.registrationStart)
          : new Date(),
        registrationEnd: new Date(createDto.registrationEnd),
        cost: createDto.cost,
        earlyBirdCost: createDto.earlyBirdCost,
        earlyBirdDate: createDto.earlyBirdDate ? new Date(createDto.earlyBirdDate) : undefined,
        location: createDto.location,
        venueName: createDto.venueName,
        maxParticipants: createDto.maxParticipants,
        status: createDto.status ?? 'DRAFT',
        createdBy: 'system',
      },
      include: { category: true, branch: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.event.findMany({
      include: { category: true, branch: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prismaService.prisma.event.findUnique({
      where: { id },
      include: { category: true, branch: true, registrations: true },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  async findByCategory(categoryId: string) {
    return this.prismaService.prisma.event.findMany({
      where: { categoryId },
      include: { branch: true },
    });
  }

  async update(id: string, updateDto: UpdateEventDto) {
    await this.findOne(id);
    return this.prismaService.prisma.event.update({
      where: { id },
      data: {
        ...updateDto,
        startDate: updateDto.startDate ? new Date(updateDto.startDate) : undefined,
        endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
        registrationEnd: updateDto.registrationEnd ? new Date(updateDto.registrationEnd) : undefined,
        earlyBirdDate: updateDto.earlyBirdDate ? new Date(updateDto.earlyBirdDate) : undefined,
      },
      include: { category: true, branch: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.event.delete({ where: { id } });
  }
}