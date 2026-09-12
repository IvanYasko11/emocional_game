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
  previousChoices?: Record<string, string>;
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
const LAST_RUN_KEY = 'between-us-last-run-v1';
const REPLAY_MEMORY_PATCH_V1 = true;
const REPLAY_BRANCH_PATCH_V1 = true;
const PRODUCT_ENDINGS_V1 = true;
const REPLAY_SAVE_FIX_V1 = true;
const DEEP_CONSEQUENCES_V1 = true;
const STORY_EXPANSION_V1 = true;
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
    nextSceneId: 'scene-07-departure',
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
  {
    id: 'scene-07-departure',
    title: '02:19',
    subtitle: 'ГЛАВА 07 / ЛЕСТНИЦА',
    nextSceneId: 'scene-08-rooftop',
    line: '«Пойдём. Мне нужно тебе кое-что показать».',
    detail: 'Мира надевает пальто. Ночь закончилась, но разговор — нет.',
    choices: [
      { id: 'scene-07-departure-choice-01', text: 'Пойти за ней, ничего не спрашивая.', trust: 2, tension: 0, response: '«Спасибо». Мне сейчас проще, когда не надо всё объяснять.', memory: 'Ты сделал выбор: Пойти за ней, ничего не спрашивая..', next: '' },
      { id: 'scene-07-departure-choice-02', text: 'Спросить: «Куда мы идём?»', trust: 1, tension: 1, response: '«Туда, где можно говорить тише. Если хочешь — можешь не идти».', memory: 'Ты сделал выбор: Спросить: «Куда мы идём?».', next: '' },
      { id: 'scene-07-departure-choice-03', text: 'Сказать, что лучше остаться здесь.', trust: -1, tension: 1, response: '«Ладно. Тогда просто постоим ещё минуту».', memory: 'Ты сделал выбор: Сказать, что лучше остаться здесь..', next: '' },
    ],
  },
  {
    id: 'scene-08-rooftop',
    title: '02:27',
    subtitle: 'ГЛАВА 08 / КРЫША',
    nextSceneId: 'scene-09-truth',
    line: 'Город внизу кажется чужим и очень тихим.',
    detail: '«Я прихожу сюда, когда не понимаю, что делать дальше», — говорит Мира.',
    choices: [
      { id: 'scene-08-rooftop-choice-01', text: '«Тогда ничего не решай прямо сейчас».', trust: 2, tension: -1, response: 'Она улыбается. «Можно я просто побуду здесь?»', memory: 'Ты сделал выбор: «Тогда ничего не решай прямо сейчас»..', next: '' },
      { id: 'scene-08-rooftop-choice-02', text: 'Спросить, что она хотела показать.', trust: 1, tension: 1, response: '«Сейчас покажу». Она достаёт старую аудиозапись.', memory: 'Ты сделал выбор: Спросить, что она хотела показать..', next: '' },
      { id: 'scene-08-rooftop-choice-03', text: 'Посмотреть на город и промолчать.', trust: 0, tension: -1, response: '«Спасибо. Мне не всегда нужны вопросы».', memory: 'Ты сделал выбор: Посмотреть на город и промолчать..', next: '' },
    ],
  },
  {
    id: 'scene-09-truth',
    title: '02:36',
    subtitle: 'ГЛАВА 09 / ГОЛОС',
    nextSceneId: 'scene-10-message',
    line: '«Это я записала в тот день, когда уехала».',
    detail: 'Голос на записи звучит моложе. В нём слышно то, чего Мира никогда не говорила вслух.',
    choices: [
      { id: 'scene-09-truth-choice-01', text: '«Ты не обязана была быть сильной».', trust: 3, tension: -1, response: 'Она закрывает глаза. «Вот этого мне тогда никто не сказал».', memory: 'Ты сделал выбор: «Ты не обязана была быть сильной»..', next: '' },
      { id: 'scene-09-truth-choice-02', text: 'Спросить, что она чувствовала тогда.', trust: 2, tension: 1, response: '«Злость. А потом стыд за эту злость».', memory: 'Ты сделал выбор: Спросить, что она чувствовала тогда..', next: '' },
      { id: 'scene-09-truth-choice-03', text: '«Давай не будем возвращаться туда».', trust: 0, tension: -1, response: '«Хорошо». Она сама решает, что сказать дальше.', memory: 'Ты сделал выбор: «Давай не будем возвращаться туда»..', next: '' },
    ],
  },
  {
    id: 'scene-10-message',
    title: '02:48',
    subtitle: 'ГЛАВА 10 / СООБЩЕНИЕ',
    nextSceneId: 'scene-11-decision',
    line: 'На экране появляется сообщение: «Он снова написал».',
    detail: 'Одно имя. Один экран. И решение, которое Мира не хочет принимать одна.',
    choices: [
      { id: 'scene-10-message-choice-01', text: '«Что ты хочешь сделать?»', trust: 2, tension: 0, response: '«Не знаю. Но теперь хотя бы знаю, что могу не отвечать».', memory: 'Ты сделал выбор: «Что ты хочешь сделать?».', next: '' },
      { id: 'scene-10-message-choice-02', text: '«Не отвечай прямо сейчас».', trust: 1, tension: -1, response: '«Да. Мне нужно хотя бы утро без этого».', memory: 'Ты сделал выбор: «Не отвечай прямо сейчас»..', next: '' },
      { id: 'scene-10-message-choice-03', text: '«Я могу ответить за тебя».', trust: -1, tension: 2, response: 'Она смотрит настороженно. «Нет. Это должна быть моя история».', memory: 'Ты сделал выбор: «Я могу ответить за тебя»..', next: '' },
    ],
  },
  {
    id: 'scene-11-decision',
    title: '03:02',
    subtitle: 'ГЛАВА 11 / РЕШЕНИЕ',
    nextSceneId: 'scene-12-dawn',
    line: '«А если завтра всё изменится?»',
    detail: 'Первые птицы перекрывают шум города. Вопрос уже не о прошлом.',
    choices: [
      { id: 'scene-11-decision-choice-01', text: '«Тогда завтра разберёмся с завтрашним».', trust: 2, tension: -1, response: 'Мира улыбается. «Звучит неожиданно нормально».', memory: 'Ты сделал выбор: «Тогда завтра разберёмся с завтрашним»..', next: '' },
      { id: 'scene-11-decision-choice-02', text: '«Не знаю. Но сегодня я здесь».', trust: 3, tension: 0, response: 'Она кивает. «Этого достаточно».', memory: 'Ты сделал выбор: «Не знаю. Но сегодня я здесь»..', next: '' },
      { id: 'scene-11-decision-choice-03', text: '«Лучше ничего не обещать».', trust: 1, tension: 1, response: '«Тогда хотя бы не будем врать себе».', memory: 'Ты сделал выбор: «Лучше ничего не обещать»..', next: '' },
    ],
  },
  {
    id: 'scene-12-dawn',
    title: '03:19',
    subtitle: 'ГЛАВА 12 / РАССВЕТ',
    line: 'Солнце появляется раньше, чем вы успеваете попрощаться.',
    detail: '«Я думала, мне нужен ответ. А мне нужен был свидетель», — говорит Мира.',
    choices: [
      { id: 'scene-12-dawn-choice-01', text: '«Я видел тебя. Этого достаточно».', trust: 3, tension: -1, response: 'Она улыбается. «Тогда увидимся не только ночью».', memory: 'Ты сделал выбор: «Я видел тебя. Этого достаточно»..', next: '' },
      { id: 'scene-12-dawn-choice-02', text: '«Мне тоже не нужен был ответ».', trust: 2, tension: 0, response: 'Она смеётся. «Вот теперь это похоже на честность».', memory: 'Ты сделал выбор: «Мне тоже не нужен был ответ»..', next: '' },
      { id: 'scene-12-dawn-choice-03', text: 'Ничего не говорить. Просто остаться.', trust: 2, tension: -1, response: 'Она ничего не спрашивает. Только остаётся рядом до самого утра.', memory: 'Ты сделал выбор: Ничего не говорить. Просто остаться..', next: '' },
    ],
  },
  ],
}];

