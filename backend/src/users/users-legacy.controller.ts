import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Alias `/users` por compatibilidad con frontends antiguos.
 * En producción el WAF puede bloquear esta ruta; el frontend debe usar `/usuarios`.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersLegacyController extends UsersController {
  constructor(users: UsersService) {
    super(users);
  }
}
