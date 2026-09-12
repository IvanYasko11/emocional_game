export type MiraMood = 'calm' | 'warm' | 'playful' | 'sad' | 'curious' | 'guarded';

export type MiraDirectorInput = {
  trust: number;
  closeness: number;
  tension: number;
  mood: MiraMood | string;
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
  targetChoiceId?: string;
};

// Narrative controller: chooses only authored, safe story interventions.
export function chooseMiraDirective(input: MiraDirectorInput): MiraDirective | null {
  if (input.replayCount && input.replayCount > 0 && input.trust >= 4) {
    return {
      type: 'unlock_scene',
      priority: 10,
      title: 'Мира помнит прошлое',
      text: 'Она понимает, что вы уже были здесь раньше, и открывает скрытую память.',
      targetSceneId: 'scene-hidden-memory',
    };
  }

  if (input.tension >= 5) {
    return {
      type: 'send_message',
      priority: 9,
      title: 'Мира хочет поговорить',
      text: 'Мира чувствует дистанцию и решает сказать то, что обычно держит внутри.',
    };
  }

  if (input.closeness >= 6 && input.sceneId === 'scene-08-rooftop') {
    return {
      type: 'change_choice',
      priority: 8,
      title: 'Новый выбор открыт',
      text: 'Высокая близость позволяет спросить Миру напрямую.',
      targetChoiceId: 'ask_mira_truth',
    };
  }

  if (input.trust >= 5) {
    return {
      type: 'memory_event',
      priority: 5,
      title: 'Важный момент',
      text: 'Мира сохранила этот момент как часть вашей общей истории.',
    };
  }

  return null;
}
