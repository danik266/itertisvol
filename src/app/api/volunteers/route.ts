import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/** Поля, безопасные для публичного показа: телефон и email не отдаём. */
const PUBLIC_FIELDS =
  'firstName lastName avatar city directions entityType orgName activityType socials bio createdAt';

/** В каталог попадают только волонтёры: обычные пользователи и админы скрыты. */
const CATALOG_FILTER = {
  accountType: 'volunteer',
  role: { $ne: 'admin' },
  isBlocked: { $ne: true },
} as const;

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const direction = searchParams.get('direction');
    const since = searchParams.get('since');
    const limit = Math.min(Number(searchParams.get('limit')) || 60, 200);

    const query: Record<string, unknown> = { ...CATALOG_FILTER };
    if (direction && direction !== 'all') query.directions = direction;
    // Лента в реальном времени: клиент дозапрашивает только тех, кто появился позже.
    if (since) {
      const date = new Date(since);
      if (!isNaN(date.getTime())) query.createdAt = { $gt: date };
    }

    const volunteers = await User.find(query)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const total = await User.countDocuments(CATALOG_FILTER);

    return NextResponse.json({ volunteers, total });
  } catch (error) {
    console.error('Volunteers error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить волонтёров' }, { status: 500 });
  }
}
