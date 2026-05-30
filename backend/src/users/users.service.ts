import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { sanitizeUser } from '../common/utils/sanitize-user';
import { validatePassword } from '../common/utils/password.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminResetPasswordDto,
  ChangeRoleDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(actor: AuthUser) {
    this.ensureStaff(actor);
    const users = await this.prismaService.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map(sanitizeUser);
  }

  async findOne(id: string, actor: AuthUser) {
    if (actor.id !== id) {
      this.ensureStaff(actor);
    }
    const user = await this.prismaService.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (actor.id !== id) {
      this.assertCanManage(actor, user);
    }
    return sanitizeUser(user);
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    this.ensureStaff(actor);
    if (actor.role === UserRole.ADMIN) {
      if (dto.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'No puedes crear usuarios con rol SUPER_ADMIN',
        );
      }
    }
    const exists = await this.prismaService.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El correo ya está en uso');
    if (dto.documentId) {
      const doc = await this.prismaService.prisma.user.findUnique({
        where: { documentId: dto.documentId },
      });
      if (doc) throw new ConflictException('El documento ya está en uso');
    }
    const pwdCheck = validatePassword(dto.password);
    if (!pwdCheck.valid) throw new BadRequestException(pwdCheck.message);
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prismaService.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        lastName: dto.lastName,
        role: dto.role,
        phone: dto.phone,
        documentId: dto.documentId,
        address: dto.address,
        gender: dto.gender as any,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        status: UserStatus.ACTIVE,
      },
    });
    return sanitizeUser(user);
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    this.ensureStaff(actor);
    const target = await this.requireUser(id);
    this.assertCanManage(actor, target);
    if (actor.role === UserRole.ADMIN && dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No puedes asignar SUPER_ADMIN');
    }
    if (dto.role !== undefined && actor.role === UserRole.ADMIN) {
      if (
        dto.role === UserRole.SUPER_ADMIN ||
        target.role === UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException('Operación no permitida');
      }
    }
    if (dto.email && dto.email !== target.email) {
      const exists = await this.prismaService.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (exists) throw new ConflictException('El correo ya está en uso');
    }
    if (dto.documentId && dto.documentId !== target.documentId) {
      const doc = await this.prismaService.prisma.user.findUnique({
        where: { documentId: dto.documentId },
      });
      if (doc) throw new ConflictException('El documento ya está en uso');
    }

    const { password, birthDate, ...rest } = dto;
    if (password) {
      const pwdCheck = validatePassword(password);
      if (!pwdCheck.valid) throw new BadRequestException(pwdCheck.message);
    }
    const user = await this.prismaService.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        gender: rest.gender as any,
        ...(birthDate !== undefined && {
          birthDate: birthDate ? new Date(birthDate) : null,
        }),
        ...(password && { password: await bcrypt.hash(password, 10) }),
      },
    });
    return sanitizeUser(user);
  }

  async changeRole(id: string, dto: ChangeRoleDto, actor: AuthUser) {
    this.ensureStaff(actor);
    const target = await this.requireUser(id);
    this.assertCanManage(actor, target);
    if (actor.role === UserRole.ADMIN) {
      if (
        dto.role === UserRole.SUPER_ADMIN ||
        target.role === UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException('Operación no permitida');
      }
    }
    const user = await this.prismaService.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });
    return sanitizeUser(user);
  }

  async changeStatus(id: string, dto: UpdateUserStatusDto, actor: AuthUser) {
    this.ensureStaff(actor);
    const target = await this.requireUser(id);
    this.assertCanManage(actor, target);
    const user = await this.prismaService.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });
    return sanitizeUser(user);
  }

  async resetPassword(
    id: string,
    dto: AdminResetPasswordDto,
    actor: AuthUser,
  ) {
    this.ensureStaff(actor);
    const target = await this.requireUser(id);
    this.assertCanManage(actor, target);
    const pwdCheck = validatePassword(dto.newPassword);
    if (!pwdCheck.valid) throw new BadRequestException(pwdCheck.message);
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    const user = await this.prismaService.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
    return sanitizeUser(user);
  }

  async softDelete(id: string, actor: AuthUser) {
    this.ensureStaff(actor);
    const target = await this.requireUser(id);
    this.assertCanManage(actor, target);
    await this.prismaService.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE },
    });
    return { id, status: UserStatus.INACTIVE };
  }

  private ensureStaff(actor: AuthUser) {
    const staff: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
    ];
    
    if (!staff.includes(actor.role)) {
      throw new ForbiddenException('Sin permisos de administración');
    }
  }

  private assertCanManage(actor: AuthUser, target: any) {
    if (actor.role === UserRole.SUPER_ADMIN) return;
    if (actor.role === UserRole.ADMIN) {
      if (target.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('No puedes gestionar al Super Admin');
      }
      return;
    }
    throw new ForbiddenException('Sin permisos');
  }

  private async requireUser(id: string) {
    const user = await this.prismaService.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}