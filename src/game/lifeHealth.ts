import { DISEASES, MEDICAL_TESTS } from './lifeData';
import type { Body, Condition, DiseaseId } from './lifeTypes';
import type { GameState } from './types';
export const limit = (n: number, low = 0, high = 100) => Math.min(high, Math.max(low, n));
export const lifeAge = (g: GameState) => g.life.baseAge + (g.life.active ? g.life.weeks : g.week) / 52;
export function roll(seed: number, salt: number) { const x = Math.sin(seed * .000031 + salt * 12.9898) * 43758.5453; return x - Math.floor(x); }
export function createBody(): Body { return { habits: { diet: 65, sleep: 65, movement: 55, posture: 60, smoke: 0, strain: 20 }, internal: { metabolic: 88, vascular: 90, cardiac: 91, renal: 93, respiratory: 94, marrow: 95, skeletal: 88 }, conditions: [], emergency: null, emergencyWeek: -1, tests: [], notices: [], constitution: 75, schoolWeeks: 0 }; }
export function recordHabit(body: Body, action: string): Body {
  const h = { ...body.habits };
  if (['rest', 'sleep', 'tea'].includes(action)) { h.sleep += 4; h.strain -= 4; }
  if (['meal', 'milk', 'bread', 'cook'].includes(action)) h.diet += 3;
  if (['coffee', 'late-study'].includes(action)) { h.sleep -= 4; h.strain += 3; }
  if (['exercise', 'ball', 'walk', 'run'].includes(action)) { h.movement += 4; h.strain -= 2; }
  if (['work', 'course', 'balanced', 'review', 'math', 'physics', 'chinese', 'english', 'chemistry', 'biology'].includes(action)) { h.posture -= 1; h.movement -= 1; }
  for (const key of Object.keys(h) as (keyof typeof h)[]) h[key] = limit(h[key]);
  return { ...body, habits: h };
}
// Normalized gameplay indicators and hazards, not clinical scores or epidemiological probabilities.
export function advanceBody(g: GameState): { body: Body; fatal?: string } {
  const old = g.life.body, age = lifeAge(g), week = g.life.active ? g.life.weeks : g.week;
  const h = { ...old.habits }, i = { ...old.internal };
  h.strain = limit(h.strain * .97 + g.stats.stress * .025 + (g.stats.energy < 25 ? 1.8 : 0));
  if (g.stats.energy < 25) h.sleep = limit(h.sleep - 1.2);
  const aging = Math.max(0, age - 35) * .0009;
  i.metabolic = limit(i.metabolic + (h.diet - 58) * .002 + (h.movement - 45) * .001 - aging);
  i.vascular = limit(i.vascular + (h.sleep - 60) * .0015 - h.strain * .0012 - aging);
  i.cardiac = limit(i.cardiac + (h.movement - 45) * .001 - h.strain * .0013 - aging);
  i.respiratory = limit(i.respiratory - h.smoke * .001 - aging / 2);
  i.renal = limit(i.renal - Math.max(0, 65 - i.metabolic) * .0008 - aging / 2);
  i.skeletal = limit(i.skeletal + (h.movement - 50) * .0008 - aging / 2);
  if (i.respiratory < 50) i.cardiac = limit(i.cardiac - (50 - i.respiratory) * .001);
  if (i.renal < 45) { i.vascular = limit(i.vascular - .05); i.metabolic = limit(i.metabolic - .04); }
  if (i.marrow < 45) { i.cardiac = limit(i.cardiac - .04); h.strain = limit(h.strain + .15); }
  const conditions = old.conditions.map(c => ({ ...c })), notices: string[] = [];
  let emergency = old.emergency;
  let fatal: string | undefined;
  for (const c of conditions) {
    const disease = DISEASES[c.id];
    if (disease.acute) continue;
    const speed = ['aml', 'all'].includes(c.id) ? 4 : c.id.includes('Cancer') ? .8 : .28;
    c.severity = limit(c.severity + (c.stage === 'stable' ? -.12 : speed));
    if (c.stage === 'latent' && c.severity >= 28) c.stage = 'symptoms';
    if ((c.stage === 'symptoms' || c.stage === 'diagnosed') && c.severity >= 66) c.stage = 'progressing';
    if (c.stage !== 'latent' && c.stage !== 'stable') notices.push(disease.symptom);
    const key = disease.system as keyof typeof i;
    i[key] = limit(i[key] - c.severity * .003);
    if (g.life.active && c.severity >= 98 && c.stage === 'progressing') fatal = disease.name;
  }
  for (const id of Object.keys(DISEASES) as DiseaseId[]) {
    const d = DISEASES[id];
    const existing = conditions.find(c => c.id === id);
    if (id === 'ovarianCancer' && g.gender !== 'female' || existing && (!d.acute || existing.stage !== 'stable')) continue;
    if (d.acute && (!g.life.active || emergency)) continue;
    let hazard = .000015 * (1 + Math.max(0, age - 35) / 15) * (.65 + (100 - old.constitution) / 50);
    if (id === 'diabetes') hazard = .00008 + Math.max(0, 70 - i.metabolic) * .00009;
    if (id === 'scoliosis') hazard = age < 24 ? .0003 : .00001; // Not caused simply by sitting poorly.
    if (id === 'mitral') hazard = .00005 + Math.max(0, age - 45) * .000003;
    if (id === 'lungCancer') hazard *= 1 + h.smoke / 8;
    if (d.acute) hazard = .000008 + Math.max(0, 70 - i[d.system as keyof typeof i]) * .000018 + Math.max(0, age - 50) * .000004;
    if (roll(g.seed, week * 23 + Object.keys(DISEASES).indexOf(id) + g.life.generation * 17) < hazard) {
      const c: Condition = { id, stage: d.acute ? 'diagnosed' : 'latent', severity: d.acute ? 85 : 10, since: week, treated: -1, discovered: d.acute };
      if (existing) Object.assign(existing, c); else conditions.push(c);
      if (d.acute) { emergency = id; notices.unshift(d.symptom + '。立即进入医院急救。'); }
    }
  }
  return { body: { ...old, habits: h, internal: i, conditions, emergency, emergencyWeek: emergency ? week : -1, notices: [...new Set(notices)].slice(0, 8), schoolWeeks: old.schoolWeeks + (g.life.active ? 0 : 1) }, fatal };
}
export function medicalLock(g: GameState, test: string): string | null {
  if (!MEDICAL_TESTS.some(t => t.id === test)) return '没有这项检查。';
  if (g.life.body.tests.some(t => t.test === test && t.week === g.life.weeks)) return '本周已完成这项检查。';
  if (test === 'scan' && !g.life.body.conditions.some(c => c.stage !== 'latent') && !g.life.body.tests.some(t => t.text.includes('异常'))) return '先由基础检查或症状提示影像检查指征。';
  if (test === 'biopsy' && !g.life.body.tests.some(t => t.test === 'scan' && t.text.includes('病灶'))) return '尚无影像病灶，暂不需要活检。';
  if (test === 'marrow' && !g.life.body.tests.some(t => t.test === 'blood' && t.text.includes('造血异常'))) return '先做血常规，发现造血异常后再进一步检查。';
  return null;
}
export function examine(g: GameState, test: string): { body: Body; text: string } {
  const body = structuredClone(g.life.body), findings: string[] = [];
  for (const c of body.conditions) {
    if (!DISEASES[c.id].tests.includes(test) || c.severity < 12) continue;
    const isCancer = c.id.includes('Cancer'), leukemia = ['aml', 'all'].includes(c.id);
    if (isCancer && test === 'scan') findings.push('影像发现待查病灶，需要专科评估与病理确认');
    else if (leukemia && test === 'blood') findings.push('发现造血异常，建议进一步骨髓与分型检查');
    else {
      c.discovered = true; if (c.stage !== 'stable') c.stage = c.severity >= 66 ? 'progressing' : 'diagnosed';
      findings.push(`${DISEASES[c.id].name}：已确认，安排治疗与复查`);
    }
  }
  const text = findings.length ? [...new Set(findings)].join('；') : '本次检查未发现相应异常。一次阴性结果不能永久排除疾病，持续症状仍需复诊。';
  body.tests.unshift({ week: g.life.weeks, test, text }); body.tests = body.tests.slice(0, 60);
  return { body, text };
}
