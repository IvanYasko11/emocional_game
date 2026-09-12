'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import './mira.css';

type Mood = 'calm' | 'warm' | 'playful' | 'sad' | 'curious' | 'guarded';
type Memory = { text: string; createdAt: number };
type MiraState = { trust: number; closeness: number; tension: number; memories: Memory[]; firstName: string; mood: Mood };
type ChatMessage = { role: 'mira' | 'user'; text: string; event?: boolean };
type PhoneMessage = { id: string; direction: 'mira' | 'player'; body: string; kind: string; readAt?: string | null; createdAt: number };
type LifeEvent = { id: string; title: string; body: string; kind: string; mood: Mood; occurredAt: number };
type RemoteProfile = { user_id: string; first_name: string | null; trust: number; affection: number; tension: number; mood: Mood; memories: Memory[]; updated_at: string };

const KEY = 'between-us-mira-v1';
const SAVE = 'between-us-save-v3';
const PLAYER_KEY = 'between-us-player-id-v1';
const LAST_SEEN_KEY = 'between-us-mira-last-seen-v1';
const LAST_EVENT_KEY = 'between-us-mira-last-event-v1';
const PHONE_KEY = 'between-us-mira-phone-v1';
const LIFE_KEY = 'between-us-mira-life-v1';
const defaultState: MiraState = { trust: 0, closeness: 0, tension: 0, memories: [], firstName: 'ты', mood: 'calm' };
const moods: Mood[] = ['calm', 'warm', 'playful', 'sad', 'curious', 'guarded'];

function getPlayerId() {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(PLAYER_KEY);
  if (!id) { id = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; localStorage.setItem(PLAYER_KEY, id); }
  return id;
}

function loadState(): MiraState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    const game = JSON.parse(localStorage.getItem(SAVE) || 'null');
    if (saved && typeof saved === 'object') return { ...defaultState, ...saved, memories: Array.isArray(saved.memories) ? saved.memories : [] };
    return { ...defaultState, trust: Number(game?.trust || 0), closeness: Math.max(0, Number(game?.trust || 0) * 2 - Number(game?.tension || 0)), tension: Number(game?.tension || 0), memories: Array.isArray(game?.memories) ? game.memories.map((text: string) => ({ text, createdAt: Date.now() })) : [] };
  } catch { return defaultState; }
}

