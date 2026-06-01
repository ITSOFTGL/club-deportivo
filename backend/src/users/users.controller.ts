// backend/src/users/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AdminResetPasswordDto,
  ChangeRoleDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from './dto/user.dto';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
/** Ruta `usuarios`: algunos proxies/WAF bloquean `/users` en producción */
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← AGREGAR ESTO
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios', description: 'Lista todos los usuarios (solo administradores)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@CurrentUser() actor: AuthUser) {
    console.log('📝 Usuario en findAll:', actor); // ← Agregar log temporal
    console.log('📝 Role:', actor?.role); // ← Agregar log temporal
    return this.users.findAll(actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.users.findOne(id, actor);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthUser) {
    console.log('📝 Creando usuario, actor:', actor); // ← Agregar log temporal
    return this.users.create(dto, actor);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.users.update(id, dto, actor);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id/role')
  @ApiOperation({ summary: 'Cambiar rol de un usuario' })
  changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.users.changeRole(id, dto, actor);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado de un usuario' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.users.changeStatus(id, dto, actor);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id/password')
  @ApiOperation({ summary: 'Restablecer contraseña de un usuario' })
  resetPassword(
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.users.resetPassword(id, dto, actor);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar (soft delete) un usuario' })
  softDelete(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.users.softDelete(id, actor);
  }
}