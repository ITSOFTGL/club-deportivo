import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { permissiveImageMulterOptions } from '../common/config/multer-upload.config';
import type { MulterUploadedFile } from '../common/utils/upload-image.util';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.COLLECTOR,
    UserRole.PARENT,
  )
  @Get('birthdays/today')
  findBirthdaysToday() {
    return this.studentsService.findBirthdaysToday();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)
  @Get('membership-alerts')
  findMembershipAlerts() {
    return this.studentsService.findMembershipAlerts();
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.COLLECTOR,
    UserRole.PARENT,
  )
  @Get()
  findAll(
    @CurrentUser() actor: AuthUser,
    @Query('categoryIds') categoryIds?: string,
    @Query('categoryShiftId') categoryShiftId?: string,
  ) {
    if (actor.role === UserRole.PARENT) {
      return this.studentsService.findByParent(actor.id);
    }
    if (actor.role === UserRole.TEACHER) {
      return this.studentsService.findByTeacher(actor.id, categoryShiftId);
    }
    if (categoryIds) {
      return this.studentsService.findByCategoryIds(
        categoryIds.split(',').filter(Boolean),
      );
    }
    return this.studentsService.findAll();
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.COLLECTOR,
    UserRole.PARENT,
  )
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.studentsService.findOne(id, actor);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo', permissiveImageMulterOptions('students')))
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile()
    file?: MulterUploadedFile,
  ) {
    return this.studentsService.uploadProfilePhoto(id, file);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
