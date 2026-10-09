import type { IconName } from './types';
import type { LifePanel } from './lifeTypes';

export const LIFE_PANEL_ICONS: Record<LifePanel, IconName> = {
  atlas: 'compass', overview: 'coin', place: 'university', work: 'briefcase', finance: 'market',
  health: 'medical', family: 'home', tasks: 'notes', news: 'newspaper', game: 'controller',
  journal: 'journal', death: 'moon', guide: 'book', stories: 'letter',
};
export function lifePlaceIcon(place: { name: string; action?: string; panel?: LifePanel; game?: string }): IconName {
  if (place.name.includes('保险') || place.name.includes('医保')) return 'shield';
  if (place.name.includes('课程')) return 'book';
  if (place.name.includes('实践') || place.name.includes('实验')) return 'lab';
  if (place.name.includes('照护')) return 'home';
  if (place.panel) return LIFE_PANEL_ICONS[place.panel];
  if (place.game) return place.game === 'interview' ? 'briefcase' : place.game === 'budget' ? 'coin' : place.game === 'logic' ? 'lab' : 'controller';
  return ({ rest: 'moon', meal: 'food', exercise: 'ball', course: 'book', skill: 'notes', social: 'friends', work: 'briefcase', date: 'heart', care: 'home' } as Record<string, IconName>)[place.action ?? ''] ?? 'university';
}