const replayScenes: Scene[] = [
  { id: 'replay-01-return', title: '23:47', subtitle: 'ВТОРОЙ ВЕЧЕР / ВОЗВРАЩЕНИЕ', nextSceneId: 'replay-02-memory', line: '«Странно. Я уже знаю, что ты сейчас скажешь».', detail: 'Мира смотрит на тебя дольше обычного. На этот раз первым меняется не её голос — а твой выбор.', choices: [
    { id: 'replay-01-choice-01', text: 'Сделать иначе, чем в прошлый раз.', trust: 2, tension: -1, response: 'Она улыбается: «Вот. Сейчас ты действительно меня услышал».', memory: 'Во второй раз ты не повторил себя.', next: 'Она не садится у окна. Она ждёт, что ты сам выберешь место.', echo: 'Первое решение второго вечера стало другим.' },
    { id: 'replay-01-choice-02', text: 'Повторить свой прошлый выбор.', trust: -1, tension: 1, response: 'Она тихо говорит: «Я так и думала».', memory: 'Ты повторил знакомый путь — и Мира заметила это.', next: 'Но теперь она задаёт вопрос, которого не было в первый раз.', echo: 'Повторение оказалось выбором само по себе.' },
    { id: 'replay-01-choice-03', text: 'Спросить её: «А ты чего хочешь сейчас?»', trust: 3, tension: 0, response: 'Она впервые отвечает сразу: «Чтобы сегодня ты не решал за меня».', memory: 'Ты передал ей право вести этот разговор.', next: 'Мира закрывает окно и остаётся в комнате.', echo: 'Во втором прохождении инициатива перешла к ней.' },
  ] },
  { id: 'replay-02-memory', title: '00:16', subtitle: 'ВТОРОЙ ВЕЧЕР / ПАМЯТЬ', nextSceneId: 'replay-03-door', line: 'На экране появляется старое сообщение.', detail: 'Ты узнаёшь его. Мира тоже. Но теперь она предлагает не повторять разговор из прошлого.', choices: [
    { id: 'replay-02-choice-01', text: 'Открыть сообщение вместе с ней.', trust: 3, tension: 0, response: 'Она садится рядом. «Теперь я могу сказать, что тогда не смогла».', memory: 'Вы вместе вернулись к моменту, который раньше разделил вас.', next: 'Она рассказывает то, чего не было в первом прохождении.', echo: 'Прошлая версия ночи стала причиной нового разговора.' },
    { id: 'replay-02-choice-02', text: 'Удалить сообщение и не возвращаться назад.', trust: 1, tension: -1, response: 'Мира кивает: «Наверное, не всё прошлое нужно спасать».', memory: 'Ты позволил прошлому остаться прошлым.', next: 'Она предлагает показать тебе место, куда собиралась уйти.', echo: 'Второй путь открывает событие, которого не было раньше.' },
    { id: 'replay-02-choice-03', text: 'Сказать: «Я помню, чем это закончилось».', trust: -1, tension: 3, response: 'Её взгляд становится серьёзным: «Тогда не повторяй мою сторону этой истории».', memory: 'Ты принёс в разговор память о будущем.', next: 'Она выходит первой. Теперь тебе решать, пойдёшь ли ты следом.', echo: 'Знание прошлого не гарантирует правильного выбора.' },
  ] },
  { id: 'replay-03-door', title: '00:41', subtitle: 'ВТОРОЙ ВЕЧЕР / ДВЕРЬ', nextSceneId: 'replay-04-confession', line: 'Мира открывает дверь, которую в первый раз не открыла.', detail: 'За ней нет тайны. Только лестница вниз и старый конверт на подоконнике.', choices: [
    { id: 'replay-03-choice-01', text: 'Пойти за ней.', trust: 2, tension: 1, response: '«Хорошо. Только теперь не веди меня — иди рядом».', memory: 'Ты вошёл в место, которое раньше осталось за кадром.', next: 'На первом этаже она отдаёт тебе конверт.', echo: 'Второе прохождение буквально открывает новую дверь.' },
    { id: 'replay-03-choice-02', text: 'Остаться и дать ей самой решить.', trust: 3, tension: -1, response: 'Она возвращается через минуту: «Спасибо. Мне нужно было сделать это самой».', memory: 'Ты не стал превращать близость в контроль.', next: 'Конверт остаётся между вами.', echo: 'Иногда новый путь появляется благодаря отсутствию действия.' },
    { id: 'replay-03-choice-03', text: 'Спросить, почему она не показала дверь раньше.', trust: 0, tension: 2, response: '«Потому что раньше ты слишком торопился узнать ответ».', memory: 'Ты услышал о своей роли в том, что осталось невысказанным.', next: 'Она протягивает тебе конверт.', echo: 'Вторая версия истории делает игрока частью причины.' },
  ] },
  { id: 'replay-04-confession', title: '01:08', subtitle: 'ВТОРОЙ ВЕЧЕР / ПРАВДА', nextSceneId: 'replay-05-choice', line: '«В первый раз я рассказала тебе только половину».', detail: 'В конверте — билет на поезд и короткая записка без подписи.', choices: [
    { id: 'replay-04-choice-01', text: 'Спросить, хочет ли она уехать.', trust: 2, tension: 0, response: '«Не знаю. Но теперь хочу, чтобы решение было моим».', memory: 'Ты не пытался удержать её.', next: 'Она рвёт билет пополам.', echo: 'Событие второго прохождения меняет её решение о будущем.' },
    { id: 'replay-04-choice-02', text: 'Спросить, хочет ли она остаться.', trust: 3, tension: 0, response: '«Я хочу остаться здесь. Но не потому, что ты попросил».', memory: 'Она выбрала остаться без обещания тебе.', next: 'Она убирает билет в карман.', echo: 'Близость стала результатом её выбора, а не твоего спасения.' },
    { id: 'replay-04-choice-03', text: 'Сказать: «Что бы ты ни выбрала — я рядом».', trust: 1, tension: -1, response: 'Она кивает: «Вот теперь я верю, что это не условие».', memory: 'Ты оставил ей свободу выбора.', next: 'Она сама предлагает открыть конверт до конца.', echo: 'Во втором пути доверие строится без давления.' },
  ] },
  { id: 'replay-05-choice', title: '01:31', subtitle: 'ВТОРОЙ ВЕЧЕР / РАЗВИЛКА', nextSceneId: 'replay-06-morning', line: '«Есть ещё одна вещь, которой не было вчера».', detail: 'Мира показывает фотографию. На обороте сегодняшняя дата.', choices: [
    { id: 'replay-05-choice-01', text: 'Спросить, кто сделал снимок.', trust: 2, tension: 1, response: '«Ты. Но ещё не знаешь об этом».', memory: 'Второй вечер оставил след ещё до своего финала.', next: 'Она предлагает сделать снимок прямо сейчас.', echo: 'Игра впервые создаёт память о самом повторном прохождении.' },
    { id: 'replay-05-choice-02', text: 'Не спрашивать. Просто посмотреть.', trust: 3, tension: -1, response: 'Она улыбается: «Спасибо. Сегодня мне не нужно всё объяснять».', memory: 'Ты позволил моменту остаться моментом.', next: 'Она кладёт фотографию между вами.', echo: 'То, что раньше требовало слов, теперь выдерживает тишину.' },
    { id: 'replay-05-choice-03', text: 'Сказать, что не хочешь менять прошлое.', trust: 0, tension: 2, response: '«И не нужно. Второй шанс не про прошлое».', memory: 'Ты понял смысл второго прохождения.', next: 'Она открывает окно. На улице уже светает.', echo: 'Теперь игра говорит напрямую о цене повторного выбора.' },
  ] },
  { id: 'replay-06-morning', title: '02:03', subtitle: 'ВТОРОЙ ВЕЧЕР / УТРО', line: 'Утром сообщение приходит снова.', detail: 'Но на этот раз Мира пишет не потому, что боится остаться одна.', choices: [
    { id: 'replay-06-choice-01', text: '«Я помню».', trust: 2, tension: 0, response: '«Я тоже. Поэтому сегодня всё получилось иначе».', memory: 'Ты изменил не прошлое — отношение к нему.', next: 'Она присылает фотографию сегодняшнего утра.', echo: 'Вторая версия стала отдельной историей, а не копией.' },
    { id: 'replay-06-choice-02', text: '«Что изменилось?»', trust: 3, tension: 0, response: '«Я перестала ждать, что кто-то выберет за меня».', memory: 'Она стала героиней собственного выбора.', next: 'Она предлагает встретиться днём.', echo: 'Главное последствие второго прохождения — её самостоятельность.' },
    { id: 'replay-06-choice-03', text: 'Ничего не отвечать.', trust: -1, tension: 2, response: 'На этот раз она не пишет второе сообщение.', memory: 'Ты получил другую тишину — потому что теперь знаешь её цену.', next: 'Экран гаснет. История заканчивается не там, где закончилась в первый раз.', echo: 'Даже знакомый выбор приводит к новому событию.' },
  ] },
];

