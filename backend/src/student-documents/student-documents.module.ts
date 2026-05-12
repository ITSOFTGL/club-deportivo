import { Module } from '@nestjs/common';
import { StudentDocumentsService } from './student-documents.service';
import { StudentDocumentsController } from './student-documents.controller';

@Module({
  controllers: [StudentDocumentsController],
  providers: [StudentDocumentsService],
})
export class StudentDocumentsModule {}
