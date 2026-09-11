'use client';

import { useEffect, useRef, useState } from 'react';

type Choice = { text: string; trust: number; fear: number; response: string; memory: string };

const choices: Choice[] = [
  { text: 'Остаться рядом. Ничего не требовать.', trust: 2, fear: -1, response: 'Она впервые за вечер смотрит прямо на тебя. «Спасибо… что не ушёл».', memory: 'Ты остался, когда было проще уйти.' },
  { text: 'Спросить: «Что с тобой происходит?»', trust: 1, fear: 1, response: 'Она молчит дольше обычного. Потом тихо: «Я не привыкла, что кому-то правда интересно».', memory: 'Ты задал вопрос, от которого нельзя спрятаться.' },
  { text: 'Дать ей пространство и уйти.', trust: -1, fear: -1, response: 'Она кивает. Но когда ты уходишь, её взгляд ещё долго остаётся на тебе.', memory: 'Ты дал ей пространство — и оставил вопрос без ответа.' },
];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [trust, setTrust] = useState(0);
  const [fear, setFear] = useState(0);
  const audio = useRef<AudioContext | null>(null);

  function sound(type: 'tap' | 'warm') {
    if (typeof window === 'undefined') return;
    audio.current ??= new AudioContext();
    const ctx = audio.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = type === 'warm' ? 392 : 220;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(type === 'warm' ? 0.035 : 0.02, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.35);
  }

  function choose(c: Choice) {
    sound(c.trust > 0 ? 'warm' : 'tap');
    setChoice(c); setTrust(v => v + c.trust); setFear(v => v + c.fear);
  }

  useEffect(() => () => { audio.current?.close(); }, []);

  return <main className="stage">
    <div className="grain" />
    {!started ? <section className="intro">
      <div className="eyebrow">BETWEEN US · CHAPTER 01</div>
      <h1>Иногда человеку<br/><em>нужно не решение.</em><br/>А чтобы кто-то остался.</h1>
      <p>Это история о доверии. Здесь нет правильных ответов. Есть только то, что ты оставишь после себя.</p>
      <button className="primary" onClick={() => { sound('warm'); setStarted(true); }}>Начать историю <span>→</span></button>
    </section> : <section className="story">
      <header><span>23:47</span><span>Глава 01 / Мира</span></header>
      <div className="scene">
        <div className="moon" />
        <div className="character"><div className="halo" /><div className="face" /></div>
        <div className="copy">
          <div className="name">МИРА <span>•</span> незнакомое тебе лицо</div>
          {!choice ? <><h2>«Ты когда-нибудь<br/>оставался, когда<br/>тебя не просили?»</h2><p>Она сидит у окна и смотрит на город. В её голосе нет просьбы. Только усталость.</p></> : <><h2>{choice.response}</h2><p className="memory">Память сохранена · {choice.memory}</p></>}
        </div>
      </div>
      {!choice ? <div className="choices">{choices.map((c, i) => <button key={c.text} onClick={() => choose(c)}><span>0{i + 1}</span>{c.text}<b>↗</b></button>)}</div> : <div className="after"><div className="meters"><span>доверие {trust > 0 ? '+' : ''}{trust}</span><span>напряжение {fear > 0 ? '+' : ''}{fear}</span></div><button className="primary" onClick={() => setChoice(null)}>Продолжить <span>→</span></button></div>}
    </section>}
  </main>;
}
