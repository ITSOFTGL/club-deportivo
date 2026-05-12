import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateProductDto) {
    return this.prismaService.prisma.product.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        sku: createDto.sku,
        productType: createDto.productType,
        price: createDto.price,
        discountPrice: createDto.discountPrice,
        stock: createDto.stock ?? 0,
        minStock: createDto.minStock ?? 5,
        sizes: createDto.sizes,
        colors: createDto.colors,
        requiresCustomization: createDto.requiresCustomization ?? false,
        customizationPrice: createDto.customizationPrice,
        categoryId: createDto.categoryId,
        branchId: createDto.branchId,
        images: createDto.images,
        isActive: true,
      },
      include: { category: true, branch: true },
    });
  }

  async findAll() {
    return this.prismaService.prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, branch: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByType(productType: string) {
    return this.prismaService.prisma.product.findMany({
      where: { productType, isActive: true },
      include: { category: true, branch: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prismaService.prisma.product.findUnique({
      where: { id },
      include: { category: true, branch: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, updateDto: UpdateProductDto) {
    await this.findOne(id);
    return this.prismaService.prisma.product.update({
      where: { id },
      data: updateDto,
    });
  }

  async updateStock(id: string, quantity: number, type: 'IN' | 'OUT') {
    const product = await this.findOne(id);
    const newStock = type === 'IN' ? product.stock + quantity : product.stock - quantity;
    return this.prismaService.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}