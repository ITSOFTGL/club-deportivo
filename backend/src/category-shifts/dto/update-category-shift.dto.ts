import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryShiftDto } from './create-category-shift.dto';

export class UpdateCategoryShiftDto extends PartialType(CreateCategoryShiftDto) {}