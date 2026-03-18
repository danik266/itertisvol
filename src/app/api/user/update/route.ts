import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserIdFromCookie } from '@/lib/jwt';

export async function PATCH(req: Request) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    // Only allow updating safe fields
    const allowedFields = [
      'direction',
      'scores',
      'appliedOrgs',
      'appliedEvents',
      'generationHistory',
      'firstName',
      'lastName',
      'city',
      'phone',
      'dob',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        city: user.city,
        phone: user.phone,
        dob: user.dob,
        direction: user.direction,
        scores: user.scores,
        appliedOrgs: user.appliedOrgs,
        appliedEvents: user.appliedEvents,
        generationHistory: user.generationHistory,
      },
    });
  } catch (error: unknown) {
    console.error('User update error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
