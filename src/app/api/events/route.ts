import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EventModel from '@/models/Event';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const evts = await EventModel.find({}).sort({ eventId: 1 });
    return NextResponse.json({
      events: evts.map((e) => ({
        _id: e._id.toString(),
        id: e.eventId,
        titleRu: e.titleRu,
        titleKz: e.titleKz,
        descRu: e.descRu,
        descKz: e.descKz,
        date: e.date,
        location: e.location,
        direction: e.direction,
        color: e.color,
        emoji: e.emoji,
        image: e.image,
      })),
    });
  } catch (error: unknown) {
    console.error('Events error:', error);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