function loadJson<T>(key: string, fallback: T): T { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; } catch { return fallback; } }
function fromRemote(row: RemoteProfile): MiraState { return { trust: Number(row.trust || 0), closeness: Number(row.affection || 0), tension: Number(row.tension || 0), memories: Array.isArray(row.memories) ? row.memories.slice(-30) : [], firstName: row.first_name || 'ты', mood: moods.includes(row.mood) ? row.mood : 'calm' }; }
function relationshipOf(s: MiraState) { return Math.max(0, Math.min(100, 50 + s.closeness * 4 + s.trust * 2 - s.tension * 3)); }
function uid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export default function MiraPage() {
  const [state, setState] = useState<MiraState>(defaultState);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phone, setPhone] = useState<PhoneMessage[]>([]);
  const [life, setLife] = useState<LifeEvent[]>([]);
  const [tab, setTab] = useState<'chat' | 'phone' | 'life'>('chat');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [eventBusy, setEventBusy] = useState(false);
  const [lifeBusy, setLifeBusy] = useState(false);
  const [identity, setIdentity] = useState<'local' | 'device' | 'account'>('local');
  const [accountEmail, setAccountEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  function persist(next: MiraState) { setState(next); localStorage.setItem(KEY, JSON.stringify(next)); }
  function persistPhone(next: PhoneMessage[]) { setPhone(next); localStorage.setItem(PHONE_KEY, JSON.stringify(next.slice(-100))); }
  function persistLife(next: LifeEvent[]) { setLife(next); localStorage.setItem(LIFE_KEY, JSON.stringify(next.slice(-40))); }

  async function saveRemote(next: MiraState) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('mira_player_profiles').upsert({ user_id: session.user.id, first_name: next.firstName === 'ты' ? null : next.firstName, trust: next.trust, affection: next.closeness, tension: next.tension, mood: next.mood, memories: next.memories, player_metadata: { browserPlayerId: getPlayerId() }, last_seen_at: new Date().toISOString() }, { onConflict: 'user_id' });
  }

  async function saveRemotePhone(items: PhoneMessage[]) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const fresh = items.slice(-12);
    await Promise.all(fresh.map(item => supabase.from('mira_phone_messages').upsert({ id: item.id, user_id: session.user.id, direction: item.direction, body: item.body, kind: item.kind, read_at: item.readAt || null, created_at: new Date(item.createdAt).toISOString() }, { onConflict: 'id' })));
  }

  async function saveRemoteLife(items: LifeEvent[]) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const fresh = items.slice(-8);
    await Promise.all(fresh.map(item => supabase.from('mira_life_events').upsert({ id: item.id, user_id: session.user.id, kind: item.kind, title: item.title, body: item.body, mood: item.mood, occurred_at: new Date(item.occurredAt).toISOString() }, { onConflict: 'id' })));
  }

  async function hydrateRemote(local: MiraState) {
    let { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      const anonymous = await supabase.auth.signInAnonymously();
      session = anonymous.data.session;
      if (anonymous.error || !session?.user) return local;
      setIdentity('device');
    } else if (session.user.email) { setIdentity('account'); setAccountEmail(session.user.email); } else setIdentity('device');

    const [{ data: profile }, { data: remotePhone }, { data: remoteLife }] = await Promise.all([
      supabase.from('mira_player_profiles').select('*').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('mira_phone_messages').select('*').eq('user_id', session.user.id).order('created_at', { ascending: true }).limit(100),
      supabase.from('mira_life_events').select('*').eq('user_id', session.user.id).order('occurred_at', { ascending: true }).limit(40),
    ]);
    if (profile) { const remote = fromRemote(profile as RemoteProfile); persist(remote); local = remote; } else await saveRemote(local);
    if (Array.isArray(remotePhone) && remotePhone.length) persistPhone(remotePhone.map((m: any) => ({ id: m.id, direction: m.direction, body: m.body, kind: m.kind, readAt: m.read_at, createdAt: Date.parse(m.created_at) })));
    if (Array.isArray(remoteLife) && remoteLife.length) persistLife(remoteLife.map((e: any) => ({ id: e.id, title: e.title, body: e.body, kind: e.kind, mood: moods.includes(e.mood) ? e.mood : 'calm', occurredAt: Date.parse(e.occurred_at) })));
    return local;
  }

  async function linkEmail() {
    const email = emailInput.trim();
    if (!email || !email.includes('@')) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/mira` } });
    if (!error) { setEmailSent(true); setEmailInput(''); }
  }

  async function createLifeEvent() {
    if (lifeBusy) return;
    setLifeBusy(true);
    try {
      const res = await fetch('/api/mira/life', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ state, recentEvents: life.slice(-5) }) });
      const data = await res.json();
      if (!data.event) return;
      const event: LifeEvent = { id: uid('life'), title: data.event.title, body: data.event.body, kind: data.event.kind, mood: moods.includes(data.event.mood) ? data.event.mood : state.mood, occurredAt: Date.now() };
      const next = [...life, event].slice(-40); persistLife(next); void saveRemoteLife(next); setTab('life');
    } finally { setLifeBusy(false); }
  }

  useEffect(() => {
    const local = loadState();
    const localPhone = loadJson<PhoneMessage[]>(PHONE_KEY, []);
    const localLife = loadJson<LifeEvent[]>(LIFE_KEY, []);
    setState(local); setPhone(localPhone); setLife(localLife);
    setMessages([{ role: 'mira', text: local.memories.length ? 'Ты вернулся. Я помню больше, чем в прошлый раз.' : 'Привет. Я Мира. Пока мы только знакомимся.' }]);
    hydrateRemote(local).then(next => { setState(next); localStorage.setItem(KEY, JSON.stringify(next)); }).catch(() => {});

    const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) || 0);
    const hoursAway = lastSeen ? (Date.now() - lastSeen) / 36e5 : 0;
    const lastEvent = Number(localStorage.getItem(LAST_EVENT_KEY) || 0);
    if (lastSeen && hoursAway >= 0.5 && Date.now() - lastEvent >= 6 * 36e5) {
      setEventBusy(true);
      fetch('/api/mira/proactive', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ state: local, history: [], hoursAway, playerId: getPlayerId() }) })
        .then(r => r.json()).then(data => {
          const event = data?.event; if (!event?.reply) return;
          setMessages(m => [...m, { role: 'mira', text: event.reply, event: true }]);
          const item: PhoneMessage = { id: uid('msg'), direction: 'mira', body: event.reply, kind: 'proactive', createdAt: Date.now() };
          const nextPhone = [...localPhone, item].slice(-100); persistPhone(nextPhone); void saveRemotePhone(nextPhone);
          const memoryText = typeof event.memory === 'string' ? event.memory.trim() : '';
          const memories = memoryText ? [...local.memories, { text: memoryText, createdAt: Date.now() }].slice(-30) : local.memories;
          const updated: MiraState = { ...local, trust: Math.max(-10, Math.min(10, local.trust + Number(event.trustDelta || 0))), closeness: Math.max(-10, Math.min(10, local.closeness + Number(event.closenessDelta || 0))), tension: Math.max(0, Math.min(10, local.tension + Number(event.tensionDelta || 0))), mood: moods.includes(event.mood) ? event.mood : local.mood, memories };
          persist(updated); void saveRemote(updated); localStorage.setItem(LAST_EVENT_KEY, String(Date.now()));
        }).catch(() => {}).finally(() => setEventBusy(false));
    }
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));

    const recentLife = localLife.length ? Date.now() - localLife[localLife.length - 1].occurredAt : Infinity;
    if (recentLife > 20 * 36e5) void createLifeEvent();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) { setIdentity('account'); setAccountEmail(session.user.email); void saveRemote(loadState()); }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const relationship = useMemo(() => relationshipOf(state), [state]);
  const moodLabel = { calm: 'спокойна', warm: 'теплеет', playful: 'играет', sad: 'грустит', curious: 'заинтересована', guarded: 'осторожна' }[state.mood];
  const unread = phone.filter(m => m.direction === 'mira' && !m.readAt).length;

  async function openPhone() {
    setTab('phone');
    const now = new Date().toISOString();
    const next = phone.map(m => m.direction === 'mira' ? { ...m, readAt: m.readAt || now } : m);
    persistPhone(next);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await supabase.from('mira_phone_messages').update({ read_at: now }).eq('user_id', session.user.id).is('read_at', null);
  }

  async function send() {
    const text = input.trim(); if (!text || busy) return;
    setInput(''); setMessages(current => [...current, { role: 'user', text }]); setBusy(true);
    const playerMessage: PhoneMessage = { id: uid('msg'), direction: 'player', body: text, kind: 'message', createdAt: Date.now() };
    const phoneAfterPlayer = [...phone, playerMessage].slice(-100); persistPhone(phoneAfterPlayer); void saveRemotePhone(phoneAfterPlayer);
    try {
      const res = await fetch('/api/mira', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text, state, history: messages.slice(-8), playerId: getPlayerId() }) });
      const data = await res.json();
      const reply = data.reply || 'Я слушаю тебя.';
      setMessages(m => [...m, { role: 'mira', text: reply }]);
      const miraMessage: PhoneMessage = { id: uid('msg'), direction: 'mira', body: reply, kind: 'message', createdAt: Date.now() };
      const nextPhone = [...phoneAfterPlayer, miraMessage].slice(-100); persistPhone(nextPhone); void saveRemotePhone(nextPhone);
      const effects = data.effects || {};
      const memoryText = typeof data.memory === 'string' ? data.memory.trim() : '';
      const memories = memoryText ? [...state.memories, { text: memoryText, createdAt: Date.now() }].slice(-30) : state.memories;
      const next: MiraState = { ...state, trust: Math.max(-10, Math.min(10, state.trust + Number(effects.trustDelta || 0))), closeness: Math.max(-10, Math.min(10, state.closeness + Number(effects.closenessDelta || 0))), tension: Math.max(0, Math.min(10, state.tension + Number(effects.tensionDelta || 0))), mood: moods.includes(effects.mood) ? effects.mood : state.mood, memories };
      persist(next); void saveRemote(next); localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    } catch { setMessages(m => [...m, { role: 'mira', text: 'Я потеряла связь на секунду. Но разговор не потерян.' }]); }
    finally { setBusy(false); }
  }

  return <main className="mira-shell"><section className={`mira-card mood-${state.mood}`}>
    <header className="mira-head"><div><span className="eyebrow">BETWEEN US / MIRA</span><h1>Мира</h1><p>Она помнит. У неё есть характер. И её маленькая жизнь продолжается.</p></div><div className="pulse" aria-label={`Близость ${relationship}%`}><span>{relationship}</span><small>близость</small></div></header>
    <div className="memory-strip">{state.memories.length ? `Память: ${state.memories.length} воспоминаний` : 'Память пока пуста'} · доверие {state.trust} · напряжение {state.tension} · Мира {moodLabel} · {identity === 'account' ? `сохранено: ${accountEmail}` : identity === 'device' ? 'сохранено на устройстве' : 'локальный режим'}</div>
    {identity !== 'account' && <div className="identity-bar"><div><strong>Сделать Миру своей историей</strong><span>Привяжи email — память, телефон и жизнь Миры можно будет восстановить на другом устройстве.</span></div><div className="identity-form"><input value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="твой@email.com" type="email" /><button onClick={linkEmail}>{emailSent ? 'Письмо отправлено' : 'Привязать'}</button></div></div>}
    <nav className="mira-tabs" aria-label="Разделы Миры"><button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>Разговор</button><button className={tab === 'phone' ? 'active' : ''} onClick={openPhone}>Телефон {unread > 0 && <b>{unread}</b>}</button><button className={tab === 'life' ? 'active' : ''} onClick={() => setTab('life')}>Её жизнь</button></nav>

    {tab === 'chat' && <><div className="chat" aria-live="polite">{messages.map((m, i) => <div key={i} className={`bubble ${m.role} ${m.event ? 'event' : ''}`}>{m.event && <span className="event-label">Мира написала первой</span>}{m.text}</div>)}{(busy || eventBusy) && <div className="bubble mira typing">Мира печатает…</div>}</div><div className="composer"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Напиши Мире…" rows={2} /><button onClick={send} disabled={busy || !input.trim()}>Отправить</button></div></>}

    {tab === 'phone' && <section className="phone-view"><div className="section-intro"><div><span className="eyebrow">MIRA / PHONE</span><h2>Сообщения</h2><p>Не только чат. Иногда Мира сама оставляет тебе что-то здесь.</p></div><span className="phone-status">{unread ? `${unread} новых` : 'всё прочитано'}</span></div>{phone.length ? <div className="phone-list">{phone.slice().reverse().map(m => <article key={m.id} className={`phone-item ${m.direction}`}><div className="phone-meta">{m.direction === 'mira' ? 'Мира' : 'Ты'} · {new Date(m.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div><p>{m.body}</p>{m.kind === 'proactive' && <span className="phone-tag">написала первой</span>}</article>)}</div> : <div className="empty-state">Пока тихо. Первое сообщение появится здесь, когда у Миры будет повод написать.</div>}</section>}

    {tab === 'life' && <section className="life-view"><div className="section-intro"><div><span className="eyebrow">MIRA / LIFE</span><h2>Пока тебя не было</h2><p>Маленькие моменты, которые происходят с Мирой между вашими разговорами.</p></div><button className="secondary-button" onClick={createLifeEvent} disabled={lifeBusy}>{lifeBusy ? 'Ищет момент…' : 'Новый момент'}</button></div>{life.length ? <div className="life-list">{life.slice().reverse().map(e => <article key={e.id} className={`life-card mood-${e.mood}`}><div className="life-icon">{e.kind === 'song' ? '♪' : e.kind === 'place' ? '⌂' : e.kind === 'photo' ? '□' : '·'}</div><div><div className="life-meta">{new Date(e.occurredAt).toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} · {e.kind}</div><h3>{e.title}</h3><p>{e.body}</p></div></article>)}</div> : <div className="empty-state">У Миры пока нет истории между разговорами.</div>}</section>}

    <footer>Мира не притворяется человеком. Её характер, память, телефон и отношения — часть игровой системы.</footer>
  </section></main>;
}
