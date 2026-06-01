import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public prisma: PrismaClient;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.prisma.$connect();
    await this.warnIfCategoryMigrationsMissing();
  }

  /** Evita 500 genéricos: avisa en logs si falta la migración de categorías. */
  private async warnIfCategoryMigrationsMissing(): Promise<void> {
    try {
      const rows = await this.prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'categories'
          AND column_name = 'groupLabel'
        LIMIT 1
      `;
      if (rows.length === 0) {
        this.logger.error(
          'Falta la columna categories.groupLabel. Ejecute en el servidor: cd backend && npx prisma migrate deploy && reinicie la API. ' +
            'Sin esto fallarán /students, /categories, /payments, etc.',
        );
      }
    } catch (err) {
      this.logger.warn(
        `No se pudo verificar el esquema de categories: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}