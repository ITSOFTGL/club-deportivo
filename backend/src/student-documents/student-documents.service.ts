import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDocumentDto } from './dto/create-student-document.dto';
import { UpdateStudentDocumentDto } from './dto/update-student-document.dto';

@Injectable()
export class StudentDocumentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateStudentDocumentDto) {
    return this.prismaService.prisma.studentDocument.create({
      data: {
        ...createDto,
        isVerified: createDto.isVerified ?? false,
      },
      include: { student: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.studentDocument.findMany({
      include: { student: true },
    });
  }

  async findByStudent(studentId: string) {
    return this.prismaService.prisma.studentDocument.findMany({
      where: { studentId },
      include: { student: true },
    });
  }

  async findOne(id: string) {
    const document = await this.prismaService.prisma.studentDocument.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!document) throw new NotFoundException('Documento no encontrado');
    return document;
  }

  async verify(id: string, verifiedBy: string) {
    await this.findOne(id);
    return this.prismaService.prisma.studentDocument.update({
      where: { id },
      data: { isVerified: true, verifiedBy, verifiedAt: new Date() },
    });
  }

  async update(id: string, updateDto: UpdateStudentDocumentDto) {
    await this.findOne(id);
    return this.prismaService.prisma.studentDocument.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.studentDocument.delete({ where: { id } });
  }
}