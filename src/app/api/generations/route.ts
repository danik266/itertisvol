import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Generation from '@/models/Generation';
import { getUserIdFromCookie } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

/** История своя и только своя: чужие запросы и результаты не отдаём. */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    await dbConnect();
    const limit = Math.min(Number(new URL(req.url).searchParams.get('limit')) || 30, 60);

    const items = await Generation.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('kind prompt imageUrl text createdAt')
      .lean();

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Generations GET error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить историю' }, { status: 500 });
  }
}

/** Очистка истории — целиком, по кнопке в интерфейсе. */
export async function DELETE() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    await dbConnect();
    await Generation.deleteMany({ author: userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Generations DELETE error:', error);
    return NextResponse.json({ error: 'Не удалось очистить историю' }, { status: 500 });
  }
}
