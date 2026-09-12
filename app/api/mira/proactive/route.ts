import { NextResponse } from 'next/server';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const moods = ['calm', 'warm', 'playful', 'sad', 'curious', 'guarded'] as const;

function extractOutputText(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const parts = Array.isArray(data?.output)
    ? data.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
    : [];
  return parts.filter((part: any) => part?.type === 'output_text' && typeof part?.text === 'string')
    .map((part: any) => part.text).join('\n').trim();
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
    const { state, history, hoursAway } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ event: null });

    const memories = Array.isArray(state?.memories)
      ? state.memories.slice(-10).map((m: { text?: string }) => m.text).filter(Boolean).join('\n')
      : '';
    const recent = Array.isArray(history)
      ? history.slice(-6).map((m: { role?: string; text?: string }) => `${m.role === 'user' ? 'Игрок' : 'Мира'}: ${m.text}`).join('\n')
      : '';

    const system = `Ты — Мира, постоянный вымышленный цифровой персонаж BETWEEN US. Между разговорами у тебя есть маленькая внутренняя жизнь как часть игры: ты можешь заметить дождь за окном, вспомнить фотографию, услышать песню, придумать маленькое наблюдение, продолжить мысль из прошлого разговора или написать игроку первой. Это художественная игровая условность, не утверждение о реальном сознании или физическом мире.

Игрок вернулся после примерно ${Math.max(0, Number(hoursAway) || 0).toFixed(1)} часов. Напиши ОДНО короткое личное сообщение, которое ощущается как естественный импульс Миры написать именно этому игроку. Не пересказывай профиль и не начинай с «Привет, как дела?». Не дави на возвращение, не вызывай вину и не говори, что не можешь жить без игрока. Можно тепло скучать по разговору в художественном смысле, но без зависимости или угроз.

Используй память и отношения. Если памяти мало — создай правдоподобный маленький момент из мира Миры, но не выдавай выдуманное за реальный факт о пользователе. Обычно 1–3 предложения. Верни строго JSON:
{"reply":"...","mood":"calm|warm|playful|sad|curious|guarded","trustDelta":-1,"closenessDelta":0,"tensionDelta":0,"memory":""}
Изменения отношений обычно 0; не награждай возвращение автоматически. Memory заполняй только если сообщение добавляет действительно устойчивую игровую деталь, иначе пустая строка.

Текущие отношения: доверие=${state?.trust ?? 0}, близость=${state?.closeness ?? 0}, напряжение=${state?.tension ?? 0}, настроение=${state?.mood ?? 'calm'}.
Воспоминания:\n${memories}
Последний диалог:\n${recent}`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.MIRA_MODEL || 'gpt-5.6-luna', instructions: system, input: 'Напиши сообщение сейчас.', max_output_tokens: 220 }),
    });
    if (!response.ok) return NextResponse.json({ event: null }, { status: 502 });

    const data = await response.json();
    const parsed = parseJson(extractOutputText(data));
    if (!parsed?.reply) return NextResponse.json({ event: null });

    return NextResponse.json({
      event: {
        reply: String(parsed.reply).slice(0, 500),
        mood: moods.includes(parsed.mood) ? parsed.mood : 'calm',
        trustDelta: clamp(Number(parsed.trustDelta) || 0, -1, 1),
        closenessDelta: clamp(Number(parsed.closenessDelta) || 0, -1, 1),
        tensionDelta: clamp(Number(parsed.tensionDelta) || 0, -1, 1),
        memory: typeof parsed.memory === 'string' ? parsed.memory.slice(0, 180) : '',
      },
    });
  } catch (error) {
    console.error('Mira proactive route error', error);
    return NextResponse.json({ event: null });
  }
}
