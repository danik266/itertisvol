import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { firstName, lastName, email, password, city, phone, dob } = body;

    if (!email || !password || !firstName || !lastName || !dob || !city || !phone) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName: lastName || '',
      email: email.toLowerCase(),
      password: hashedPassword,
      city: city || '',
      phone: phone || '',
      dob: dob || '',
      appliedOrgs: [],
      appliedEvents: [],
      generationHistory: [],
    });

    const token = await signToken(user._id.toString());
    await setAuthCookie(token);

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
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
