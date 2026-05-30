import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('guardians')
@ApiBearerAuth()
@Controller('guardians')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR, UserRole.TEACHER)
  @ApiOperation({ summary: 'Crear un nuevo apoderado' })
  create(@Body() createGuardianDto: CreateGuardianDto) {
    return this.guardiansService.create(createGuardianDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los apoderados' })
  findAll(
    @Query('studentId') studentId?: string,
    @Query('categoryShiftId') categoryShiftId?: string,
  ) {
    if (studentId) {
      return this.guardiansService.findByStudent(studentId);
    }
    if (categoryShiftId) {
      return this.guardiansService.findByCategoryShiftScope(categoryShiftId);
    }
    return this.guardiansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un apoderado por ID' })
  findOne(@Param('id') id: string) {
    return this.guardiansService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARENT)
  @ApiOperation({ summary: 'Actualizar un apoderado' })
  update(@Param('id') id: string, @Body() updateGuardianDto: UpdateGuardianDto) {
    return this.guardiansService.update(id, updateGuardianDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un apoderado' })
  remove(@Param('id') id: string) {
    return this.guardiansService.remove(id);
  }
}