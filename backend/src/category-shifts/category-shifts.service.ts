import { Injectable } from '@nestjs/common';
import { CreateCategoryShiftDto } from './dto/create-category-shift.dto';
import { UpdateCategoryShiftDto } from './dto/update-category-shift.dto';

@Injectable()
export class CategoryShiftsService {
  create(createCategoryShiftDto: CreateCategoryShiftDto) {
    return 'This action adds a new categoryShift';
  }

  findAll() {
    return `This action returns all categoryShifts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} categoryShift`;
  }

  update(id: number, updateCategoryShiftDto: UpdateCategoryShiftDto) {
    return `This action updates a #${id} categoryShift`;
  }

  remove(id: number) {
    return `This action removes a #${id} categoryShift`;
  }
}
