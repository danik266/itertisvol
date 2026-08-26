import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserIdFromCookie } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
]);
/** Подпись живёт недолго: её хватает начать загрузку, но не раздать другим. */
const TTL_SECONDS = 600;

/**
 * Выдаёт подписанную ссылку, по которой браузер грузит файл прямо в хранилище.
 * Так большие видео не упираются в лимит размера запроса к приложению,
 * а секретный токен хранилища не попадает в браузер.
 */
export async function POST(req: NextRequest) {
  // Публичный адрес хранилища секретом не является, поэтому есть значение по умолчанию.
  const base = process.env.MEDIA_PUBLIC_URL || 'https://cdn.flojia.top';
  const token = process.env.MEDIA_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Хранилище не настроено' }, { status: 503 });
  }

  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Войдите, чтобы загружать файлы' }, { status: 401 });

  await dbConnect();
  const user = await User.findById(userId).select('isBlocked');
  if (!user || user.isBlocked) {
    return NextResponse.json({ error: 'Загрузка недоступна' }, { status: 403 });
  }

  const { type } = await req.json().catch(() => ({ type: '' }));
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: 'Неподдерживаемый формат файла' }, { status: 415 });
  }

  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const sig = crypto.createHmac('sha256', token).update(`${type}:${exp}`).digest('hex');
  const uploadUrl = `${base}/upload?type=${encodeURIComponent(type)}&exp=${exp}&sig=${sig}`;

  return NextResponse.json({ uploadUrl, publicBase: `${base}/f` });
}
