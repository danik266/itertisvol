import { NextRequest, NextResponse } from 'next/server';
import TextToSpeech from '@google-cloud/text-to-speech';
import { speechLang, forSpeech } from '@/lib/speech';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

let googleClient: any = null;
if (process.env.GOOGLE_TTS_API_KEY) {
  try {
    googleClient = new TextToSpeech.TextToSpeechClient({ apiKey: process.env.GOOGLE_TTS_API_KEY });
  } catch (e) {
    console.error('Google TTS client init failed:', e);
  }
}

/** Голос помощника мужской: по умолчанию Adam из мультиязычных голосов ElevenLabs. */
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

/**
 * Озвучка ответа помощника.
 *
 * Порядок такой: казахский читает Mangisoz — это официальный синтез ISSAI,
 * и звучит он на казахском лучше всех. Русский и английский идут в
 * ElevenLabs: один голос читает оба языка, поэтому «IT Ertis Volunteer»
 * внутри русской фразы не превращается в кашу. Дальше — Google Cloud,
 * и только в самом конце публичный голос Google Translate: он женский и
 * механический, поэтому используется, лишь когда не осталось ничего.
 *
 * Прежний основной путь, Edge Neural, убран: Microsoft закрыла этот адрес,
 * он отвечает 404, и каждая фраза впустую ходила туда перед запасным.
 */
export async function POST(req: NextRequest) {
  try {
    const { text: rawText, language } = await req.json();
    if (!rawText) return NextResponse.json({ error: 'Нет текста' }, { status: 400 });

    const text = forSpeech(rawText);
    if (!text) return NextResponse.json({ error: 'Нечего озвучивать' }, { status: 400 });

    const lang = speechLang(text, language);

    // 1. Казахский — Mangisoz (ISSAI), мужской голос.
    if (lang === 'kk' && process.env.MANGISOZ_API_KEY) {
      try {
        const res = await fetch('https://mangisoz.nu.edu.kz/backend/api/v1/tts/audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-API-Key': process.env.MANGISOZ_API_KEY,
          },
          body: new URLSearchParams({ text, lang: 'kk', speaker: 'male' }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          return new NextResponse(await res.arrayBuffer(), { headers: { 'Content-Type': 'audio/wav' } });
        }
        console.warn('Mangisoz answered', res.status);
      } catch (e: any) {
        console.warn('Mangisoz failed:', e.message);
      }
    }

    // 2. ElevenLabs — один мультиязычный голос на русский и английский.
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}?output_format=mp3_44100_128`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              model_id: 'eleven_turbo_v2_5',
              voice_settings: { stability: 0.4, similarity_boost: 0.75 },
            }),
            signal: AbortSignal.timeout(20000),
          }
        );
        if (res.ok) {
          return new NextResponse(await res.arrayBuffer(), { headers: { 'Content-Type': 'audio/mpeg' } });
        }
        console.warn('ElevenLabs answered', res.status, await res.text());
      } catch (e: any) {
        console.warn('ElevenLabs failed:', e.message);
      }
    }

    // 3. Google Cloud — мужские голоса обоих языков.
    if (googleClient) {
      try {
        const [response] = await googleClient.synthesizeSpeech({
          input: { text },
          voice: {
            languageCode: lang === 'kk' ? 'kk-KZ' : 'ru-RU',
            ssmlGender: 'MALE',
            name: lang === 'kk' ? 'kk-KZ-Standard-A' : 'ru-RU-Wavenet-D',
          },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 1.05 },
        });
        if (response.audioContent) {
          return new NextResponse(new Uint8Array(response.audioContent as Buffer), {
            headers: { 'Content-Type': 'audio/mpeg' },
          });
        }
      } catch (e: any) {
        console.warn('Google Cloud TTS failed:', e.message);
      }
    }

    // 4. Последняя надежда: публичный голос Google Translate.
    try {
      const res = await fetch(
        `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0, 200))}&tl=${lang}&client=tw-ob`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        return new NextResponse(await res.arrayBuffer(), { headers: { 'Content-Type': 'audio/mpeg' } });
      }
    } catch {
      // дальше уже нечем
    }

    return NextResponse.json({ error: 'Синтез речи недоступен' }, { status: 503 });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Ошибка синтеза речи' }, { status: 500 });
  }
}
