'use client';

import { useEffect, useRef, useState } from 'react';

type Choice = { text: string; trust: number; tension: number; response: string; memory: string; next: string };
type Scene = { title: string; subtitle: string; line: string; detail: string; choices: Choice[] };
type Save = { started: boolean; scene: number; trust: number; tension: number; memories: string[]; ending?: boolean };

const SAVE_KEY = 'between-us-save-v1';

const scenes: Scene[] = [
  { title: '23:47', subtitle: 'ГЛАВА 01 / МИРА', line: '«Ты когда-нибудь оставался, когда тебя не просили?»', detail: 'Она сидит у окна и смотрит на город. В её голосе нет просьбы. Только усталость.', choices: [
    { text: 'Остаться рядом. Ничего не требовать.', trust: 2, tension: -1, response: 'Она впервые за вечер смотрит прямо на тебя. «Спасибо… что не ушёл».', memory: 'Ты остался, когда было проще уйти.', next: 'Она не улыбается. Но двигает стул, освобождая место рядом.' },
    { text: 'Спросить: «Что с тобой происходит?»', trust: 1, tension: 1, response: 'Она молчит дольше обычного. «Я не привыкла, что кому-то правда интересно».', memory: 'Ты задал вопрос, от которого нельзя спрятаться.', next: 'Она отвечает не сразу. Но впервые не меняет тему.' },
    { text: 'Дать ей пространство и уйти.', trust: -1, tension: -1, response: 'Она кивает. Но когда ты уходишь, её взгляд ещё долго остаётся на тебе.', memory: 'Ты дал ей пространство — и оставил вопрос без ответа.', next: 'На лестнице телефон коротко вибрирует. Сообщение без текста.' },
  ] },
  { title: '00:16', subtitle: 'ГЛАВА 02 / ПОСЛЕ', line: '«Я думала, ты уже ушёл».', detail: 'Сообщение пришло спустя двадцать девять минут. Три слова, которые значат больше, чем должны.', choices: [
    { text: '«Я здесь».', trust: 2, tension: 0, response: 'Точки набора появляются и исчезают. Потом: «Хорошо».', memory: 'Ты ответил без объяснений — и не потребовал ничего взамен.', next: 'За дверью слышны шаги. Она всё-таки выходит.' },
    { text: '«Ты хотела, чтобы я остался?»', trust: 1, tension: 2, response: 'Долгая пауза. «Не знаю. Наверное, именно поэтому спросила».', memory: 'Ты заставил её назвать то, чего она сама боялась.', next: 'Она открывает дверь, но не смотрит в глаза.' },
    { text: 'Ничего не отвечать.', trust: -2, tension: 1, response: 'Сообщение прочитано. Больше ничего не приходит.', memory: 'Ты выбрал молчание — теперь его тоже придётся помнить.', next: 'Город продолжает шуметь. А между вами становится слишком тихо.' },
  ] },
  { title: '00:41', subtitle: 'ГЛАВА 03 / ДОВЕРИЕ', line: 'Она протягивает тебе старую фотографию.', detail: '«Никому её не показывала». Теперь это не просто разговор. Это проверка того, что ты сделаешь с чужой уязвимостью.', choices: [
    { text: 'Посмотреть и вернуть молча.', trust: 2, tension: -1, response: 'Она забирает фотографию. В её лице появляется что-то похожее на облегчение.', memory: 'Ты увидел её прошлое и не стал присваивать его себе.', next: '«Наверное, теперь я могу тебе кое-что рассказать».' },
    { text: 'Спросить, кто на фотографии.', trust: 0, tension: 1, response: 'Она улыбается краем губ: «Любопытный». Но фотографию не прячет.', memory: 'Ты проявил интерес, не пытаясь угадать её историю.', next: 'Она начинает рассказывать сама.' },
    { text: 'Сказать, что не хочешь знать чужие тайны.', trust: -1, tension: -1, response: 'Она кивает. «Наверное, это честно». Но взгляд снова становится далёким.', memory: 'Ты поставил границу — и она запомнила её.', next: 'Иногда граница защищает. Иногда оставляет человека одного.' },
  ] },
];

