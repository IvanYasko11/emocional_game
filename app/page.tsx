'use client';

import { useEffect, useRef, useState } from 'react';

type Choice = {
  id: string;
  text: string;
  trust: number;
  tension: number;
  response: string;
  memory: string;
  next: string;
  echo?: string;
};

type Scene = {
  id: string;
  title: string;
  subtitle: string;
  line: string;
  detail: string;
  choices: Choice[];
  nextSceneId?: string;
  nextChapterId?: string;
};

type Chapter = {
  id: string;
  title: string;
  scenes: Scene[];
  nextChapterId?: string;
};

type SaveV3 = {
  version: 3;
  chapterId: string;
  sceneId: string;
  choices: Record<string, string>;
  trust: number;
  tension: number;
  memories: string[];
  ending?: boolean;
  runNumber?: number;
};

type LegacySaveV2 = {
  started?: boolean;
  scene?: number;
  trust?: number;
  tension?: number;
  memories?: string[];
  ending?: boolean;
};

const SAVE_KEY = 'between-us-save-v3';
const LEGACY_SAVE_KEY = 'between-us-save-v2';
const RUN_COUNT_KEY = 'between-us-run-count-v1';
const CHAPTER_ONE_ID = 'chapter-01-window';

const chapters: Chapter[] = [{
  id: CHAPTER_ONE_ID,
  title: 'ГЛАВА 01',
  scenes: [
  {
    id: 'scene-01-window',
    title: '23:47',
    subtitle: 'ГЛАВА 01 / ОКНО',
    nextSceneId: 'scene-02-after',
    line: '«Ты когда-нибудь оставался, когда тебя не просили?»',
    detail: 'Мира сидит у окна и смотрит на город. В её голосе нет просьбы. Только усталость.',
    choices: [
      { id: 'scene-01-window-choice-01', text: 'Остаться рядом. Ничего не требовать.', trust: 2, tension: -1, response: 'Она впервые за вечер смотрит прямо на тебя. «Спасибо… что не ушёл».', memory: 'Ты остался, когда было проще уйти.', next: 'Она не улыбается. Но двигает стул, освобождая место рядом.', echo: 'Она запомнила не слова. То, что ты не торопил её.' },
      { id: 'scene-01-window-choice-02', text: 'Спросить: «Что с тобой происходит?»', trust: 1, tension: 1, response: 'Она молчит дольше обычного. «Я не привыкла, что кому-то правда интересно».', memory: 'Ты задал вопрос, от которого нельзя спрятаться.', next: 'Она отвечает не сразу. Но впервые не меняет тему.', echo: 'Она запомнила, что ты захотел понять.' },
      { id: 'scene-01-window-choice-03', text: 'Дать ей пространство и уйти.', trust: -1, tension: -1, response: 'Она кивает. Но когда ты уходишь, её взгляд ещё долго остаётся на тебе.', memory: 'Ты дал ей пространство — и оставил вопрос без ответа.', next: 'На лестнице телефон коротко вибрирует. Сообщение без текста.', echo: 'Она запомнила твоё отсутствие не меньше, чем другие помнят присутствие.' },
    ],
  },
  {
    id: 'scene-02-after',
    title: '00:16',
    subtitle: 'ГЛАВА 02 / ПОСЛЕ',
    nextSceneId: 'scene-03-photograph',
    line: '«Я думала, ты уже ушёл».',
    detail: 'Сообщение пришло спустя двадцать девять минут. Три слова, которые значат больше, чем должны.',
    choices: [
      { id: 'scene-02-after-choice-01', text: '«Я здесь».', trust: 2, tension: 0, response: 'Точки набора появляются и исчезают. Потом: «Хорошо».', memory: 'Ты ответил без объяснений — и не потребовал ничего взамен.', next: 'За дверью слышны шаги. Она всё-таки выходит.', echo: 'Позже она признается: именно эти два слова она перечитывала ночью.' },
      { id: 'scene-02-after-choice-02', text: '«Ты хотела, чтобы я остался?»', trust: 1, tension: 2, response: 'Долгая пауза. «Не знаю. Наверное, именно поэтому спросила».', memory: 'Ты заставил её назвать то, чего она сама боялась.', next: 'Она открывает дверь, но не смотрит в глаза.', echo: 'Она запомнила, что рядом с тобой приходится быть честнее.' },
      { id: 'scene-02-after-choice-03', text: 'Ничего не отвечать.', trust: -2, tension: 1, response: 'Сообщение прочитано. Больше ничего не приходит.', memory: 'Ты выбрал молчание — теперь его тоже придётся помнить.', next: 'Город продолжает шуметь. А между вами становится слишком тихо.', echo: 'Она больше не пишет первой. По крайней мере, пока.' },
    ],
  },
  {
    id: 'scene-03-photograph',
    title: '00:41',
    subtitle: 'ГЛАВА 03 / ФОТОГРАФИЯ',
    nextSceneId: 'scene-04-name',
    line: 'Она протягивает тебе старую фотографию.',
    detail: '«Никому её не показывала». Теперь это не просто разговор. Это проверка того, что ты сделаешь с чужой уязвимостью.',
    choices: [
      { id: 'scene-03-photograph-choice-01', text: 'Посмотреть и вернуть молча.', trust: 2, tension: -1, response: 'Она забирает фотографию. В её лице появляется что-то похожее на облегчение.', memory: 'Ты увидел её прошлое и не стал присваивать его себе.', next: '«Наверное, теперь я могу тебе кое-что рассказать».', echo: 'Она впервые достаёт из памяти то, что обычно прячет.' },
      { id: 'scene-03-photograph-choice-02', text: 'Спросить, кто на фотографии.', trust: 0, tension: 1, response: 'Она улыбается краем губ: «Любопытный». Но фотографию не прячет.', memory: 'Ты проявил интерес, не пытаясь угадать её историю.', next: 'Она начинает рассказывать сама.', echo: 'Ей понравилось, что ты спросил, а не придумал ответ за неё.' },
      { id: 'scene-03-photograph-choice-03', text: 'Сказать, что не хочешь знать чужие тайны.', trust: -1, tension: -1, response: 'Она кивает. «Наверное, это честно». Но взгляд снова становится далёким.', memory: 'Ты поставил границу — и она запомнила её.', next: 'Иногда граница защищает. Иногда оставляет человека одного.', echo: 'Она больше не показывает фотографию. Но продолжает держать её при себе.' },
    ],
  },
  {
    id: 'scene-04-name',
    title: '01:08',
    subtitle: 'ГЛАВА 04 / ИМЯ',
    nextSceneId: 'scene-05-test',
    line: '«Я никому не рассказывала, почему уехала».',
    detail: 'Она произносит это так, будто проверяет не тебя, а саму себя. За окном проходит первый автобус.',
    choices: [
      { id: 'scene-04-name-choice-01', text: '«Можешь не рассказывать».', trust: 3, tension: -1, response: 'Мира выдыхает. «Вот поэтому я и хочу рассказать».', memory: 'Ты дал ей право не говорить — и она выбрала сказать.', next: 'Она впервые называет имя человека с фотографии.', echo: 'Свобода рассказать оказалась важнее самого рассказа.' },
      { id: 'scene-04-name-choice-02', text: '«Я слушаю».', trust: 2, tension: 0, response: 'Она кивает. И говорит. Медленно, с паузами, не пряча глаз.', memory: 'Ты не спасал её. Ты просто выдержал её рассказ.', next: 'Некоторые вещи становятся легче только после того, как их услышали.', echo: 'Она запомнила, что тебе можно говорить правду без красивой версии.' },
      { id: 'scene-04-name-choice-03', text: 'Перевести разговор на другое.', trust: -1, tension: 0, response: 'Она благодарно улыбается, но в улыбке есть усталость. «Давай».', memory: 'Ты заметил боль, но решил не открывать её.', next: 'Разговор продолжается. Только теперь поверх самого важного.', echo: 'Иногда забота тоже может быть способом не слышать.' },
    ],
  },
  {
    id: 'scene-05-test',
    title: '01:31',
    subtitle: 'ГЛАВА 05 / ПРОВЕРКА',
    nextSceneId: 'scene-06-morning',
    line: '«А ты сам почему остался?»',
    detail: 'Теперь вопрос возвращается к тебе. И впервые Мира смотрит не в окно.',
    choices: [
      { id: 'scene-05-test-choice-01', text: '«Потому что не хотел, чтобы ты была одна».', trust: 2, tension: 1, response: 'Она долго смотрит на тебя. «Только не делай из этого обещание».', memory: 'Ты назвал причину, не превращая её в долг.', next: 'Она улыбается — впервые по-настоящему.', echo: 'Она услышала заботу, но не почувствовала себя обязанной.' },
      { id: 'scene-05-test-choice-02', text: '«Не знаю. Наверное, мне тоже было страшно уйти».', trust: 3, tension: 0, response: 'Мира тихо смеётся. «Это самый честный ответ за весь вечер».', memory: 'Ты признал собственную уязвимость.', next: 'Она перестаёт держать дистанцию.', echo: 'Впервые вы оба перестали играть роль того, у кого всё нормально.' },
      { id: 'scene-05-test-choice-03', text: '«Неважно».', trust: -2, tension: 2, response: 'Её лицо закрывается. «Понятно».', memory: 'Ты оставил свою сторону истории при себе.', next: 'Она снова смотрит в окно. Теперь уже не спрашивая.', echo: 'Доверие не исчезло. Но дверь закрылась чуть тише.' },
    ],
  },
  {
    id: 'scene-06-morning',
    title: '02:03',
    subtitle: 'ГЛАВА 06 / УТРО',
    line: 'Утром она пишет первой.',
    detail: 'Одно сообщение. Без объяснений. Но оно звучит иначе после всего, что произошло ночью.',
    choices: [
      { id: 'scene-06-morning-choice-01', text: 'Ответить: «Доброе утро, Мира».', trust: 2, tension: 0, response: 'Через секунду приходит ответ: «Я боялась, что утром всё это покажется глупым».', memory: 'Ты вернулся в разговор без необходимости продолжать ночь.', next: 'Она отправляет фотографию. Теперь уже сама.', echo: 'То, что ночью было секретом, утром стало выбором.' },
      { id: 'scene-06-morning-choice-02', text: 'Спросить: «Ты выспалась?»', trust: 1, tension: 0, response: '«Нет. Но впервые за долгое время не жалею об этом».', memory: 'Ты спросил не о вчерашнем, а о ней сегодняшней.', next: 'Она предлагает встретиться днём.', echo: 'Она начала думать о тебе не как о спасении, а как о человеке рядом.' },
      { id: 'scene-06-morning-choice-03', text: 'Не отвечать сразу.', trust: -1, tension: 1, response: 'Она видит прочитанное. Через час приходит второе сообщение: «Всё нормально».', memory: 'Ты оставил ей время — но заставил снова сомневаться.', next: 'На экране остаются два коротких сообщения.', echo: 'Иногда пауза даёт свободу. Иногда возвращает старый страх.' },
    ],
  },
  ],
}];

