import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getUserIdFromCookie } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ notifications: [], unread: 0 });

    await dbConnect();
    const [notifications, unread] = await Promise.all([
      Notification.find({ user: userId })
        .populate('actor', 'firstName lastName avatar entityType orgName')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    return NextResponse.json({ notifications, unread });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ notifications: [], unread: 0 });
  }
}

/** Пометить все уведомления прочитанными (или одно, если передан id). */
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    await dbConnect();
    const { id } = await req.json().catch(() => ({ id: undefined }));
    const filter = id ? { _id: id, user: userId } : { user: userId, isRead: false };
    await Notification.updateMany(filter, { $set: { isRead: true } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: 'Не удалось обновить' }, { status: 500 });
  }
}
