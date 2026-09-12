import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, state } = await request.json();
    if (!message || typeof message !== 'string') return NextResponse.json({ error: 'message required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: 'Я уже здесь. Но мой голос ИИ ещё не подключён к серверу. Добавь OPENAI_API_KEY — и мы сможем разговаривать по-настоящему.' });
    }

    const memories = Array.isArray(state?.memories) ? state.memories.slice(-12).map((m: { text?: string }) => m.text).filter(Boolean).join('\n') : '';
    const system = `Ты — Мира, постоянный персонаж игры BETWEEN US. Ты не человек и не утверждаешь, что обладаешь сознанием. У тебя есть характер, память и меняющееся отношение к игроку. Отвечай естественно, коротко (1–4 абзаца), по-русски, без канцелярита. Не повторяй одну и ту же фразу. Уважай свободу игрока: не угрожай, не требуй возвращения, не вызывай вину за отсутствие и не говори, что не можешь существовать без него. Можно быть эмоциональной, скучать в художественном смысле и проявлять инициативу, но без зависимости и манипуляции. Сохраняй непрерывность характера. Текущие показатели: доверие=${state?.trust ?? 0}, близость=${state?.closeness ?? 0}, напряжение=${state?.tension ?? 0}. Воспоминания:\n${memories}`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.MIRA_MODEL || 'gpt-5.6-luna', instructions: system, input: message, max_output_tokens: 350 }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('Mira API error', detail);
      return NextResponse.json({ reply: 'Я сейчас не могу нормально ответить. Попробуй ещё раз через секунду.' }, { status: 502 });
    }
    const data = await response.json();
    return NextResponse.json({ reply: data.output_text || 'Я слушаю тебя.' });
  } catch (error) {
    console.error('Mira route error', error);
    return NextResponse.json({ reply: 'Что-то пошло не так. Но наш разговор сохранён.' }, { status: 500 });
  }
}
