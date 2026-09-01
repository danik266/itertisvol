import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getUserIdFromCookie } from '@/lib/jwt';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Generation, { GenerationKind } from '@/models/Generation';
import { storeImage } from '@/lib/storeImage';

/** Сколько генераций в сутки доступно одному волонтёру. */
const DAILY_LIMIT = 4;

/** Холодный старт модели занимает до минуты, поэтому просим у хостинга запас по времени. */
export const maxDuration = 60;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/** Один вызов Groq: текстовые задачи и подготовка промптов идут через него. */
async function groqChat(
  system: string,
  user: string,
  maxTokens: number,
  temperature = 0.7,
  reasoningEffort?: 'low' | 'medium' | 'high',
): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature,
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    }),
  });

  if (!res.ok) {
    console.error('Groq error:', await res.text());
    throw new Error('Groq API Error');
  }

  const data = await res.json();
  return String(data.choices?.[0]?.message?.content || '').trim();
}

/**
 * Волонтёры пишут запрос по-русски, а Flux понимает английский заметно лучше:
 * с русского он ловит два-три слова и рисует что-то своё. Поэтому просьбу
 * сначала переводим и разворачиваем в подробное английское описание.
 */
const PROMPT_WRITER = `You write prompts for the FLUX text-to-image model.
Rewrite the user's request in English as ONE vivid, concrete visual description.
Rules:
- Output only the prompt itself. No quotes, no explanations, no preamble.
- Keep every meaningful detail the user asked for: colours, symbols, objects, style.
- Describe what is visible in the frame, not intentions or feelings.
- Do NOT invent slogans or lettering. Written words come out garbled and ruin the
  image. Only keep text if the user explicitly named the exact words, and then
  repeat them verbatim in quotes.
- Aim for 40-70 words.`;

async function toImagePrompt(request: string, brief: string): Promise<string> {
  try {
    /**
     * Запас по токенам и низкое усилие рассуждений: gpt-oss сначала думает,
     * и на 300 токенах ответ обрывался на полуслове либо не доходил вовсе.
     */
    const written = await groqChat(
      PROMPT_WRITER,
      `${brief}\n\nЗапрос пользователя: "${request}"`,
      700,
      0.6,
      'low',
    );
    const clean = written.replace(/^["'«»]+|["'«»]+$/g, '').trim();
    return clean.length > 10 ? clean : request;
  } catch {
    // Перевод — улучшение, а не обязательный шаг: без него просто рисуем как есть.
    return request;
  }
}

/**
 * Кладёт результат в историю. Сбой записи не должен ронять саму генерацию:
 * волонтёру важнее увидеть картинку, чем сохранить её в архив.
 */
async function remember(author: string, kind: GenerationKind, prompt: string, fields: { imageUrl?: string; text?: string }) {
  try {
    await Generation.create({ author, kind, prompt, ...fields });
  } catch (error) {
    console.error('Generation history save failed:', error);
  }
}

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
    const user = await User.findById(userId).select('generationCount generationResetAt isBlocked role');
    if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    if (user.isBlocked) return NextResponse.json({ error: 'Генерация недоступна' }, { status: 403 });

    // Главному администратору лимит не считаем: он показывает генератор со
    // сцены и правит контент, четырёх попыток в сутки на это не хватает.
    const unlimited = user.role === 'admin';

    // Счётчик обнуляется в начале новых суток.
    const now = new Date();
    const resetAt = user.generationResetAt ? new Date(user.generationResetAt) : null;
    const sameDay =
      resetAt &&
      resetAt.getFullYear() === now.getFullYear() &&
      resetAt.getMonth() === now.getMonth() &&
      resetAt.getDate() === now.getDate();

    const used = sameDay ? user.generationCount : 0;
    if (!unlimited && used >= DAILY_LIMIT) {
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
      unlimited
        ? Promise.resolve()
        : User.updateOne(
            { _id: userId },
            sameDay
              ? { $inc: { generationCount: 1 } }
              : { $set: { generationCount: 1, generationResetAt: now } }
          );

    if (type === 'image') {
      const described = await toImagePrompt(prompt, 'Иллюстрация для волонтёрского сообщества.');
      const imageUrl = await generateImage('black-forest-labs/flux-1.1-pro', {
        prompt: `${described} Natural lighting, realistic proportions, sharp focus, high detail.`,
        prompt_upsampling: true,
        aspect_ratio: '4:3',
        output_format: 'jpg',
      });
      const stored = await storeImage(imageUrl);
      await chargeAttempt();
      await remember(userId, 'image', prompt, { imageUrl: stored });
      return NextResponse.json({ type: 'image', result: stored });
    } else if (type === 'merch') {
      const described = await toImagePrompt(
        prompt,
        'Мокап одежды для волонтёров: футболка, худи или жилет. Опиши цвет ткани, крой и рисунок на груди.'
      );
      /**
       * Модель посильнее и явный запрет на выдуманные надписи: schnell рисовал
       * на футболках бессмысленные буквы вроде «VULDER RECTNECCIVE», и вместо
       * волонтёрской формы получалась спортивная форма неизвестного клуба.
       */
      const enhancedPrompt = `Product photography mockup of volunteer team apparel. ${described} Flat lay garment mockup, front view and back view side by side, isolated on a plain pure white background. Simple casual cut, not a sports jersey. No people, no mannequins, no hangers, no props, no shadows of objects. Do not add any invented lettering, logos or slogans — leave the fabric clean unless specific words were described. Soft even studio lighting, crisp fabric texture, high resolution.`;
      const imageUrl = await generateImage('black-forest-labs/flux-1.1-pro', {
        prompt: enhancedPrompt,
        prompt_upsampling: true,
        aspect_ratio: '4:3',
        output_format: 'jpg',
      });
      const stored = await storeImage(imageUrl);
      await chargeAttempt();
      await remember(userId, 'merch', prompt, { imageUrl: stored });
      return NextResponse.json({ type: 'image', result: stored });
    } else if (type === 'logo') {
      const described = await toImagePrompt(
        prompt,
        'Эмблема волонтёрской организации. Опиши символ, форму и два-три цвета.'
      );
      const enhancedPrompt = `Flat vector logo design. ${described} Single centered emblem on a plain pure white background, clean geometric shapes, bold silhouette, limited colour palette, crisp edges, no gradients, no photorealism, no mockup, no background scenery. Do not add invented lettering or slogans unless specific words were described.`;
      const imageUrl = await generateImage('black-forest-labs/flux-1.1-pro', {
        prompt: enhancedPrompt,
        prompt_upsampling: true,
        aspect_ratio: '1:1',
        output_format: 'jpg',
      });
      const stored = await storeImage(imageUrl);
      await chargeAttempt();
      await remember(userId, 'logo', prompt, { imageUrl: stored });
      return NextResponse.json({ type: 'image', result: stored });
    } else if (type === 'scenario') {
      const systemPrompt = `Ты — профессиональный организатор мероприятий и координатор волонтёров.
Пиши подробные, чёткие и реалистичные сценарии мероприятий на русском языке.
Обязательно включай тайминг, распределение ролей и список инвентаря.

Оформление:
- Заголовки разделов — строкой вида «## Название».
- Расписание и роли — таблицами Markdown с заголовком и разделителем.
- Списки — строками, начинающимися с «- ».
- Выделяй важное двойными звёздочками.
- Не используй горизонтальные линии из дефисов.`;

      const text = await groqChat(systemPrompt, `Напиши подробный сценарий для мероприятия: "${prompt}"`, 1800);

      await chargeAttempt();
      await remember(userId, 'scenario', prompt, { text });
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
