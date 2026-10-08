export const PLAYTIME_KEY = 'shiguang-playtime-v1';
export const REMINDER_INTERVAL = 30 * 60 * 1000;
const BREAK_RESET = 5 * 60 * 1000;
export interface Playtime { elapsed: number; acknowledged: number; lastAt: number; visible: boolean; away: number }
export function readPlaytime(raw: unknown, now: number): Playtime {
  const fresh = { elapsed: 0, acknowledged: 0, lastAt: now, visible: true, away: 0 };
  if (!raw || typeof raw !== 'object') return fresh;
  const value = raw as Playtime;
  if (![value.elapsed, value.acknowledged, value.lastAt].every(Number.isFinite) || value.elapsed < 0 || value.elapsed > 24 * 3600000 || value.acknowledged < 0 || value.acknowledged > Math.floor(value.elapsed / REMINDER_INTERVAL) || !Number.isInteger(value.acknowledged) || typeof value.visible !== 'boolean' || now < value.lastAt || now - value.lastAt >= BREAK_RESET) return fresh;
  return { ...value, lastAt: now, visible: true, away: 0 };
}
export function tickPlaytime(value: Playtime, now: number, visible: boolean, playing: boolean): Playtime {
  const delta = Math.max(0, now - value.lastAt);
  const away = value.visible ? 0 : (value.away ?? 0) + delta;
  if (away >= BREAK_RESET) return { elapsed: 0, acknowledged: 0, lastAt: now, visible, away: 0 };
  return { ...value, elapsed: value.elapsed + (value.visible && playing ? Math.min(delta, 15000) : 0), lastAt: now, visible, away: visible ? 0 : away };
}
export const reminderDue = (value: Playtime) => Math.floor(value.elapsed / REMINDER_INTERVAL) > value.acknowledged;
export const acknowledgePlaytime = (value: Playtime): Playtime => ({ ...value, acknowledged: Math.floor(value.elapsed / REMINDER_INTERVAL) });
