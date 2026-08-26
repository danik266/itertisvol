import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/jwt';
import { serializeUser } from '@/lib/serializeUser';
import { moderateProfile } from '@/lib/moderation';

const SOCIAL_KEYS = ['instagram', 'telegram', 'whatsapp', 'facebook', 'website'] as const;
/** Аватар приходит как data URL, сжатый на клиенте. Ограничиваем ~300 КБ. */
const MAX_AVATAR_CHARS = 400_000;

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      firstName, lastName, email, password, city, phone, dob,
      accountType, entityType, orgName, activityType, address, avatar, bio, socials, directions,
    } = body;

    const isLegal = entityType === 'legal';
    // Волонтёр попадает в каталог и выбирает направления; обычный пользователь — нет.
    const isVolunteer = accountType !== 'user';

    if (!email || !password || !firstName || !city || !phone) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
    }
    if (isLegal && !orgName) {
      return NextResponse.json({ error: 'Укажите наименование организации' }, { status: 400 });
    }
    if (!isLegal && !lastName) {
      return NextResponse.json({ error: 'Укажите фамилию' }, { status: 400 });
    }
    if (isVolunteer && (!Array.isArray(directions) || directions.length === 0)) {
      return NextResponse.json({ error: 'Выберите хотя бы одно направление' }, { status: 400 });
    }

    // Анкета попадает в общий каталог, поэтому проверяем её так же строго,
    // как публикации: имя и описание видят все посетители.
    const clean = await moderateProfile({
      firstName, lastName, orgName, activityType, city, address, bio,
    });
    if (!clean.ok) {
      return NextResponse.json({ error: clean.reason }, { status: 422 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Неверный формат email' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Пароль должен содержать минимум 6 символов' }, { status: 400 });
    }
    if (typeof avatar === 'string' && avatar.length > MAX_AVATAR_CHARS) {
      return NextResponse.json({ error: 'Фото слишком большое' }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 });
    }

    const cleanSocials: Record<string, string> = {};
    for (const key of SOCIAL_KEYS) {
      const value = socials?.[key];
      if (typeof value === 'string' && value.trim()) cleanSocials[key] = value.trim();
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
      accountType: isVolunteer ? 'volunteer' : 'user',
      entityType: isLegal ? 'legal' : 'individual',
      orgName: isLegal ? orgName : '',
      activityType: activityType || '',
      address: address || '',
      avatar: typeof avatar === 'string' ? avatar : '',
      bio: bio || '',
      socials: cleanSocials,
      directions: isVolunteer
        ? (directions as unknown[]).filter((d): d is string => typeof d === 'string')
        : [],
      appliedEvents: [],
      generationHistory: [],
    });

    const token = await signToken(user._id.toString());
    await setAuthCookie(token);

    return NextResponse.json({ user: serializeUser(user) });
  } catch (error: unknown) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
