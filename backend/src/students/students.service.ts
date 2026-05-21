// backend/src/students/students.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prismaService: PrismaService) {}

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