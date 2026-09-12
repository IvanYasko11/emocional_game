from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()
marker = 'const REPLAY_SAVE_FIX_V1 = true;'
if marker in s:
    print('Replay save fix already applied.')
    raise SystemExit(0)
s = s.replace("const REPLAY_BRANCH_PATCH_V1 = true;", "const REPLAY_BRANCH_PATCH_V1 = true;\nconst REPLAY_SAVE_FIX_V1 = true;", 1)
old = "localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 3, chapterId: CHAPTER_ONE_ID, sceneId: nextRun > 1 ? replayScenes[0].id : chapters[0].scenes[0].id, choices: {}, trust: 0, tension: 0, memories: [], ending: false, runNumber: nextRun } satisfies SaveV3));"
new = "const replayPreviousChoices: Record<string, string> = nextRun > 1 ? (() => { try { const raw = localStorage.getItem(LAST_RUN_KEY); return raw ? ((JSON.parse(raw) as SaveV3).choices ?? {}) : {}; } catch { return {}; } })() : {};\n\n" + old[:-1] + ", previousChoices: replayPreviousChoices } satisfies SaveV3));"
if old not in s:
    raise SystemExit('Expected startFresh save initialization not found')
s = s.replace(old, new, 1)
p.write_text(s)
print('Replay save fix applied.')
