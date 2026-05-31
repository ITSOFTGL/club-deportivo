import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { sanitizeUser } from '../common/utils/sanitize-user';
import { getJwtSecretKey } from '../common/utils/jwt-secret.util';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async validateUser(email: string, password: string) {
    console.log('🔍 [validateUser] email recibido:', email);
    
    const user = await this.prismaService.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      console.log('❌ [validateUser] Usuario no encontrado');
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    console.log('✅ [validateUser] Usuario encontrado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    
    if (user.status !== UserStatus.ACTIVE) {
      console.log('❌ [validateUser] Usuario inactivo');
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    if (user.password === 'pending') {
      console.log('❌ [validateUser] Contraseña pendiente');
      throw new UnauthorizedException(
        'Debes restablecer tu contraseña antes de iniciar sesión',
      );
    }
    
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log('❌ [validateUser] Contraseña incorrecta');
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    console.log('✅ [validateUser] Validación exitosa');
    return user;
  }

  async login(dto: LoginDto) {
    console.log('\n🔐 ========== LOGIN ==========');
    console.log('📧 Email:', dto.email);
    
    const user = await this.validateUser(dto.email, dto.password);
    
    console.log('\n📋 DATOS DEL USUARIO DESDE BD:');
    console.log('   id:', user.id);
    console.log('   id length:', user.id.length);
    console.log('   id caracteres:', JSON.stringify(user.id));
    console.log('   email:', user.email);
    console.log('   role:', user.role);
    console.log('   status:', user.status);
    
    // Verificar si el id contiene texto basura
    if (user.id.includes('bc1q5mlw')) {
      console.log('🚨 ¡ALERTA! El ID contiene texto basura: bc1q5mlw...');
    }
    
    // Verificar si el email contiene texto basura
    if (user.email.includes('bc1q5mlw')) {
      console.log('🚨 ¡ALERTA! El email contiene texto basura: bc1q5mlw...');
    }
    
    await this.prismaService.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    
    console.log('\n🔑 Generando token...');
    const token = await this.signToken(user.id, user.email, user.role);
    
    console.log('📤 TOKEN GENERADO:', token);
    console.log('🔐 ========== FIN LOGIN ==========\n');
    
    return {
      access_token: token,
      user: sanitizeUser(user),
    };
  }

  async register(dto: RegisterDto) {
    console.log('\n📝 ========== REGISTER ==========');
    console.log('📧 Email:', dto.email);
    console.log('👤 Nombre:', dto.name);
    console.log('👤 Apellido:', dto.lastName);
    
    const existing = await this.prismaService.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      console.log('❌ Email ya registrado');
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
    
    console.log('✅ Usuario creado con ID:', user.id);
    console.log('📝 ========== FIN REGISTER ==========\n');
    
    const token = await this.signToken(user.id, user.email, user.role);
    return { access_token: token, user: sanitizeUser(user) };
  }

  private async signToken(userId: string, email: string, role: UserRole) {
    console.log('\n🔏 ========== SIGN TOKEN ==========');
    console.log('📥 userId RECIBIDO:', userId);
    console.log('📥 userId length:', userId.length);
    console.log('📥 userId caracteres:', JSON.stringify(userId));
    console.log('📥 email RECIBIDO:', email);
    console.log('📥 role RECIBIDO:', role);
    
    // Verificar texto basura
    if (userId.includes('bc1q5mlw')) {
      console.log('🚨 ¡ALERTA CRÍTICA! userId contiene texto basura ANTES de firmar!');
    }
    
    const secret = getJwtSecretKey();
    
    const payload = { sub: userId, email, role };
    console.log('📦 Payload a firmar:', JSON.stringify(payload, null, 2));
    
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);
    
    console.log('🔑 TOKEN FIRMADO:', token);
    console.log('🔏 ========== FIN SIGN TOKEN ==========\n');
    
    return token;
  }
}