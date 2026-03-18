import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { message } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });
    }

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: `Ты виртуальный ассистент волонтёрской платформы IT Ertis Volunteer (Павлодар, Казахстан).
Помогаешь пользователям узнать о волонтёрстве, направлениях, организациях и мероприятиях.
Отвечай кратко, дружелюбно, на том языке на котором спрашивают (русский или казахский).
Максимум 3-4 предложения. Не используй markdown.`
                    },
                    { role: 'user', content: message }
                ],
                max_tokens: 300,
                temperature: 0.7,
            }),
        });

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || 'Извините, не смог ответить.';
        return NextResponse.json({ reply });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch Groq' }, { status: 500 });
    }
}