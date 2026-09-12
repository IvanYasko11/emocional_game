from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()
marker = 'const DEEP_CONSEQUENCES_V1 = true;'
if marker in s:
    print('Deep consequences already applied.')
    raise SystemExit(0)

needle = 'const REPLAY_BRANCH_PATCH_V1 = true;'
if needle not in s:
    raise SystemExit('Replay branch marker not found')
s = s.replace(needle, needle + '\n' + marker, 1)

start = s.find('function personalizeReplayScene')
end = s.find('\n  return scene;\n}', start)
if start < 0 or end < 0:
    raise SystemExit('Replay personalization function not found')

patch = r'''

  // Deep consequences: the replay remembers *patterns* across several first-run choices.
  // This deliberately changes what happens, not only what the narrator says.
  const chosePresence = first === 'scene-01-window-choice-01';
  const choseCuriosity = second === 'scene-02-after-choice-02';
  const protectedHerPast = third === 'scene-03-photograph-choice-01';
  const gavePermission = fourth === 'scene-04-name-choice-01';
  const admittedFear = fifth === 'scene-05-test-choice-02';

  if (scene.id === 'replay-03-door' && choseCuriosity && protectedHerPast) {
    return {
      ...scene,
      nextSceneId: 'replay-04-confession',
      line: 'Мира открывает дверь раньше, чем ты успеваешь постучать.',
      detail: 'В первый раз ты спросил, но не стал присваивать её прошлое. Во второй она сама решает, сколько тебе показать — и встречает тебя раньше, чем ты попросишь.'
    };
  }

  if (scene.id === 'replay-04-confession' && gavePermission && protectedHerPast) {
    return {
      ...scene,
      nextSceneId: 'replay-05-choice',
      line: '«Ты помнишь, что тогда сказал мне не рассказывать?» — спрашивает Мира. «Я запомнила именно это».',
      detail: 'Твоя первая граница стала для неё доказательством безопасности. Поэтому во второй раз признание начинается не с проверки, а с доверия.'
    };
  }

  if (scene.id === 'replay-05-choice' && chosePresence && admittedFear) {
    return {
      ...scene,
      line: '«В первый раз ты остался. Потом впервые сказал, что тебе тоже страшно».',
      detail: 'Эти два решения больше не существуют отдельно. Мира больше не просит доказать близость — она предлагает выбрать её вместе.',
      choices: scene.choices.map((choice, index) => index === 0
        ? { ...choice, text: '«Давай не будем делать вид, что нам не страшно».', trust: choice.trust + 1, response: 'Она кивает. «Тогда впервые попробуем честно».', memory: 'Вы назвали страх общим, а не чужим.' }
        : choice)
    };
  }

  if (scene.id === 'replay-06-morning' && choseCuriosity && !admittedFear) {
    return {
      ...scene,
      line: 'Утром Мира оставляет тебе голосовое сообщение — впервые.',
      detail: 'В первый раз ты заставил её назвать желание остаться. Во второй она сама делает следующий шаг, но оставляет тебе право решить, что будет дальше.',
      choices: scene.choices.map((choice, index) => index === 1
        ? { ...choice, text: 'Ответить голосовым: «Я услышал тебя».', trust: choice.trust + 1, response: 'После паузы приходит короткое: «Тогда сегодня не уходи первым».', memory: 'Ты ответил не объяснением, а присутствием.' }
        : choice)
    };
  }
'''

s = s[:end] + patch + s[end:]
p.write_text(s)
print('Deep consequence engine applied.')
