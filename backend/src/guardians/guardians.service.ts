import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateGuardianDto) {
    return this.prismaService.prisma.guardian.create({
      data: {
        ...createDto,
        isPrimary: createDto.isPrimary ?? false,
      },
      include: { student: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.guardian.findMany({
      where: { isActive: true },
      include: { student: true },
    });
  }

  async findByStudent(studentId: string) {
    return this.prismaService.prisma.guardian.findMany({
      where: { studentId, isActive: true },
      include: { student: true },
    });
  }

  async findOne(id: string) {
    const guardian = await this.prismaService.prisma.guardian.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!guardian) throw new NotFoundException('Apoderado no encontrado');
    return guardian;
  }

  async update(id: string, updateDto: UpdateGuardianDto) {
    await this.findOne(id);
    return this.prismaService.prisma.guardian.update({
      where: { id },
      data: updateDto,
      include: { student: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.guardian.update({
      where: { id },
      data: { isActive: false },
    });
  }
}