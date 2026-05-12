import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';

@Injectable()
export class TeacherAssignmentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateTeacherAssignmentDto) {
    return this.prismaService.prisma.teacherAssignment.create({
      data: {
        teacherId: createDto.teacherId,
        categoryShiftId: createDto.categoryShiftId,
        isLeadTeacher: createDto.isLeadTeacher ?? false,
        role: createDto.role ?? 'ASSISTANT',
        assignedAt: new Date(),
        assignedBy: 'system',
        isActive: true,
      },
      include: { teacher: true, categoryShift: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.teacherAssignment.findMany({
      where: { isActive: true },
      include: { teacher: true, categoryShift: true },
    });
  }

  async findByCategoryShift(categoryShiftId: string) {
    return this.prismaService.prisma.teacherAssignment.findMany({
      where: { categoryShiftId, isActive: true },
      include: { teacher: true },
    });
  }

  async findByTeacher(teacherId: string) {
    return this.prismaService.prisma.teacherAssignment.findMany({
      where: { teacherId, isActive: true },
      include: { categoryShift: true },
    });
  }

  async findOne(id: string) {
    const assignment = await this.prismaService.prisma.teacherAssignment.findUnique({
      where: { id },
      include: { teacher: true, categoryShift: true },
    });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    return assignment;
  }

  async update(id: string, updateDto: UpdateTeacherAssignmentDto) {
    await this.findOne(id);
    return this.prismaService.prisma.teacherAssignment.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.teacherAssignment.update({
      where: { id },
      data: { isActive: false },
    });
  }
}