'use client';

import { useEffect, useMemo, useState } from 'react';
import './mira.css';

type Memory = { text: string; createdAt: number };
type MiraState = { trust: number; closeness: number; tension: number; memories: Memory[]; firstName: string };

const KEY = 'between-us-mira-v1';
const SAVE = 'between-us-save-v3';
const defaultState: MiraState = { trust: 0, closeness: 0, tension: 0, memories: [], firstName: 'ты' };

function loadState(): MiraState { if (typeof window === 'undefined') return defaultState; try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); const game = JSON.parse(localStorage.getItem(SAVE) || 'null'); const memories = Array.isArray(game?.memories) ? game.memories.map((text: string) => ({ text, createdAt: Date.now() })) : []; return { ...defaultState, ...(saved || {}), memories: saved?.memories?.length ? saved.memories : memories }; } catch { return defaultState; } }
function inferFromGame(): MiraState { if (typeof window === 'undefined') return defaultState; try { const game = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (!game) return defaultState; return { ...defaultState, trust: Number(game.trust || 0), closeness: Math.max(0, Number(game.trust || 0) * 2 - Number(game.tension || 0)), tension: Number(game.tension || 0), memories: Array.isArray(game.memories) ? game.memories.map((text: string) => ({ text, createdAt: Date.now() })) : [] }; } catch { return defaultState; } }

export default function MiraPage() {
  const [state, setState] = useState<MiraState>(defaultState); const [messages, setMessages] = useState<{ role: 'mira' | 'user'; text: string }[]>([]); const [input, setInput] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { const game = inferFromGame(); const saved = loadState(); const next = { ...saved, ...game, memories: game.memories.length ? game.memories : saved.memories }; setState(next); setMessages([{ role: 'mira', text: next.memories.length ? 'Ты вернулся. Я помню больше, чем в прошлый раз. Расскажешь, как ты?' : 'Привет. Я Мира. Пока мы только знакомимся, но я хочу узнать тебя настоящего.' }]); }, []);
  const relationship = useMemo(() => Math.max(0, Math.min(100, 50 + state.closeness * 4 - state.tension * 2)), [state]);
  function persist(next: MiraState) { setState(next); localStorage.setItem(KEY, JSON.stringify(next)); }
  async function send() { const text = input.trim(); if (!text || busy) return; setInput(''); setMessages(m => [...m, { role: 'user', text }]); setBusy(true); try { const res = await fetch('/api/mira', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text, state }) }); const data = await res.json(); setMessages(m => [...m, { role: 'mira', text: data.reply || 'Я рядом. Расскажи ещё.' }]); persist({ ...state, closeness: state.closeness + 1, memories: [...state.memories, { text: `Игрок сказал: ${text}`, createdAt: Date.now() }].slice(-30) }); } catch { setMessages(m => [...m, { role: 'mira', text: 'Я потеряла связь на секунду. Но разговор не потерян.' }]); } finally { setBusy(false); } }
  return <main className="mira-shell"><section className="mira-card"><header className="mira-head"><div><span className="eyebrow">BETWEEN US / MIRA</span><h1>Мира</h1><p>Она помнит. И отношения с ней меняются.</p></div><div className="pulse" aria-label={`Близость ${relationship}%`}><span>{relationship}</span><small>близость</small></div></header><div className="memory-strip">{state.memories.length ? `Память: ${state.memories.length} воспоминаний` : 'Память пока пуста'} · доверие {state.trust} · напряжение {state.tension}</div><div className="chat" aria-live="polite">{messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}{busy && <div className="bubble mira typing">Мира печатает…</div>}</div><div className="composer"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Напиши Мире…" rows={2} /><button onClick={send} disabled={busy || !input.trim()}>Отправить</button></div><footer>Мира не притворяется человеком. Её характер, память и отношения — часть игровой системы.</footer></section></main>;
}
