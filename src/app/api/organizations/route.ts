import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Organization from '@/models/Organization';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const orgs = await Organization.find({}).sort({ orgId: 1 });
    return NextResponse.json({
      organizations: orgs.map((o) => ({
        _id: o._id.toString(),
        id: o.orgId,
        name: o.name,
        direction: o.direction,
        descRu: o.descRu,
        descKz: o.descKz,
        contentRu: o.contentRu,
        contentKz: o.contentKz,
        logo: o.logo,
        city: o.city,
        phone: o.phone,
        email: o.email,
        social: o.social,
        volunteers: o.volunteers,
      })),
    });
  } catch (error: unknown) {
    console.error('Orgs error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить организации' }, { status: 500 });
  }
}
