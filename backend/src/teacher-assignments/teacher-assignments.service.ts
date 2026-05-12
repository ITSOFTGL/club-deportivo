import { Injectable } from '@nestjs/common';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';

@Injectable()
export class TeacherAssignmentsService {
  create(createTeacherAssignmentDto: CreateTeacherAssignmentDto) {
    return 'This action adds a new teacherAssignment';
  }

  findAll() {
    return `This action returns all teacherAssignments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} teacherAssignment`;
  }

  update(id: number, updateTeacherAssignmentDto: UpdateTeacherAssignmentDto) {
    return `This action updates a #${id} teacherAssignment`;
  }

  remove(id: number) {
    return `This action removes a #${id} teacherAssignment`;
  }
}
