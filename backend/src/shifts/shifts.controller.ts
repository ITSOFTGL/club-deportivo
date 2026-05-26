import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('shifts')
@ApiBearerAuth()
@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo turno' })
  async create(@Body() createShiftDto: CreateShiftDto) {
    console.log('📝 POST /shifts - Creando turno:', createShiftDto);
    const result = await this.shiftsService.create(createShiftDto);
    console.log('✅ Turno creado:', result);
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los turnos' })
  async findAll() {
    console.log('📋 GET /shifts - Obteniendo todos los turnos');
    const result = await this.shiftsService.findAll();
    console.log(`✅ Encontrados ${result.length} turnos`);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un turno por ID' })
  async findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un turno' })
  async update(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDto) {
    return this.shiftsService.update(id, updateShiftDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un turno' })
  async remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }
}