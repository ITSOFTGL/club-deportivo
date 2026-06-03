import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PaymentPlansService } from './payment-plans.service';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';
import { UpdatePaymentPlanDto } from './dto/update-payment-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('payment-plans')
@ApiBearerAuth()
@Controller('payment-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentPlansController {
  constructor(private readonly paymentPlansService: PaymentPlansService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARENT)
  @ApiOperation({ summary: 'Crear plan de pago' })
  create(@Body() createDto: CreatePaymentPlanDto) {
    return this.paymentPlansService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  @ApiOperation({ summary: 'Obtener todos los planes' })
  findAll() {
    return this.paymentPlansService.findAll();
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Planes por alumno' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.paymentPlansService.findByStudent(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plan por ID' })
  findOne(@Param('id') id: string) {
    return this.paymentPlansService.findOne(id);
  }

  @Patch(':id/paid')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  @ApiOperation({ summary: 'Marcar plan como pagado' })
  markAsPaid(@Param('id') id: string) {
    return this.paymentPlansService.markAsPaid(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar plan' })
  update(@Param('id') id: string, @Body() updateDto: UpdatePaymentPlanDto) {
    return this.paymentPlansService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancelar plan' })
  remove(@Param('id') id: string) {
    return this.paymentPlansService.remove(id);
  }
}