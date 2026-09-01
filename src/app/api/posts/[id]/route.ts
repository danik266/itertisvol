import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import User from '@/models/User';
import { getUserIdFromCookie } from '@/lib/jwt';
import { notify } from '@/lib/notify';
import { moderateText } from '@/lib/moderation';
import { hasProfanity } from '@/lib/profanity';
import { cleanTime } from '@/lib/eventTime';

export const dynamic = 'force-dynamic';

const AUTHOR_FIELDS = 'firstName lastName avatar entityType orgName city directions';

const FEED_LINKS: Record<string, string> = {
  experience: '/experience',
  need: '/needs',
  announcement: '/announcements',
};

/** Лайк и отклик «я приду» — переключатели, поэтому один PATCH на оба действия. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Войдите, чтобы участвовать' }, { status: 401 });
    }

    await dbConnect();
    const { action } = await req.json();
    const post = await Post.findById(params.id);
    if (!post) return NextResponse.json({ error: 'Публикация не найдена' }, { status: 404 });

    const field = action === 'attend' ? 'attendees' : action === 'like' ? 'likes' : null;
    if (!field) return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
    if (field === 'attendees' && !post.allowAttend) {
      return NextResponse.json({ error: 'Отклики отключены автором' }, { status: 400 });
    }

    const list = post[field] as unknown as { toString(): string }[];
    const already = list.some(id => id.toString() === userId);
    await Post.updateOne(
      { _id: post._id },
      already ? { $pull: { [field]: userId } } : { $addToSet: { [field]: userId } }
    );

    // Уведомляем автора только когда действие включают, а не отменяют.
    if (!already) {
      await notify({
        user: post.author,
        actor: userId,
        post: post._id,
        type: field === 'attendees' ? 'attend' : 'like',
        text: field === 'attendees'
          ? 'Волонтёр откликнулся на вашу публикацию'
          : 'Вашу публикацию отметили',
        link: FEED_LINKS[post.type] || '/',
      });
    }

    const updated = await Post.findById(params.id).select('likes attendees').lean();
    return NextResponse.json({
      active: !already,
      likes: updated?.likes?.length ?? 0,
      attendees: updated?.attendees?.length ?? 0,
    });
  } catch (error) {
    console.error('Post PATCH error:', error);
    return NextResponse.json({ error: 'Не удалось выполнить действие' }, { status: 500 });
  }
}

/**
 * Правка публикации. Доступна автору и главному администратору — тем же,
 * кто может её удалить. Вложения не трогаем: их заменяют перезаливкой.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Войдите, чтобы редактировать' }, { status: 401 });

    await dbConnect();
    const [post, user] = await Promise.all([
      Post.findById(params.id),
      User.findById(userId).select('role isBlocked'),
    ]);
    if (!post) return NextResponse.json({ error: 'Публикация не найдена' }, { status: 404 });
    if (user?.isBlocked) return NextResponse.json({ error: 'Редактирование недоступно' }, { status: 403 });

    const isOwner = post.author.toString() === userId;
    if (!isOwner && user?.role !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на редактирование' }, { status: 403 });
    }

    const body = await req.json();
    const text = String(body.text ?? post.text).trim();
    const location = String(body.location ?? post.location ?? '').trim();

    if (!text && post.media.length === 0) {
      return NextResponse.json({ error: 'Добавьте текст или медиа' }, { status: 400 });
    }

    // Правка проходит ту же проверку, что и публикация: иначе через неё
    // можно было бы протащить в ленту то, что не пропустили при создании.
    if (text !== post.text) {
      const verdict = await moderateText(text);
      if (!verdict.ok) return NextResponse.json({ error: verdict.reason }, { status: 422 });
    }
    if (hasProfanity(location)) {
      return NextResponse.json({ error: 'Недопустимое слово в месте проведения' }, { status: 422 });
    }

    post.text = text;
    post.location = location;
    if ('direction' in body) post.direction = String(body.direction || '');
    if ('eventDate' in body) post.eventDate = body.eventDate ? new Date(body.eventDate) : undefined;
    if ('eventTime' in body) post.eventTime = cleanTime(body.eventTime);
    if ('isUrgent' in body) post.isUrgent = Boolean(body.isUrgent);
    if ('allowAttend' in body) post.allowAttend = Boolean(body.allowAttend);
    await post.save();

    const updated = await Post.findById(post._id).populate('author', AUTHOR_FIELDS).lean();
    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error('Post PUT error:', error);
    return NextResponse.json({ error: 'Не удалось сохранить изменения' }, { status: 500 });
  }
}

/** Удалить может автор публикации или главный администратор. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    await dbConnect();
    const [post, user] = await Promise.all([
      Post.findById(params.id).select('author'),
      User.findById(userId).select('role'),
    ]);
    if (!post) return NextResponse.json({ error: 'Публикация не найдена' }, { status: 404 });

    const isOwner = post.author.toString() === userId;
    if (!isOwner && user?.role !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на удаление' }, { status: 403 });
    }

    await Promise.all([
      Post.deleteOne({ _id: post._id }),
      Comment.deleteMany({ post: post._id }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post DELETE error:', error);
    return NextResponse.json({ error: 'Не удалось удалить' }, { status: 500 });
  }
}
