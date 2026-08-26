/**
 * Сжимает выбранное фото в квадрат заданного размера и отдаёт data URL.
 * Нужно, чтобы аватарки с телефона (5–10 МБ) не улетали в базу целиком.
 */
export async function compressImage(
  file: File,
  size = 256,
  quality = 0.82
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close?.();

  return canvas.toDataURL('image/jpeg', quality);
}

export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/heic';
