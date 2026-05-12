import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';

@Injectable()
export class TeacherProfilesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateTeacherProfileDto) {
    return this.prismaService.prisma.teacherProfile.create({
      data: {
        userId: createDto.userId,
        documentId: createDto.documentId,
        phone: createDto.phone,
        emergencyPhone: createDto.emergencyPhone,
        address: createDto.address,
        specialty: createDto.specialty,
        experienceYears: createDto.experienceYears,
        certifications: createDto.certifications,
        cvUrl: createDto.cvUrl,
        isActive: true,
      },
      include: { user: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.teacherProfile.findMany({
      where: { isActive: true },
      include: { user: true },
    });
  }

  async findOne(id: string) {
    const profile = await this.prismaService.prisma.teacherProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!profile) throw new NotFoundException('Perfil de profesor no encontrado');
    return profile;
  }

  async findByUser(userId: string) {
    return this.prismaService.prisma.teacherProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async update(id: string, updateDto: UpdateTeacherProfileDto) {
    await this.findOne(id);
    return this.prismaService.prisma.teacherProfile.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.teacherProfile.update({
      where: { id },
      data: { isActive: false },
    });
  }
}