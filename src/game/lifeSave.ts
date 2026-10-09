import { ASSETS, DISEASES, JOBS, LIFE_ACTIONS, LIFE_EVENTS, LIFE_REGIONS, MINI_GAMES } from './lifeData';
import { createLife } from './life';
import { LIFE_ARCS } from './lifeStoryData';
import { createLifeStories, pendingChapter } from './lifeStories';
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
  if(record(raw)&&raw.schema===1){
    const merge=(value:any,base:any):any=>Array.isArray(base)?value??base:record(base)?Object.fromEntries(Object.entries(base).map(([k,b])=>[k,merge(value?.[k],b)])):value??base;
    const old=raw;raw=merge(old,createLife());(raw as any).schema=2;
    const upgraded=raw as any;upgraded.originWeek=upgraded.active?Math.max(game.week,Math.round((upgraded.baseAge-18)*52)):0;upgraded.education.entered=0;
    upgraded.eventWeeks=Object.fromEntries(LIFE_EVENTS.filter(e=>upgraded.seen.includes(e.id)).map(e=>[e.id,upgraded.memories.find((m:any)=>m.title===e.title)?.week??Math.max(0,upgraded.weeks-52)]));
    upgraded.finance.rebuiltBefore=upgraded.weeks*7;for(const a of ASSETS){const series=upgraded.finance.series[a.id] as number[];let prev=series[0];upgraded.finance.candles[a.id]=series.flatMap((close,i)=>{const bars=[];for(let d=0;d<7;d++){const open=prev,next=d===6?close:prev+(close-prev)/(7-d);bars.push({day:(upgraded.weeks-series.length+i)*7+d,open,close:next,high:Math.max(open,next),low:Math.min(open,next),volume:0,news:[]});prev=next;}return bars;}).slice(-364);}
    upgraded.finance.basis=Object.fromEntries(ASSETS.map(a=>[a.id,upgraded.finance.holdings[a.id]*upgraded.finance.prices[a.id]]));
    upgraded.body.conditions=upgraded.body.conditions.map((c:any)=>({...c,care:c.stage==='stable',review:upgraded.weeks+13,remission:upgraded.weeks+52}));
    upgraded.body.tests=upgraded.body.tests.map((t:any)=>({...t,findings:[],confirmed:[],readings:{}}));
    // Legacy records had no structured indication: re-examination is needed, never infer a diagnosis from prose.
    upgraded.family.marriedWeek=upgraded.family.spouse?upgraded.weeks:-1;upgraded.family.partnerJob=upgraded.family.spouse?'shop':null;
  }
  // v3.0/v3.1 lifetime records predate serialized chapter routes.
  if (record(raw) && raw.schema === 2 && raw.stories === undefined) raw = { ...raw, stories: createLifeStories() };
  const checked = shape(raw, createLife()); if (!checked) return null;
  const l = checked as LifeState, r = raw as Record<string, unknown>;
  if(!record(r.eventWeeks))return null;l.eventWeeks=Object.fromEntries(Object.entries(r.eventWeeks).filter(([id])=>LIFE_EVENTS.some(e=>e.id===id))) as Record<string,number>;if(!Object.values(l.eventWeeks).every(w=>int(w,0,l.weeks)))return null;
  if (!record(r.scores)) return null;
  l.scores = Object.fromEntries(Object.entries(r.scores).filter(([id]) => MINI_GAMES.some(m => m.id === id))) as Record<string, number>;
  if (l.schema !== 2 || !['school', 'university', 'society'].includes(l.stage) || !['school', 'university', 'society'].includes(l.atlas) || !LIFE_REGIONS.some(region => region.id === l.region)) return null;
  if (l.active && (!game.started || game.phase !== 'ending') || !num(l.baseAge, 15, 110) || !int(l.originWeek,0,100000) || !int(l.weeks) || !int(l.actions, 0, 3) || !int(l.generation, 1, 100)) return null;
  if (!list(l.used, 3, id => typeof id === 'string' && (id in LIFE_ACTIONS || ['apply', 'talk', 'aid', 'claim'].includes(id) || /^(game|test):[a-z]+$/.test(id) || id.startsWith('story:') && LIFE_ARCS.some(a => a.id === id.slice(6)) || id.startsWith('treat:') && id.slice(6) in DISEASES)) || l.used.length !== l.actions) return null;
  if (!list(l.seen, LIFE_EVENTS.length, id => LIFE_EVENTS.some(e => e.id === id)) || new Set(l.seen).size !== l.seen.length) return null;
  if (l.pending !== null && (!text(l.pending, 80) || !LIFE_EVENTS.some(e => e.id === l.pending) && !pendingChapter({ ...game, life: l }) && !['school-transition', 'proposal', 'baby-plan', 'care-plan', 'separate', 'confess:su', 'confess:zhou', 'confess:zhixia', 'confess:xinghe', 'confess:tangtang'].includes(l.pending))) return null;
  if (l.work.job !== null && !JOBS.some(j => j.id === l.work.job) || !num(l.work.experience, 0, 10000) || !num(l.work.hours, 0, 1000000) || !int(l.work.missed) || !int(l.work.lastApplication, -1, l.weeks)) return null;
  if (!num(l.education.credits, 0, 10000) || !num(l.education.gpa, 0, 4) || !num(l.education.prestige) || !text(l.education.school, 100) || !text(l.education.major, 100) || !Object.values(l.skills).every(v => num(v))) return null;
  const e = l.economy;
  if (!['dorm', 'shared', 'apartment'].includes(e.rent) || !['none', 'basic', 'commercial'].includes(e.insurance) || !int(e.insuredSince, -1, l.weeks) || ![e.debt, e.income, e.expenses].every(v => num(v, 0, 1e10))) return null;
  if (!list(e.ledger, 160, t => record(t) && int(t.week, 0, l.weeks) && text(t.label, 200) && num(t.amount, -1e8, 1e8))) return null;
  const b = l.body;
  if (!Object.values(b.habits).every(v => num(v)) || !Object.values(b.internal).every(v => num(v)) || !num(b.constitution) || !int(b.schoolWeeks, 0, 10000) || !int(b.emergencyWeek, -1, l.weeks)) return null;
  if (!list(b.conditions, 12, c => record(c) && typeof c.id === 'string' && c.id in DISEASES && ['latent', 'symptoms', 'diagnosed', 'stable', 'progressing'].includes(String(c.stage)) && num(c.severity) && int(c.since) && int(c.treated, -1) && typeof c.discovered === 'boolean')) return null;
  if (new Set(b.conditions.map(c => c.id)).size !== b.conditions.length || game.gender === 'male' && b.conditions.some(c => c.id === 'ovarianCancer')) return null;
  if (b.emergency !== null && (!(b.emergency in DISEASES) || !DISEASES[b.emergency].acute || !b.conditions.some(c => c.id === b.emergency))) return null;
  if (!list(b.tests, 60, t => record(t) && int(t.week, 0, l.weeks) && text(t.test, 60) && text(t.text)) || !list(b.notices, 8, t => text(t, 200))) return null;
  const f = l.finance;
  if(f.rebuiltBefore!==null&&!int(f.rebuiltBefore,0,l.weeks*7))return null;
  if (!ASSETS.every(a => num(f.prices[a.id], .0001, 1e12) && num(f.holdings[a.id], 0, 1e12) && f.series[a.id].length>0 && list(f.series[a.id], 52, v => num(v, .0001, 1e12))) || !int(f.nextId, 1, 1e8) || !num(f.fees, 0, 1e10) || !num(f.realized, -1e10, 1e10)) return null;
  if (!list(f.positions, 12, p => record(p) && int(p.id, 1, f.nextId - 1) && ['BTC', 'ETH'].includes(String(p.asset)) && ['perpetual', 'delivery'].includes(String(p.kind)) && ['long', 'short'].includes(String(p.side)) && num(p.entry, .0001, 1e12) && num(p.quantity, .0000000001, 1e12) && num(p.margin, .01, 999999) && [1, 2, 3, 5, 10].includes(Number(p.leverage)) && int(p.expiry, 0, 10004) && num(p.funding, -1e10, 1e10))) return null;
  if (new Set(f.positions.map(p => p.id)).size !== f.positions.length || ![f.pool.eth, f.pool.cash, f.pool.supply].every(v => num(v, .0000001, 1e12)) || !num(f.pool.shares, 0, f.pool.supply) || !num(f.pool.deposited, 0, 1e12)) return null;
  const family = l.family, partners = ['su', 'zhou', 'zhixia', 'xinghe', 'tangtang', 'teacher'];
  if (family.spouse !== null && !partners.includes(family.spouse) || !num(family.affection) || !int(family.lastCare, -1, l.weeks)) return null;
  if(l.active&&l.baseAge+l.weeks/52<18&&(family.spouse||game.social.partner||game.graduate.partner||family.pregnancy))return null;
  if (family.spouse && family.spouse !== (game.social.partner ?? game.graduate.partner)) return null;
  if (family.pregnancy !== null && (!record(family.pregnancy) || !int(family.pregnancy.due, l.weeks, l.weeks + 40) || !['male', 'female'].includes(family.pregnancy.gender) || !text(family.pregnancy.name, 16) || !(family.spouse||family.coParent))) return null;
  if (!list(family.children, 4, c => record(c) && text(c.id, 80) && text(c.name, 16) && ['male', 'female'].includes(String(c.gender)) && int(c.bornWeek, -10000, l.weeks) && num(c.education) && num(c.care))) return null;
  if (new Set(family.children.map(c => c.id)).size !== family.children.length) return null;
  if (l.game !== null && (!record(l.game) || !MINI_GAMES.some(m => m.id === l.game!.id) || !int(l.game.seed, 1, 2147483646) || l.game.week !== l.weeks || !text(l.game.target, 50) || !list(l.game.answers, 48, a => int(a, 0, l.game!.id === 'rhythm' ? 1000 : l.game!.id === 'memory' ? 11 : 2)))) return null;
  if (!record(r.scores) || !Object.entries(l.scores).every(([id, score]) => MINI_GAMES.some(m => m.id === id) && num(score)) || !list(l.tasks, 12, t => text(t, 60))) return null;
  if (!list(l.memories, 180, m => record(m) && int(m.week, 0, l.weeks) && text(m.title, 100) && text(m.text)) || !list(l.ancestors, 12, a => record(a) && text(a.name, 16) && num(a.age, 15, 120) && text(a.cause, 200) && num(a.wealth, 0, 1e12) && int(a.generation, 1, 100))) return null;
  if (l.death !== null && (!record(l.death) || !text(l.death.cause, 200) || !num(l.death.age, 15, 120) || !int(l.death.week, 0, l.weeks) || typeof l.death.settled !== 'boolean' || l.pending || l.game || b.emergency)) return null;
  if(!int(l.education.entered??0,-10000,l.weeks)||!num(l.work.arrears,0,1e10)||!int(l.work.claimDue,-1,l.weeks+3)||!int(l.work.pensionWeeks)||!int(l.work.paidWeeks)||!num(l.work.wageFactor,.7,1.4)||!int(l.work.arrearsWeeks))return null;
  if(!num(e.costIndex,.5,3)||!num(e.rentIndex,.5,3)||!num(e.shortfall,0,1e10)||!int(e.aidDue,-1,l.weeks+4)||!int(e.aidCooldown,-52,l.weeks)||!int(e.deductibleYear,-1,3000)||!num(e.deductibleSpent,0,500)||!list(e.excluded,12,id=>id in DISEASES))return null;
  if(!int(family.marriedWeek,-1,l.weeks)||family.partnerJob!==null&&!JOBS.some(j=>j.id===family.partnerJob)||!num(family.careShare,0,1)||!int(family.partnerWorkWeeks)||!list(family.prenatal,3,w=>int(w,0,l.weeks)))return null;
  if(!ASSETS.every(a=>num(f.basis[a.id],0,1e12)&&num(f.sentiment[a.id],-2,2)&&f.candles[a.id].length>0&&list(f.candles[a.id],364,c=>record(c)&&int(c.day,-1000,l.weeks*7)&&[c.open,c.high,c.low,c.close].every(v=>num(v,.0001,1e12))&&Number(c.high)>=Math.max(Number(c.open),Number(c.close))&&Number(c.low)<=Math.min(Number(c.open),Number(c.close))&&num(c.volume,0,1e12)&&list(c.news,60,id=>text(id,80)))))return null;
  if(!list(f.news,60,n=>record(n)&&text(n.id,80)&&int(n.week,0,l.weeks)&&['经济','教育','医疗','劳动','市场'].includes(String(n.category))&&text(n.title,200)&&text(n.text,1000)&&int(n.duration,1,52)&&num(n.rent,-.1,.1)&&num(n.wages,-.1,.1)&&record(n.impacts)&&Object.entries(n.impacts).every(([a,v])=>ASSETS.some(x=>x.id===a)&&num(v,-1,1))))return null;
  if(!list(f.trades,100,t=>record(t)&&int(t.week,0,l.weeks)&&ASSETS.some(a=>a.id===t.asset)&&text(t.kind,50)&&num(t.amount,0,1e12)&&num(t.price,0,1e12)&&num(t.pnl,-1e12,1e12)))return null;
  if(!b.tests.every(t=>(t.findings===undefined||list(t.findings,12,id=>id in DISEASES))&&(t.confirmed===undefined||list(t.confirmed,12,id=>id in DISEASES))&&(t.readings===undefined||record(t.readings)&&Object.values(t.readings).every(v=>num(v,0,10000)))))return null;
  if(!b.conditions.every(c=>(c.care===undefined||typeof c.care==='boolean')&&(c.review===undefined||int(c.review,0,10013))&&(c.remission===undefined||int(c.remission,0,10052))&&(c.sessions===undefined||int(c.sessions,0,6))))return null;
  for(const child of family.children){const p=child.profile;if(p&&(!record(p)||typeof p.degree!=='boolean'||typeof p.enrolled!=='boolean'||!int(p.credits)||!int(p.collegeWeeks)||!num(p.prestige)||!num(p.technical)||!int(p.workWeeks)||!record(p.body)||!shape(p.body,createLife().body)||!Object.values(p.body.internal??{}).every(v=>num(v))||!Object.values(p.body.habits??{}).every(v=>num(v))||!list(p.body.conditions,12,c=>record(c)&&typeof c.id==='string'&&c.id in DISEASES&&['latent','symptoms','diagnosed','stable','progressing'].includes(String(c.stage))&&num(c.severity)&&int(c.since)&&int(c.treated,-1)&&typeof c.discovered==='boolean')||child.gender==='male'&&p.body.conditions.some(c=>c.id==='ovarianCancer')))return null;}
  if(!list(l.claims,8,c=>record(c)&&['tuition','insurance'].includes(String(c.kind))&&int(c.due,l.weeks,l.weeks+4)&&num(c.amount,0,2000))||new Set(l.claims.map(c=>c.kind)).size!==l.claims.length)return null;
  if (!record(r.stories) || !record(r.stories.routes)) return null;
  l.stories.routes = structuredClone(r.stories.routes) as LifeState['stories']['routes'];
  const s = l.stories;
  if (s.version !== 1 || !int(s.lastOffered, -2, l.weeks) || Object.keys(s.routes).length > LIFE_ARCS.length) return null;
  for (const [id, route] of Object.entries(s.routes)) {
    const arc = LIFE_ARCS.find(a => a.id === id);
    if (!arc || !record(route) || !int(route.started, 0, l.weeks) || !int(route.lastWeek, route.started, l.weeks) || !list(route.choices, arc.chapters.length, c => c === 0 || c === 1)) return null;
  }
  if (!list(s.log, 60, row => record(row) && text(row.id, 80) && text(row.result, 1000) && int(row.week, 0, l.weeks) && (row.choice === 0 || row.choice === 1) && LIFE_ARCS.some(a => a.id === row.arc && int(row.step, 0, a.chapters.length - 1) && s.routes[a.id]?.choices[Number(row.step)] === row.choice))) return null;
  if (new Set(s.log.map(row => row.id)).size !== s.log.length || s.receipt !== null && (!text(s.receipt, 80) || !s.log.some(row => row.id === s.receipt)) || s.receipt && l.pending) return null;
  const chapter = pendingChapter({ ...game, life: l });
  if (chapter && (s.routes[chapter.arc.id]?.choices.length !== chapter.step || !l.used.includes(`story:${chapter.arc.id}`))) return null;
  for (const [id, route] of Object.entries(s.routes)) {
    if (route.choices.some((choice, step) => !s.log.some(row => row.arc === id && row.step === step && row.choice === choice))) return null;
  }
  return structuredClone(l);
}
