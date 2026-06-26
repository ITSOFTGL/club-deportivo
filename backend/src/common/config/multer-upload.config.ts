import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';

export const IMAGE_UPLOAD_MAX_BYTES = 25 * 1024 * 1024; // 25 MB

const IMAGE_EXT = new Set([
  '.jpg',
  '.jpeg',
  '.jpe',
  '.jfif',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.heic',
  '.heif',
  '.avif',
  '.svg',
]);

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

type MulterIncoming = { mimetype?: string; originalname?: string };

/** Acepta casi cualquier archivo de imagen; Multer no rechaza en fileFilter. */
export function permissiveImageMulterOptions(subfolder: string) {
  const dest = join(process.cwd(), 'uploads', subfolder);
  ensureDir(dest);

  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, dest),
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname || '').toLowerCase();
        const safeExt = IMAGE_EXT.has(ext) ? ext : '.jpg';
        cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${safeExt}`);
      },
    }),
    limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES, files: 1 },
    fileFilter: (
      _req: unknown,
      file: MulterIncoming,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      const mime = (file.mimetype || '').toLowerCase();
      const ext = extname(file.originalname || '').toLowerCase();
      const looksLikeImage =
        mime.startsWith('image/') ||
        mime === 'application/octet-stream' ||
        mime === '' ||
        IMAGE_EXT.has(ext);

      if (!looksLikeImage) {
        cb(new Error('Seleccione un archivo de imagen'), false);
        return;
      }
      cb(null, true);
    },
  };
}

/** Memoria para endpoints que escriben el archivo manualmente (QR fijo). */
export function memoryImageMulterOptions() {
  return {
    storage: memoryStorage(),
    limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES, files: 1 },
    fileFilter: (
      _req: unknown,
      _file: MulterIncoming,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => cb(null, true),
  };
}