function findReplayScene(sceneId: string) { return replayScenes.find((scene) => scene.id === sceneId); }

function personalizeReplayScene(scene: Scene | undefined, previousChoices: Record<string, string>): Scene | undefined {
  if (!scene) return undefined;
  const first = previousChoices['scene-01-window'];
  const second = previousChoices['scene-02-after'];
  const fifth = previousChoices['scene-05-test'];


  // Deep consequences: several first-run choices combine into a new replay state.
  // These checks intentionally run before the older replay branches so they can reroute scenes.
  const third = previousChoices['scene-03-photograph'];
  const fourth = previousChoices['scene-04-name'];
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
}


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
  const [previousChoices, setPreviousChoices] = useState<Record<string, string>>({});
  const [miraDirective, setMiraDirective] = useState<{ sourceSceneId: string; nextSceneId: string; text: string } | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const ambient = useRef<OscillatorNode | null>(null);
  const chapter = chapterById.get(chapterId) ?? chapters[0];
  const replayBase = runNumber > 1 ? findReplayScene(sceneId) : undefined;
  const current = (runNumber > 1 ? personalizeReplayScene(replayBase, previousChoices) : findScene(chapter.id, sceneId)) ?? (runNumber > 1 ? replayScenes[0] : chapter.scenes[0]);
  const selectedChoice = current.choices.find((choice) => choice.id === choices[current.id]);
  const sceneNumber = runNumber > 1 ? replayScenes.findIndex((scene) => scene.id === current.id) + 1 : chapter.scenes.findIndex((scene) => scene.id === current.id) + 1;

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
      previousChoices,
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
    try {
      localStorage.setItem('between-us-mira-choice-event-v1', JSON.stringify({
        id: `${Date.now()}-${choice.id}`,
        sceneId: current.id,
        choiceId: choice.id,
        choiceText: choice.text,
        response: choice.response,
        memory: choice.memory,
        trust: choice.trust,
        tension: choice.tension,
        createdAt: Date.now(),
      }));
    } catch {}
  }

  function continueStory() {
    sound('warm');
    const directedNextSceneId = miraDirective?.sourceSceneId === current.id ? miraDirective.nextSceneId : current.nextSceneId;
    if (miraDirective?.sourceSceneId === current.id) {
      setMiraDirective(null);
      try { localStorage.removeItem('between-us-mira-directive-v1'); } catch {}
    }
    if (directedNextSceneId) {
      const nextScene = runNumber > 1 ? findReplayScene(directedNextSceneId) : findScene(chapter.id, directedNextSceneId);
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
    let nextRun = 1;
    try {
      const previous = localStorage.getItem(SAVE_KEY);
      if (previous) localStorage.setItem(LAST_RUN_KEY, previous);
      const stored = Number(localStorage.getItem(RUN_COUNT_KEY) ?? '0');
      const hasPreviousRun = Boolean(previous) || stored > 0 || started || ending;
      nextRun = hasPreviousRun ? Math.max(runNumber, stored) + 1 : 1;
      localStorage.setItem(RUN_COUNT_KEY, String(nextRun));
      let replayPreviousChoices: Record<string, string> = {};
      if (nextRun > 1) {
        try {
          const parsed = previous ? JSON.parse(previous) as Partial<SaveV3> : undefined;
          replayPreviousChoices = parsed?.choices && typeof parsed.choices === 'object' ? parsed.choices : {};
        } catch {}
      }
      setPreviousChoices(replayPreviousChoices);
      localStorage.removeItem(SAVE_KEY);
    } catch {}
    setRunNumber(nextRun);
    setStarted(true);
    setChapterId(CHAPTER_ONE_ID);
    setSceneId(nextRun > 1 ? replayScenes[0].id : chapters[0].scenes[0].id);
    setChoices({});
    setTrust(0);
    setTension(0);
    setMemories([]);
    setEnding(false);
    sound('warm');
    startAmbient();
    try {
      const replayPreviousChoices: Record<string, string> = nextRun > 1 ? (() => { try { const raw = localStorage.getItem(LAST_RUN_KEY); return raw ? ((JSON.parse(raw) as SaveV3).choices ?? {}) : {}; } catch { return {}; } })() : {};

localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 3, chapterId: CHAPTER_ONE_ID, sceneId: nextRun > 1 ? replayScenes[0].id : chapters[0].scenes[0].id, choices: {}, trust: 0, tension: 0, memories: [], ending: false, runNumber: nextRun, previousChoices: replayPreviousChoices } satisfies SaveV3));
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
      const rawDirective = localStorage.getItem('between-us-mira-directive-v1');
      if (rawDirective) {
        const directive = JSON.parse(rawDirective);
        if (directive?.sourceSceneId && directive?.nextSceneId && directive?.expiresAt > Date.now()) setMiraDirective({ sourceSceneId: directive.sourceSceneId, nextSceneId: directive.nextSceneId, text: directive.text || 'Мира изменила следующий шаг этой истории.' });
        else localStorage.removeItem('between-us-mira-directive-v1');
      }
    } catch {}
    function onMiraDirective(event: StorageEvent) {
      if (event.key !== 'between-us-mira-directive-v1' || !event.newValue) return;
      try { const d = JSON.parse(event.newValue); if (d?.sourceSceneId && d?.nextSceneId && d?.expiresAt > Date.now()) setMiraDirective({ sourceSceneId: d.sourceSceneId, nextSceneId: d.nextSceneId, text: d.text || 'Мира изменила следующий шаг этой истории.' }); } catch {}
    }
    window.addEventListener('storage', onMiraDirective);
    try {
      const storedRun = Number(localStorage.getItem(RUN_COUNT_KEY) ?? '0');
      if (storedRun > 0) setRunNumber(storedRun);
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SaveV3>;
        const savedChapter = typeof saved.chapterId === 'string' ? chapterById.get(saved.chapterId) : undefined;
        const savedScene = savedChapter && typeof saved.sceneId === 'string' ? (saved.runNumber && saved.runNumber > 1 ? findReplayScene(saved.sceneId) : findScene(savedChapter.id, saved.sceneId)) : undefined;
        if (saved.version === 3 && savedChapter && savedScene) {
          setStarted(true);
          setChapterId(savedChapter.id);
          setSceneId(savedScene.id);
          setChoices(saved.choices && typeof saved.choices === 'object' ? saved.choices : {});
          setTrust(saved.trust ?? 0);
          setTension(saved.tension ?? 0);
          setMemories(Array.isArray(saved.memories) ? saved.memories : []);
          setEnding(Boolean(saved.ending));
          setPreviousChoices(saved.previousChoices && typeof saved.previousChoices === 'object' ? saved.previousChoices : {});
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
      window.removeEventListener('storage', onMiraDirective);
      ambient.current?.stop();
      void audio.current?.close();
    };
  }, []);

  if (!mounted) return <main className="stage"><div className="grain" /></main>;

  if (ending) {
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

  const replayHint = runNumber > 1 && sceneNumber === 1 && !selectedChoice;

  return <main className={`stage mood-${tension > trust ? 'tense' : trust > tension ? 'warm' : 'neutral'}`}>
    <div className="grain" /><div className="ambient" />
    {!started ? <section className="intro">
      <div className="eyebrow">BETWEEN US · INTERACTIVE STORY</div>
      <h1>Иногда человеку<br /><em>нужно не решение.</em><br />А чтобы кто-то остался.</h1>
      <p>Это история о доверии. Здесь нет правильных ответов. Игра запоминает твои поступки — а потом возвращает их тебе.</p>
      <button className="primary" onClick={startFresh}>Начать историю <span>→</span></button>
      <div className="promise">~ 15–20 минут · 12 сцен · несколько разных последствий</div>
    </section> : <section className="story">
      <header><span>{current.title}</span><span>{current.subtitle}</span><span>{runNumber > 1 ? 'ПОВТОРНОЕ ПРОХОЖДЕНИЕ' : `ПАМЯТЬ ${memories.length.toString().padStart(2, '0')}`}</span></header>
      <div className="progress"><i style={{ width: `${((sceneNumber - 1 + (selectedChoice ? 1 : 0)) / chapter.scenes.length) * 100}%` }} /></div>
      <div className="scene">
        <div className="character" aria-label="Мира"><div className="halo" /><div className="face" /><div className="pulse" /></div>
        <div className="copy">
          {replayHint && <div className="reaction">ТЫ УЖЕ БЫЛ ЗДЕСЬ</div>}
          <div className="name">МИРА <span>•</span> {replayHint ? 'в этот раз всё может сложиться иначе' : 'она ещё не знает, что ты запомнишь'}</div>
          {!selectedChoice ? <>{miraDirective?.sourceSceneId === current.id && <div className="reaction mira-directive">МИРА ИЗМЕНИЛА ХОД ИСТОРИИ · {miraDirective.text}</div>}<h2>{replayHint ? '«Некоторые ответы понимаешь только после того, как уже выбрал.»' : current.line}</h2><p>{replayHint ? 'Ты знаешь эту ночь. Но не знаешь, каким человеком станешь в ней во второй раз.' : current.detail}</p></> : <><div className="reaction">РЕАКЦИЯ МИРЫ</div><h2>{selectedChoice.response}</h2><p className="memory">ПАМЯТЬ СОХРАНЕНА · {selectedChoice.memory}</p><p className="next-line">{selectedChoice.next}</p>{selectedChoice.echo && <p className="echo">{selectedChoice.echo}</p>}</>}
        </div>
      </div>
      {!selectedChoice ? <div className="choices">{current.choices.map((c, i) => <button key={c.id} onClick={() => choose(c)}><span>0{i + 1}</span>{c.text}<b>↗</b></button>)}</div> : <div className="after"><div className="meters"><span>сцена {sceneNumber} / {chapter.scenes.length}</span><span>выбор сохранён</span></div><button className="primary" onClick={continueStory}>{current.nextSceneId || current.nextChapterId || chapter.nextChapterId ? 'Продолжить' : 'Открыть последнее воспоминание'} <span>→</span></button></div>}
      {memories.length > 0 && <aside className="memory-drawer"><span>ЕЁ ПАМЯТЬ</span><strong>{memories[memories.length - 1]}</strong></aside>}
      {sceneNumber > 1 && !selectedChoice && <button className="reset" onClick={startFresh}>Начать заново</button>}
    </section>}
  </main>;
}
