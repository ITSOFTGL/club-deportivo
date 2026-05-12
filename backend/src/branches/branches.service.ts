import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    return this.prismaService.prisma.branch.create({
      data: {
        ...createBranchDto,
        isActive: createBranchDto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prismaService.prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const branch = await this.prismaService.prisma.branch.findUnique({
      where: { id },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    await this.findOne(id);
    return this.prismaService.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
  }
}