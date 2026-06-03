import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { EventRegistrationsService } from './event-registrations.service';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { UpdateEventRegistrationDto } from './dto/update-event-registration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('event-registrations')
@ApiBearerAuth()
@Controller('event-registrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventRegistrationsController {
  constructor(private readonly eventRegistrationsService: EventRegistrationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARENT)
  @ApiOperation({ summary: 'Inscribir alumno en evento' })
  create(@Body() createDto: CreateEventRegistrationDto) {
    return this.eventRegistrationsService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener todas las inscripciones' })
  findAll() {
    return this.eventRegistrationsService.findAll();
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Inscripciones por evento' })
  findByEvent(@Param('eventId') eventId: string) {
    return this.eventRegistrationsService.findByEvent(eventId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Inscripciones por alumno' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.eventRegistrationsService.findByStudent(studentId);
  }

  @Get('scan/:qrCode')
  @ApiOperation({ summary: 'Escanear QR de evento' })
  scanQR(@Param('qrCode') qrCode: string) {
    return this.eventRegistrationsService.scanQR(qrCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener inscripción por ID' })
  findOne(@Param('id') id: string) {
    return this.eventRegistrationsService.findOne(id);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Confirmar inscripción' })
  confirm(@Param('id') id: string) {
    return this.eventRegistrationsService.confirm(id);
  }

  @Patch(':id/paid')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  @ApiOperation({ summary: 'Marcar pago de evento' })
  markAsPaid(@Param('id') id: string) {
    return this.eventRegistrationsService.markAsPaid(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar inscripción' })
  update(@Param('id') id: string, @Body() updateDto: UpdateEventRegistrationDto) {
    return this.eventRegistrationsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancelar inscripción' })
  remove(@Param('id') id: string) {
    return this.eventRegistrationsService.remove(id);
  }
}