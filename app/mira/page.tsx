'use client';

import { useEffect, useMemo, useState } from 'react';
import './mira.css';

type Mood = 'calm' | 'warm' | 'playful' | 'sad' | 'curious' | 'guarded';
type Memory = { text: string; createdAt: number };
type MiraState = { trust: number; closeness: number; tension: number; memories: Memory[]; firstName: string; mood: Mood };
type ChatMessage = { role: 'mira' | 'user'; text: string };

const KEY = 'between-us-mira-v1';
const SAVE = 'between-us-save-v3';
const defaultState: MiraState = { trust: 0, closeness: 0, tension: 0, memories: [], firstName: 'ты', mood: 'calm' };

function loadState(): MiraState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    const game = JSON.parse(localStorage.getItem(SAVE) || 'null');
    const memories = Array.isArray(saved?.memories) && saved.memories.length
      ? saved.memories
      : Array.isArray(game?.memories) ? game.memories.map((text: string) => ({ text, createdAt: Date.now() })) : [];
    return { ...defaultState, ...(saved || {}), memories };
  } catch { return defaultState; }
}

function inferFromGame(): Partial<MiraState> {
  if (typeof window === 'undefined') return {};
  try {
    const game = JSON.parse(localStorage.getItem(SAVE) || 'null');
    if (!game) return {};
    return {
      trust: Number(game.trust || 0),
      closeness: Math.max(0, Number(game.trust || 0) * 2 - Number(game.tension || 0)),
      tension: Number(game.tension || 0),
      memories: Array.isArray(game.memories) ? game.memories.map((text: string) => ({ text, createdAt: Date.now() })) : [],
    };
  } catch { return {}; }
}

export default function MiraPage() {
  const [state, setState] = useState<MiraState>(defaultState);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = loadState();
    const game = inferFromGame();
    const next = { ...saved, ...game, memories: game.memories?.length ? game.memories : saved.memories };
    setState(next);
    setMessages([{ role: 'mira', text: next.memories.length ? 'Ты вернулся. Я помню больше, чем в прошлый раз. Расскажешь, как ты?' : 'Привет. Я Мира. Пока мы только знакомимся, но я хочу узнать тебя настоящего.' }]);
  }, []);

  const relationship = useMemo(() => Math.max(0, Math.min(100, 50 + state.closeness * 4 + state.trust * 2 - state.tension * 3)), [state]);
  const moodLabel = { calm: 'спокойна', warm: 'теплеет', playful: 'играет', sad: 'грустит', curious: 'заинтересована', guarded: 'осторожна' }[state.mood];

  function persist(next: MiraState) { setState(next); localStorage.setItem(KEY, JSON.stringify(next)); }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const nextHistory = [...messages, { role: 'user' as const, text }];
    setMessages(nextHistory);
    setBusy(true);
    try {
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, state, history: messages.slice(-8) }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'mira', text: data.reply || 'Я слушаю тебя.' }]);
      const effects = data.effects || {};
      const memoryText = typeof data.memory === 'string' ? data.memory.trim() : '';
      const memories = memoryText
        ? [...state.memories, { text: memoryText, createdAt: Date.now() }].slice(-30)
        : state.memories;
      persist({
        ...state,
        trust: Math.max(-10, Math.min(10, state.trust + Number(effects.trustDelta || 0))),
        closeness: Math.max(-10, Math.min(10, state.closeness + Number(effects.closenessDelta || 0))),
        tension: Math.max(0, Math.min(10, state.tension + Number(effects.tensionDelta || 0))),
        mood: ['calm','warm','playful','sad','curious','guarded'].includes(effects.mood) ? effects.mood : state.mood,
        memories,
      });
    } catch {
      setMessages(m => [...m, { role: 'mira', text: 'Я потеряла связь на секунду. Но разговор не потерян.' }]);
    } finally { setBusy(false); }
  }

  return <main className="mira-shell"><section className={`mira-card mood-${state.mood}`}>
    <header className="mira-head"><div><span className="eyebrow">BETWEEN US / MIRA</span><h1>Мира</h1><p>Она помнит. И отношения с ней меняются.</p></div><div className="pulse" aria-label={`Близость ${relationship}%`}><span>{relationship}</span><small>близость</small></div></header>
    <div className="memory-strip">{state.memories.length ? `Память: ${state.memories.length} воспоминаний` : 'Память пока пуста'} · доверие {state.trust} · напряжение {state.tension} · Мира {moodLabel}</div>
    <div className="chat" aria-live="polite">{messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}{busy && <div className="bubble mira typing">Мира печатает…</div>}</div>
    <div className="composer"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Напиши Мире…" rows={2} /><button onClick={send} disabled={busy || !input.trim()}>Отправить</button></div>
    <footer>Мира не притворяется человеком. Её характер, память и отношения — часть игровой системы.</footer>
  </section></main>;
}