export default function Home() {
  const [started, setStarted] = useState(false), [scene, setScene] = useState(0), [choice, setChoice] = useState<Choice | null>(null), [trust, setTrust] = useState(0), [tension, setTension] = useState(0), [memories, setMemories] = useState<string[]>([]), [ending, setEnding] = useState(false), [mounted, setMounted] = useState(false);
  const audio = useRef<AudioContext | null>(null), current = scenes[scene];

  function sound(kind: 'tap' | 'warm' | 'low') {
    if (typeof window === 'undefined') return; audio.current ??= new AudioContext(); const ctx = audio.current; if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = kind === 'low' ? 'triangle' : 'sine'; osc.frequency.value = kind === 'warm' ? 392 : kind === 'low' ? 146 : 220;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(kind === 'warm' ? 0.035 : 0.018, ctx.currentTime + 0.03); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === 'low' ? 0.55 : 0.32)); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + (kind === 'low' ? 0.6 : 0.36));
  }

  function save(next: Save) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch {} }
  function choose(c: Choice) {
    sound(c.trust > 0 ? 'warm' : c.tension > 0 ? 'low' : 'tap');
    const nextTrust = trust + c.trust, nextTension = tension + c.tension, nextMemories = [...memories, c.memory];
    setChoice(c); setTrust(nextTrust); setTension(nextTension); setMemories(nextMemories);
    save({ started: true, scene, trust: nextTrust, tension: nextTension, memories: nextMemories });
  }
  function continueStory() {
    sound('warm');
    if (scene < scenes.length - 1) {
      const nextScene = scene + 1; setScene(nextScene); setChoice(null); save({ started: true, scene: nextScene, trust, tension, memories });
    } else {
      setEnding(true); save({ started: true, scene, trust, tension, memories, ending: true });
    }
  }
  function startFresh() {
    localStorage.removeItem(SAVE_KEY); setStarted(true); setScene(0); setChoice(null); setTrust(0); setTension(0); setMemories([]); setEnding(false); sound('warm');
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) { const saved = JSON.parse(raw) as Save; setStarted(Boolean(saved.started)); setScene(Math.min(Math.max(saved.scene ?? 0, 0), scenes.length - 1)); setTrust(saved.trust ?? 0); setTension(saved.tension ?? 0); setMemories(Array.isArray(saved.memories) ? saved.memories : []); setEnding(Boolean(saved.ending)); }
    } catch {}
    setMounted(true);
    return () => { void audio.current?.close(); };
  }, []);

  if (!mounted) return <main className="stage"><div className="grain"/></main>;
  if (ending) return <main className={`stage mood-${tension > trust ? 'tense' : trust > tension ? 'warm' : 'neutral'}`}><div className="grain"/><div className="ambient"/><section className="intro ending"><div className="eyebrow">BETWEEN US · ПОСЛЕДНЯЯ СТРАНИЦА</div><h1>Ты не изменил<br/><em>её прошлое.</em><br/>Ты изменил то,<br/>что она решилась рассказать.</h1><p>{trust >= 4 ? 'Она запомнит тебя как человека, рядом с которым можно не прятаться.' : tension >= 4 ? 'Она запомнит этот разговор. Но, возможно, ещё не решит, можно ли тебе доверять.' : 'Она не скажет вслух, что почувствовала. Но твой выбор останется в её памяти.'}</p><div className="ending-meta"><span>ВОСПОМИНАНИЙ · {memories.length.toString().padStart(2, '0')}</span><span>ДОВЕРИЕ · {trust > 0 ? '+' : ''}{trust}</span><span>НАПРЯЖЕНИЕ · {tension > 0 ? '+' : ''}{tension}</span></div><button className="primary" onClick={startFresh}>Прожить историю заново <span>↻</span></button></section></main>;

  return <main className={`stage mood-${tension > trust ? 'tense' : trust > tension ? 'warm' : 'neutral'}`}><div className="grain"/><div className="ambient"/>
    {!started ? <section className="intro"><div className="eyebrow">BETWEEN US · INTERACTIVE STORY</div><h1>Иногда человеку<br/><em>нужно не решение.</em><br/>А чтобы кто-то остался.</h1><p>Это история о доверии. Здесь нет правильных ответов. Твои действия меняют не только разговор — они меняют то, каким тебя запомнит другой человек.</p><button className="primary" onClick={() => { sound('warm'); setStarted(true); save({ started: true, scene: 0, trust: 0, tension: 0, memories: [] }); }}>Начать историю <span>→</span></button></section> : <section className="story">
      <header><span>{current.title}</span><span>{current.subtitle}</span><span>ПАМЯТЬ {memories.length.toString().padStart(2, '0')}</span></header>
      <div className="scene"><div className="character" aria-label="Мира"><div className="halo"/><div className="face"/><div className="pulse"/></div><div className="copy"><div className="name">МИРА <span>•</span> она ещё не знает, что ты запомнишь</div>{!choice ? <><h2>{current.line}</h2><p>{current.detail}</p></> : <><div className="reaction">РЕАКЦИЯ МИРЫ</div><h2>{choice.response}</h2><p className="memory">ПАМЯТЬ СОХРАНЕНА · {choice.memory}</p><p className="next-line">{choice.next}</p></>}</div></div>
      {!choice ? <div className="choices">{current.choices.map((c, i) => <button key={c.text} onClick={() => choose(c)}><span>0{i + 1}</span>{c.text}<b>↗</b></button>)}</div> : <div className="after"><div className="meters"><span>доверие {trust > 0 ? '+' : ''}{trust}</span><span>напряжение {tension > 0 ? '+' : ''}{tension}</span></div><button className="primary" onClick={continueStory}>{scene < scenes.length - 1 ? 'Следующая сцена' : 'Узнать, чем всё закончилось'} <span>→</span></button></div>}
      {memories.length > 0 && <aside className="memory-drawer"><span>ЕЁ ПАМЯТЬ</span><strong>{memories[memories.length - 1]}</strong></aside>}
      {scene > 0 && !choice && <button className="reset" onClick={startFresh}>Начать заново</button>}
    </section>}
  </main>;
}
