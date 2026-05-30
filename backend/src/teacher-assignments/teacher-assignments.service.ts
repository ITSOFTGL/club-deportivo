import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';
import { schedulesConflict, formatDaysOfWeek } from '../common/utils/schedule.util';

@Injectable()
export class TeacherAssignmentsService {
  constructor(private readonly prismaService: PrismaService) {}

  private async assertNoScheduleConflict(
    teacherId: string,
    categoryShiftId: string,
    excludeAssignmentId?: string,
  ) {
    const target = await this.prismaService.prisma.categoryShift.findUnique({
      where: { id: categoryShiftId },
      include: { branch: true, category: true, shift: true },
    });
    if (!target) {
      throw new NotFoundException('Grupo (categoría + sucursal + horario) no encontrado');
    }

    const existing = await this.prismaService.prisma.teacherAssignment.findMany({
      where: {
        teacherId,
        isActive: true,
        ...(excludeAssignmentId ? { id: { not: excludeAssignmentId } } : {}),
      },
      include: {
        categoryShift: {
          include: { branch: true, category: true, shift: true },
        },
      },
    });

    for (const assignment of existing) {
      const other = assignment.categoryShift;
      if (!other) continue;
      if (
        schedulesConflict(
          {
            daysOfWeek: target.daysOfWeek,
            startTime: target.startTime,
            endTime: target.endTime,
          },
          {
            daysOfWeek: other.daysOfWeek,
            startTime: other.startTime,
            endTime: other.endTime,
          },
        )
      ) {
        throw new ConflictException(
          `El profesor ya tiene asignación en el mismo día y horario: ${other.category?.name} — ${other.branch?.name} (${formatDaysOfWeek(other.daysOfWeek)} ${other.startTime}-${other.endTime})`,
        );
      }
    }
  }

  async create(createDto: CreateTeacherAssignmentDto) {
    const duplicate =
      await this.prismaService.prisma.teacherAssignment.findFirst({
        where: {
          teacherId: createDto.teacherId,
          categoryShiftId: createDto.categoryShiftId,
          isActive: true,
        },
      });
    if (duplicate) {
      throw new ConflictException(
        'El profesor ya está asignado a este grupo (sucursal + categoría + horario)',
      );
    }

    await this.assertNoScheduleConflict(
      createDto.teacherId,
      createDto.categoryShiftId,
    );

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
      include: {
        teacher: true,
        categoryShift: {
          include: { category: true, shift: true, branch: true },
        },
      },
    });
  }

  async findAll() {
    return this.prismaService.prisma.teacherAssignment.findMany({
      where: { isActive: true },
      include: {
        teacher: true,
        categoryShift: {
          include: { category: true, shift: true, branch: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
      include: {
        categoryShift: {
          include: { category: true, shift: true, branch: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const assignment =
      await this.prismaService.prisma.teacherAssignment.findUnique({
        where: { id },
        include: {
          teacher: true,
          categoryShift: {
            include: { category: true, shift: true, branch: true },
          },
        },
      });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    return assignment;
  }

  async update(id: string, updateDto: UpdateTeacherAssignmentDto) {
    const current = await this.findOne(id);
    const teacherId = updateDto.teacherId ?? current.teacherId;
    const categoryShiftId =
      updateDto.categoryShiftId ?? current.categoryShiftId;

    if (updateDto.categoryShiftId || updateDto.teacherId) {
      await this.assertNoScheduleConflict(teacherId, categoryShiftId, id);
    }

    return this.prismaService.prisma.teacherAssignment.update({
      where: { id },
      data: updateDto,
      include: {
        teacher: true,
        categoryShift: {
          include: { category: true, shift: true, branch: true },
        },
      },
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
