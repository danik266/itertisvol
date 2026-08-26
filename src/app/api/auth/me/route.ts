import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { serializeUser } from '@/lib/serializeUser';
import { getUserIdFromCookie } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ user: null });
    }

    await dbConnect();
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: serializeUser(user) });
  } catch (error: unknown) {
    console.error('Auth me error:', error);
    return NextResponse.json({ user: null });
  }
}
