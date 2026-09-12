export type MiraDirectorInput = {
  trust: number;
  closeness: number;
  tension: number;
  mood: string;
  choiceId?: string;
  sceneId?: string;
  replayCount?: number;
};

export type MiraDirective = {
  type: 'unlock_scene' | 'change_choice' | 'send_message' | 'memory_event';
  priority: number;
  title: string;
  text: string;
  targetSceneId?: string;
};

// Safe narrative controller. It does not invent impossible branches.
// It chooses among authored events using relationship state.
export function chooseMiraDirective(input: MiraDirectorInput): MiraDirective | null {
  if (input.tension >= 5) {
    return {
      type: 'send_message',
      priority: 10,
      title: 'Мира осторожна',
      text: 'Мира чувствует дистанцию. Следующий разговор станет важнее обычного.',
    };
  }

  if (input.closeness >= 6 && input.replayCount && input.replayCount > 1) {
    return {
      type: 'unlock_scene',
      priority: 9,
      title: 'Скрытая ветка',
      text: 'Мира доверяет тебе достаточно, чтобы показать то, что скрывала раньше.',
      targetSceneId: 'scene-hidden-memory',
    };
  }

  if (input.trust >= 5) {
    return {
      type: 'memory_event',
      priority: 5,
      title: 'Новое воспоминание',
      text: 'Мира запомнила этот момент как важный для вас двоих.',
    };
  }

  return null;
}
