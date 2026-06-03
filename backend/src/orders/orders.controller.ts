import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, OrderStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARENT)
  @ApiOperation({ summary: 'Crear una orden' })
  create(@Body() createDto: CreateOrderDto) {
    return this.ordersService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  @ApiOperation({ summary: 'Obtener todas las órdenes' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Órdenes por usuario' })
  findByUser(@Param('userId') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener orden por ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  @ApiOperation({ summary: 'Actualizar estado de orden' })
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus, @Body('note') note?: string) {
    return this.ordersService.updateStatus(id, status, note);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar orden' })
  update(@Param('id') id: string, @Body() updateDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancelar orden' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}