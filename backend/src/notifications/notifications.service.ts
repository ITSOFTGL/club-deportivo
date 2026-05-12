import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreateNotificationDto) {
    return this.prismaService.prisma.notification.create({
      data: {
        userId: createDto.userId,
        title: createDto.title,
        message: createDto.message,
        type: createDto.type,
        data: createDto.data,
      },
    });
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