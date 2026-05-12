import { Injectable } from '@nestjs/common';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';

@Injectable()
export class TeacherProfilesService {
  create(createTeacherProfileDto: CreateTeacherProfileDto) {
    return 'This action adds a new teacherProfile';
  }

  findAll() {
    return `This action returns all teacherProfiles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} teacherProfile`;
  }

  update(id: number, updateTeacherProfileDto: UpdateTeacherProfileDto) {
    return `This action updates a #${id} teacherProfile`;
  }

  remove(id: number) {
    return `This action removes a #${id} teacherProfile`;
  }
}
