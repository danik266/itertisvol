import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getUserIdFromCookie } from '@/lib/jwt';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

/** Сколько генераций в сутки доступно одному волонтёру. */
const DAILY_LIMIT = 4;

/** Холодный старт модели занимает до минуты, поэтому просим у хостинга запас по времени. */
export const maxDuration = 60;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Генерирует картинку и возвращает ссылку на неё.
 *
 * Намеренно не используем replicate.run(): для flux-schnell он бросает ожидание,
 * пока предсказание ещё в статусе processing, и отдаёт null — на фронт уезжала
 * строка "null" вместо ссылки, и вместо картинки была пустая рамка.
 */
async function generateImage(model: `${string}/${string}`, input: Record<string, unknown>): Promise<string> {
  const created = await replicate.predictions.create({ model, input });
  const prediction = await replicate.wait(created);

  if (prediction.status !== 'succeeded') {
    throw new Error(prediction.error ? String(prediction.error) : 'Модель не смогла сгенерировать изображение');
  }

  const output = prediction.output;
  const item = Array.isArray(output) ? output[0] : output;
  const url = typeof item === 'string' ? item : item?.url;

  if (typeof url !== 'string' || !url.startsWith('http')) {
    throw new Error('Модель не вернула ссылку на изображение');
  }

  return url;
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { type, prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Запрос не может быть пустым' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(userId).select('generationCount generationResetAt isBlocked');
    if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    if (user.isBlocked) return NextResponse.json({ error: 'Генерация недоступна' }, { status: 403 });

    // Счётчик обнуляется в начале новых суток.
    const now = new Date();
    const resetAt = user.generationResetAt ? new Date(user.generationResetAt) : null;
    const sameDay =
      resetAt &&
      resetAt.getFullYear() === now.getFullYear() &&
      resetAt.getMonth() === now.getMonth() &&
      resetAt.getDate() === now.getDate();

    const used = sameDay ? user.generationCount : 0;
    if (used >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Дневной лимит исчерпан: ${DAILY_LIMIT} генерации в сутки. Попробуйте завтра.`,
          limit: DAILY_LIMIT,
          used,
        },
        { status: 429 }
      );
    }

    /**
     * Списываем попытку только после удачной генерации: иначе сбой на стороне
     * нейросети съедал бы дневной лимит, не отдав волонтёру ничего взамен.
     */
    const chargeAttempt = () =>
      User.updateOne(
        { _id: userId },
        sameDay
          ? { $inc: { generationCount: 1 } }
          : { $set: { generationCount: 1, generationResetAt: now } }
      );

    if (type === 'image') {
      const imageUrl = await generateImage('black-forest-labs/flux-1.1-pro', {
        prompt: prompt,
        prompt_upsampling: true,
      });
      await chargeAttempt();
      return NextResponse.json({ type: 'image', result: imageUrl });
    } else if (type === 'merch') {
      const enhancedPrompt = `Professional 3D render or clean flat mockup of volunteer organization merchandise apparel. ${prompt}. FRONT AND BACK VIEW ONLY. Exactly one strictly isolated clothing object on a clean solid white background. STRICTLY NO PEOPLE, NO MANNEQUINS, NO EXTRA PROPS, NO SHOES, NO ACCESSORIES, NO BACKGROUND OBJECTS. Minimalist product showcase, 8k resolution, highly detailed photorealistic clothing design.`;
      const imageUrl = await generateImage('black-forest-labs/flux-schnell', { prompt: enhancedPrompt });
      await chargeAttempt();
      return NextResponse.json({ type: 'image', result: imageUrl });
    } else if (type === 'logo') {
      const enhancedPrompt = `Professional modern vector flat logo design for a volunteer organization. ${prompt}. Clean solid white background, minimalist, high resolution, crisp lines, corporate identity.`;
      const imageUrl = await generateImage('black-forest-labs/flux-schnell', { prompt: enhancedPrompt });
      await chargeAttempt();
      return NextResponse.json({ type: 'image', result: imageUrl });
    } else if (type === 'scenario') {
      const systemPrompt = "Ты — профессиональный организатор мероприятий и координатор волонтёров. Твоя задача писать подробные, чёткие и реалистичные сценарии мероприятий на русском языке. Включай тайминг, распределение ролей и список инвентаря.";

      const groqReq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Напиши подробный сценарий для мероприятия: "${prompt}"` }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!groqReq.ok) {
        const errText = await groqReq.text();
        console.error('Groq error:', errText);
        throw new Error('Groq API Error');
      }

      const groqData = await groqReq.json();
      const text = groqData.choices[0].message.content;

      await chargeAttempt();
      return NextResponse.json({ type: 'text', result: text });
    } else {
      return NextResponse.json({ error: 'Неизвестный тип генератора' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Generation error:', error);

    // Кончились деньги на счету Replicate — сообщаем понятно, а не «ошибка 402».
    if (error.message?.includes('402') || error.message?.toLowerCase().includes('insufficient credit')) {
      return NextResponse.json({
        error: 'Сервис генерации временно недоступен. Мы уже разбираемся, попробуйте позже.'
      }, { status: 503 });
    }

    // Check if it's a rate limit error from Replicate
    if (error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('throttled')) {
      return NextResponse.json({
        error: 'Сервер нейросети временно перегружен (слишком много запросов). Пожалуйста, подождите 10 секунд и попробуйте снова!'
      }, { status: 429 });
    }

    return NextResponse.json({ error: 'Ошибка генерации AI: ' + error.message }, { status: 500 });
  }
}
