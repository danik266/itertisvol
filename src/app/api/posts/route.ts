import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post, { PostType, IMedia } from '@/models/Post';
import User from '@/models/User';
import { getUserIdFromCookie } from '@/lib/jwt';
import { moderateText } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

const TYPES: PostType[] = ['experience', 'need', 'announcement'];
const AUTHOR_FIELDS = 'firstName lastName avatar entityType orgName city directions';
/** Медиа приходит data URL-ами, пока не подключено внешнее хранилище. */
const MAX_MEDIA = 6;
const MAX_MEDIA_CHARS = 1_500_000;

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as PostType | null;
    const direction = searchParams.get('direction');
    const month = searchParams.get('month'); // формат YYYY-MM
    const since = searchParams.get('since');
    const limit = Math.min(Number(searchParams.get('limit')) || 40, 100);

    const query: Record<string, unknown> = { status: 'published' };
    if (type && TYPES.includes(type)) query.type = type;
    if (direction && direction !== 'all') query.direction = direction;
    if (since) {
      const date = new Date(since);
      if (!isNaN(date.getTime())) query.createdAt = { $gt: date };
    }
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      query.eventDate = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
    }

    const posts = await Post.find(query)
      .populate('author', AUTHOR_FIELDS)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Posts GET error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить публикации' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Войдите, чтобы публиковать' }, { status: 401 });
    }

    await dbConnect();
    const author = await User.findById(userId).select('isBlocked');
    if (!author) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    if (author.isBlocked) {
      return NextResponse.json({ error: 'Публикация недоступна' }, { status: 403 });
    }

    const body = await req.json();
    const { type, text, media, direction, location, eventDate, isUrgent, allowAttend } = body;

    if (!TYPES.includes(type)) {
      return NextResponse.json({ error: 'Неизвестный тип публикации' }, { status: 400 });
    }

    const cleanMedia: IMedia[] = Array.isArray(media)
      ? media
          .filter((m: unknown): m is { url: string; type: string } =>
            !!m && typeof (m as { url?: unknown }).url === 'string')
          .slice(0, MAX_MEDIA)
          .map(m => ({ url: m.url, type: m.type === 'video' ? ('video' as const) : ('image' as const) }))
      : [];

    if (!String(text || '').trim() && cleanMedia.length === 0) {
      return NextResponse.json({ error: 'Добавьте текст или медиа' }, { status: 400 });
    }
    if (cleanMedia.reduce((sum, m) => sum + m.url.length, 0) > MAX_MEDIA_CHARS) {
      return NextResponse.json({ error: 'Файлы слишком большие' }, { status: 400 });
    }

    const verdict = await moderateText(String(text || ''));
    if (!verdict.ok) {
      return NextResponse.json({ error: verdict.reason }, { status: 422 });
    }

    const post = await Post.create({
      type,
      author: userId,
      text: String(text || '').trim(),
      media: cleanMedia,
      direction: direction || '',
      location: location || '',
      eventDate: eventDate ? new Date(eventDate) : undefined,
      isUrgent: Boolean(isUrgent),
      allowAttend: Boolean(allowAttend),
    });

    const populated = await Post.findById(post._id).populate('author', AUTHOR_FIELDS).lean();
    return NextResponse.json({ post: populated });
  } catch (error) {
    console.error('Posts POST error:', error);
    return NextResponse.json({ error: 'Не удалось опубликовать' }, { status: 500 });
  }
}
