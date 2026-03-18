import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Direction from '@/models/Direction';
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
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    const data = await req.json();
    console.log('Direction POST data:', JSON.stringify(data));
    const newDir = await Direction.create(data);
    return NextResponse.json({ direction: newDir });
  } catch (error: any) {
    console.error('Direction POST error:', error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  try {
    const data = await req.json();
    const { _id, ...updates } = data;
    const updated = await Direction.findByIdAndUpdate(_id, updates, { new: true });
    return NextResponse.json({ direction: updated });
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
    await Direction.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
