import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CategoryShiftsService } from './category-shifts.service';
import { CreateCategoryShiftDto } from './dto/create-category-shift.dto';
import { UpdateCategoryShiftDto } from './dto/update-category-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('category-shifts')
@ApiBearerAuth()
@Controller('category-shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryShiftsController {
  constructor(private readonly categoryShiftsService: CategoryShiftsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear un turno para categoría' })
  create(@Body() createDto: CreateCategoryShiftDto) {
    return this.categoryShiftsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los turnos de categorías' })
  findAll() {
    return this.categoryShiftsService.findAll();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Obtener turnos por categoría' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.categoryShiftsService.findByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un turno de categoría por ID' })
  findOne(@Param('id') id: string) {
    return this.categoryShiftsService.findOne(id);
  }

  @Patch(':id/capacity')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar cupos' })
  updateCapacity(@Param('id') id: string, @Body('change') change: number) {
    return this.categoryShiftsService.updateCapacity(id, change);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un turno de categoría' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCategoryShiftDto) {
    return this.categoryShiftsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un turno de categoría' })
  remove(@Param('id') id: string) {
    return this.categoryShiftsService.remove(id);
  }
}