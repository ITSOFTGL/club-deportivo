import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

/** Mensaje claro cuando el API nuevo corre contra una BD sin migrar (p. ej. falta groupLabel). */
@Catch()
export class DatabaseSchemaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseSchemaExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const message = this.extractMessage(exception);

    if (this.isLikelySchemaMismatch(message)) {
      this.logger.error(
        `Esquema de BD desactualizado: ${message}. Ejecute: npx prisma migrate deploy`,
      );
      const body = {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'La base de datos no está actualizada. En el servidor ejecute: cd backend && npx prisma migrate deploy && reinicie la API.',
        code: 'DATABASE_SCHEMA_OUTDATED',
      };
      httpAdapter.reply(ctx.getResponse(), body, HttpStatus.SERVICE_UNAVAILABLE);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      httpAdapter.reply(ctx.getResponse(), res, status);
      return;
    }

    this.logger.error(exception);
    httpAdapter.reply(
      ctx.getResponse(),
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return `${exception.message} ${exception.stack ?? ''}`;
    }
    return String(exception);
  }

  private isLikelySchemaMismatch(message: string): boolean {
    const lower = message.toLowerCase();
    return (
      lower.includes('grouplabel') ||
      lower.includes('does not exist') ||
      lower.includes('column') && lower.includes('categories') ||
      lower.includes('unknown column') ||
      lower.includes('p2022')
    );
  }
}
