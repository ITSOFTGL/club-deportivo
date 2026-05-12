import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateStudentDto) {
    return this.prismaService.prisma.student.create({
      data: {
        name: createDto.name,
        lastName: createDto.lastName,
        birthDate: new Date(createDto.birthDate),
        documentId: createDto.documentId,
        gender: createDto.gender,
        weight: createDto.weight,
        height: createDto.height,
        medicalNotes: createDto.medicalNotes,
        parentId: createDto.parentId,
        branchId: createDto.branchId,
        categoryId: createDto.categoryId,
        status: 'ACTIVE',
      },
      include: { parent: true, branch: true, category: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { parent: true, branch: true, category: true },
    });
  }

  async findByParent(parentId: string) {
    return this.prismaService.prisma.student.findMany({
      where: { parentId, status: 'ACTIVE' },
      include: { branch: true, category: true },
    });
  }

  async findOne(id: string) {
    const student = await this.prismaService.prisma.student.findUnique({
      where: { id },
      include: { parent: true, branch: true, category: true, guardians: true },
    });
    if (!student) throw new NotFoundException('Alumno no encontrado');
    return student;
  }

  async update(id: string, updateDto: UpdateStudentDto) {
    await this.findOne(id);
    return this.prismaService.prisma.student.update({
      where: { id },
      data: {
        ...updateDto,
        birthDate: updateDto.birthDate ? new Date(updateDto.birthDate) : undefined,
      },
      include: { parent: true, branch: true, category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.student.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}