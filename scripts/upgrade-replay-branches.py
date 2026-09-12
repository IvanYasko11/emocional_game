from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

if 'REPLAY_BRANCH_PATCH_V1' in s:
    print('Replay branch patch already applied.')
    raise SystemExit(0)

needle = "const REPLAY_MEMORY_PATCH_V1 = true;"
s = s.replace(needle, needle + "\nconst REPLAY_BRANCH_PATCH_V1 = true;", 1)

old = """  if (scene.id === 'replay-05-choice' && fifth === 'scene-05-test-choice-02') {
    return { ...scene, line: '«В первый раз ты тоже признался, что тебе было страшно».', detail: 'Мира помнит твою уязвимость. Поэтому сегодня она не проверяет тебя — она отвечает взаимностью.' };
  }

  return scene;
}"""

new = """  if (scene.id === 'replay-05-choice' && fifth === 'scene-05-test-choice-02') {
    return { ...scene, line: '«В первый раз ты тоже признался, что тебе было страшно».', detail: 'Мира помнит твою уязвимость. Поэтому сегодня она не проверяет тебя — она отвечает взаимностью.' };
  }

  // The replay is a different timeline, not a text skin: combinations of past choices
  // can reroute the player before the final scene.
  if (scene.id === 'replay-03-door' && first === 'scene-01-window-choice-03' && second === 'scene-02-after-choice-03') {
    return { ...scene, nextSceneId: 'replay-05-choice', line: 'На этот раз дверь открывается, но Мира не ждёт объяснений.', detail: 'Ты дважды выбрал молчание в первой ночи. Теперь она предлагает встретиться без попытки вернуть прошлое.' };
  }

  if (scene.id === 'replay-04-confession' && first === 'scene-01-window-choice-01' && fifth === 'scene-05-test-choice-02') {
    return { ...scene, line: '«В первый раз ты остался. Потом признался, что тебе тоже было страшно».', detail: 'Два старых решения складываются в новый момент: Мира перестаёт проверять, останешься ли ты, и говорит первой.' };
  }

  if (scene.id === 'replay-06-morning') {
    if (first === 'scene-01-window-choice-03' && second === 'scene-02-after-choice-03') {
      return { ...scene, line: 'Утром сообщения нет.', detail: 'В первый раз между вами осталось слишком много молчания. Во второй попытке Мира не делает первый шаг — теперь следующий ход полностью за тобой.', choices: scene.choices.map((choice, index) => index === 0 ? { ...choice, text: 'Написать первым: «Я помню, почему ушёл».', trust: choice.trust + 1, response: 'Сообщение прочитано. Через минуту: «Тогда приходи. Но не обещай мне, что всё будет иначе».', memory: 'Ты впервые взял ответственность за незаконченный разговор.' } : choice) };
    }
    if (first === 'scene-01-window-choice-01' && fifth === 'scene-05-test-choice-02') {
      return { ...scene, line: 'Утром она уже ждёт твоего сообщения.', detail: 'Вы оба помните, что в первый раз страх был назван вслух. На этот раз молчание больше не нужно.', choices: scene.choices.map((choice, index) => index === 0 ? { ...choice, text: 'Написать: «Я всё ещё здесь».', trust: choice.trust + 1, response: '«Я знаю», — отвечает Мира. И впервые это не звучит как вопрос.' } : choice) };
    }
  }

  return scene;
}"""

if old not in s:
    raise SystemExit('Expected replay personalization block not found')
s = s.replace(old, new, 1)
p.write_text(s)
print('Replay branch patch applied.')
