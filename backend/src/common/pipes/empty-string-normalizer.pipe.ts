import { Injectable, PipeTransform } from '@nestjs/common';

/** Convierte "" en undefined antes de ValidationPipe (evita fallos @IsOptional + @IsEmail, etc.) */
@Injectable()
export class EmptyStringNormalizerPipe implements PipeTransform {
  transform(value: unknown): unknown {
    return this.normalize(value);
  }

  private normalize(value: unknown): unknown {
    if (value === '') return undefined;
    if (Array.isArray(value)) {
      return value.map((item) => this.normalize(item));
    }
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        out[key] = this.normalize(val);
      }
      return out;
    }
    return value;
  }
}
