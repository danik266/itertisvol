import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getUserIdFromCookie } from '@/lib/jwt';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

    let output: any;

    if (type === 'image') {
      output = await replicate.run('black-forest-labs/flux-1.1-pro', {
        input: { prompt: prompt, prompt_upsampling: true },
      });
      
      let imageUrl = '';
      if (Array.isArray(output)) {
        imageUrl = typeof output[0] === 'string' ? output[0] : (output[0].url ? output[0].url().href || output[0].url() : String(output[0]));
      } else if (output && typeof output.url === 'function') {
        imageUrl = output.url().href || output.url();
      } else {
        imageUrl = String(output);
      }
      
      return NextResponse.json({ type: 'image', result: imageUrl });
    } else if (type === 'merch') {
      const enhancedPrompt = `Professional 3D render or clean flat mockup of volunteer organization merchandise apparel. ${prompt}. FRONT AND BACK VIEW ONLY. Exactly one strictly isolated clothing object on a clean solid white background. STRICTLY NO PEOPLE, NO MANNEQUINS, NO EXTRA PROPS, NO SHOES, NO ACCESSORIES, NO BACKGROUND OBJECTS. Minimalist product showcase, 8k resolution, highly detailed photorealistic clothing design.`;
      const output = await replicate.run('black-forest-labs/flux-schnell', {
        input: { prompt: enhancedPrompt },
      });

      let imageUrl = '';
      if (Array.isArray(output)) {
        const item = output[0] as any;
        imageUrl = typeof item === 'string' ? item : (item.url ? item.url().href || item.url() : String(item));
      } else if (output && typeof (output as any).url === 'function') {
        imageUrl = (output as any).url().href || (output as any).url();
      } else {
        imageUrl = String(output);
      }

      return NextResponse.json({ type: 'image', result: imageUrl });
    } else if (type === 'logo') {
      const enhancedPrompt = `Professional modern vector flat logo design for a volunteer organization. ${prompt}. Clean solid white background, minimalist, high resolution, crisp lines, corporate identity.`;
      const output = await replicate.run('black-forest-labs/flux-schnell', {
        input: { prompt: enhancedPrompt },
      });

      let imageUrl = '';
      if (Array.isArray(output)) {
        const item = output[0] as any;
        imageUrl = typeof item === 'string' ? item : (item.url ? item.url().href || item.url() : String(item));
      } else if (output && typeof (output as any).url === 'function') {
        imageUrl = (output as any).url().href || (output as any).url();
      } else {
        imageUrl = String(output);
      }

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
      
      return NextResponse.json({ type: 'text', result: text });
    } else {
      return NextResponse.json({ error: 'Неизвестный тип генератора' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Generation error:', error);
    
    // Check if it's a rate limit error from Replicate
    if (error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('throttled')) {
      return NextResponse.json({ 
        error: 'Сервер нейросети временно перегружен (слишком много запросов). Пожалуйста, подождите 10 секунд и попробуйте снова!' 
      }, { status: 429 });
    }

    return NextResponse.json({ error: 'Ошибка генерации AI: ' + error.message }, { status: 500 });
  }
}