const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));

function findScene(chapterId: string, sceneId: string) {
  return chapterById.get(chapterId)?.scenes.find((scene) => scene.id === sceneId);
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [chapterId, setChapterId] = useState(CHAPTER_ONE_ID);
  const [sceneId, setSceneId] = useState(chapters[0].scenes[0].id);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [trust, setTrust] = useState(0);
  const [tension, setTension] = useState(0);
  const [memories, setMemories] = useState<string[]>([]);
  const [ending, setEnding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [runNumber, setRunNumber] = useState(1);
  const audio = useRef<AudioContext | null>(null);
  const ambient = useRef<OscillatorNode | null>(null);
  const chapter = chapterById.get(chapterId) ?? chapters[0];
  const current = findScene(chapter.id, sceneId) ?? chapter.scenes[0];
  const selectedChoice = current.choices.find((choice) => choice.id === choices[current.id]);
  const sceneNumber = chapter.scenes.findIndex((scene) => scene.id === current.id) + 1;

  function sound(kind: 'tap' | 'warm' | 'low' | 'heartbeat') {
    if (typeof window === 'undefined') return;
    audio.current ??= new AudioContext();
    const ctx = audio.current;
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === 'low' ? 'triangle' : 'sine';
    osc.frequency.value = kind === 'warm' ? 392 : kind === 'low' ? 146 : kind === 'heartbeat' ? 78 : 220;
    const volume = kind === 'heartbeat' ? 0.025 : kind === 'warm' ? 0.035 : 0.018;
    const duration = kind === 'low' ? 0.55 : kind === 'heartbeat' ? 0.18 : 0.32;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.04);
  }

  function startAmbient() {
    if (!audio.current || ambient.current) return;
    const ctx = audio.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 54;
    gain.gain.value = 0.006;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    ambient.current = osc;
  }

  function save(next: SaveV3) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch {}
  }

  function makeSave(next: Partial<SaveV3> = {}): SaveV3 {
    return {
      version: 3,
      chapterId,
      sceneId: current.id,
      choices,
      trust,
      tension,
      memories,
      ending,
      runNumber,
      ...next,
    };
  }

  function choose(choice: Choice) {
    if (selectedChoice) return;
    sound(choice.trust >= 2 ? 'warm' : choice.tension >= 2 ? 'low' : 'tap');
    if (choice.tension >= 2) window.setTimeout(() => sound('heartbeat'), 180);
    const nextTrust = trust + choice.trust;
    const nextTension = tension + choice.tension;
    const nextMemories = [...memories, choice.memory];
    const nextChoices = { ...choices, [current.id]: choice.id };
    setChoices(nextChoices);
    setTrust(nextTrust);
    setTension(nextTension);
    setMemories(nextMemories);
    save(makeSave({ choices: nextChoices, trust: nextTrust, tension: nextTension, memories: nextMemories }));
  }

  function continueStory() {
    sound('warm');
    if (current.nextSceneId) {
      const nextScene = findScene(chapter.id, current.nextSceneId);
      if (nextScene) {
        setSceneId(nextScene.id);
        save(makeSave({ sceneId: nextScene.id }));
        return;
      }
    }

    const nextChapterId = current.nextChapterId ?? chapter.nextChapterId;
    const nextChapter = nextChapterId ? chapterById.get(nextChapterId) : undefined;
    if (nextChapter) {
      setChapterId(nextChapter.id);
      setSceneId(nextChapter.scenes[0].id);
      save(makeSave({ chapterId: nextChapter.id, sceneId: nextChapter.scenes[0].id }));
      return;
    }

    setEnding(true);
    save(makeSave({ ending: true }));
  }

  function startFresh() {
    let nextRun = runNumber + 1;
    try {
      const stored = Number(localStorage.getItem(RUN_COUNT_KEY) ?? '0');
      nextRun = Math.max(runNumber, stored) + 1;
      localStorage.setItem(RUN_COUNT_KEY, String(nextRun));
      localStorage.removeItem(SAVE_KEY);
    } catch {}
    setRunNumber(nextRun);
    setStarted(true);
    setChapterId(CHAPTER_ONE_ID);
    setSceneId(chapters[0].scenes[0].id);
    setChoices({});
    setTrust(0);
    setTension(0);
    setMemories([]);
    setEnding(false);
    sound('warm');
    startAmbient();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 3, chapterId: CHAPTER_ONE_ID, sceneId: chapters[0].scenes[0].id, choices: {}, trust: 0, tension: 0, memories: [], ending: false, runNumber: nextRun } satisfies SaveV3));
    } catch {}
  }

  async function shareStory() {
    setSharing(true);
    const text = 'Я прошёл BETWEEN US — историю, в которой игра запоминает не только твои ответы, но и то, каким человеком ты был рядом с другим.';
    try {
      if (navigator.share) await navigator.share({ title: 'BETWEEN US', text, url: window.location.href });
      else await navigator.clipboard.writeText(`${text} ${window.location.href}`);
    } catch {}
    window.setTimeout(() => setSharing(false), 900);
  }

  useEffect(() => {
    try {
      const storedRun = Number(localStorage.getItem(RUN_COUNT_KEY) ?? '0');
      if (storedRun > 0) setRunNumber(storedRun);
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SaveV3>;
        const savedChapter = typeof saved.chapterId === 'string' ? chapterById.get(saved.chapterId) : undefined;
        const savedScene = savedChapter && typeof saved.sceneId === 'string' ? findScene(savedChapter.id, saved.sceneId) : undefined;
        if (saved.version === 3 && savedChapter && savedScene) {
          setStarted(true);
          setChapterId(savedChapter.id);
          setSceneId(savedScene.id);
          setChoices(saved.choices && typeof saved.choices === 'object' ? saved.choices : {});
          setTrust(saved.trust ?? 0);
          setTension(saved.tension ?? 0);
          setMemories(Array.isArray(saved.memories) ? saved.memories : []);
          setEnding(Boolean(saved.ending));
          if (saved.runNumber && saved.runNumber > 0) setRunNumber(saved.runNumber);
        }
      } else {
        const legacyRaw = localStorage.getItem(LEGACY_SAVE_KEY);
        if (legacyRaw) {
          const legacy = JSON.parse(legacyRaw) as LegacySaveV2;
          const legacyMemories = Array.isArray(legacy.memories) ? legacy.memories : [];
          const legacySceneIndex = Math.min(Math.max(legacy.scene ?? 0, 0), chapters[0].scenes.length - 1);
          const migratedChoices: Record<string, string> = {};
          chapters[0].scenes.slice(0, Math.min(legacyMemories.length, legacySceneIndex + 1)).forEach((legacyScene, index) => {
            const matchingChoice = legacyScene.choices.find((choice) => choice.memory === legacyMemories[index]);
            if (matchingChoice) migratedChoices[legacyScene.id] = matchingChoice.id;
          });
          const migrated: SaveV3 = {
            version: 3,
            chapterId: CHAPTER_ONE_ID,
            sceneId: chapters[0].scenes[legacySceneIndex].id,
            choices: migratedChoices,
            trust: legacy.trust ?? 0,
            tension: legacy.tension ?? 0,
            memories: legacyMemories,
            ending: Boolean(legacy.ending),
            runNumber: storedRun || 1,
          };
          setStarted(Boolean(legacy.started));
          setChapterId(migrated.chapterId);
          setSceneId(migrated.sceneId);
          setChoices(migrated.choices);
          setTrust(migrated.trust);
          setTension(migrated.tension);
          setMemories(migrated.memories);
          setEnding(Boolean(migrated.ending));
          setRunNumber(migrated.runNumber ?? 1);
          save(migrated);
        }
      }
    } catch {}
    setMounted(true);
    return () => {
      ambient.current?.stop();
      void audio.current?.close();
    };
  }, []);

  if (!mounted) return <main className="stage"><div className="grain" /></main>;

  if (ending) {
    const endingText = trust >= 8
      ? 'Она запомнит тебя не как человека, который её спас. А как человека, рядом с которым ей не пришлось притворяться.'
      : trust >= 4
        ? 'Она не забудет эту ночь. Возможно, потому что впервые смогла рассказать свою историю и остаться собой.'
        : tension >= 5
          ? 'Она запомнит разговор. Но некоторые двери открываются только тогда, когда перестаёшь торопиться их открыть.'
          : 'Она не скажет вслух, что почувствовала. Но твой выбор останется в её памяти.';
    const endingLabel = trust >= 8 ? 'БЛИЗОСТЬ' : trust >= 4 ? 'ДОВЕРИЕ' : tension >= 5 ? 'ДИСТАНЦИЯ' : 'НЕОПРЕДЕЛЁННОСТЬ';
    const replayText = runNumber > 1 ? 'Прожить иначе · снова' : 'Прожить иначе';
    return <main className={`stage mood-${tension > trust ? 'tense' : trust > tension ? 'warm' : 'neutral'}`}>
      <div className="grain" /><div className="ambient" />
      <section className="intro ending">
        <div className="eyebrow">BETWEEN US · ПОСЛЕДНЯЯ СТРАНИЦА</div>
        <h1>Ты не изменил<br /><em>её прошлое.</em><br />Ты изменил то,<br />что она решилась рассказать.</h1>
        <p>{endingText}</p>
        <div className="ending-meta">
          <span>ВОСПОМИНАНИЙ · {memories.length.toString().padStart(2, '0')}</span>
          <span>ТВОЙ СЛЕД · {endingLabel}</span>
          {runNumber > 1 && <span>ПРОХОЖДЕНИЕ · {runNumber}</span>}
        </div>
        <div className="ending-actions">
          <button className="primary" onClick={startFresh}>{replayText} <span>↻</span></button>
          <button className="ghost" onClick={shareStory}>{sharing ? 'Скопировано' : 'Поделиться историей ↗'}</button>
        </div>
      </section>
    </main>;
  }

  const replayHint = runNumber > 1 && sceneNumber === 1 && !selectedChoice;

  return <main className={`stage mood-${tension > trust ? 'tense' : trust > tension ? 'warm' : 'neutral'}`}>
    <div className="grain" /><div className="ambient" />
    {!started ? <section className="intro">
      <div className="eyebrow">BETWEEN US · INTERACTIVE STORY</div>
      <h1>Иногда человеку<br /><em>нужно не решение.</em><br />А чтобы кто-то остался.</h1>
      <p>Это история о доверии. Здесь нет правильных ответов. Игра запоминает твои поступки — а потом возвращает их тебе.</p>
      <button className="primary" onClick={startFresh}>Начать историю <span>→</span></button>
      <div className="promise">~ 8 минут · 6 сцен · несколько разных последствий</div>
    </section> : <section className="story">
      <header><span>{current.title}</span><span>{current.subtitle}</span><span>ПАМЯТЬ {memories.length.toString().padStart(2, '0')}</span></header>
      <div className="progress"><i style={{ width: `${((sceneNumber - 1 + (selectedChoice ? 1 : 0)) / chapter.scenes.length) * 100}%` }} /></div>
      <div className="scene">
        <div className="character" aria-label="Мира"><div className="halo" /><div className="face" /><div className="pulse" /></div>
        <div className="copy">
          {replayHint && <div className="reaction">ТЫ УЖЕ БЫЛ ЗДЕСЬ</div>}
          <div className="name">МИРА <span>•</span> {replayHint ? 'в этот раз всё может сложиться иначе' : 'она ещё не знает, что ты запомнишь'}</div>
          {!selectedChoice ? <><h2>{replayHint ? '«Некоторые ответы понимаешь только после того, как уже выбрал.»' : current.line}</h2><p>{replayHint ? 'Ты знаешь эту ночь. Но не знаешь, каким человеком станешь в ней во второй раз.' : current.detail}</p></> : <><div className="reaction">РЕАКЦИЯ МИРЫ</div><h2>{selectedChoice.response}</h2><p className="memory">ПАМЯТЬ СОХРАНЕНА · {selectedChoice.memory}</p><p className="next-line">{selectedChoice.next}</p>{selectedChoice.echo && <p className="echo">{selectedChoice.echo}</p>}</>}
        </div>
      </div>
      {!selectedChoice ? <div className="choices">{current.choices.map((c, i) => <button key={c.id} onClick={() => choose(c)}><span>0{i + 1}</span>{c.text}<b>↗</b></button>)}</div> : <div className="after"><div className="meters"><span>сцена {sceneNumber} / {chapter.scenes.length}</span><span>выбор сохранён</span></div><button className="primary" onClick={continueStory}>{current.nextSceneId || current.nextChapterId || chapter.nextChapterId ? 'Продолжить' : 'Открыть последнее воспоминание'} <span>→</span></button></div>}
      {memories.length > 0 && <aside className="memory-drawer"><span>ЕЁ ПАМЯТЬ</span><strong>{memories[memories.length - 1]}</strong></aside>}
      {sceneNumber > 1 && !selectedChoice && <button className="reset" onClick={startFresh}>Начать заново</button>}
    </section>}
  </main>;
}
