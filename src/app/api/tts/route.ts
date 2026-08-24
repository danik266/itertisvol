import { NextRequest, NextResponse } from 'next/server';
import TextToSpeech from "@google-cloud/text-to-speech";

// Initialize Google TTS client if key is present
let googleClient: any = null;
if (process.env.GOOGLE_TTS_API_KEY) {
  try {
    googleClient = new TextToSpeech.TextToSpeechClient({
      apiKey: process.env.GOOGLE_TTS_API_KEY,
    });
  } catch (e) {
    console.error('Google TTS Client Init failed:', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text: rawText, language } = await req.json();
    const lang = language === 'kz' ? 'kz' : 'ru';

    if (!rawText) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Синтезаторы проговаривают эмодзи и markdown вслух ("подмигивающее лицо",
    // "звёздочка"), поэтому убираем их из озвучки — в чате текст остаётся как есть.
    const text = String(rawText)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{20D0}-\u{20FF}\u{2122}\u{2139}\u{3030}\u{303D}]/gu, ' ')
      .replace(/[*_`#~]/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!text) {
      return NextResponse.json({ error: 'Nothing to speak' }, { status: 400 });
    }

    // 0. Official ISSAI Mangisoz TTS (The Absolute Gold Standard for Kazakh)
    const mangisozKey = process.env.MANGISOZ_API_KEY;
    if (lang === 'kz' && mangisozKey) {
      try {
        console.log('TTS: Trying Official Mangisoz (ISSAI)...');
        const params = new URLSearchParams({
          text,
          lang: "kk",
          speaker: "male",
        });
        const mRes = await fetch("https://mangisoz.nu.edu.kz/backend/api/v1/tts/audio", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-API-Key": mangisozKey,
          },
          body: params,
          signal: AbortSignal.timeout(10000)
        });
        if (mRes.ok) {
          console.log('Success: Mangisoz (ISSAI)');
          const buffer = await mRes.arrayBuffer();
          return new NextResponse(buffer, { headers: { "Content-Type": "audio/wav" } });
        }
      } catch (e: any) {
        console.warn('Mangisoz API failed, falling back:', e.message);
      }
    }

    // 1. Direct Microsoft Edge Neural TTS (Daulet/Dmitry)
    // Primary fallback / Russian choice: Best general neural quality.
    try {
      const voice = lang === 'kz' ? 'kk-KZ-DauletNeural' : 'ru-RU-DmitryNeural';
      console.log(`TTS: Trying Direct Edge Neural (${voice})...`);
      
      const audioUrl = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E97A7C030823F7E3F42&VoiceName=${voice}&Text=${encodeURIComponent(text)}&OutputFormat=audio-24khz-48kbitrate-mono-mp3`;

      const msRes = await fetch(audioUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (msRes.ok) {
        console.log(`Success: Microsoft Edge Neural (${voice})`);
        const buffer = await msRes.arrayBuffer();
        return new NextResponse(buffer, { headers: { 'Content-Type': 'audio/mpeg' } });
      }
    } catch (err: any) {
      console.warn('Edge TTS Error:', err.message);
    }

    // 2. Official Google Cloud TTS (Premium Fallback)
    if (googleClient) {
      try {
        console.log('TTS: Trying Google Cloud TTS (Official)...');
        const [response] = await googleClient.synthesizeSpeech({
          input: { text },
          voice: {
            languageCode: lang === 'kz' ? 'kk-KZ' : 'ru-RU',
            ssmlGender: 'MALE',
            name: lang === 'kz' ? 'kk-KZ-Standard-A' : 'ru-RU-Wavenet-B'
          },
          audioConfig: { audioEncoding: 'MP3' },
        });

        if (response.audioContent) {
          console.log('Success: Google Cloud TTS');
          return new NextResponse(new Uint8Array(response.audioContent as Buffer), {
            headers: { 'Content-Type': 'audio/mpeg' },
          });
        }
      } catch (err: any) {
        console.warn('Google Cloud TTS failed:', err.message);
      }
    }

    // 3. Final Failsafe: Google Translate (Free Public API)
    try {
      const gLang = lang === 'kz' ? 'kk' : 'ru';
      console.log('TTS: Final Failsafe (Google Translate Public)...');
      const gRes = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${gLang}&client=tw-ob`);
      if (gRes.ok) {
        console.log('Success: Google Translate Public');
        const buffer = await gRes.arrayBuffer();
        return new NextResponse(buffer, { headers: { 'Content-Type': 'audio/mpeg' } });
      }
    } catch (e) {}

    return NextResponse.json({ error: 'All TTS failed' }, { status: 501 });

  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'TTS processing failed' }, { status: 500 });
  }
}
