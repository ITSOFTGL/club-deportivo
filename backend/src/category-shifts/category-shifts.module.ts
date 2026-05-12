import { Module } from '@nestjs/common';
import { CategoryShiftsService } from './category-shifts.service';
import { CategoryShiftsController } from './category-shifts.controller';

@Module({
  controllers: [CategoryShiftsController],
  providers: [CategoryShiftsService],
})
export class CategoryShiftsModule {}
