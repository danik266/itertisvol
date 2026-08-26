import { compressImage } from '@/lib/image';

export interface UploadedMedia {
  url: string;
  type: 'image' | 'video';
}

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const ACCEPTED_MEDIA =
  'image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm';

/**
 * Файл уходит прямо в хранилище по одноразовой подписанной ссылке.
 * Если хранилище недоступно, пробуем старый путь через приложение —
 * он ограничен размером запроса, но выручает для фотографий.
 */
export async function uploadMedia(file: File): Promise<UploadedMedia> {
  const isVideo = file.type.startsWith('video/');

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error('Видео больше 100 МБ не принимается');
  }

  let payload: Blob = file;
  let contentType = file.type;

  if (!isVideo) {
    const dataUrl = await compressImage(file, 1280, 0.8);
    payload = await (await fetch(dataUrl)).blob();
    contentType = 'image/jpeg';
  }

  const signed = await fetch('/api/media/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: contentType }),
  });

  if (signed.ok) {
    const { uploadUrl, publicBase } = await signed.json();
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: payload,
    });
    if (res.ok) {
      const data = await res.json();
      return { url: `${publicBase}/${data.name}`, type: data.type };
    }
    if (res.status === 413) throw new Error('Файл слишком большой');
  }

  const form = new FormData();
  form.append('file', payload, isVideo ? file.name : 'photo.jpg');
  const res = await fetch('/api/media', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Не удалось загрузить файл');
  return { url: data.url, type: data.type };
}
