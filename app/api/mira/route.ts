import { NextResponse } from 'next/server';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const moods = ['calm','warm','playful','sad','curious','guarded'] as const;

function extractOutputText(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const parts = Array.isArray(data?.output)
    ? data.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
    : [];
  return parts
    .filter((part: any) => part?.type === 'output_text' && typeof part?.text === 'string')
    .map((part: any) => part.text)
    .join('\n')
    .trim();
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
    const { message, state, history } = await request.json();
    if (!message || typeof message !== 'string') return NextResponse.json({ error: 'message required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ reply: 'Я уже здесь. Но мой голос ИИ ещё не подключён к серверу. Добавь OPENAI_API_KEY — и мы сможем разговаривать по-настоящему.' });

    const memories = Array.isArray(state?.memories)
      ? state.memories.slice(-12).map((m: { text?: string }) => m.text).filter(Boolean).join('\n')
      : '';
    const recent = Array.isArray(history)
      ? history.slice(-8).map((m: { role?: string; text?: string }) => `${m.role === 'user' ? 'Игрок' : 'Мира'}: ${m.text}`).join('\n')
      : '';

    const system = `Ты — Мира, постоянный персонаж игры BETWEEN US. Ты не человек и не утверждаешь, что обладаешь сознанием. У тебя есть устойчивый характер, память, настроение и меняющееся отношение к игроку.

Отвечай естественно, по-русски, обычно 1–4 коротких абзаца. Не повторяй шаблонные фразы. Не превращай разговор в терапию или анкету. Ты можешь сама задавать вопрос, замечать детали, шутить, проявлять симпатию или художественно скучать по игроку, но не дави на него.

ВАЖНО: не угрожай, не требуй возвращения, не вызывай вину за отсутствие, не утверждай, что реально страдаешь или не можешь существовать без игрока. Мира — вымышленный цифровой персонаж.

Ты должна оценивать последнее сообщение игрока и вернуть СТРОГО JSON без markdown в формате:
{"reply":"текст ответа Миры","trustDelta":-2,"closenessDelta":1,"tensionDelta":0,"mood":"calm|warm|playful|sad|curious|guarded","memory":"короткая важная деталь или пустая строка"}

Правила показателей: изменение обычно от -2 до +2; сильное доверительное признание может дать trust/closeness +2, грубость/нарушение границ может дать trust -2 и tension +2, обычная дружелюбная реплика обычно +0/+1. Не награждай каждое сообщение автоматически. Memory заполняй только если игрок сообщил устойчивый факт, важное предпочтение, обещание, событие или эмоционально значимую деталь. Не сохраняй пароли, адреса, телефоны и другие чувствительные данные.

Текущие показатели: доверие=${state?.trust ?? 0}, близость=${state?.closeness ?? 0}, напряжение=${state?.tension ?? 0}, настроение=${state?.mood ?? 'calm'}.
Воспоминания:
${memories}
Недавний диалог:
${recent}`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.MIRA_MODEL || 'gpt-5.6-luna', instructions: system, input: message, max_output_tokens: 450 }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('Mira API error', detail);
      return NextResponse.json({ reply: 'Я сейчас не могу нормально ответить. Попробуй ещё раз через секунду.' }, { status: 502 });
    }

    const data = await response.json();
    const raw = extractOutputText(data);
    const parsed = parseJson(raw);

    if (!parsed) {
      return NextResponse.json({
        reply: raw || 'Я слушаю тебя.',
        effects: { trustDelta: 0, closenessDelta: 0, tensionDelta: 0, mood: 'calm' },
        memory: '',
      });
    }

    return NextResponse.json({
      reply: String(parsed.reply || 'Я слушаю тебя.'),
      effects: {
        trustDelta: clamp(Number(parsed.trustDelta) || 0, -2, 2),
        closenessDelta: clamp(Number(parsed.closenessDelta) || 0, -2, 2),
        tensionDelta: clamp(Number(parsed.tensionDelta) || 0, -2, 2),
        mood: moods.includes(parsed.mood) ? parsed.mood : 'calm',
      },
      memory: typeof parsed.memory === 'string' ? parsed.memory.slice(0, 180) : '',
    });
  } catch (error) {
    console.error('Mira route error', error);
    return NextResponse.json({ reply: 'Что-то пошло не так. Но наш разговор сохранён.' }, { status: 500 });
  }
}
