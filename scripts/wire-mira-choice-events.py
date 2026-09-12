from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'app/page.tsx'
MIRA = ROOT / 'app/mira/page.tsx'


def replace_once(path: Path, old: str, new: str, label: str):
    text = path.read_text(encoding='utf-8')
    if new in text:
        return False
    if old not in text:
        raise SystemExit(f'wire-mira: anchor not found in {label}')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')
    return True

# The story iframe and Mira workspace share the same origin. Emit a tiny, versioned
# localStorage event whenever a player commits a choice; the Mira pane consumes it.
replace_once(
    PAGE,
    "    save(makeSave({ choices: nextChoices, trust: nextTrust, tension: nextTension, memories: nextMemories }));\n  }",
    "    save(makeSave({ choices: nextChoices, trust: nextTrust, tension: nextTension, memories: nextMemories }));\n    try {\n      localStorage.setItem('between-us-mira-choice-event-v1', JSON.stringify({\n        id: `${Date.now()}-${choice.id}`,\n        sceneId: current.id,\n        choiceId: choice.id,\n        choiceText: choice.text,\n        response: choice.response,\n        memory: choice.memory,\n        trust: choice.trust,\n        tension: choice.tension,\n        createdAt: Date.now(),\n      }));\n    } catch {}\n  }",
    'app/page.tsx',
)

# Mira reacts in the same window: the choice becomes a relationship event and a phone item.
replace_once(
    MIRA,
    "  const rel = useMemo(() => relationship(state), [state]);",
    "  useEffect(() => {\n    function onChoiceEvent(event: StorageEvent) {\n      if (event.key !== 'between-us-mira-choice-event-v1' || !event.newValue) return;\n      try {\n        const e = JSON.parse(event.newValue);\n        if (!e?.id || !e.choiceText) return;\n        const seen = localStorage.getItem('between-us-mira-last-choice-event-v1');\n        if (seen === e.id) return;\n        localStorage.setItem('between-us-mira-last-choice-event-v1', e.id);\n        const current = loadState();\n        const deltaTrust = Math.max(-1, Math.min(1, Number(e.trust || 0) * 0.25));\n        const deltaClose = Math.max(-1, Math.min(1, Number(e.trust || 0) * 0.35));\n        const deltaTension = Math.max(-1, Math.min(1, Number(e.tension || 0) * 0.3));\n        const next: MiraState = { ...current, trust: Math.max(-10, Math.min(10, current.trust + deltaTrust)), closeness: Math.max(-10, Math.min(10, current.closeness + deltaClose)), tension: Math.max(0, Math.min(10, current.tension + deltaTension)), memories: e.memory ? [...current.memories, { text: e.memory, createdAt: Date.now() }].slice(-30) : current.memories, mood: Number(e.tension || 0) >= 2 ? 'guarded' : Number(e.trust || 0) >= 2 ? 'warm' : current.mood };\n        persist(next);\n        const reply = Number(e.trust || 0) >= 2\n          ? `Я заметила твой выбор. Ты выбрал: «${e.choiceText}». Кажется, теперь я понимаю тебя чуть лучше.`\n          : Number(e.tension || 0) >= 2\n            ? `Я заметила твой выбор. Не уверена, что ожидала именно этого. Но я запомню.`\n            : `Я заметила твой выбор. Иногда то, что ты делаешь, говорит больше слов.`;\n        setChat(c => [...c, { role: 'mira', text: reply, event: true }]);\n        const item: PhoneMessage = { id: uid(), direction: 'mira', body: reply, kind: 'story-choice', createdAt: Date.now() };\n        const nextPhone = [...loadJson<PhoneMessage[]>(PHONE_KEY, []), item];\n        persistPhone(nextPhone);\n        void savePhone(nextPhone);\n        void saveRemote(next);\n\n        // Mira can occasionally change the route instead of merely commenting on it.\n        // The branch is deterministic and safe: only known story IDs can be targeted.\n        let directive: { sourceSceneId: string; nextSceneId: string; text: string } | null = null;\n        if (e.choiceId === 'scene-07-departure-choice-03') {\n          directive = { sourceSceneId: e.sceneId, nextSceneId: 'scene-09-truth', text: 'Мира передумала идти на крышу. «Сегодня я хочу сказать это сразу». Она ведёт тебя дальше — без промежуточной остановки.' };\n        } else if (e.choiceId === 'scene-08-rooftop-choice-02') {\n          directive = { sourceSceneId: e.sceneId, nextSceneId: 'scene-10-message', text: 'Запись, которую Мира хотела показать позже, уже не ждёт. После её рассказа следующий шаг приходит раньше, чем вы ожидали.' };\n        }\n        if (directive) {\n          localStorage.setItem('between-us-mira-directive-v1', JSON.stringify({ ...directive, createdAt: Date.now(), expiresAt: Date.now() + 30 * 60 * 1000 }));\n        }\n      } catch {}\n    }\n    window.addEventListener('storage', onChoiceEvent);\n    return () => window.removeEventListener('storage', onChoiceEvent);\n  }, []);\n\n  const rel = useMemo(() => relationship(state), [state]);",
    'app/mira/page.tsx',
)

