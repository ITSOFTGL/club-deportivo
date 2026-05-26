// backend/src/students/students.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prismaService: PrismaService) {}

  private async withMembership<T extends { id: string }>(students: T[]) {
    if (students.length === 0) return [];

    const ids = students.map((s) => s.id);
    const paidPayments = await this.prismaService.prisma.payment.findMany({
      where: {
        students: { some: { id: { in: ids } } },
        status: PaymentStatus.PAID,
        expiresAt: { not: null },
      },
      select: { expiresAt: true, students: { select: { id: true } } },
      orderBy: { expiresAt: 'desc' },
    });

    const paidUntilMap = new Map<string, Date>();
    for (const payment of paidPayments) {
      if (!payment.expiresAt) continue;
      for (const st of payment.students) {
        const current = paidUntilMap.get(st.id);
        if (!current || payment.expiresAt > current) {
          paidUntilMap.set(st.id, payment.expiresAt);
        }
      }
    }

    const now = new Date();
    return students.map((student) => {
      const paidUntil = paidUntilMap.get(student.id);
      return {
        ...student,
        membershipPaidUntil: paidUntil?.toISOString() ?? null,
        membershipActive: paidUntil ? paidUntil >= now : false,
      };
    });
  }

  async create(createDto: CreateStudentDto) {
    console.log('📦 Creando estudiante:', JSON.stringify(createDto, null, 2));
    
    return this.prismaService.prisma.student.create({
      data: {
        name: createDto.name,
        lastName: createDto.lastName,
        birthDate: new Date(createDto.birthDate),
        documentId: createDto.documentId,
        gender: createDto.gender,
        weight: createDto.weight,
        height: createDto.height,
        shoeSize: createDto.shoeSize,
        shirtSize: createDto.shirtSize,
        pantsSize: createDto.pantsSize,
        medicalNotes: createDto.medicalNotes,
        bloodType: createDto.bloodType,
        emergencyContact: createDto.emergencyContact,
        emergencyPhone: createDto.emergencyPhone,
        school: createDto.school,
        grade: createDto.grade,
        parentId: createDto.parentId,
        branchId: createDto.branchId,
        categoryId: createDto.categoryId,
      //  discountPercent: createDto.discountPercent ?? 0,
        status: 'ACTIVE',
      },
      include: { parent: true, branch: true, category: true },
    });
  }

  async findAll() {
    const rows = await this.prismaService.prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { parent: true, branch: true, category: true },
    });
    return this.withMembership(rows);
  }

  async findByParent(parentId: string) {
    const rows = await this.prismaService.prisma.student.findMany({
      where: { parentId, status: 'ACTIVE' },
      include: { branch: true, category: true, parent: true },
    });
    return this.withMembership(rows);
  }

  async findByTeacher(teacherId: string) {
    const assignments =
      await this.prismaService.prisma.teacherAssignment.findMany({
        where: { teacherId, isActive: true },
        include: { categoryShift: true },
      });

    const categoryIds = [
      ...new Set(
        assignments
          .map((a) => a.categoryShift?.categoryId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (categoryIds.length === 0) return [];

    return this.prismaService.prisma.student.findMany({
      where: { categoryId: { in: categoryIds }, status: 'ACTIVE' },
      include: { parent: true, branch: true, category: true },
      orderBy: [{ category: { name: 'asc' } }, { lastName: 'asc' }],
    });
  }

  async findByCategoryIds(categoryIds: string[]) {
    if (!categoryIds.length) return [];
    return this.prismaService.prisma.student.findMany({
      where: { categoryId: { in: categoryIds }, status: 'ACTIVE' },
      include: { parent: true, branch: true, category: true },
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
    console.log('📝 Actualizando estudiante:', id);
    console.log('📦 Datos recibidos:', JSON.stringify(updateDto, null, 2));
    
    await this.findOne(id);
    
    // Construir el objeto data solo con los campos que vienen
    const data: any = {};
    
    if (updateDto.name !== undefined) data.name = updateDto.name;
    if (updateDto.lastName !== undefined) data.lastName = updateDto.lastName;
    if (updateDto.birthDate !== undefined) data.birthDate = new Date(updateDto.birthDate);
    if (updateDto.documentId !== undefined) data.documentId = updateDto.documentId;
    if (updateDto.gender !== undefined) data.gender = updateDto.gender;
    if (updateDto.weight !== undefined) data.weight = updateDto.weight;
    if (updateDto.height !== undefined) data.height = updateDto.height;
    if (updateDto.shoeSize !== undefined) data.shoeSize = updateDto.shoeSize;
    if (updateDto.shirtSize !== undefined) data.shirtSize = updateDto.shirtSize;
    if (updateDto.pantsSize !== undefined) data.pantsSize = updateDto.pantsSize;
    if (updateDto.medicalNotes !== undefined) data.medicalNotes = updateDto.medicalNotes;
    if (updateDto.bloodType !== undefined) data.bloodType = updateDto.bloodType;
    if (updateDto.emergencyContact !== undefined) data.emergencyContact = updateDto.emergencyContact;
    if (updateDto.emergencyPhone !== undefined) data.emergencyPhone = updateDto.emergencyPhone;
    if (updateDto.school !== undefined) data.school = updateDto.school;
    if (updateDto.grade !== undefined) data.grade = updateDto.grade;
    if (updateDto.parentId !== undefined) data.parentId = updateDto.parentId;
    if (updateDto.branchId !== undefined) data.branchId = updateDto.branchId;
    if (updateDto.categoryId !== undefined) data.categoryId = updateDto.categoryId;
    if (updateDto.status !== undefined) data.status = updateDto.status;
    if (updateDto.discountPercent !== undefined) {
      data.discountPercent = updateDto.discountPercent;
    }

    return this.prismaService.prisma.student.update({
      where: { id },
      data,
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