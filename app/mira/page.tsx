'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import './mira.css';

type Mood = 'calm' | 'warm' | 'playful' | 'sad' | 'curious' | 'guarded';
type Memory = { text: string; createdAt: number };
type MiraState = { trust: number; closeness: number; tension: number; memories: Memory[]; firstName: string; mood: Mood };
type ChatMessage = { role: 'mira' | 'user'; text: string; event?: boolean };

type RemoteProfile = {
  user_id: string;
  first_name: string | null;
  trust: number;
  affection: number;
  tension: number;
  mood: Mood;
  memories: Memory[];
  updated_at: string;
};

const KEY = 'between-us-mira-v1';
const SAVE = 'between-us-save-v3';
const PLAYER_KEY = 'between-us-player-id-v1';
const LAST_SEEN_KEY = 'between-us-mira-last-seen-v1';
const LAST_EVENT_KEY = 'between-us-mira-last-event-v1';
const defaultState: MiraState = { trust: 0, closeness: 0, tension: 0, memories: [], firstName: 'ты', mood: 'calm' };
const moods: Mood[] = ['calm', 'warm', 'playful', 'sad', 'curious', 'guarded'];

function getPlayerId() {
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
    const game = JSON.parse(localStorage.getItem(SAVE) || 'null');
    if (saved && typeof saved === 'object') return { ...defaultState, ...saved, memories: Array.isArray(saved.memories) ? saved.memories : [] };
    return {
      ...defaultState,
      trust: Number(game?.trust || 0),
      closeness: Math.max(0, Number(game?.trust || 0) * 2 - Number(game?.tension || 0)),
      tension: Number(game?.tension || 0),
      memories: Array.isArray(game?.memories) ? game.memories.map((text: string) => ({ text, createdAt: Date.now() })) : [],
    };
  } catch { return defaultState; }
}

