import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDocumentDto } from './create-student-document.dto';

export class UpdateStudentDocumentDto extends PartialType(CreateStudentDocumentDto) {}
