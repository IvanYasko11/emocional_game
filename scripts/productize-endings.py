from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()
marker = 'const PRODUCT_ENDINGS_V1 = true;'
if marker in s:
    print('Product endings already applied.')
    raise SystemExit(0)

s = s.replace('const REPLAY_BRANCH_PATCH_V1 = true;', 'const REPLAY_BRANCH_PATCH_V1 = true;\n' + marker, 1)
start = s.find('  if (ending) {')
end = s.find('  const replayHint =', start)
if start < 0 or end < 0:
    raise SystemExit('Ending render block not found')
replacement = '''  if (ending) {
    const first = previousChoices;
    const replay = runNumber > 1;
    const firstWasOpen = first['scene-04-name'] === 'scene-04-name-choice-01' || first['scene-04-name'] === 'scene-04-name-choice-02';
    const firstWasSilent = first['scene-02-after'] === 'scene-02-after-choice-03' || first['scene-05-test'] === 'scene-05-test-choice-03';
    const replayChoseHonesty = choices['replay-05-choice'] === 'replay-05-choice-02';
    const replayChoseDistance = choices['replay-05-choice'] === 'replay-05-choice-03';
    let endingTitle = 'НЕОПРЕДЕЛЁННОСТЬ';
    let endingText = 'Не каждая встреча заканчивается ответом. Иногда человек остаётся в памяти именно вопросом.';
    let endingLabel = 'НЕОПРЕДЕЛЁННОСТЬ';
    if (replay && replayChoseHonesty && firstWasOpen) {
      endingTitle = 'ВЫ ВЫБРАЛИ ДРУГ ДРУГА';
      endingText = 'В первый раз вы оба оставили важное между строк. Во второй — ты уже знал, где была спрятана правда, и выбрал не проходить мимо.';
      endingLabel = 'ВСТРЕЧА';
    } else if (replay && replayChoseDistance && firstWasSilent) {
      endingTitle = 'НАУЧИТЬСЯ ОТПУСКАТЬ';
      endingText = 'Память вернула тебя к той же двери не для того, чтобы ты вошёл. А чтобы ты наконец понял: близость без свободы тоже может быть одиночеством.';
      endingLabel = 'СВОБОДА';
    } else if (trust >= 8 && tension < 4) {
      endingTitle = 'БЛИЗОСТЬ';
      endingText = 'Она запомнит тебя не как человека, который её спас. А как человека, рядом с которым ей не пришлось притворяться.';
      endingLabel = 'БЛИЗОСТЬ';
    } else if (trust >= 4) {
      endingTitle = 'ДОВЕРИЕ';
      endingText = 'Она не забудет эту ночь. Возможно, потому что впервые смогла рассказать свою историю и остаться собой.';
      endingLabel = 'ДОВЕРИЕ';
    } else if (tension >= 5) {
      endingTitle = 'ДИСТАНЦИЯ';
      endingText = 'Она запомнит разговор. Но некоторые двери открываются только тогда, когда перестаёшь торопиться их открыть.';
      endingLabel = 'ДИСТАНЦИЯ';
    } else if (firstWasSilent) {
      endingTitle = 'НЕСКАЗАННОЕ';
      endingText = 'Ты оставил часть себя за дверью. Теперь ты знаешь, что молчание тоже становится выбором — и у него есть последствия.';
      endingLabel = 'НЕСКАЗАННОЕ';
    }
    const replayText = replay ? 'Прожить иначе · снова' : 'Прожить иначе';
    return <main className={`stage mood-${tension > trust ? 'tense' : trust > tension ? 'warm' : 'neutral'}`}>
      <div className="grain" /><div className="ambient" />
      <section className="intro ending">
        <div className="eyebrow">BETWEEN US · ПОСЛЕДНЯЯ СТРАНИЦА</div>
        <h1>{replay ? <>ВТОРОЙ РАЗ<br /><em>НЕ ПОВТОРЯЕТ</em><br />ПЕРВЫЙ.</> : <>ТЫ НЕ ИЗМЕНИЛ<br /><em>ЕЁ ПРОШЛОЕ.</em><br />ТЫ ИЗМЕНИЛ<br />ЭТУ НОЧЬ.</>}</h1>
        <p>{endingText}</p>
        <div className="ending-meta">
          <span>ВОСПОМИНАНИЙ · {memories.length.toString().padStart(2, '0')}</span>
          <span>ТВОЙ СЛЕД · {endingLabel}</span>
          {replay && <span>ПРОХОЖДЕНИЕ · {runNumber}</span>}
        </div>
        <div className="ending-actions">
          <button className="primary" onClick={startFresh}>{replayText} <span>↻</span></button>
          <button className="ghost" onClick={shareStory}>{sharing ? 'Скопировано' : 'Поделиться историей ↗'}</button>
        </div>
        <div className="ending-after">{endingTitle} · Твой выбор имеет продолжение.</div>
      </section>
    </main>;
  }

'''
s = s[:start] + replacement + s[end:]
p.write_text(s)
print('Product ending system applied.')
