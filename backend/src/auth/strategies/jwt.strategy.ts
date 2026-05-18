// backend/src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

const FIXED_SECRET = 'SuperSecretKey123456789';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: AuthUser['role'];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: FIXED_SECRET,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthUser> {
    console.log('🔍 JWT Strategy - payload recibido:', payload);
    
    if (!payload || !payload.sub) {
      console.error('❌ Payload inválido o sin sub');
      throw new UnauthorizedException('Token inválido');
    }
    
    const user = await this.prismaService.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, name: true, lastName: true },
    });
    
    console.log('👤 Usuario encontrado en BD:', user);
    
    if (!user) {
      console.error('❌ Usuario no encontrado en BD');
      throw new UnauthorizedException('Usuario no encontrado');
    }
    
    if (user.status !== UserStatus.ACTIVE) {
      console.error('❌ Usuario inactivo:', user.status);
      throw new UnauthorizedException('Sesión inválida o usuario inactivo');
    }
    
    const authUser: AuthUser = { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name,
      lastName: user.lastName,
    };
    
    console.log('✅ AuthUser retornado:', authUser);
    return authUser;
  }
}