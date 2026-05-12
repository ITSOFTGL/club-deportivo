import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryShiftDto } from './dto/create-category-shift.dto';
import { UpdateCategoryShiftDto } from './dto/update-category-shift.dto';

@Injectable()
export class CategoryShiftsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateCategoryShiftDto) {
    return this.prismaService.prisma.categoryShift.create({
      data: {
        categoryId: createDto.categoryId,
        branchId: createDto.branchId,
        shiftId: createDto.shiftId,
        name: createDto.name,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        daysOfWeek: createDto.daysOfWeek,
        totalCapacity: createDto.totalCapacity,
        monthlyPrice: createDto.monthlyPrice,
        enrollmentEnd: new Date(createDto.enrollmentEnd),
        enrolledCount: 0,
        waitingList: 0,
        isActive: createDto.isActive ?? true,
        isFull: false,
        enrollmentStart: new Date(),
      },
      include: { category: true, branch: true, shift: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.categoryShift.findMany({
      where: { isActive: true },
      include: { category: true, branch: true, shift: true },
    });
  }

  async findOne(id: string) {
    const item = await this.prismaService.prisma.categoryShift.findUnique({
      where: { id },
      include: { category: true, branch: true, shift: true, enrollments: true },
    });
    if (!item) throw new NotFoundException('Turno de categoría no encontrado');
    return item;
  }

  async findByCategory(categoryId: string) {
    return this.prismaService.prisma.categoryShift.findMany({
      where: { categoryId, isActive: true },
      include: { branch: true, shift: true },
    });
  }

  async updateCapacity(id: string, enrolledCountChange: number) {
    const item = await this.findOne(id);
    const newEnrolledCount = item.enrolledCount + enrolledCountChange;
    const isFull = newEnrolledCount >= item.totalCapacity;
    
    return this.prismaService.prisma.categoryShift.update({
      where: { id },
      data: {
        enrolledCount: newEnrolledCount,
        isFull,
      },
    });
  }

  async update(id: string, updateDto: UpdateCategoryShiftDto) {
    await this.findOne(id);
    return this.prismaService.prisma.categoryShift.update({
      where: { id },
      data: updateDto,
      include: { category: true, branch: true, shift: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.categoryShift.update({
      where: { id },
      data: { isActive: false },
    });
  }
}