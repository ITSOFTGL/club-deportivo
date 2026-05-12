import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateOrderDto) {
    let subtotal = 0;

    // Verificar productos y calcular subtotal
    for (const item of createDto.items) {
      const product = await this.prismaService.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);

      const itemPrice = product.discountPrice || product.price;
      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;
    }

    const discount = createDto.discount || 0;
    const total = subtotal - discount;
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Crear la orden con los orderItems
    return this.prismaService.prisma.$transaction(async (tx) => {
      // Crear la orden
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: createDto.userId,
          studentId: createDto.studentId,
          buyerName: createDto.buyerName,
          buyerEmail: createDto.buyerEmail,
          buyerPhone: createDto.buyerPhone,
          subtotal,
          discount,
          total,
          deliveryMethod: createDto.deliveryMethod || 'PICKUP',
          pickupBranchId: createDto.pickupBranchId,
          deliveryAddress: createDto.deliveryAddress,
          status: OrderStatus.PENDING,
        },
      });

      // Crear los orderItems
      for (const item of createDto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);

        const itemPrice = product.discountPrice || product.price;
        const itemSubtotal = itemPrice * item.quantity;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: product.name,
            productPrice: itemPrice,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            customization: item.customization,
            subtotal: itemSubtotal,
          },
        });
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: { orderItems: { include: { product: true } }, user: true, student: true },
      });
    });
  }

  async findAll() {
    return this.prismaService.prisma.order.findMany({
      include: { orderItems: { include: { product: true } }, user: true, student: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prismaService.prisma.order.findMany({
      where: { userId },
      include: { orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prismaService.prisma.order.findUnique({
      where: { id },
      include: { orderItems: { include: { product: true } }, user: true, student: true, orderHistory: true },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, note?: string) {
    const order = await this.findOne(id);
    
    await this.prismaService.prisma.orderHistory.create({
      data: {
        orderId: id,
        status: order.status,
        note: note || `Cambio de estado a ${status}`,
        changedBy: 'system',
      },
    });

    return this.prismaService.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === OrderStatus.PAID && { paidAt: new Date() }),
        ...(status === OrderStatus.PROCESSING && { processedAt: new Date() }),
        ...(status === OrderStatus.SHIPPED && { shippedAt: new Date() }),
        ...(status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
        ...(status === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
      },
    });
  }

  async update(id: string, updateDto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prismaService.prisma.order.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
    });
  }
}