import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (elevenLabsKey) {
      // Use ElevenLabs (Voice ID: 'EXAVITQu4vr4xnSDxMaL' is a popular one, or 'pFZP5JQG7iQjIQuC4Bku')
      const voiceId = 'pNInz6obpgDQGcFmaJcg'; // Adam (Russian supported on multilingual v2)
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
        }),
      });

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: { 'Content-Type': 'audio/mpeg' },
        });
      }
    }

    if (openaiKey) {
      // Use OpenAI TTS
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'onyx', // 'onyx' or 'echo' for male, 'nova' or 'shimmer' for female
        }),
      });

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: { 'Content-Type': 'audio/mpeg' },
        });
      }
    }

    return NextResponse.json({ error: 'Premium TTS API endpoints not configured' }, { status: 501 });

  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'TTS processing failed' }, { status: 500 });
  }
}
