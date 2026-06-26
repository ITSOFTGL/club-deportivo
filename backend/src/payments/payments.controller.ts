import {

  Controller,

  Get,

  Post,

  Body,

  Param,

  Patch,

  UseGuards,

  UseInterceptors,

  UploadedFile,

} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { permissiveImageMulterOptions } from '../common/config/multer-upload.config';
import type { MulterUploadedFile } from '../common/utils/upload-image.util';

import { PaymentsService } from './payments.service';

import { CreatePaymentDto } from './dto/create-payment.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { UserRole } from '@prisma/client';

import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';



@ApiTags('payments')

@ApiBearerAuth()

@Controller('payments')

@UseGuards(JwtAuthGuard, RolesGuard)

export class PaymentsController {

  constructor(private readonly paymentsService: PaymentsService) {}



  @Get('config')

  @Roles(

    UserRole.SUPER_ADMIN,

    UserRole.ADMIN,

    UserRole.COLLECTOR,

    UserRole.PARENT,

  )

  @ApiOperation({ summary: 'URL del QR de pago del club' })

  getConfig() {

    return this.paymentsService.getClubPaymentConfig();

  }



  @Post('config/qr')

  @Roles(UserRole.SUPER_ADMIN)

  @UseInterceptors(FileInterceptor('qr', permissiveImageMulterOptions('payments')))

  @ApiConsumes('multipart/form-data')

  @ApiOperation({ summary: 'Subir imagen QR de pago (solo super admin)' })

  uploadQr(@UploadedFile() file?: MulterUploadedFile) {

    return this.paymentsService.savePaymentQrFile(file);

  }



  @Post('generate-qr/:studentId')

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR, UserRole.PARENT)

  @ApiOperation({ summary: 'Generar QR de pago' })

  generateQR(@Param('studentId') studentId: string, @Body('amount') amount: number) {

    return this.paymentsService.generateQR(studentId, amount);

  }



  @Post()

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)

  @ApiOperation({ summary: 'Registrar un pago' })

  create(@Body() createPaymentDto: CreatePaymentDto) {

    return this.paymentsService.create(createPaymentDto);

  }



  @Get()

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)

  @ApiOperation({ summary: 'Obtener todos los pagos' })

  findAll() {

    return this.paymentsService.findAll();

  }



  @Get('student/:studentId')

  @ApiOperation({ summary: 'Obtener historial de pagos de un alumno' })

  findByStudent(@Param('studentId') studentId: string) {

    return this.paymentsService.findByStudent(studentId);

  }



  @Patch(':id/verify')

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLLECTOR)

  @ApiOperation({ summary: 'Verificar pago pendiente (comprobante QR)' })

  verify(@Param('id') id: string) {

    return this.paymentsService.verify(id);

  }



  @Get(':id')

  @ApiOperation({ summary: 'Obtener un pago por ID' })

  findOne(@Param('id') id: string) {

    return this.paymentsService.findOne(id);

  }

}


