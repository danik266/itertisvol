import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/jwt';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
]);

/**
 * Загрузка идёт через сервер приложения, потому что файловое хранилище
 * работает по HTTP: браузер на HTTPS-странице не может обратиться к нему напрямую.
 */
export async function POST(req: NextRequest) {
  const base = process.env.MEDIA_SERVER_URL;
  const token = process.env.MEDIA_TOKEN;
  if (!base || !token) {
    return NextResponse.json({ error: 'Хранилище не настроено' }, { status: 503 });
  }

  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Войдите, чтобы загружать файлы' }, { status: 401 });

  await dbConnect();
  const user = await User.findById(userId).select('isBlocked');
  if (!user || user.isBlocked) {
    return NextResponse.json({ error: 'Загрузка недоступна' }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Файл не передан' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Неподдерживаемый формат файла' }, { status: 415 });
  }

  try {
    const res = await fetch(`${base}/upload?type=${encodeURIComponent(file.type)}`, {
      method: 'POST',
      headers: { 'x-media-token': token, 'Content-Type': 'application/octet-stream' },
      body: Buffer.from(await file.arrayBuffer()),
      signal: AbortSignal.timeout(50000),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Media upload failed:', res.status, detail);
      const message = res.status === 413 ? 'Файл слишком большой' : 'Не удалось сохранить файл';
      return NextResponse.json({ error: message }, { status: res.status === 413 ? 413 : 502 });
    }

    const data = await res.json();
    return NextResponse.json({ url: `/api/media/${data.name}`, type: data.type });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: 'Хранилище недоступно' }, { status: 502 });
  }
}
