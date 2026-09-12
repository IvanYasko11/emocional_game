'use client';

import { useEffect, useMemo, useState } from 'react';
import './mira.css';

type Mood = 'calm' | 'warm' | 'playful' | 'sad' | 'curious' | 'guarded';
type Memory = { text: string; createdAt: number };
type MiraState = { trust: number; closeness: number; tension: number; memories: Memory[]; firstName: string; mood: Mood };
type ChatMessage = { role: 'mira' | 'user'; text: string; event?: boolean };

const KEY = 'between-us-mira-v1';
const PLAYER_KEY = 'between-us-player-id-v1';
const LAST_SEEN_KEY = 'between-us-mira-last-seen-v1';
const LAST_EVENT_KEY = 'between-us-mira-last-event-v1';
const defaultState: MiraState = { trust: 0, closeness: 0, tension: 0, memories: [], firstName: 'ты', mood: 'calm' };
const moods: Mood[] = ['calm', 'warm', 'playful', 'sad', 'curious', 'guarded'];

function playerId() {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(PLAYER_KEY);
  if (!id) {
    id = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(PLAYER_KEY, id);
  }
  return id;
}

function loadState(): MiraState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    return { ...defaultState, ...(saved || {}), memories: Array.isArray(saved?.memories) ? saved.memories : [] };
  } catch { return defaultState; }
}

function inferFromGame(): Partial<MiraState> {
  if (typeof window === 'undefined') return {};
  try {
    const game = JSON.parse(localStorage.getItem('between-us-save-v3') || 'null');
    if (!game) return {};
    return {
      trust: Number(game.trust || 0),
      closeness: Math.max(0, Number(game.trust || 0) * 2 - Number(game.tension || 0)),
      tension: Number(game.tension || 0),
      memories: Array.isArray(game.memories) ? game.memories.map((text: string) => ({ text, createdAt: Date.now() })) : [],
    };
  } catch { return {}; }
}

function relationshipOf(s: MiraState) {
  return Math.max(0, Math.min(100, 50 + s.closeness * 4 + s.trust * 2 - s.tension * 3));
}

export default function MiraPage() {
  const [state, setState] = useState<MiraState>(defaultState);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [eventBusy, setEventBusy] = useState(false);

  useEffect(() => {
    const saved = loadState();
    const game = inferFromGame();
    const next = { ...saved, ...game, memories: game.memories?.length ? game.memories : saved.memories };
    setState(next);
    playerId();
    const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) || 0);
    const hoursAway = lastSeen ? (Date.now() - lastSeen) / 36e5 : 0;
    const opening = next.memories.length ? 'Ты вернулся. Я помню больше, чем в прошлый раз.' : 'Привет. Я Мира. Пока мы только знакомимся.';
    setMessages([{ role: 'mira', text: opening }]);

    // Mira can initiate a small in-game moment after a meaningful pause.
    const lastEvent = Number(localStorage.getItem(LAST_EVENT_KEY) || 0);
    if (lastSeen && hoursAway >= 0.5 && Date.now() - lastEvent >= 6 * 36e5) {
      setEventBusy(true);
      fetch('/api/mira/proactive', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state: next, history: [], hoursAway, playerId: playerId() }),
      }).then(r => r.json()).then(data => {
        const event = data?.event;
        if (!event?.reply) return;
        setMessages(m => [...m, { role: 'mira', text: event.reply, event: true }]);
        const memoryText = typeof event.memory === 'string' ? event.memory.trim() : '';
        const memories = memoryText ? [...next.memories, { text: memoryText, createdAt: Date.now() }].slice(-30) : next.memories;
        const updated = {
          ...next,
          trust: Math.max(-10, Math.min(10, next.trust + Number(event.trustDelta || 0))),
          closeness: Math.max(-10, Math.min(10, next.closeness + Number(event.closenessDelta || 0))),
          tension: Math.max(0, Math.min(10, next.tension + Number(event.tensionDelta || 0))),
          mood: moods.includes(event.mood) ? event.mood : next.mood,
          memories,
        } as MiraState;
        setState(updated);
        localStorage.setItem(KEY, JSON.stringify(updated));
        localStorage.setItem(LAST_EVENT_KEY, String(Date.now()));
      }).catch(() => {}).finally(() => setEventBusy(false));
    }
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  }, []);

  const relationship = useMemo(() => relationshipOf(state), [state]);
  const moodLabel = { calm: 'спокойна', warm: 'теплеет', playful: 'играет', sad: 'грустит', curious: 'заинтересована', guarded: 'осторожна' }[state.mood];

  function persist(next: MiraState) { setState(next); localStorage.setItem(KEY, JSON.stringify(next)); }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages(current => [...current, { role: 'user', text }]);
    setBusy(true);
    try {
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, state, history: messages.slice(-8), playerId: playerId() }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'mira', text: data.reply || 'Я слушаю тебя.' }]);
      const effects = data.effects || {};
      const memoryText = typeof data.memory === 'string' ? data.memory.trim() : '';
      const memories = memoryText ? [...state.memories, { text: memoryText, createdAt: Date.now() }].slice(-30) : state.memories;
      persist({
        ...state,
        trust: Math.max(-10, Math.min(10, state.trust + Number(effects.trustDelta || 0))),
        closeness: Math.max(-10, Math.min(10, state.closeness + Number(effects.closenessDelta || 0))),
        tension: Math.max(0, Math.min(10, state.tension + Number(effects.tensionDelta || 0))),
        mood: moods.includes(effects.mood) ? effects.mood : state.mood,
        memories,
      });
      localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    } catch {
      setMessages(m => [...m, { role: 'mira', text: 'Я потеряла связь на секунду. Но разговор не потерян.' }]);
    } finally { setBusy(false); }
  }

  return <main className="mira-shell"><section className={`mira-card mood-${state.mood}`}>
    <header className="mira-head"><div><span className="eyebrow">BETWEEN US / MIRA</span><h1>Мира</h1><p>Она помнит. У неё есть характер. И отношения с тобой меняются.</p></div><div className="pulse" aria-label={`Близость ${relationship}%`}><span>{relationship}</span><small>близость</small></div></header>
    <div className="memory-strip">{state.memories.length ? `Память: ${state.memories.length} воспоминаний` : 'Память пока пуста'} · доверие {state.trust} · напряжение {state.tension} · Мира {moodLabel}</div>
    <div className="chat" aria-live="polite">{messages.map((m, i) => <div key={i} className={`bubble ${m.role} ${m.event ? 'event' : ''}`}>{m.event && <span className="event-label">Мира написала первой</span>}{m.text}</div>)}{(busy || eventBusy) && <div className="bubble mira typing">Мира печатает…</div>}</div>
    <div className="composer"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Напиши Мире…" rows={2} /><button onClick={send} disabled={busy || !input.trim()}>Отправить</button></div>
    <footer>Мира не притворяется человеком. Её характер, память и отношения — часть игровой системы.</footer>
  </section></main>;
}
