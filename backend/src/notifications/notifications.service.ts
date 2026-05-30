import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { getMembershipStatus } from '../common/utils/membership.util';

@Injectable()
export class NotificationsService {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.prisma;
  }

  async create(createDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: createDto.userId,
        title: createDto.title,
        message: createDto.message,
        type: createDto.type,
        data: createDto.data,
      },
    });
  }

  /** Alertas de mensualidad por vencer / último día / vencida. */
  async syncMembershipAlerts() {
    const students = await this.prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { parent: true, category: true },
    });

    if (students.length === 0) return { created: 0 };

    const ids = students.map((s) => s.id);
    const payments = await this.prisma.payment.findMany({
      where: {
        students: { some: { id: { in: ids } } },
        status: PaymentStatus.PAID,
        expiresAt: { not: null },
      },
      select: { expiresAt: true, students: { select: { id: true } } },
      orderBy: { expiresAt: 'desc' },
    });

    const paidUntilMap = new Map<string, Date>();
    for (const payment of payments) {
      if (!payment.expiresAt) continue;
      for (const st of payment.students) {
        const current = paidUntilMap.get(st.id);
        if (!current || payment.expiresAt > current) {
          paidUntilMap.set(st.id, payment.expiresAt);
        }
      }
    }

    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR] },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    const todayKey = new Date().toISOString().slice(0, 10);
    let created = 0;

    for (const student of students) {
      const paidUntil = paidUntilMap.get(student.id);
      const membership = getMembershipStatus(paidUntil);

      if (
        membership.status !== 'EXPIRED' &&
        membership.status !== 'LAST_DAY' &&
        membership.status !== 'EXPIRING'
      ) {
        continue;
      }

      const expiryLabel = paidUntil
        ? paidUntil.toLocaleDateString('es-BO')
        : '—';
      const title =
        membership.status === 'EXPIRED'
          ? 'Mensualidad vencida'
          : membership.status === 'LAST_DAY'
            ? 'Mensualidad: último día'
            : 'Mensualidad por vencer';

      const message = `${student.name} ${student.lastName} (${student.category.name}) — ${membership.label}. Vence: ${expiryLabel}.`;

      const recipients = [
        ...(student.parentId ? [student.parentId] : []),
        ...admins.map((a) => a.id),
      ];

      for (const userId of recipients) {
        const exists = await this.prisma.notification.findFirst({
          where: {
            userId,
            type: 'MEMBERSHIP_EXPIRY',
            createdAt: { gte: new Date(`${todayKey}T00:00:00`) },
            message: { contains: student.id },
          },
        });
        if (exists) continue;

        await this.create({
          userId,
          title,
          message: `${message} [${student.id}]`,
          type: 'MEMBERSHIP_EXPIRY',
          data: {
            studentId: student.id,
            status: membership.status,
            paidUntil: paidUntil?.toISOString(),
          },
        });
        created++;
      }
    }

    return { created };
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    return this.prismaService.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const notification = await this.prismaService.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Notificación no encontrada');
    return notification;
  }

  async markAsRead(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prismaService.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async update(id: string, updateDto: UpdateNotificationDto) {
    await this.findOne(id);
    return this.prismaService.prisma.notification.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.notification.delete({ where: { id } });
  }
}