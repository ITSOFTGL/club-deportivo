import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateEnrollmentDto) {
    return this.prismaService.prisma.enrollment.create({
      data: {
        studentId: createDto.studentId,
        categoryShiftId: createDto.categoryShiftId,
        status: createDto.status ?? 'ENROLLED',
        enrolledBy: createDto.enrolledBy,
        startDate: new Date(),
      },
      include: { student: true, categoryShift: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.enrollment.findMany({
      include: { student: true, categoryShift: true },
    });
  }

  async findByStudent(studentId: string) {
    return this.prismaService.prisma.enrollment.findMany({
      where: { studentId },
      include: { student: true, categoryShift: true },
    });
  }

  async findOne(id: string) {
    const enrollment = await this.prismaService.prisma.enrollment.findUnique({
      where: { id },
      include: { student: true, categoryShift: true },
    });
    if (!enrollment) throw new NotFoundException('Inscripción no encontrada');
    return enrollment;
  }

  async update(id: string, updateDto: UpdateEnrollmentDto) {
    await this.findOne(id);
    return this.prismaService.prisma.enrollment.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.enrollment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}