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
    const oncology=c.id.includes('Cancer')||['aml','all'].includes(c.id),overdue=week>(c.review??week)+13;
    if(c.stage==='stable'&&(!c.care||overdue||oncology&&week>(c.remission??Infinity)&&roll(g.seed,week+543)<.008)){c.stage='diagnosed';notices.push(disease.name+'需要重新评估治疗与复查。');}
    c.severity = limit(c.severity + (c.stage === 'stable'&&c.care ? -.12 : speed));
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
  return { body: { ...old, habits: h, internal: i, conditions, emergency, emergencyWeek: emergency ? week : -1, notices: [...new Set(notices)].slice(0, 8), schoolWeeks: old.schoolWeeks + (!g.life.active||g.life.stage==='school'?1:0) }, fatal };
}
export function medicalLock(g:GameState,test:string):string|null{
 if(!MEDICAL_TESTS.some(t=>t.id===test))return '没有这项检查。';
 if(g.life.body.tests.some(t=>t.test===test&&t.week===g.life.weeks))return '本周已完成这项检查。';
 const recent=g.life.body.tests.filter(t=>g.life.weeks-t.week<=13);
 if(test==='scan'&&!g.life.body.conditions.some(c=>c.stage!=='latent')&&!recent.some(t=>(t.findings??[]).length))return '需要近期异常检查或持续症状，先做基础评估。';
 if(test==='biopsy'&&!recent.some(t=>t.test==='scan'&&(t.findings??[]).some(id=>id.includes('Cancer'))))return '近13周没有待查影像病灶，暂不安排活检。';
 if(test==='marrow'&&!recent.some(t=>t.test==='blood'&&(t.findings??[]).some(id=>['aml','all'].includes(id))))return '先做血常规，发现近期造血异常后再进一步检查。';
 return null;
}
export function bodyReadings(body:Body){
 const severity=(id:DiseaseId)=>body.conditions.find(c=>c.id===id)?.severity??0;
 const sugar=severity('diabetes'),marrow=Math.max(severity('aml'),severity('all'));
 return {glucose:Math.round((sugar>=12?7.1+sugar*.02:4.8+(100-body.internal.metabolic)*.012+sugar*.08)*10)/10,a1c:Math.round((sugar>=12?6.5+sugar*.01:5.1+sugar*.045)*10)/10,systolic:Math.round(110+(100-body.internal.vascular)*.7+body.habits.strain*.3),diastolic:Math.round(70+(100-body.internal.vascular)*.3),hemoglobin:Math.round(140-marrow*.8),leukocytes:Math.round((6+marrow*.35)*10)/10,platelets:Math.round(220-marrow*2),egfr:Math.round(body.internal.renal*1.1),oxygen:Math.round(90+body.internal.respiratory*.09),fatigue:Math.round(body.habits.strain)};
}
export function bodyPhase(body:Body){const v=Math.min(...Object.values(body.internal));return body.emergency||v<20?'危急':v<45?'失代偿':v<70||body.habits.strain>65?'负荷升高':'代偿稳定';}
export function examine(g:GameState,test:string):{body:Body;text:string}{
 const body=structuredClone(g.life.body),messages:string[]=[],findings:DiseaseId[]=[],confirmed:DiseaseId[]=[];
 for(const c of body.conditions){
  if(!DISEASES[c.id].tests.includes(test)||c.severity<12)continue;findings.push(c.id);
  const cancer=c.id.includes('Cancer'),leukemia=['aml','all'].includes(c.id);
  if(cancer&&test==='scan')messages.push('影像发现待查病灶，需要专科评估与病理确认');
  else if(leukemia&&test==='blood')messages.push('发现造血异常，建议进一步骨髓与分型检查');
  else if(c.id==='scoliosis'&&test==='posture')messages.push('脊柱评估发现异常线索，需要影像进一步确认');
  else if(c.id==='diabetes'&&test==='glucose'&&!body.tests.some(t=>t.test==='glucose'&&t.week!==g.life.weeks&&g.life.weeks-t.week<=13&&(t.findings??[]).includes('diabetes')))messages.push('血糖异常，需在不同周复查确认，单次异常尚未确诊');
  else {c.discovered=true;confirmed.push(c.id);if(c.stage!=='stable')c.stage=c.severity>=66?'progressing':'diagnosed';messages.push(DISEASES[c.id].name+'：已确认，安排治疗与复查');}
 }
 const text=messages.length?[...new Set(messages)].join('；'):'本次检查未发现相应异常。一次阴性结果不能永久排除疾病，持续症状仍需复诊。';
 const all=bodyReadings(body),keys=test==='glucose'?['glucose','a1c']:test==='blood'?['hemoglobin','leukocytes','platelets']:test==='cardio'?['systolic','diastolic','oxygen']:test==='echo'?['oxygen']:test==='scan'?['egfr']:[];
 body.tests.unshift({week:g.life.weeks,test,text,findings,confirmed,readings:Object.fromEntries(keys.map(k=>[k,all[k as keyof typeof all]]))});body.tests=body.tests.slice(0,60);
 return {body,text};
}
