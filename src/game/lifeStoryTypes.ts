import type { GameState, IconName } from './types';

export interface StoryEffect {
  energy?: number; stress?: number; mood?: number; money?: number;
  technical?: number; communication?: number; practical?: number;
  sleep?: number; strain?: number; affection?: number; rentFactor?: number;
  application?: 'tuition' | 'wages' | 'aid';
}
export interface LifeChapter {
  title: string; gap: number; paragraphs: string[];
  dialogue: { speaker: string; text: string }[];
  choices: [string, string]; results: [string, string]; effects: [StoryEffect, StoryEffect];
}
export interface LifeArc {
  id: string; title: string; subtitle: string; kind: '主线' | '支线';
  region: string; icon: IconName; image: string;
  condition: string; visible: (g: GameState) => boolean;
  echoes: [string, string]; chapters: LifeChapter[];
}
export const chapter = (title: string, gap: number, paragraphs: string[], dialogue: [string, string][], choices: [string, string], results: [string, string], effects: [StoryEffect, StoryEffect]): LifeChapter => ({ title, gap, paragraphs, dialogue: dialogue.map(([speaker, text]) => ({ speaker, text })), choices, results, effects });
export const adult = (g: GameState) => g.life.baseAge + g.life.weeks / 52 >= 18;
