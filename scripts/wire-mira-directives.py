from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'app/page.tsx'
MIRA = ROOT / 'app/mira/page.tsx'


def once(path, old, new):
    text = path.read_text(encoding='utf-8')
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'mira-directives: anchor not found in {path}')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')

# Immediate route directive in the story, so the player cannot outrun Mira's intervention.
once(PAGE,
"    } catch {}\n  }\n\n  function continueStory() {",
"    } catch {}\n    try {\n      if (choice.id === 'scene-07-departure-choice-03') localStorage.setItem('between-us-mira-directive-v1', JSON.stringify({ sourceSceneId: current.id, nextSceneId: 'scene-09-truth', text: 'Мира передумала идти на крышу. «Сегодня я хочу сказать это сразу».', createdAt: Date.now(), expiresAt: Date.now() + 30 * 60 * 1000 }));\n      else if (choice.id === 'scene-08-rooftop-choice-02') localStorage.setItem('between-us-mira-directive-v1', JSON.stringify({ sourceSceneId: current.id, nextSceneId: 'scene-10-message', text: 'Мира решает не откладывать следующий разговор.', createdAt: Date.now(), expiresAt: Date.now() + 30 * 60 * 1000 }));\n    } catch {}\n  }\n\n  function continueStory()",
)

once(PAGE,
"  const [previousChoices, setPreviousChoices] = useState<Record<string, string>>({});",
"  const [previousChoices, setPreviousChoices] = useState<Record<string, string>>({});\n  const [miraDirective, setMiraDirective] = useState<{ sourceSceneId: string; nextSceneId: string; text: string } | null>(null);",
)

once(PAGE,
"  function continueStory() {\n    sound('warm');\n    if (current.nextSceneId) {\n      const nextScene = runNumber > 1 ? findReplayScene(current.nextSceneId) : findScene(chapter.id, current.nextSceneId);",
"  function continueStory() {\n    sound('warm');\n    const directedNextSceneId = miraDirective?.sourceSceneId === current.id ? miraDirective.nextSceneId : current.nextSceneId;\n    if (miraDirective?.sourceSceneId === current.id) { setMiraDirective(null); try { localStorage.removeItem('between-us-mira-directive-v1'); } catch {} }\n    if (directedNextSceneId) {\n      const nextScene = runNumber > 1 ? findReplayScene(directedNextSceneId) : findScene(chapter.id, directedNextSceneId);",
)

once(PAGE,
"  useEffect(() => {\n    try {\n      const storedRun = Number(localStorage.getItem(RUN_COUNT_KEY) ?? '0');",
"  useEffect(() => {\n    try { const raw = localStorage.getItem('between-us-mira-directive-v1'); if (raw) { const d = JSON.parse(raw); if (d?.sourceSceneId && d?.nextSceneId && d?.expiresAt > Date.now()) setMiraDirective({ sourceSceneId: d.sourceSceneId, nextSceneId: d.nextSceneId, text: d.text || 'Мира изменила следующий шаг истории.' }); else localStorage.removeItem('between-us-mira-directive-v1'); } } catch {}\n    function onMiraDirective(e: StorageEvent) { if (e.key !== 'between-us-mira-directive-v1' || !e.newValue) return; try { const d = JSON.parse(e.newValue); if (d?.sourceSceneId && d?.nextSceneId && d?.expiresAt > Date.now()) setMiraDirective({ sourceSceneId: d.sourceSceneId, nextSceneId: d.nextSceneId, text: d.text || 'Мира изменила следующий шаг истории.' }); } catch {} }\n    window.addEventListener('storage', onMiraDirective);\n    try {\n      const storedRun = Number(localStorage.getItem(RUN_COUNT_KEY) ?? '0');",
)

once(PAGE,
"    return () => {\n      ambient.current?.stop();",
"    return () => { window.removeEventListener('storage', onMiraDirective);\n      ambient.current?.stop();",
)

once(PAGE,
"          {!selectedChoice ? <><h2>{replayHint ?",
"          {!selectedChoice ? <>{miraDirective?.sourceSceneId === current.id && <div className=\"reaction mira-directive\">МИРА ИЗМЕНИЛА ХОД · {miraDirective.text}</div>}<h2>{replayHint ?",
)

print('mira-directives: story routing enabled')
