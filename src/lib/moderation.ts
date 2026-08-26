/**
 * Модерация пользовательского текста в два уровня:
 * 1) быстрый локальный фильтр по корням бранных слов — работает всегда и бесплатно;
 * 2) модель Groq gpt-oss-safeguard — ловит то, что фильтр не видит
 *    (оскорбления без мата, травля, спам). Если Groq недоступен, публикация
 *    не блокируется: первый уровень уже отработал.
 */

export interface ModerationResult {
  ok: boolean;
  reason: string;
}

// Явный мат: ищем как подстроку в слитном тексте, чтобы ловить «х у й» и «xyй».
const PROFANITY_ROOTS = [
  'хуй', 'хуе', 'хуя', 'пизд', 'ебан', 'ебат', 'ебал', 'ебуч', 'еблан', 'ебуч',
  'бляд', 'блят', 'мудак', 'мудил', 'гандон', 'долбоеб', 'уебок', 'уебищ',
  'пидор', 'пидар', 'залуп', 'шлюх', 'потаскух', 'ублюдок', 'котак', 'амкос',
];

// Слова, которые встречаются внутри обычных («сука» в «Сукачёв»),
// поэтому сверяем их только целиком.
const PROFANITY_WORDS = [
  'сука', 'суки', 'суке', 'сукой', 'сучка', 'гнида', 'тварь', 'дебил',
  'даун', 'манда', 'сикт', 'сiкт',
];

/** Похожие латинские буквы приводим к кириллице, чтобы «xyй» тоже ловился. */
const HOMOGLYPHS: Record<string, string> = {
  a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м',
  o: 'о', p: 'р', t: 'т', x: 'х', y: 'у', u: 'у', i: 'и', 3: 'з', 0: 'о', 4: 'ч',
};

function mapChars(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map(ch => HOMOGLYPHS[ch] ?? ch)
    .join('');
}

/** Растянутые буквы схлопываем полностью: «пиииизда» -> «пизда». */
function squeeze(text: string): string {
  return text.replace(/(.)\1+/g, '$1');
}

export function hasProfanity(text: string): boolean {
  const mapped = mapChars(text);

  // 1) слитный текст без разделителей — ловит разбивку пробелами и точками
  const glued = squeeze(mapped.replace(/[^a-zа-яёіңғүұқөһ]+/gi, ''));
  if (PROFANITY_ROOTS.some(root => glued.includes(root))) return true;

  // 2) отдельные слова — для омонимичных корней
  const words = mapped.split(/[^a-zа-яёіңғүұқөһ]+/i).filter(Boolean);
  return words.some(word => {
    const w = squeeze(word);
    return PROFANITY_WORDS.some(bad => w === bad || w === squeeze(bad));
  });
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
