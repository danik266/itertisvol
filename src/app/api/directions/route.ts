import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Direction from '@/models/Direction';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const dirs = await Direction.find({});
    const mappedDirs = dirs.map(d => ({
        _id: d._id.toString(),
        id: d.id,
        icon: d.icon,
        color: d.color,
        bg: d.bg,
        labelRu: d.labelRu,
        labelKz: d.labelKz,
        descRu: d.descRu,
        descKz: d.descKz,
        tagsRu: d.tagsRu,
        tagsKz: d.tagsKz,
        image: d.image,
      }));
    return NextResponse.json({ directions: mappedDirs });
  } catch (error: unknown) {
    console.error('Directions error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить направления' }, { status: 500 });
  }
}
