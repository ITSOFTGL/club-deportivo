import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { StudentDocumentsService } from './student-documents.service';
import { CreateStudentDocumentDto } from './dto/create-student-document.dto';
import { UpdateStudentDocumentDto } from './dto/update-student-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('student-documents')
@ApiBearerAuth()
@Controller('student-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentDocumentsController {
  constructor(private readonly studentDocumentsService: StudentDocumentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARENT)
  @ApiOperation({ summary: 'Subir documento de alumno' })
  create(@Body() createDto: CreateStudentDocumentDto) {
    return this.studentDocumentsService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener todos los documentos' })
  findAll() {
    return this.studentDocumentsService.findAll();
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Documentos por alumno' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.studentDocumentsService.findByStudent(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener documento por ID' })
  findOne(@Param('id') id: string) {
    return this.studentDocumentsService.findOne(id);
  }

  @Patch(':id/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Verificar documento' })
  verify(@Param('id') id: string, @Body('verifiedBy') verifiedBy: string) {
    return this.studentDocumentsService.verify(id, verifiedBy);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARENT)
  @ApiOperation({ summary: 'Actualizar documento' })
  update(@Param('id') id: string, @Body() updateDto: UpdateStudentDocumentDto) {
    return this.studentDocumentsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARENT)
  @ApiOperation({ summary: 'Eliminar documento' })
  remove(@Param('id') id: string) {
    return this.studentDocumentsService.remove(id);
  }
}