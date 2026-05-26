import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateShiftDto) {
    return this.prismaService.prisma.shift.create({
      data: {
        name: createDto.name,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        isActive: createDto.isActive ?? true,
      },
    });
  }

  async findAll() {
    // IMPORTANTE: Devuelve TODOS los turnos sin filtrar
    const shifts = await this.prismaService.prisma.shift.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log(`📊 ShiftsService.findAll() devolviendo ${shifts.length} turnos`);
    return shifts;
  }

  async findOne(id: string) {
    const shift = await this.prismaService.prisma.shift.findUnique({
      where: { id },
    });
    if (!shift) throw new NotFoundException('Turno no encontrado');
    return shift;
  }

  async update(id: string, updateDto: UpdateShiftDto) {
    await this.findOne(id);
    return this.prismaService.prisma.shift.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.shift.delete({
      where: { id },
    });
  }
}