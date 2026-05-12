import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { sanitizeUser } from '../common/utils/sanitize-user';

const FIXED_SECRET = 'SuperSecretKey123456789';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prismaService.prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (user.password === 'pending') {
      throw new UnauthorizedException(
        'Debes restablecer tu contraseña antes de iniciar sesión',
      );
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    await this.prismaService.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    const token = this.signToken(user.id, user.email, user.role);
    return {
      access_token: token,
      user: sanitizeUser(user),
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prismaService.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prismaService.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        lastName: dto.lastName,
        phone: dto.phone,
        documentId: dto.documentId,
        role: dto.role ?? UserRole.MEMBER,
        status: UserStatus.ACTIVE,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
    const token = this.signToken(user.id, user.email, user.role);
    return { access_token: token, user: sanitizeUser(user) };
  }

  private signToken(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };
    const token = jwt.sign(payload, FIXED_SECRET, { expiresIn: '7d' });
    return token;
  }
}