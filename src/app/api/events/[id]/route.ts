import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EventModel from '@/models/Event';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const e = await EventModel.findOne({ eventId: parseInt(params.id, 10) });

    if (!e) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      event: {
        _id: e._id.toString(),
        id: e.eventId,
        titleRu: e.titleRu,
        titleKz: e.titleKz,
        descRu: e.descRu,
        descKz: e.descKz,
        contentRu: e.contentRu,
        contentKz: e.contentKz,
        date: e.date,
        location: e.location,
        direction: e.direction,
        color: e.color,
        emoji: e.emoji,
        image: e.image,
        images: e.images,
      },
    });
  } catch (error) {
    console.error('Event fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
