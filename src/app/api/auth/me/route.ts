import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
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
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error('Auth me error:', error);
    return NextResponse.json({ user: null });
  }
}
