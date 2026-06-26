import * as fs from 'fs';
import * as path from 'path';

export type UploadedImageFile = {
  buffer?: Buffer;
  path?: string;
  mimetype?: string;
  originalname?: string;
  size?: number;
};

export type MulterUploadedFile = UploadedImageFile;

const IMAGE_EXT = /\.(jpe?g|jpe|jfif|png|webp|gif|bmp|heic|heif|avif|svg)$/i;

export function readUploadBytes(file?: UploadedImageFile): Buffer | null {
  if (!file) return null;
  if (file.buffer?.length) return file.buffer;
  if (file.path && fs.existsSync(file.path)) {
    try {
      return fs.readFileSync(file.path);
    } catch {
      return null;
    }
  }
  return null;
}

/** Validación permisiva: acepta la mayoría de fotos de celular/PC. */
export function isValidImageUpload(file?: UploadedImageFile): boolean {
  const bytes = readUploadBytes(file);
  if (!bytes?.length) return false;
  if (bytes.length > 25 * 1024 * 1024) return false;

  const mime = file?.mimetype?.toLowerCase() ?? '';
  if (mime.startsWith('image/')) return true;
  if (mime === 'application/octet-stream' || mime === '') {
    const name = file?.originalname?.toLowerCase() ?? '';
    if (IMAGE_EXT.test(name)) return true;
  }

  const name = file?.originalname?.toLowerCase() ?? '';
  if (IMAGE_EXT.test(name)) return true;

  return hasImageMagicBytes(bytes);
}

function hasImageMagicBytes(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8) return true;
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return true;
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  // WEBP (RIFF....WEBP)
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf.length >= 12 &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  )
    return true;
  // BMP
  if (buf[0] === 0x42 && buf[1] === 0x4d) return true;
  // HEIC/HEIF (ftyp)
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp') return true;
  return false;
}

export function imageExtensionFromUpload(file: UploadedImageFile): string {
  const mime = file.mimetype?.toLowerCase() ?? '';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('heic') || mime.includes('heif')) return 'heic';
  const name = file.originalname?.toLowerCase() ?? '';
  const ext = path.extname(name).replace('.', '');
  if (ext && IMAGE_EXT.test(`.${ext}`)) return ext === 'jpeg' ? 'jpg' : ext;
  return 'jpg';
}

/** Persiste bytes en destDir/filename; limpia archivo temporal de Multer si aplica. */
export function persistUpload(
  file: UploadedImageFile,
  destDir: string,
  filename: string,
): string {
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, filename);
  const bytes = readUploadBytes(file);
  if (!bytes?.length) {
    throw new Error('No se pudo leer el archivo subido');
  }
  fs.writeFileSync(destPath, bytes);
  if (file.path && file.path !== destPath && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch {
      /* ignore */
    }
  }
  return destPath;
}