# The story consumes Mira's one-shot route directive when advancing from the choice.
replace_once(
    PAGE,
    "  const [previousChoices, setPreviousChoices] = useState<Record<string, string>>({});",
    "  const [previousChoices, setPreviousChoices] = useState<Record<string, string>>({});\n  const [miraDirective, setMiraDirective] = useState<{ sourceSceneId: string; nextSceneId: string; text: string } | null>(null);",
    'app/page.tsx',
)

replace_once(
    PAGE,
    "  function continueStory() {\n    sound('warm');\n    if (current.nextSceneId) {\n      const nextScene = runNumber > 1 ? findReplayScene(current.nextSceneId) : findScene(chapter.id, current.nextSceneId);",
    "  function continueStory() {\n    sound('warm');\n    const directedNextSceneId = miraDirective?.sourceSceneId === current.id ? miraDirective.nextSceneId : current.nextSceneId;\n    if (miraDirective?.sourceSceneId === current.id) {\n      setMiraDirective(null);\n      try { localStorage.removeItem('between-us-mira-directive-v1'); } catch {}\n    }\n    if (directedNextSceneId) {\n      const nextScene = runNumber > 1 ? findReplayScene(directedNextSceneId) : findScene(chapter.id, directedNextSceneId);",
    'app/page.tsx',
)

replace_once(
    PAGE,
    "  useEffect(() => {\n    try {\n      const storedRun = Number(localStorage.getItem(RUN_COUNT_KEY) ?? '0');",
    "  useEffect(() => {\n    try {\n      const rawDirective = localStorage.getItem('between-us-mira-directive-v1');\n      if (rawDirective) {\n        const directive = JSON.parse(rawDirective);\n        if (directive?.sourceSceneId && directive?.nextSceneId && directive?.expiresAt > Date.now()) setMiraDirective({ sourceSceneId: directive.sourceSceneId, nextSceneId: directive.nextSceneId, text: directive.text || 'Мира изменила следующий шаг этой истории.' });\n        else localStorage.removeItem('between-us-mira-directive-v1');\n      }\n    } catch {}\n    function onMiraDirective(event: StorageEvent) {\n      if (event.key !== 'between-us-mira-directive-v1' || !event.newValue) return;\n      try { const d = JSON.parse(event.newValue); if (d?.sourceSceneId && d?.nextSceneId && d?.expiresAt > Date.now()) setMiraDirective({ sourceSceneId: d.sourceSceneId, nextSceneId: d.nextSceneId, text: d.text || 'Мира изменила следующий шаг этой истории.' }); } catch {}\n    }\n    window.addEventListener('storage', onMiraDirective);\n    try {\n      const storedRun = Number(localStorage.getItem(RUN_COUNT_KEY) ?? '0');",
    'app/page.tsx',
)

replace_once(
    PAGE,
    "    return () => {\n      ambient.current?.stop();",
    "    return () => {\n      window.removeEventListener('storage', onMiraDirective);\n      ambient.current?.stop();",
    'app/page.tsx',
)

replace_once(
    PAGE,
    "          {!selectedChoice ? <><h2>{replayHint ?",
    "          {!selectedChoice ? <>{miraDirective?.sourceSceneId === current.id && <div className=\"reaction mira-directive\">МИРА ИЗМЕНИЛА ХОД ИСТОРИИ · {miraDirective.text}</div>}<h2>{replayHint ?",
    'app/page.tsx',
)

print('wire-mira: choice events and route directives connected')
