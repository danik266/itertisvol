import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import User from '@/models/User';
import { getUserIdFromCookie } from '@/lib/jwt';
import { moderateText } from '@/lib/moderation';
import { notify } from '@/lib/notify';

export const dynamic = 'force-dynamic';

const AUTHOR_FIELDS = 'firstName lastName avatar entityType orgName';

const FEED_LINKS: Record<string, string> = {
  experience: '/experience',
  need: '/needs',
  announcement: '/announcements',
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const comments = await Comment.find({ post: params.id, status: 'published' })
      .populate('author', AUTHOR_FIELDS)
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Comments GET error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить комментарии' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Комментировать могут только зарегистрированные волонтёры.
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Войдите, чтобы комментировать' }, { status: 401 });
    }

    await dbConnect();
    const [post, user] = await Promise.all([
      Post.findById(params.id).select('_id author type'),
      User.findById(userId).select('isBlocked'),
    ]);
    if (!post) return NextResponse.json({ error: 'Публикация не найдена' }, { status: 404 });
    if (user?.isBlocked) return NextResponse.json({ error: 'Комментарии недоступны' }, { status: 403 });

    const { text } = await req.json();
    const trimmed = String(text || '').trim();
    if (!trimmed) return NextResponse.json({ error: 'Пустой комментарий' }, { status: 400 });
    if (trimmed.length > 1000) {
      return NextResponse.json({ error: 'Слишком длинный комментарий' }, { status: 400 });
    }

    const verdict = await moderateText(trimmed);
    if (!verdict.ok) return NextResponse.json({ error: verdict.reason }, { status: 422 });

    const created = await Comment.create({ post: post._id, author: userId, text: trimmed });

    await notify({
      user: post.author,
      actor: userId,
      post: post._id,
      type: 'comment',
      text: 'Новый комментарий к вашей публикации',
      link: FEED_LINKS[post.type] || '/',
    });
    const populated = await Comment.findById(created._id).populate('author', AUTHOR_FIELDS).lean();
    return NextResponse.json({ comment: populated });
  } catch (error) {
    console.error('Comments POST error:', error);
    return NextResponse.json({ error: 'Не удалось отправить комментарий' }, { status: 500 });
  }
}
