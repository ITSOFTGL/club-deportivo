import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StudentDocumentsService } from './student-documents.service';
import { CreateStudentDocumentDto } from './dto/create-student-document.dto';
import { UpdateStudentDocumentDto } from './dto/update-student-document.dto';

@Controller('student-documents')
export class StudentDocumentsController {
  constructor(private readonly studentDocumentsService: StudentDocumentsService) {}

  @Post()
  create(@Body() createStudentDocumentDto: CreateStudentDocumentDto) {
    return this.studentDocumentsService.create(createStudentDocumentDto);
  }

  @Get()
  findAll() {
    return this.studentDocumentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentDocumentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDocumentDto: UpdateStudentDocumentDto) {
    return this.studentDocumentsService.update(+id, updateStudentDocumentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentDocumentsService.remove(+id);
  }
}
