import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Organization from '@/models/Organization';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const org = await Organization.findOne({ orgId: Number(params.id) });
    
    if (!org) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      organization: {
        _id: org._id.toString(),
        id: org.orgId,
        name: org.name,
        direction: org.direction,
        descRu: org.descRu,
        descKz: org.descKz,
        contentRu: org.contentRu,
        contentKz: org.contentKz,
        logo: org.logo,
        gallery: org.gallery,
        city: org.city,
        phone: org.phone,
        email: org.email,
        social: org.social,
        volunteers: org.volunteers,
      }
    });
  } catch (error: unknown) {
    console.error('Org error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
