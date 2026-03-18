import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Organization from '@/models/Organization';
import User from '@/models/User';
import { getUserIdFromCookie } from '@/lib/jwt';

async function checkAdmin() {
  const userId = await getUserIdFromCookie();
  if (!userId) return false;
  await dbConnect();
  const user = await User.findById(userId);
  return user?.role === 'admin';
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  try {
    const data = await req.json();
    const newOrg = await Organization.create({ ...data, orgId: Date.now() });
    return NextResponse.json({ organization: newOrg });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  try {
    const data = await req.json();
    const { _id, ...updates } = data;
    const updated = await Organization.findByIdAndUpdate(_id, updates, { new: true });
    return NextResponse.json({ organization: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID не указан' }, { status: 400 });
    await Organization.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