function fromRemote(row: RemoteProfile): MiraState {
  return {
    trust: Number(row.trust || 0),
    closeness: Number(row.affection || 0),
    tension: Number(row.tension || 0),
    memories: Array.isArray(row.memories) ? row.memories.slice(-30) : [],
    firstName: row.first_name || 'ты',
    mood: moods.includes(row.mood) ? row.mood : 'calm',
  };
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
  const [identity, setIdentity] = useState<'local' | 'device' | 'account'>('local');
  const [accountEmail, setAccountEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  function persist(next: MiraState) { setState(next); localStorage.setItem(KEY, JSON.stringify(next)); }

  async function saveRemote(next: MiraState) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('mira_player_profiles').upsert({
      user_id: session.user.id,
      first_name: next.firstName === 'ты' ? null : next.firstName,
      trust: next.trust,
      affection: next.closeness,
      tension: next.tension,
      mood: next.mood,
      memories: next.memories,
      player_metadata: { browserPlayerId: getPlayerId() },
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }

  async function hydrateRemote(local: MiraState) {
    let { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      const anonymous = await supabase.auth.signInAnonymously();
      session = anonymous.data.session;
      if (anonymous.error || !session?.user) return local;
      setIdentity('device');
    } else if (session.user.email) {
      setIdentity('account');
      setAccountEmail(session.user.email);
    } else {
      setIdentity('device');
    }

    const { data } = await supabase.from('mira_player_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
    if (data) {
      const remote = fromRemote(data as RemoteProfile);
      persist(remote);
      return remote;
    }
    await saveRemote(local);
    return local;
  }

  async function linkEmail() {
    const email = emailInput.trim();
    if (!email || !email.includes('@')) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/mira` } });
    if (!error) {
      setEmailSent(true);
      setEmailInput('');
    }
  }

  useEffect(() => {
    const local = loadState();
    setState(local);
    setMessages([{ role: 'mira', text: local.memories.length ? 'Ты вернулся. Я помню больше, чем в прошлый раз.' : 'Привет. Я Мира. Пока мы только знакомимся.' }]);

    hydrateRemote(local).then(next => {
      setState(next);
      localStorage.setItem(KEY, JSON.stringify(next));
    }).catch(() => {});

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setIdentity('account');
        setAccountEmail(session.user.email);
        void saveRemote(loadState());
      }
    });

    const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) || 0);
    const hoursAway = lastSeen ? (Date.now() - lastSeen) / 36e5 : 0;
    const lastEvent = Number(localStorage.getItem(LAST_EVENT_KEY) || 0);
    if (lastSeen && hoursAway >= 0.5 && Date.now() - lastEvent >= 6 * 36e5) {
      setEventBusy(true);
      fetch('/api/mira/proactive', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state: local, history: [], hoursAway, playerId: getPlayerId() }),
      }).then(r => r.json()).then(data => {
        const event = data?.event;
        if (!event?.reply) return;
        setMessages(m => [...m, { role: 'mira', text: event.reply, event: true }]);
        const memoryText = typeof event.memory === 'string' ? event.memory.trim() : '';
        const memories = memoryText ? [...local.memories, { text: memoryText, createdAt: Date.now() }].slice(-30) : local.memories;
        const updated: MiraState = {
          ...local,
          trust: Math.max(-10, Math.min(10, local.trust + Number(event.trustDelta || 0))),
          closeness: Math.max(-10, Math.min(10, local.closeness + Number(event.closenessDelta || 0))),
          tension: Math.max(0, Math.min(10, local.tension + Number(event.tensionDelta || 0))),
          mood: moods.includes(event.mood) ? event.mood : local.mood,
          memories,
        };
        persist(updated);
        void saveRemote(updated);
        localStorage.setItem(LAST_EVENT_KEY, String(Date.now()));
      }).catch(() => {}).finally(() => setEventBusy(false));
    }
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));

    return () => authListener.subscription.unsubscribe();
  }, []);

  const relationship = useMemo(() => relationshipOf(state), [state]);
  const moodLabel = { calm: 'спокойна', warm: 'теплеет', playful: 'играет', sad: 'грустит', curious: 'заинтересована', guarded: 'осторожна' }[state.mood];

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
        body: JSON.stringify({ message: text, state, history: messages.slice(-8), playerId: getPlayerId() }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'mira', text: data.reply || 'Я слушаю тебя.' }]);
      const effects = data.effects || {};
      const memoryText = typeof data.memory === 'string' ? data.memory.trim() : '';
      const memories = memoryText ? [...state.memories, { text: memoryText, createdAt: Date.now() }].slice(-30) : state.memories;
      const next: MiraState = {
        ...state,
        trust: Math.max(-10, Math.min(10, state.trust + Number(effects.trustDelta || 0))),
        closeness: Math.max(-10, Math.min(10, state.closeness + Number(effects.closenessDelta || 0))),
        tension: Math.max(0, Math.min(10, state.tension + Number(effects.tensionDelta || 0))),
        mood: moods.includes(effects.mood) ? effects.mood : state.mood,
        memories,
      };
      persist(next);
      void saveRemote(next);
      localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    } catch {
      setMessages(m => [...m, { role: 'mira', text: 'Я потеряла связь на секунду. Но разговор не потерян.' }]);
    } finally { setBusy(false); }
  }

  return <main className="mira-shell"><section className={`mira-card mood-${state.mood}`}>
    <header className="mira-head"><div><span className="eyebrow">BETWEEN US / MIRA</span><h1>Мира</h1><p>Она помнит. У неё есть характер. И отношения с тобой меняются.</p></div><div className="pulse" aria-label={`Близость ${relationship}%`}><span>{relationship}</span><small>близость</small></div></header>
    <div className="memory-strip">{state.memories.length ? `Память: ${state.memories.length} воспоминаний` : 'Память пока пуста'} · доверие {state.trust} · напряжение {state.tension} · Мира {moodLabel} · {identity === 'account' ? `сохранено: ${accountEmail}` : identity === 'device' ? 'сохранено на устройстве' : 'локальный режим'}</div>
    {identity !== 'account' && <div className="identity-bar"><div><strong>Сделать Миру твоей</strong><span>Привяжи эту историю к email — тогда память и отношения можно будет восстановить на другом устройстве.</span></div><div className="identity-form"><input value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="твой@email.com" type="email" /><button onClick={linkEmail}>{emailSent ? 'Письмо отправлено' : 'Привязать'}</button></div></div>}
    <div className="chat" aria-live="polite">{messages.map((m, i) => <div key={i} className={`bubble ${m.role} ${m.event ? 'event' : ''}`}>{m.event && <span className="event-label">Мира написала первой</span>}{m.text}</div>)}{(busy || eventBusy) && <div className="bubble mira typing">Мира печатает…</div>}</div>
    <div className="composer"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Напиши Мире…" rows={2} /><button onClick={send} disabled={busy || !input.trim()}>Отправить</button></div>
    <footer>Мира не притворяется человеком. Её характер, память и отношения — часть игровой системы.</footer>
  </section></main>;
}
