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
    "  useEffect(() => {\n    function onChoiceEvent(event: StorageEvent) {\n      if (event.key !== 'between-us-mira-choice-event-v1' || !event.newValue) return;\n      try {\n        const e = JSON.parse(event.newValue);\n        if (!e?.id || !e.choiceText) return;\n        const seen = localStorage.getItem('between-us-mira-last-choice-event-v1');\n        if (seen === e.id) return;\n        localStorage.setItem('between-us-mira-last-choice-event-v1', e.id);\n        const current = loadState();\n        const deltaTrust = Math.max(-1, Math.min(1, Number(e.trust || 0) * 0.25));\n        const deltaClose = Math.max(-1, Math.min(1, Number(e.trust || 0) * 0.35));\n        const deltaTension = Math.max(-1, Math.min(1, Number(e.tension || 0) * 0.3));\n        const next: MiraState = { ...current, trust: Math.max(-10, Math.min(10, current.trust + deltaTrust)), closeness: Math.max(-10, Math.min(10, current.closeness + deltaClose)), tension: Math.max(0, Math.min(10, current.tension + deltaTension)), memories: e.memory ? [...current.memories, { text: e.memory, createdAt: Date.now() }].slice(-30) : current.memories, mood: Number(e.tension || 0) >= 2 ? 'guarded' : Number(e.trust || 0) >= 2 ? 'warm' : current.mood };\n        persist(next);\n        const reply = Number(e.trust || 0) >= 2\n          ? `Я заметила твой выбор. Ты выбрал: «${e.choiceText}». Кажется, теперь я понимаю тебя чуть лучше.`\n          : Number(e.tension || 0) >= 2\n            ? `Я заметила твой выбор. Не уверена, что ожидала именно этого. Но я запомню.`\n            : `Я заметила твой выбор. Иногда то, что ты делаешь, говорит больше слов.`;\n        setChat(c => [...c, { role: 'mira', text: reply, event: true }]);\n        const item: PhoneMessage = { id: uid(), direction: 'mira', body: reply, kind: 'story-choice', createdAt: Date.now() };\n        const nextPhone = [...loadJson<PhoneMessage[]>(PHONE_KEY, []), item];\n        persistPhone(nextPhone);\n        void savePhone(nextPhone);\n        void saveRemote(next);\n      } catch {}\n    }\n    window.addEventListener('storage', onChoiceEvent);\n    return () => window.removeEventListener('storage', onChoiceEvent);\n  }, []);\n\n  const rel = useMemo(() => relationship(state), [state]);",
    'app/mira/page.tsx',
)

print('wire-mira: choice events connected')
