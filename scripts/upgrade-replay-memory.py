from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

if 'REPLAY_MEMORY_PATCH_V1' in s:
    print('Replay memory patch already applied.')
    raise SystemExit(0)

s = s.replace("  runNumber?: number;\n};", "  runNumber?: number;\n  previousChoices?: Record<string, string>;\n};", 1)
s = s.replace("const LAST_RUN_KEY = 'between-us-last-run-v1';", "const LAST_RUN_KEY = 'between-us-last-run-v1';\nconst REPLAY_MEMORY_PATCH_V1 = true;", 1)
s = s.replace("  const [runNumber, setRunNumber] = useState(1);", "  const [runNumber, setRunNumber] = useState(1);\n  const [previousChoices, setPreviousChoices] = useState<Record<string, string>>({});", 1)
s = s.replace(
    "  const current = (runNumber > 1 ? findReplayScene(sceneId) : findScene(chapter.id, sceneId)) ?? (runNumber > 1 ? replayScenes[0] : chapter.scenes[0]);",
    "  const replayBase = runNumber > 1 ? findReplayScene(sceneId) : undefined;\n  const current = (runNumber > 1 ? personalizeReplayScene(replayBase, previousChoices) : findScene(chapter.id, sceneId)) ?? (runNumber > 1 ? replayScenes[0] : chapter.scenes[0]);",
    1,
)
s = s.replace(
    "function findReplayScene(sceneId: string) { return replayScenes.find((scene) => scene.id === sceneId); }",
    '''function findReplayScene(sceneId: string) { return replayScenes.find((scene) => scene.id === sceneId); }

function personalizeReplayScene(scene: Scene | undefined, previousChoices: Record<string, string>): Scene | undefined {
  if (!scene) return undefined;
  const first = previousChoices['scene-01-window'];
  const second = previousChoices['scene-02-after'];
  const fifth = previousChoices['scene-05-test'];

  if (scene.id === 'replay-01-return') {
    if (first === 'scene-01-window-choice-03') {
      return { ...scene, nextSceneId: 'replay-03-door', line: '«В прошлый раз ты ушёл. Я помню».', detail: 'На этот раз Мира не ждёт сообщения. Она открывает дверь сама — потому что помнит твоё отсутствие.' };
    }
    if (first === 'scene-01-window-choice-02') {
      return { ...scene, line: '«Ты снова хочешь понять, что со мной происходит?»', detail: 'Она помнит твой вопрос из первой ночи. Теперь ей интересно, задашь ли ты его снова.' };
    }
    return { ...scene, line: '«Ты остался. Я помню это».', detail: 'Первое решение не исчезло. Оно изменило то, с чего Мира начинает этот вечер.' };
  }

  if (scene.id === 'replay-02-memory') {
    if (second === 'scene-02-after-choice-03') {
      return { ...scene, line: '«В прошлый раз ты ничего не ответил».', detail: 'Твоё молчание стало частью её памяти. Теперь она не оставляет эту паузу без последствий.' };
    }
    if (second === 'scene-02-after-choice-02') {
      return { ...scene, line: '«В прошлый раз ты спросил, хотела ли я, чтобы ты остался».', detail: 'Она помнит, как ты заставил её назвать желание. Теперь она сама начинает разговор.' };
    }
    return { ...scene, line: '«После той ночи я перечитывала твои слова».', detail: 'То, что ты сказал раньше, стало для неё точкой отсчёта.' };
  }

  if (scene.id === 'replay-05-choice' && fifth === 'scene-05-test-choice-02') {
    return { ...scene, line: '«В первый раз ты тоже признался, что тебе было страшно».', detail: 'Мира помнит твою уязвимость. Поэтому сегодня она не проверяет тебя — она отвечает взаимностью.' };
  }

  return scene;
}
''',
    1,
)
s = s.replace("      runNumber,\n      ...next,", "      runNumber,\n      previousChoices,\n      ...next,", 1)
s = s.replace(
    "      localStorage.setItem(RUN_COUNT_KEY, String(nextRun));\n      localStorage.removeItem(SAVE_KEY);",
    '''      localStorage.setItem(RUN_COUNT_KEY, String(nextRun));
      let replayPreviousChoices: Record<string, string> = {};
      if (nextRun > 1) {
        try {
          const parsed = previous ? JSON.parse(previous) as Partial<SaveV3> : undefined;
          replayPreviousChoices = parsed?.choices && typeof parsed.choices === 'object' ? parsed.choices : {};
        } catch {}
      }
      setPreviousChoices(replayPreviousChoices);
      localStorage.removeItem(SAVE_KEY);''',
    1,
)
s = s.replace(
    "previousChoices: replayPreviousChoices } satisfies SaveV3",
    "previousChoices: replayPreviousChoices } satisfies SaveV3",
)
s = s.replace(
    "      localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 3, chapterId: CHAPTER_ONE_ID, sceneId: nextRun > 1 ? replayScenes[0].id : chapters[0].scenes[0].id, choices: {}, trust: 0, tension: 0, memories: [], ending: false, runNumber: nextRun, previousChoices: replayPreviousChoices } satisfies SaveV3));",
    "      localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 3, chapterId: CHAPTER_ONE_ID, sceneId: nextRun > 1 ? replayScenes[0].id : chapters[0].scenes[0].id, choices: {}, trust: 0, tension: 0, memories: [], ending: false, runNumber: nextRun, previousChoices } satisfies SaveV3));",
    1,
)
s = s.replace(
    "          setEnding(Boolean(saved.ending));\n          if (saved.runNumber && saved.runNumber > 0) setRunNumber(saved.runNumber);",
    "          setEnding(Boolean(saved.ending));\n          setPreviousChoices(saved.previousChoices && typeof saved.previousChoices === 'object' ? saved.previousChoices : {});\n          if (saved.runNumber && saved.runNumber > 0) setRunNumber(saved.runNumber);",
    1,
)
p.write_text(s)
print('Replay memory patch applied.')
