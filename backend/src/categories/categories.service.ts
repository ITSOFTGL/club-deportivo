// backend/src/categories/categories.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { shifts, ...categoryData } = createCategoryDto;

    let category;
    try {
      category = await this.prismaService.prisma.category.create({
        data: categoryData,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2002') {
        throw new ConflictException(
          'Ya existe esa categoría en esta sucursal. Use el mismo nombre en otra sede creando otra fila con la otra sucursal.',
        );
      }
      throw e;
    }

    // Si hay turnos, crear los CategoryShifts
    if (shifts && shifts.length > 0) {
      const shiftIds = shifts.map(s => s.shiftId);
      const existingShifts = await this.prismaService.prisma.shift.findMany({
        where: { id: { in: shiftIds } }
      });

      const shiftsMap = new Map(existingShifts.map(s => [s.id, s]));

      for (const shift of shifts) {
        const shiftData = shiftsMap.get(shift.shiftId);
        if (shiftData) {
          await this.prismaService.prisma.categoryShift.create({
            data: {
              categoryId: category.id,
              branchId: categoryData.branchId,
              shiftId: shift.shiftId,
              name: `${category.name} - ${shiftData.name}`,
              startTime: shiftData.startTime,
              endTime: shiftData.endTime,
              daysOfWeek: 'LUN,MAR,MIE,JUE,VIE',
              totalCapacity: shift.capacity,
              enrolledCount: 0,
              waitingList: 0,
              monthlyPrice: categoryData.monthlyPrice,
              enrollmentStart: new Date(),
              enrollmentEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
              isActive: true,
              isFull: false,
            },
          });
        }
      }
    }

    return this.findOne(category.id);
  }

  async findAll() {
    const categories = await this.prismaService.prisma.category.findMany({
      include: {
        branch: true,
        categoryShifts: {
          include: {
            shift: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return categories.map(category => ({
      ...category,
      shifts: category.categoryShifts.map(cs => ({
        shiftId: cs.shiftId,
        capacity: cs.totalCapacity,
        shift: cs.shift,
      })),
    }));
  }

  async findOne(id: string) {
    const category = await this.prismaService.prisma.category.findUnique({
      where: { id },
      include: {
        branch: true,
        categoryShifts: {
          include: {
            shift: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return {
      ...category,
      shifts: category.categoryShifts.map(cs => ({
        shiftId: cs.shiftId,
        capacity: cs.totalCapacity,
        shift: cs.shift,
      })),
    };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { shifts, ...categoryData } = updateCategoryDto;

    const existingCategory = await this.findOne(id);

    // Actualizar la categoría
    const category = await this.prismaService.prisma.category.update({
      where: { id },
      data: categoryData,
    });

    // Si se enviaron turnos, actualizar las relaciones
    if (shifts !== undefined) {
      // Eliminar relaciones existentes
      await this.prismaService.prisma.categoryShift.deleteMany({
        where: { categoryId: id },
      });

      // Crear nuevas relaciones
      if (shifts.length > 0) {
        const shiftIds = shifts.map(s => s.shiftId);
        const existingShifts = await this.prismaService.prisma.shift.findMany({
          where: { id: { in: shiftIds } }
        });

        const shiftsMap = new Map(existingShifts.map(s => [s.id, s]));

        for (const shift of shifts) {
          const shiftData = shiftsMap.get(shift.shiftId);
          if (shiftData) {
            await this.prismaService.prisma.categoryShift.create({
              data: {
                categoryId: id,
                branchId: categoryData.branchId || existingCategory.branchId,
                shiftId: shift.shiftId,
                name: `${category.name || existingCategory.name} - ${shiftData.name}`,
                startTime: shiftData.startTime,
                endTime: shiftData.endTime,
                daysOfWeek: 'LUN,MAR,MIE,JUE,VIE',
                totalCapacity: shift.capacity,
                enrolledCount: 0,
                waitingList: 0,
                monthlyPrice: categoryData.monthlyPrice || existingCategory.monthlyPrice,
                enrollmentStart: new Date(),
                enrollmentEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                isActive: true,
                isFull: false,
              },
            });
          }
        }
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.prismaService.prisma.categoryShift.deleteMany({
      where: { categoryId: id },
    });

    return this.prismaService.prisma.category.delete({
      where: { id },
    });
  }
}