'use client';

import { useState } from 'react';

export default function MiraCompanion() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  return <div className="mira-companion">
    {open && <section className="mira-panel">
      <header>Мира <button onClick={() => setOpen(false)}>×</button></header>
      <div className="mira-messages">Я рядом. Можешь обсудить то, что произошло в истории.</div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Напиши Мире..." />
    </section>}
    <button className="mira-open" onClick={() => setOpen(v => !v)}>Мира 💬</button>
  </div>;
}
