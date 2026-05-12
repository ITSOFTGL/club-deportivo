import { PartialType } from '@nestjs/mapped-types';
import { CreateTeacherAssignmentDto } from './create-teacher-assignment.dto';

export class UpdateTeacherAssignmentDto extends PartialType(CreateTeacherAssignmentDto) {}
