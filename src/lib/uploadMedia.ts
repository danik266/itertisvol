import { compressImage } from '@/lib/image';

export interface UploadedMedia {
  url: string;
  type: 'image' | 'video';
}

/**
 * Загрузка через сервер приложения ограничена размером тела запроса,
 * поэтому фотографии предварительно сжимаем, а видео принимаем небольшие.
 */
export const MAX_VIDEO_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_MEDIA =
  'image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm';

export async function uploadMedia(file: File): Promise<UploadedMedia> {
  const isVideo = file.type.startsWith('video/');

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error('Видео больше 4 МБ пока не принимается');
  }

  let payload: Blob = file;
  let filename = file.name;

  if (!isVideo) {
    const dataUrl = await compressImage(file, 1280, 0.8);
    payload = await (await fetch(dataUrl)).blob();
    filename = 'photo.jpg';
  }

  const form = new FormData();
  form.append('file', payload, filename);

  const res = await fetch('/api/media', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Не удалось загрузить файл');

  return { url: data.url, type: data.type };
}
