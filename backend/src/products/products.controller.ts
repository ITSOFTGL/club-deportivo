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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { permissiveImageMulterOptions } from '../common/config/multer-upload.config';
import type { MulterUploadedFile } from '../common/utils/upload-image.util';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear un producto' })
  create(@Body() createDto: CreateProductDto) {
    return this.productsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Catálogo de productos activos' })
  findAll(@Query('all') all?: string, @CurrentUser() user?: AuthUser) {
    const includeInactive =
      all === '1' &&
      (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN);
    return this.productsService.findAll(includeInactive);
  }

  @Get('type/:productType')
  @ApiOperation({ summary: 'Productos por tipo' })
  findByType(@Param('productType') productType: string) {
    return this.productsService.findByType(productType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post(':id/image')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image', permissiveImageMulterOptions('products')))
  @ApiOperation({ summary: 'Subir imagen de producto' })
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    return this.productsService.uploadImage(id, file);
  }

  @Patch(':id/stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar stock' })
  updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('type') type: 'IN' | 'OUT',
    @CurrentUser() user: AuthUser,
    @Body('note') note?: string,
  ) {
    return this.productsService.updateStock(id, quantity, type, user.id, note);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar producto' })
  update(@Param('id') id: string, @Body() updateDto: UpdateProductDto) {
    return this.productsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar producto' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
