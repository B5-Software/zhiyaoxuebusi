import { asset } from '../utils/asset';
import type { GameState } from './types';

export const DEFAULT_PLAYER_NAME = '江予安';
const LEGACY_DEFAULT_NAME = '林小满';

export function playerDisplayName(game: Pick<GameState, 'name'>) {
  return game.name.trim() || DEFAULT_PLAYER_NAME;
}

export function playerText(game: Pick<GameState, 'name'> & Partial<Pick<GameState, 'gender'>>, text: string) {
  return text.split('{{player}}').join(playerDisplayName(game)).split('{{pronoun}}').join(game.gender === 'female' ? '她' : '他').split('{{child}}').join(game.gender === 'female' ? '女儿' : '儿子');
}

export function playerNameError(value: string) {
  const name = value.trim();
  if (!name) return '请输入你的名字。';
  if (name.length > 16) return '名字最多 16 个字符。';
  if (/[\u0000-\u001f\u007f]/.test(name)) return '名字中不能包含换行或控制字符。';
  return null;
}

export function migratePlayerName(value: string, customFlag?: boolean) {
  const name = value.trim();
  if (customFlag === false || customFlag === undefined && name === LEGACY_DEFAULT_NAME) return { name: DEFAULT_PLAYER_NAME, nameIsCustom: false };
  return { name, nameIsCustom: customFlag ?? name !== DEFAULT_PLAYER_NAME };
}

export function renamePlayer(game: GameState, value: string): { game: GameState; error?: string } {
  const error = playerNameError(value);
  if (error) return { game, error };
  return { game: { ...game, name: value.trim(), nameIsCustom: true, updatedAt: new Date().toISOString() } };
}

export const playerPortrait = (game: Pick<GameState, 'gender'>) => asset(game.gender === 'female' ? 'images/student-female.webp' : 'images/student.jpg');
