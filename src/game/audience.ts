import type { Audience, GameState } from './types';

// Viewer preferences are deliberately outside save files and never imported.
export const AUDIENCE_KEY = 'shiguang-audience-v1';
export const ADULT_BIRTHDAYS = { player: '2007-05-12', su: '2007-04-18', zhou: '2007-02-09', zhixia: '2007-06-16', xinghe: '2006-12-23', tangtang: '2007-03-27' } as const;
export function loadAudience(): Audience {
  try {
    const raw = JSON.parse(localStorage.getItem(AUDIENCE_KEY) ?? '{}');
    return { age: raw.age === 'adult' || raw.age === 'minor' ? raw.age : 'unknown', skipPrivate: raw.skipPrivate === true };
  } catch { return { age: 'unknown', skipPrivate: false }; }
}
export function persistAudience(audience: Audience) {
  try { localStorage.setItem(AUDIENCE_KEY, JSON.stringify(audience)); } catch { /* An unavailable store keeps the next visit gated. */ }
}
export function actorsAreAdults(game: GameState) {
  const date = new Date(Date.UTC(2025, 8, 1 + game.week * 7));
  return Object.values(ADULT_BIRTHDAYS).every(birthday => {
    const birth = new Date(`${birthday}T00:00:00Z`);
    return date >= new Date(Date.UTC(birth.getUTCFullYear() + 18, birth.getUTCMonth(), birth.getUTCDate()));
  });
}
export function matureAllowed(game: GameState, audience: Audience) { return audience.age === 'adult' && actorsAreAdults(game); }
