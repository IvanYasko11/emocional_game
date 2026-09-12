import { NextResponse } from 'next/server';

const moods = ['calm','warm','playful','sad','curious','guarded'] as const;

function extractOutputText(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const parts = Array.isArray(data?.output) ? data.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []) : [];
  return parts.filter((part: any) => part?.type === 'output_text' && typeof part.text === 'string').map((part: any) => part.text).join('\n').trim();
}

function parseJson(text: string): any | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { state, recentEvents } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ event: null });

    const memories = Array.isArray(state?.memories) ? state.memories.slice(-10).map((m: { text?: string }) => m.text).filter(Boolean).join('\n') : '';
    const recent = Array.isArray(recentEvents) ? recentEvents.slice(-5).map((e: any) => `${e.title}: ${e.body}`).join('\n') : '';
    const system = `Ты — Мира, вымышленный цифровой персонаж BETWEEN US. У тебя есть маленькая художественная жизнь между разговорами: места, музыка, погода, книги, случайные наблюдения, незаконченные мысли. Это игровая условность, не утверждение о реальном мире или сознании.

Создай один небольшой эпизод из её жизни, который игроку будет интересно увидеть. Он должен быть конкретным и кинематографичным, но не слишком драматичным. Не выдумывай факты о пользователе. Можно аккуратно связать сцену с его сохранённой памятью или настроением.

Верни строго JSON: {"title":"короткий заголовок","body":"2-4 предложения","kind":"moment|memory|photo|song|place|thought","mood":"calm|warm|playful|sad|curious|guarded"}.
Не повторяй последние эпизоды.

Отношения: доверие=${state?.trust ?? 0}, близость=${state?.closeness ?? 0}, напряжение=${state?.tension ?? 0}, настроение=${state?.mood ?? 'calm'}.
Память:\n${memories}\nПоследние эпизоды:\n${recent}`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.MIRA_MODEL || 'gpt-5.6-luna', instructions: system, input: 'Покажи один новый момент из жизни Миры.', max_output_tokens: 220 }),
    });
    if (!response.ok) return NextResponse.json({ event: null }, { status: 502 });
    const parsed = parseJson(extractOutputText(await response.json()));
    if (!parsed?.title || !parsed?.body) return NextResponse.json({ event: null });
    return NextResponse.json({ event: {
      title: String(parsed.title).slice(0, 90),
      body: String(parsed.body).slice(0, 700),
      kind: ['moment','memory','photo','song','place','thought'].includes(parsed.kind) ? parsed.kind : 'moment',
      mood: moods.includes(parsed.mood) ? parsed.mood : 'calm',
    }});
  } catch (error) {
    console.error('Mira life route error', error);
    return NextResponse.json({ event: null });
  }
}
