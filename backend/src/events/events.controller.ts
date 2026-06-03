import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Crear un evento' })
  create(@Body() createDto: CreateEventDto) {
    return this.eventsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los eventos' })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Eventos por categoría' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.eventsService.findByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener evento por ID' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Actualizar evento' })
  update(@Param('id') id: string, @Body() updateDto: UpdateEventDto) {
    return this.eventsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar evento' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}