import { ASSETS, DISEASES, JOBS, LIFE_ACTIONS, LIFE_EVENTS, LIFE_REGIONS, MINI_GAMES } from './lifeData';
import { createLife } from './life';
import type { GameState } from './types';
import type { LifeState } from './lifeTypes';
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown, min = 0, max = 100) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const int = (v: unknown, min = 0, max = 10000) => num(v, min, max) && Number.isInteger(v);
const text = (v: unknown, max = 1000) => typeof v === 'string' && v.length <= max;
const list = (v: unknown, max: number, check: (item: any) => boolean) => Array.isArray(v) && v.length <= max && v.every(check);
// Match the known shape, then validate unions and array elements below. Unknown fields are discarded.
function shape(value: unknown, base: unknown): unknown {
  if (base === null) return value;
  if (Array.isArray(base)) return Array.isArray(value) ? value : undefined;
  if (record(base)) { if (!record(value)) return undefined; const out: Record<string, unknown> = {}; for (const key of Object.keys(base)) { const result = shape(value[key], base[key]); if (result === undefined) return undefined; out[key] = result; } return out; }
  if (typeof value !== typeof base || typeof value === 'number' && !Number.isFinite(value)) return undefined;
  return value;
}
export function validateLife(raw: unknown, game: GameState): LifeState | null {
  if (raw === undefined) { const l = createLife(); l.body.schoolWeeks = game.week; l.body.habits.sleep = Math.min(85, 50 + game.counts.rest * 1.2); l.body.habits.movement = Math.min(85, 40 + game.counts.exercise * 2); l.body.habits.strain = game.stats.stress; return l; }
  const checked = shape(raw, createLife()); if (!checked) return null;
  const l = checked as LifeState, r = raw as Record<string, unknown>;
  if (!record(r.scores)) return null;
  l.scores = Object.fromEntries(Object.entries(r.scores).filter(([id]) => MINI_GAMES.some(m => m.id === id))) as Record<string, number>;
  if (l.schema !== 1 || !['university', 'society'].includes(l.stage) || !['school', 'university', 'society'].includes(l.atlas) || !LIFE_REGIONS.some(region => region.id === l.region)) return null;
  if (l.active && (!game.started || game.phase !== 'ending') || !num(l.baseAge, 18, 110) || !int(l.weeks) || !int(l.actions, 0, 3) || !int(l.generation, 1, 100)) return null;
  if (!list(l.used, 3, id => typeof id === 'string' && (id in LIFE_ACTIONS || ['apply', 'talk'].includes(id) || /^(game|test):[a-z]+$/.test(id) || id.startsWith('treat:') && id.slice(6) in DISEASES)) || l.used.length !== l.actions) return null;
  if (!list(l.seen, LIFE_EVENTS.length, id => LIFE_EVENTS.some(e => e.id === id)) || new Set(l.seen).size !== l.seen.length) return null;
  if (l.pending !== null && (!text(l.pending, 80) || !LIFE_EVENTS.some(e => e.id === l.pending) && !['proposal', 'baby-plan', 'care-plan', 'separate', 'confess:su', 'confess:zhou', 'confess:zhixia', 'confess:xinghe', 'confess:tangtang'].includes(l.pending))) return null;
  if (l.work.job !== null && !JOBS.some(j => j.id === l.work.job) || !num(l.work.experience, 0, 10000) || !num(l.work.hours, 0, 1000000) || !int(l.work.missed) || !int(l.work.lastApplication, -1, l.weeks)) return null;
  if (!num(l.education.credits, 0, 10000) || !num(l.education.gpa, 0, 4) || !num(l.education.prestige) || !text(l.education.school, 100) || !text(l.education.major, 100) || !Object.values(l.skills).every(v => num(v))) return null;
  const e = l.economy;
  if (!['dorm', 'shared', 'apartment'].includes(e.rent) || !['none', 'basic', 'commercial'].includes(e.insurance) || !int(e.insuredSince, -1, l.weeks) || ![e.debt, e.income, e.expenses].every(v => num(v, 0, 1e10))) return null;
  if (!list(e.ledger, 160, t => record(t) && int(t.week, 0, l.weeks) && text(t.label, 200) && num(t.amount, -1e8, 1e8))) return null;
  const b = l.body;
  if (!Object.values(b.habits).every(v => num(v)) || !Object.values(b.internal).every(v => num(v)) || !num(b.constitution) || !int(b.schoolWeeks, 0, 40) || !int(b.emergencyWeek, -1, l.weeks)) return null;
  if (!list(b.conditions, 12, c => record(c) && typeof c.id === 'string' && c.id in DISEASES && ['latent', 'symptoms', 'diagnosed', 'stable', 'progressing'].includes(String(c.stage)) && num(c.severity) && int(c.since) && int(c.treated, -1) && typeof c.discovered === 'boolean')) return null;
  if (new Set(b.conditions.map(c => c.id)).size !== b.conditions.length || game.gender === 'male' && b.conditions.some(c => c.id === 'ovarianCancer')) return null;
  if (b.emergency !== null && (!(b.emergency in DISEASES) || !DISEASES[b.emergency].acute || !b.conditions.some(c => c.id === b.emergency))) return null;
  if (!list(b.tests, 60, t => record(t) && int(t.week, 0, l.weeks) && text(t.test, 60) && text(t.text)) || !list(b.notices, 8, t => text(t, 200))) return null;
  const f = l.finance;
  if (!ASSETS.every(a => num(f.prices[a.id], .0001, 1e12) && num(f.holdings[a.id], 0, 1e12) && list(f.series[a.id], 52, v => num(v, .0001, 1e12))) || !int(f.nextId, 1, 1e8) || !num(f.fees, 0, 1e10) || !num(f.realized, -1e10, 1e10)) return null;
  if (!list(f.positions, 12, p => record(p) && int(p.id, 1, f.nextId - 1) && ['BTC', 'ETH'].includes(String(p.asset)) && ['perpetual', 'delivery'].includes(String(p.kind)) && ['long', 'short'].includes(String(p.side)) && num(p.entry, .0001, 1e12) && num(p.quantity, .0000000001, 1e12) && num(p.margin, .01, 999999) && [1, 2, 3, 5, 10].includes(Number(p.leverage)) && int(p.expiry, 0, 10004) && num(p.funding, -1e10, 1e10))) return null;
  if (new Set(f.positions.map(p => p.id)).size !== f.positions.length || ![f.pool.eth, f.pool.cash, f.pool.supply].every(v => num(v, .0000001, 1e12)) || !num(f.pool.shares, 0, f.pool.supply) || !num(f.pool.deposited, 0, 1e12)) return null;
  const family = l.family, partners = ['su', 'zhou', 'zhixia', 'xinghe', 'tangtang', 'teacher'];
  if (family.spouse !== null && !partners.includes(family.spouse) || !num(family.affection) || !int(family.lastCare, -1, l.weeks)) return null;
  if (family.spouse && family.spouse !== (game.social.partner ?? game.graduate.partner)) return null;
  if (family.pregnancy !== null && (!record(family.pregnancy) || !int(family.pregnancy.due, l.weeks, l.weeks + 40) || !['male', 'female'].includes(family.pregnancy.gender) || !text(family.pregnancy.name, 16) || !family.spouse)) return null;
  if (!list(family.children, 4, c => record(c) && text(c.id, 80) && text(c.name, 16) && ['male', 'female'].includes(String(c.gender)) && int(c.bornWeek, -10000, l.weeks) && num(c.education) && num(c.care))) return null;
  if (new Set(family.children.map(c => c.id)).size !== family.children.length) return null;
  if (l.game !== null && (!record(l.game) || !MINI_GAMES.some(m => m.id === l.game!.id) || !int(l.game.seed, 1, 2147483646) || l.game.week !== l.weeks || !text(l.game.target, 50) || !list(l.game.answers, 48, a => int(a, 0, l.game!.id === 'rhythm' ? 1000 : l.game!.id === 'memory' ? 11 : 2)))) return null;
  if (!record(r.scores) || !Object.entries(l.scores).every(([id, score]) => MINI_GAMES.some(m => m.id === id) && num(score)) || !list(l.tasks, 12, t => text(t, 60))) return null;
  if (!list(l.memories, 180, m => record(m) && int(m.week, 0, l.weeks) && text(m.title, 100) && text(m.text)) || !list(l.ancestors, 12, a => record(a) && text(a.name, 16) && num(a.age, 18, 120) && text(a.cause, 200) && num(a.wealth, 0, 1e12) && int(a.generation, 1, 100))) return null;
  if (l.death !== null && (!record(l.death) || !text(l.death.cause, 200) || !num(l.death.age, 18, 120) || !int(l.death.week, 0, l.weeks) || typeof l.death.settled !== 'boolean' || l.pending || l.game || b.emergency)) return null;
  return structuredClone(l);
}
