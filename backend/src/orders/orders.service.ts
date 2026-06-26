import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@prisma/client';

const RESERVE_HOURS = 48;

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  private async nextOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    const last = await this.prismaService.prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });
    const seq = last
      ? parseInt(last.orderNumber.replace(prefix, ''), 10) + 1
      : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  async create(createDto: CreateOrderDto) {
    let subtotal = 0;
    const lineItems: Array<{
      productId: string;
      productName: string;
      productPrice: number;
      quantity: number;
      size?: string;
      color?: string;
      customization?: string;
      subtotal: number;
    }> = [];

    for (const item of createDto.items) {
      const product = await this.prismaService.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || !product.isActive) {
        throw new NotFoundException(`Producto ${item.productId} no encontrado`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}" (disponible: ${product.stock})`,
        );
      }

      const unitPrice = product.discountPrice ?? product.price;
      let customizationCost = 0;
      if (product.requiresCustomization && item.customization) {
        customizationCost = product.customizationPrice ?? 0;
      }

      const itemSubtotal = (unitPrice + customizationCost) * item.quantity;
      subtotal += itemSubtotal;

      lineItems.push({
        productId: item.productId,
        productName: product.name,
        productPrice: unitPrice + customizationCost,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        customization: item.customization,
        subtotal: itemSubtotal,
      });
    }

    const discount = createDto.discount ?? 0;
    const shippingCost = createDto.shippingCost ?? 0;
    const total = Math.max(0, subtotal - discount + shippingCost);
    const orderNumber = await this.nextOrderNumber();
    const isReserve = createDto.mode === 'RESERVE';
    const status = isReserve ? OrderStatus.RESERVED : OrderStatus.PENDING;
    const reservationExpiresAt = isReserve
      ? new Date(Date.now() + RESERVE_HOURS * 60 * 60 * 1000)
      : null;

    return this.prismaService.prisma.$transaction(async (tx) => {
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
          shippingCost,
          total,
          deliveryMethod: createDto.deliveryMethod || 'PICKUP',
          pickupBranchId: createDto.pickupBranchId,
          deliveryAddress: createDto.deliveryAddress,
          paymentMethod: createDto.paymentMethod,
          status,
          reservationExpiresAt,
          notes: createDto.notes,
        },
      });

      for (const line of lineItems) {
        await tx.orderItem.create({
          data: { orderId: order.id, ...line },
        });
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            type: 'OUT',
            quantity: line.quantity,
            reason: isReserve ? 'RESERVATION' : 'SALE_PENDING',
            referenceId: order.id,
            note: `Orden ${orderNumber}`,
            createdBy: createDto.userId,
          },
        });
      }

      await tx.orderHistory.create({
        data: {
          orderId: order.id,
          status,
          note: isReserve
            ? `Reserva por ${RESERVE_HOURS}h`
            : 'Orden creada — pendiente de pago',
          changedBy: createDto.userId,
        },
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          orderItems: { include: { product: true } },
          user: true,
          student: true,
          pickupBranch: true,
        },
      });
    });
  }

  async findAll() {
    return this.prismaService.prisma.order.findMany({
      include: {
        orderItems: { include: { product: true } },
        user: true,
        student: true,
        pickupBranch: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prismaService.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: { include: { product: true } },
        pickupBranch: true,
        orderHistory: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prismaService.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { product: true } },
        user: true,
        student: true,
        pickupBranch: true,
        orderHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  private async releaseStock(orderId: string, userId?: string) {
    const items = await this.prismaService.prisma.orderItem.findMany({
      where: { orderId },
    });
    for (const item of items) {
      await this.prismaService.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      await this.prismaService.prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          reason: 'CANCELLED',
          referenceId: orderId,
          note: 'Stock liberado por cancelación',
          createdBy: userId,
        },
      });
    }
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    changedBy?: string,
  ) {
    const order = await this.findOne(id);
    const prev = order.status;

    if (status === OrderStatus.CANCELLED && prev !== OrderStatus.CANCELLED) {
      await this.releaseStock(id, changedBy);
    }

    if (status === OrderStatus.DELIVERED && prev !== OrderStatus.DELIVERED) {
      // stock already deducted on create
    }

    await this.prismaService.prisma.orderHistory.create({
      data: {
        orderId: id,
        status,
        note: note || `Estado: ${prev} → ${status}`,
        changedBy: changedBy ?? 'system',
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
        ...(status === OrderStatus.CANCELLED && {
          cancelledAt: new Date(),
          cancellationReason: note,
        }),
      },
      include: { orderItems: true, orderHistory: true },
    });
  }

  async getSalesStats() {
    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.READY,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];
    const orders = await this.prismaService.prisma.order.findMany({
      where: { status: { in: paidStatuses } },
      include: { orderItems: true },
    });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sumInRange = (from: Date) =>
      orders
        .filter((o) => new Date(o.orderDate) >= from)
        .reduce((s, o) => s + o.total, 0);

    const productCounts = new Map<string, { name: string; qty: number }>();
    for (const o of orders) {
      for (const item of o.orderItems) {
        const cur = productCounts.get(item.productId) ?? {
          name: item.productName,
          qty: 0,
        };
        cur.qty += item.quantity;
        productCounts.set(item.productId, cur);
      }
    }

    const topProducts = [...productCounts.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const products = await this.prismaService.prisma.product.findMany({
      select: { id: true, productType: true },
    });
    const typeById = new Map(products.map((p) => [p.id, p.productType]));

    const byCategory = new Map<string, number>();
    for (const o of orders) {
      for (const item of o.orderItems) {
        const cat = typeById.get(item.productId) ?? 'OTHER';
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + item.subtotal);
      }
    }

    return {
      today: sumInRange(startOfDay),
      week: sumInRange(startOfWeek),
      month: sumInRange(startOfMonth),
      topProducts,
      byCategory: Object.fromEntries(byCategory),
      totalOrders: orders.length,
    };
  }

  async update(id: string, updateDto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prismaService.prisma.order.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    return this.updateStatus(id, OrderStatus.CANCELLED, 'Cancelada por administrador');
  }
}
