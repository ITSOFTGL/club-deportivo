import { Injectable } from '@nestjs/common';
import { CreateStudentDocumentDto } from './dto/create-student-document.dto';
import { UpdateStudentDocumentDto } from './dto/update-student-document.dto';

@Injectable()
export class StudentDocumentsService {
  create(createStudentDocumentDto: CreateStudentDocumentDto) {
    return 'This action adds a new studentDocument';
  }

  findAll() {
    return `This action returns all studentDocuments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} studentDocument`;
  }

  update(id: number, updateStudentDocumentDto: UpdateStudentDocumentDto) {
    return `This action updates a #${id} studentDocument`;
  }

  remove(id: number) {
    return `This action removes a #${id} studentDocument`;
  }
}
