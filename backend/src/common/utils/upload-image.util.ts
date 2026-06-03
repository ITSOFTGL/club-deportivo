export type UploadedImageFile = {
  buffer?: Buffer;
  mimetype?: string;
  originalname?: string;
};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

export function isValidImageUpload(file?: UploadedImageFile): boolean {
  if (!file?.buffer?.length) return false;
  if (file.mimetype?.startsWith('image/')) return true;
  const name = file.originalname?.toLowerCase() ?? '';
  if (IMAGE_EXT.test(name)) return true;
  const head = file.buffer.subarray(0, 12);
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return true;
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47)
    return true;
  if (head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46)
    return true;
  return false;
}

export function imageExtensionFromUpload(file: UploadedImageFile): 'png' | 'jpg' {
  if (file.mimetype?.includes('png')) return 'png';
  if (file.mimetype?.includes('webp')) return 'jpg';
  const name = file.originalname?.toLowerCase() ?? '';
  if (name.endsWith('.png')) return 'png';
  return 'jpg';
}
