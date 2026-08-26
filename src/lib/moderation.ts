/**
 * Модерация пользовательского текста в два уровня:
 * 1) быстрый локальный фильтр по корням бранных слов — работает всегда и бесплатно;
 * 2) модель Groq gpt-oss-safeguard — ловит то, что фильтр не видит
 *    (оскорбления без мата, травля, спам). Если Groq недоступен, публикация
 *    не блокируется: первый уровень уже отработал.
 */

import { hasProfanity } from '@/lib/profanity';

export interface ModerationResult {
  ok: boolean;
  reason: string;
}

const SAFEGUARD_PROMPT = `Ты модератор волонтёрской платформы. Оцени текст пользователя.
Он недопустим, если содержит: оскорбления, травлю, угрозы, разжигание вражды,
порнографию, пропаганду наркотиков или насилия, мошенничество, спам и рекламу.
Обычные просьбы о помощи, рассказы о волонтёрстве и объявления о мероприятиях — допустимы.
Ответь строго одним словом: ALLOW или BLOCK.`;

async function checkWithGroq(text: string): Promise<ModerationResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'openai/gpt-oss-safeguard-20b',
        messages: [
          { role: 'system', content: SAFEGUARD_PROMPT },
          { role: 'user', content: text.slice(0, 2000) },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const verdict = String(data.choices?.[0]?.message?.content || '').toUpperCase();
    if (verdict.includes('BLOCK')) {
      return { ok: false, reason: 'Текст не прошёл проверку на недопустимое содержание' };
    }
    return { ok: true, reason: '' };
  } catch {
    return null;
  }
}

export async function moderateText(text: string): Promise<ModerationResult> {
  const trimmed = (text || '').trim();
  if (!trimmed) return { ok: true, reason: '' };

  if (hasProfanity(trimmed)) {
    return { ok: false, reason: 'В тексте есть нецензурная лексика' };
  }

  const viaModel = await checkWithGroq(trimmed);
  // Groq недоступен — доверяем локальному фильтру, не блокируем публикацию.
  return viaModel ?? { ok: true, reason: '' };
}

/** Человекочитаемые названия полей — попадают в текст ошибки. */
const FIELD_LABELS: Record<string, string> = {
  firstName: 'имени',
  lastName: 'фамилии',
  orgName: 'названии организации',
  activityType: 'виде деятельности',
  city: 'городе',
  address: 'адресе',
  bio: 'описании',
  text: 'тексте',
  location: 'месте проведения',
};

/**
 * Проверка анкеты. Словарь применяем ко всем полям — это мгновенно, а модель
 * зовём один раз и только для связного текста: гонять её по имени и городу
 * значило бы задерживать регистрацию впустую.
 */
export async function moderateProfile(
  fields: Record<string, string | undefined>
): Promise<ModerationResult> {
  for (const [name, value] of Object.entries(fields)) {
    const trimmed = (value || '').trim();
    if (trimmed && hasProfanity(trimmed)) {
      const where = FIELD_LABELS[name] || 'анкете';
      return { ok: false, reason: `Недопустимое слово в ${where}` };
    }
  }

  const prose = (fields.bio || '').trim();
  if (prose.length < 20) return { ok: true, reason: '' };

  const viaModel = await checkWithGroq(prose);
  return viaModel ?? { ok: true, reason: '' };
}
