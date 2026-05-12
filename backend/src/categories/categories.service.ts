import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prismaService.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        type: createCategoryDto.type,
        monthlyPrice: createCategoryDto.monthlyPrice,
        maxCapacity: createCategoryDto.maxCapacity,
        minAge: createCategoryDto.minAge,
        maxAge: createCategoryDto.maxAge,
        requiresEquipment: createCategoryDto.requiresEquipment,
        branchId: createCategoryDto.branchId,
        isActive: true,
      },
      include: { branch: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.category.findMany({
      where: { isActive: true },
      include: { branch: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prismaService.prisma.category.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prismaService.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: { branch: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}