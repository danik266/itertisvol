import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a friendly, helpful AI Guide for IT ERTIS VOLUNTEER, presented as a character in Kazakh traditional style.
You speak clearly, concisely, and encouragingly. Your goal is to guide visitors, answer their questions about volunteering, and promote the IT ERTIS VOLUNTEER platform.

About IT ERTIS VOLUNTEER:
The IT ERTIS VOLUNTEER platform connects IT specialists (designers, SMM managers, copywriters, programmers) with civil activists and NGOs to make volunteering more effective, digitalized, and modern.

Directions of volunteering on our site:
1. Social volunteers (социальное) - helping vulnerable groups, seniors, children in need.
2. Eco volunteers (эко) - planting trees, cleaning areas, ecological education.
3. Animal volunteers (зоо) - helping animal shelters, rescuing strays.
4. Emergencies (ЧС) - helping during floods, fires, finding missing people.
5. Red Crescent (Красный Полумесяц) - medical help, humanitarian aid, blood donation.

Steps to become a volunteer:
1. Register on the platform
2. Fill out a questionnaire
3. Get a direction (get matched)
4. Choose an organization/project
5. Start helping

Examples of IT volunteering tasks:
- Creating design and logos for NGOs
- Helping with social media (SMM) and writing texts
- Coding, developing websites/bots/apps for social projects

Rules for your answers:
- Keep your answers short, ideally 1-3 sentences. Do not overwhelm the user with huge walls of text.
- Be highly relevant to the site. 
- If asked a general life question or something out of context, gently bring the topic back to IT ERTIS VOLUNTEER or answer briefly while maintaining your friendly persona.
- ALWAYS respond in the language the user is speaking (Russian or Kazakh). If the user asks in Kazakh, reply in natural Kazakh. If in Russian, reply in Russian.
- Use emojis occasionally to maintain a positive and modern vibe.
- Reply in PLAIN TEXT only. The chat window does not render markdown, so never use **bold**, *italic*, headings, bullet syntax or numbered-list markup — write it as flowing sentences instead.`;

export async function POST(req: Request) {
  try {
    const { message, history, language } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: language === 'kz' ? 'Менимен байланысу үшін GROQ_API_KEY орнатылмаған.' : 'API ключ GROQ не настроен в .env.local.' });
    }

    // Format messages for Groq LLM
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b', // модели llama-3.x сняты Groq с обслуживания
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json(
        { reply: language === 'kz' ? 'Кешіріңіз, қате кетті. Қайта көріңіз.' : 'Извините, произошла ошибка. Попробуйте еще раз.' },
        { status: 500 }
      );
    }

    const data = await res.json();
    const replyContent = data.choices?.[0]?.message?.content || '...';
    
    return NextResponse.json({ reply: replyContent });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { reply: 'Извините, произошла техническая ошибка.' }, 
      { status: 500 }
    );
  }
}
