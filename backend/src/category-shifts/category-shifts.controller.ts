import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoryShiftsService } from './category-shifts.service';
import { CreateCategoryShiftDto } from './dto/create-category-shift.dto';
import { UpdateCategoryShiftDto } from './dto/update-category-shift.dto';

@Controller('category-shifts')
export class CategoryShiftsController {
  constructor(private readonly categoryShiftsService: CategoryShiftsService) {}

  @Post()
  create(@Body() createCategoryShiftDto: CreateCategoryShiftDto) {
    return this.categoryShiftsService.create(createCategoryShiftDto);
  }

  @Get()
  findAll() {
    return this.categoryShiftsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryShiftsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoryShiftDto: UpdateCategoryShiftDto) {
    return this.categoryShiftsService.update(+id, updateCategoryShiftDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryShiftsService.remove(+id);
  }
}
