import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  imageExtensionFromUpload,
  isValidImageUpload,
  persistUpload,
  type UploadedImageFile,
} from '../common/utils/upload-image.util';
import * as path from 'path';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  private generateSku(): string {
    return `SKU-${Date.now().toString(36).toUpperCase()}`;
  }

  async create(createDto: CreateProductDto) {
    return this.prismaService.prisma.product.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        sku: createDto.sku || this.generateSku(),
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
        images: createDto.images ?? [],
        mainImage: createDto.mainImage,
        isPopular: createDto.isPopular ?? false,
        isActive: true,
      },
      include: { category: true, branch: true },
    });
  }

  async findAll(includeInactive = false) {
    return this.prismaService.prisma.product.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: { category: true, branch: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
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

  async uploadImage(id: string, file?: UploadedImageFile) {
    if (!file) {
      throw new BadRequestException('No se recibió imagen');
    }
    if (!isValidImageUpload(file)) {
      throw new BadRequestException(
        'Imagen no válida. Use JPG, PNG o WEBP (máx. 25 MB).',
      );
    }
    const product = await this.findOne(id);
    const ext = imageExtensionFromUpload(file);
    const dir = path.join(process.cwd(), 'uploads', 'products');
    const filename = `${id}-${Date.now()}.${ext}`;
    persistUpload(file, dir, filename);
    const url = `/uploads/products/${filename}`;
    const images = [...(product.images ?? []), url].slice(-5);

    return this.prismaService.prisma.product.update({
      where: { id },
      data: {
        mainImage: product.mainImage || url,
        images,
      },
      include: { category: true, branch: true },
    });
  }

  async update(id: string, updateDto: UpdateProductDto) {
    await this.findOne(id);
    return this.prismaService.prisma.product.update({
      where: { id },
      data: updateDto,
      include: { category: true, branch: true },
    });
  }

  async updateStock(
    id: string,
    quantity: number,
    type: 'IN' | 'OUT',
    userId?: string,
    note?: string,
  ) {
    const product = await this.findOne(id);
    const newStock = type === 'IN' ? product.stock + quantity : product.stock - quantity;
    if (newStock < 0) {
      throw new BadRequestException('Stock insuficiente');
    }

    await this.prismaService.prisma.stockMovement.create({
      data: {
        productId: id,
        type,
        quantity,
        reason: type === 'IN' ? 'STOCK_IN' : 'STOCK_OUT',
        note: note ?? 'Ajuste manual',
        createdBy: userId,
      },
    });

    return this.prismaService.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    const orderCount = await this.prismaService.prisma.orderItem.count({
      where: { productId: id },
    });
    if (orderCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar: el producto tiene órdenes asociadas. Desactívelo.',
      );
    }
    return this.prismaService.prisma.product.update({
      where: { id: product.id },
      data: { isActive: false },
    });
  }
}
