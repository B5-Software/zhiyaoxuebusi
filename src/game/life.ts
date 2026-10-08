import { advanceChild, childProfile } from './lifeChildren';
import { CHARACTERS, ROMANCE_IDS, UNIVERSITIES } from './data';
import { ASSETS, DISEASES, JOBS, LIFE_ACTIONS, LIFE_EVENTS, LIFE_REGIONS, MEDICAL_TESTS } from './lifeData';
import { advanceBody, createBody, examine, lifeAge, limit, medicalLock, recordHabit, roll } from './lifeHealth';
import { createFinance, portfolioValue, positionEquity, stepMarket, swapQuote } from './lifeFinance';
import type { AtlasId, DiseaseId, LifeState } from './lifeTypes';
import type { GameState, RomanceId } from './types';
export { lifeAge } from './lifeHealth';
export type LifeResult = { game: GameState; message: string; error?: string };
const fail = (g: GameState, error: string): LifeResult => ({ game: g, message: '', error });
const cents = (n: number) => Math.round(n * 100) / 100;
const copy = (g: GameState) => ({ ...structuredClone(g), updatedAt: new Date().toISOString() });
export function createLife(): LifeState {
  return { schema: 2, originWeek: 0, active: false, stage: 'university', atlas: 'school', region: 'college-study', baseAge: 18, weeks: 0, actions: 0, used: [], generation: 1,
    education: { enrolled: false, school: '', major: '', prestige: 0, credits: 0, gpa: 2.5, degree: false, entered: 0 }, skills: { technical: 10, communication: 10, practical: 10 }, work: { job: null, experience: 0, hours: 0, missed: 0, lastApplication: -1, retired: false, partTime: false, wageFactor: 1, delayed:false, arrearsWeeks:0, arrears: 0, claimDue: -1, pensionWeeks: 0, paidWeeks: 0 },
    economy: { debt: 0, income: 0, expenses: 0, rent: 'dorm', insurance: 'none', insuredSince: -1, costIndex: 1, rentIndex: 1, shortfall: 0, aidDue: -1, aidCooldown: -52, deductibleYear: -1, deductibleSpent: 0, excluded: [], ledger: [] },
    family: { spouse: null, proposed: false, affection: 50, partnerConsent: false, pregnancy: null, children: [], lastCare: -1, following: false, marriedWeek: -1, partnerJob: null, partnerWorking: true, partnerWorkWeeks:0,partnerRetired:false, careShare: .5, coParent: false, prenatal: [] }, body: createBody(), finance: createFinance(), claims:[],
    pending: null, seen: [], eventWeeks:{}, memories: [], game: null, scores: {}, tasks: [], death: null, ancestors: [] };
}
export function lifeBusy(g: GameState): string | null { return !g.life.active ? '先完成高考与志愿，开启下一段人生。' : g.life.death ? '这段人生已结束，先结算或选择下一代。' : g.life.body.emergency ? '正在发生急症，请立即救治。' : g.life.pending ? '先完成眼前的选择。' : g.life.game ? '先完成或退出当前小游戏。' : null; }
export function actionLock(g: GameState, action: string): string | null {
  const busy = lifeBusy(g); if (busy) return busy;
  const a = LIFE_ACTIONS[action]; if (!a) return '没有这个行动。';
  if (g.life.actions >= 3) return '本周行动已用完，进入下一周后再来。';
  if (a.price > g.stats.money) return '可用现金不足。休息和运动可以免费进行。';
  if (g.stats.energy + a.energy < 0 && action !== 'work') return '体力不足，先休息。';
  if (['course', 'work', 'date', 'care'].includes(action) && g.life.used.includes(action)) return '这项行动本周已经完成。';
  if (action === 'course' && (!g.life.education.enrolled || g.life.education.degree)) return '当前没有在读课程。';
  if (action === 'work' && (!g.life.work.job || g.life.work.retired)) return '先到人才市场找到工作。';
  if (action === 'work' && g.stats.energy < (JOBS.find(j => j.id === g.life.work.job)?.cost ?? 28)*(g.life.work.partTime?.55:1)) return '体力不足以完成整周排班，先休息。';
  if (action === 'date' && !lifePartner(g)) return '先确认双方的交往关系。';
  return null;
}
function note(g: GameState, title: string, text: string) { g.life.memories.unshift({ week: g.life.weeks, title, text }); g.life.memories = g.life.memories.slice(0, 180); }
function cash(g: GameState, amount: number, label: string, credit = false) {
  amount = cents(amount);
  if (amount < 0 && g.stats.money + amount < 0) {
    if (!credit) return false;
    g.life.economy.debt = cents(g.life.economy.debt - (g.stats.money + amount)); g.stats.money = 0;
  } else g.stats.money = cents(limit(g.stats.money + amount, 0, 1e10));
  if (amount > 0) g.life.economy.income = cents(g.life.economy.income + amount); else g.life.economy.expenses = cents(g.life.economy.expenses - amount);
  g.life.economy.ledger.unshift({ week: g.life.weeks, label, amount }); g.life.economy.ledger = g.life.economy.ledger.slice(0, 160); return true;
}
export function startLife(g: GameState): LifeResult {
  if (!g.started || g.phase !== 'ending' || g.pendingEvent || g.romance.active || g.graduate.pending) return fail(g, '先完成高中故事与眼前的选择。');
  if (g.life.active) return { game: g, message: '下一段人生已经开始。' };
  const next = copy(g), l = next.life, school = UNIVERSITIES.find(u => u.id === g.admittedId);
  l.active = true; l.baseAge = g.graduate.unlocked ? Math.max(18 + g.week / 52, 20 + g.graduate.month / 12) : 18 + g.week / 52;l.originWeek+=Math.max(g.week,Math.round((l.baseAge-18)*52)); l.stage = school ? 'university' : 'society'; l.atlas = l.stage; l.region = school ? 'college-study' : 'recruitment';
  l.education = { enrolled: !!school, school: school?.name ?? '未进入本科', major: g.admittedMajor ?? '自主职业路径', prestige: school?.type === '985' ? 90 : school?.type === '211' ? 75 : school ? 50 : 0, credits: 0, gpa: 2.5, degree: false, entered: 0 };
  l.economy.rent = school ? 'dorm' : 'shared'; l.pending = 'welcome';
  l.skills.technical = limit(Object.values(g.subjects).reduce((a, b) => a + b, 0) / 30); l.skills.communication = limit(g.stats.autonomy / 3 + g.counts.social); l.skills.practical = limit(g.counts.explore + g.counts.exercise);
  l.family.affection = g.social.partner ? g.social.bonds[g.social.partner].affection : g.graduate.partner ? g.graduate.affection : 50;
  cash(next, 2500, '毕业后的第一笔生活储备'); note(next, '围墙之外', '高中经历与身体习惯被带到下一段人生；这笔有限的储备不是稳定收入。');
  return { game: next, message: '大学与社会地图已开放，传送免费，时间按周推进。' };
}
export function teleportLife(g: GameState, atlas: AtlasId, region?: string): LifeResult {
  if (!g.life.active || g.life.death) return fail(g, '先开启下一段人生。');
  if (lifeAge(g) < 18 && atlas !== 'school') return fail(g, '下一代完成高中阶段后开放大学与社会。');
  if (!['school', 'university', 'society'].includes(atlas)) return fail(g, '地图不存在。');
  if (region && !LIFE_REGIONS.some(r => r.id === region && r.atlas === atlas)) return fail(g, '这个区域不属于当前地图。');
  const n = copy(g); n.life.atlas = atlas; if (region) n.life.region = region;
  if (atlas !== 'school' && !LIFE_REGIONS.some(r => r.id === n.life.region && r.atlas === atlas)) n.life.region = LIFE_REGIONS.find(r => r.atlas === atlas)!.id;
  return { game: n, message: '已传送；年龄与行动次数保持当前进度。' };
}
export function lifeAction(g: GameState, id: string): LifeResult {
  const lock = actionLock(g, id); if (lock) return fail(g, lock);
  const n = copy(g), l = n.life, a = LIFE_ACTIONS[id]; l.actions++; l.used.push(id); cash(n, -a.price, a.name);
  const job = JOBS.find(j => j.id === l.work.job);
  n.stats.energy = limit(n.stats.energy + (id === 'work' ? -(job?.cost ?? 28)*(l.work.partTime?.55:1) : a.energy)); n.stats.stress = limit(n.stats.stress + (id === 'work' ? (job?.stress ?? 14)*(l.work.partTime?.55:1) : a.stress)); n.stats.mood = limit(n.stats.mood + a.mood);
  l.body = recordHabit(l.body, id);
  if (id === 'course') { l.education.credits++; l.education.gpa = Math.min(4, l.education.gpa + .003); l.skills.technical = limit(l.skills.technical + .5); }
  if (id === 'skill') { l.skills.technical = limit(l.skills.technical + 2); l.skills.practical = limit(l.skills.practical + 2); }
  if (id === 'social') l.skills.communication = limit(l.skills.communication + 2);
  if (id === 'work') { l.work.experience++; l.work.hours += l.work.partTime ? Math.min(20, job?.hours ?? 20) : job?.hours ?? 0; }
  if (id === 'date') { l.family.affection = limit(l.family.affection + 7); const id=lifePartner(n); if(id && id!=='teacher')n.social.bonds[id].affection=limit(n.social.bonds[id].affection+3); }
  if (id === 'care') { l.family.lastCare = l.weeks; l.family.affection = limit(l.family.affection + 5); l.family.children.forEach(c => { c.care = limit(c.care + 8); c.education = limit(c.education + .3); }); }
  note(n, a.name, a.hint); return { game: n, message: `${a.name}完成，本周剩余 ${3 - l.actions} 次行动。` };
}
export function advanceLife(g: GameState): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy);
  const n = copy(g), l = n.life, j = JOBS.find(job => job.id === l.work.job), age = lifeAge(g);
  const upcoming=l.weeks+1;const eventSeed=(n.seed*16807)%2147483647;
  let nextEvent:string|null=null;
  if(upcoming%4===0){const eligible=LIFE_EVENTS.filter(e=>e.id!=='welcome'&&e.id!=='generation-welcome'&&(e.stage==='any'||e.stage===l.stage)&&(e.id!=='retirement'||l.work.retired)&&(!['overtime','salary-delay','layoff','burnout'].includes(e.id)||!!l.work.job)&&(e.id!=='family-labor'||l.family.children.length>0)&&(e.id!=='delivery-clock'||l.work.job==='delivery')&&(e.id!=='bill'||l.economy.debt>0)&&(e.id!=='pregnancy-cost'||!!l.family.pregnancy)&&(e.id!=='child-school'||l.family.children.some(c=>(l.weeks-c.bornWeek)/52>=6))&&(e.id!=='review-wait'||l.body.conditions.some(c=>c.discovered)));
   const fresh=eligible.filter(e=>!l.seen.includes(e.id)),cooled=eligible.filter(e=>upcoming-(l.eventWeeks[e.id]??-52)>=52);const pool=fresh.length?fresh:cooled;if(pool.length)nextEvent=pool[Math.floor(roll(eventSeed,upcoming)*pool.length)].id;
  }
  if(nextEvent==='salary-delay')l.work.delayed=true;
  l.economy.shortfall=0;for(const claim of l.claims.filter(c=>c.due<=l.weeks+1)){const repay=Math.min(l.economy.debt,claim.amount);l.economy.debt=cents(l.economy.debt-repay);if(claim.amount>repay)cash(n,claim.amount-repay,claim.kind==='tuition'?'助学补贴审核到账':'票据申诉退款');note(n,'办理回执',`${claim.kind==='tuition'?'助学':'医疗票据'}审核通过 ¥${claim.amount}，先核减欠款 ¥${repay}。`);}l.claims=l.claims.filter(c=>c.due>l.weeks+1);
  if(l.work.claimDue>=0&&l.weeks+1>=l.work.claimDue){cash(n,l.work.arrears,'欠薪追索到账');l.work.paidWeeks+=l.work.arrearsWeeks;l.work.pensionWeeks+=l.work.arrearsWeeks;l.work.arrearsWeeks=0;l.work.delayed=false;l.work.arrears=0;l.work.claimDue=-1;note(n,'追索回执','此前被扣留的工资到账，等待的生活成本没有退回。');}
  if(l.economy.aidDue>=0&&l.weeks+1>=l.economy.aidDue){const aid=Math.min(1200,l.economy.debt);l.economy.debt=cents(l.economy.debt-aid);l.economy.aidDue=-1;note(n,'救助审核结果',`核减困难生活欠款 ¥${aid}。救助没有变成额外现金。`);}
  if (j && l.used.includes('work')) { const wage=cents(j.wage*l.work.wageFactor*(l.work.partTime?20/j.hours:1)); if(l.work.delayed){l.work.arrears=cents(l.work.arrears+wage);l.work.arrearsWeeks++;note(n,'工资仍被拖延',`本周 ¥${wage} 记入应收欠薪。`);}else cash(n,wage, `${j.name}${l.work.partTime?'兼职':''}周工资`); if(!l.work.delayed){l.work.paidWeeks++;l.work.pensionWeeks++;} l.work.missed = 0; }
  else if (j && !l.work.retired) { l.work.missed++; if (l.work.missed >= 3) { note(n, '排班中断', '连续三周未完成排班，合同结束。身体与生活没有因此停止。'); l.work.job = null; } }
  if (l.education.enrolled && !l.education.degree && (l.stage==='school'||l.weeks-(l.education.entered??0)<208)) cash(n,l.stage==='school'?200:280,'限期学生生活支持 / 助学补给');
  if (l.work.retired) cash(n,l.work.pensionWeeks>=780?Math.min(650,200+l.work.pensionWeeks*.12):90,l.work.pensionWeeks>=780?'按缴费记录模拟退休收入':'缴费不足 / 老年基本补助');
  if(l.family.spouse){const pj=JOBS.find(j=>j.id===l.family.partnerJob);if(age+(l.family.spouse==='teacher'?17:0)>=65)l.family.partnerRetired=true;if(l.family.partnerRetired)cash(n,l.family.partnerWorkWeeks>=780?Math.min(650,200+l.family.partnerWorkWeeks*.12):90,'伴侣退休 / 按劳动记录结算');else if(l.family.partnerWorking&&pj){cash(n,cents(pj.wage*(1-l.family.careShare*.6)),'伴侣排班 / 照护后的共同收入');l.family.partnerWorkWeeks++;}}
  const housing = l.economy.rent === 'dorm' ? 35 : l.economy.rent === 'shared' ? 160 : 360;
  const living=cents(95*l.economy.costIndex+housing*l.economy.rentIndex+(l.education.enrolled&&!l.education.degree&&l.stage!=='school'?110:0)); l.economy.shortfall=Math.max(0,living-n.stats.money); cash(n,-living,'饮食 / 住房 / 学费周均',true); if(l.economy.shortfall){l.body.habits.diet=limit(l.body.habits.diet-1);n.stats.stress=limit(n.stats.stress+5);note(n,'账单与餐桌','生活现金不足，必要账单转为欠款，饮食与压力开始受到影响。可申请困难救助。');}
  if (l.family.spouse) { cash(n, -140*l.economy.costIndex, '共同生活开支', true); l.family.affection = limit(l.family.affection - (l.used.includes('date') || l.used.includes('care') ? 0 : .5)); }
  for (const child of l.family.children) { const childAge=(l.weeks-child.bornWeek)/52, p=childProfile(child,l.weeks);cash(n,-(childAge<6?180:childAge<18?130:p.enrolled&&!p.degree?170:40)*l.economy.costIndex,`${child.name}的照护与教育`,true);advanceChild(child,l.weeks+1,l.family.spouse?l.family.careShare:l.family.coParent?.25:0,l.family.lastCare===l.weeks,l.economy.shortfall); }
  if(l.family.coParent)cash(n,-100,'分开后的共同抚养责任',true);
  if(l.family.pregnancy){cash(n,-70,'孕育期照护',true);const elapsed=l.weeks-(l.family.pregnancy.due-40);if([12,24,36].some(w=>elapsed>=w&&!l.family.prenatal.some(p=>p-(l.family.pregnancy!.due-40)>=w))){note(n,'孕育检查提醒','本阶段的共同照护与产前评估尚未安排，可到医院预约。');}}
  if (l.economy.insurance !== 'none') cash(n, l.economy.insurance === 'basic' ? -18 : -75, '保险周均支出', true);
  for(const c of l.body.conditions.filter(c=>c.care)){const oncology=c.id.includes('Cancer')||['aml','all'].includes(c.id);if(oncology&&(c.sessions??1)<6&&l.weeks>c.treated&&(l.weeks-c.treated)%4===0){c.sessions=(c.sessions??1)+1;if(c.sessions>=6){c.remission=l.weeks+52;note(n,'疗程结束，继续随访',DISEASES[c.id].name+'完成六阶段疗程，缓解不是永久治愈。');}}medicalBill(n,oncology&&(c.sessions??1)<6?240:65,'持续治疗 / 用药',c.id);if(c.review!==undefined&&l.weeks>=c.review)note(n,'复查到期',`${DISEASES[c.id].name}需要安排复查，长期逾期会影响稳定状态。`);}
  if (l.economy.debt > 0) { l.economy.debt = cents(l.economy.debt * 1.0008); const pay = Math.min(l.economy.debt, Math.max(0, n.stats.money - 500) * .08); if (pay > 0) { cash(n, -pay, '债务分期'); l.economy.debt = cents(l.economy.debt - pay); } }
  const market = stepMarket(l.finance, n.seed, l.weeks + 1); l.finance = market.finance; const announcement=l.finance.news.find(n=>n.week===l.weeks+1);if(announcement){l.economy.rentIndex=Math.max(.7,Math.min(3,l.economy.rentIndex*(1+announcement.rent)));l.economy.costIndex=Math.min(2,l.economy.costIndex*1.0004);note(n,'本周新闻',announcement.title); } if (market.cash) cash(n, market.cash, '合约到期结算'); market.messages.forEach(text => note(n, '市场结算', text));
  l.weeks++; l.actions = 0; l.used = []; l.game = null;
  n.seed = (n.seed * 16807) % 2147483647; n.stats.mood = limit(n.stats.mood + 2);
  const health = advanceBody(n); l.body = health.body; n.stats.health = Math.round(Object.values(l.body.internal).reduce((a, b) => a + b, 0) / 7);
  n.stats.energy=limit(n.stats.energy+22);n.stats.stress=limit(n.stats.stress-4);
  if(g.graduate.unlocked){const month=Math.max(0,Math.floor((lifeAge(n)-20)*12));if(month!==n.graduate.month)n.graduate.actions=0;n.graduate.month=month;}
  if (health.fatal) die(n, `病死 · ${health.fatal}`);
  if (!l.death && (age > 85 && roll(n.seed, l.weeks + 133) < Math.min(.05, (age - 85) ** 2 * .00004) || age >= 110)) die(n, '寿终 · 时间走到了最后');
  if (!l.death && j && roll(n.seed, l.weeks + 577) < (j.id === 'delivery' ? .00009 : .000018)) die(n, '意外身故 · 通勤事故');
  if (!l.death && l.education.enrolled && !l.education.degree && l.stage!=='school' && l.weeks-(l.education.entered??0)>=208 && l.education.credits >= 160) { l.education.degree = true; l.stage = 'society'; if (l.economy.rent === 'dorm') l.economy.rent = 'shared'; note(n, '大学毕业', '你得到了学位。招聘表里的学校标签、家庭资源与工作经历仍会影响机会。'); }
  if(!l.death&&l.stage==='school'&&lifeAge(n)>=18){l.pending='school-transition';note(n,'高中之后','自己的学习记录与选择，决定下一段人生。');}
  if (!l.death && l.family.pregnancy && l.weeks >= l.family.pregnancy.due) {
    const p = l.family.pregnancy; medicalBill(n, 8500, '分娩与住院'); l.family.children.push({ id: `child-${l.generation}-${l.weeks}`, name: p.name, gender: p.gender, bornWeek: l.weeks, education: 10, care: 70 }); l.family.pregnancy = null; note(n, '一个新的名字', `${p.name}来到了家里。照护、睡眠和费用需要共同安排。`);
  }
  if(!l.death&&!l.body.emergency&&!l.pending&&nextEvent)l.pending=nextEvent;
  return { game: n, message: l.death ? '这段人生走到了终章。' : l.body.emergency ? '出现急症，已进入医院急救提示。' : `第 ${l.weeks + 1} 周，${lifeAge(n).toFixed(1)} 岁。工资、账单、市场与身体状态已结算。` };
}
export function lifePartner(g: GameState) { return g.life.family.spouse ?? g.social.partner ?? g.graduate.partner; }
export function advanceLifePlan(g: GameState, weeks: number): LifeResult {
  if (![4, 13, 52].includes(weeks)) return fail(g, '请选择 4、13 或 52 周计划。');
  let n = g, completed = 0;
  for (let i = 0; i < weeks; i++) {
    if (lifeBusy(n)) break;
    const student=n.life.education.enrolled&&!n.life.education.degree,employed=!!n.life.work.job&&!n.life.work.retired;const tasks=[student?'course':employed?'work':'skill',student&&employed?'work':n.life.family.children.length?'care':'exercise','rest'];
    for (const action of tasks) { if (n.life.actions >= 3) break; const chosen = actionLock(n, action) ? 'rest' : action; const r = lifeAction(n, chosen); if (!r.error) n = r.game; }
    const result = advanceLife(n); if (result.error) break; n = result.game; completed++;
    if (n.life.pending || n.life.body.emergency || n.life.death || n.life.body.notices.length) break;
  }
  return { game: n, message: completed ? `按计划走过 ${completed} 周${completed < weeks ? '，遇到新故事或身体提醒，已停下等待你的选择' : ''}。` : '先处理当前选择，再继续长期计划。' };
}
export function partnerGender(id: RomanceId | 'teacher') { return ['zhou', 'xinghe', 'teacher'].includes(id) ? 'male' : 'female'; }
export function marriageLock(g: GameState): string | null {
  const id = lifePartner(g); if (!id) return '先双方确认交往关系。';
  if (g.life.family.spouse) return '你们已经登记结婚。';
  const age = lifeAge(g), otherAge = age + (id === 'teacher' ? 17 : 0);
  if (age < (g.gender === 'male' ? 22 : 20) || otherAge < (partnerGender(id) === 'male' ? 22 : 20)) return '按游戏采用的婚龄：男方满 22 岁、女方满 20 岁后可以登记。';
  if (g.life.family.affection < 70) return '先安排相处与沟通，彼此亲密达到 70。';
  return null;
}
export function familyOperation(g: GameState, operation: string, target?: RomanceId): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy);
  const n = copy(g), l = n.life, id = lifePartner(g);
  if(lifeAge(g)<18&&operation!=='talk')return fail(g,'下一代成年后开放恋爱与家庭安排。');
  if (operation === 'talk' && target && ROMANCE_IDS.includes(target)) {
    if (l.actions >= 3) return fail(g, '本周行动已用完。'); l.actions++; l.used.push('talk'); const b = n.social.bonds[target]; b.trust = limit(b.trust + 5); b.affection = limit(b.affection + 4); b.understanding = limit(b.understanding + 4); l.family.affection = limit(l.family.affection + (target === id ? 4 : 0)); note(n, '毕业后的相处', `与${CHARACTERS[target].name}认真聊了聊近况。`);
  } else if (operation === 'confess' && target && ROMANCE_IDS.includes(target)) {
    if (id) return fail(g, '先处理当前交往关系。'); if (n.social.bonds[target].trust < 60 || n.social.bonds[target].affection < 45) return fail(g, '先认真相处：信任 60、心动 45。'); l.pending = `confess:${target}`;
  } else if (operation === 'propose') { const lock = marriageLock(g); if (lock) return fail(g, lock); l.pending = 'proposal';
  } else if (operation === 'marry') {
    const lock = marriageLock(g); if (lock) return fail(g, lock); if (!l.family.proposed || !l.family.partnerConsent) return fail(g, '先确认双方愿意结婚。'); if (!cash(n, -480, '登记与共同庆祝')) return fail(g, '登记与简单庆祝需要 480 元。'); l.family.spouse = id;l.family.marriedWeek=l.weeks;l.family.partnerWorkWeeks=0;l.family.partnerRetired=false;l.family.partnerJob=id==='teacher'?'tutor':'shop';l.family.coParent=false; note(n, '把日子放在一起', '登记之后，双方仍保留边界、工作与生活选择。');
  } else if (operation === 'baby') {
    if (!l.family.spouse || l.family.pregnancy) return fail(g, '先组成家庭，当前没有正在进行的孕育计划。'); if (l.family.children.length >= 4) return fail(g, '当前家庭已需要很多照护，先照顾好已有的孩子。'); if (lifeAge(g) >= 48) return fail(g, '当前阶段不再开启孕育计划。'); if (g.gender === partnerGender(l.family.spouse)) return fail(g, '当前伴侣组合可使用共同养育计划。'); l.pending = 'baby-plan';
  } else if (operation === 'adopt') {
    if (!l.family.spouse || l.family.children.length >= 4) return fail(g, '先组成家庭并留出照护能力。'); l.pending = 'care-plan';
  } else if (operation === 'breakup') { if (!id) return fail(g, '当前没有交往关系。'); l.pending = 'separate';
  } else if (operation==='partner-work') { if(!l.family.spouse)return fail(g,'先组成共同家庭。');l.family.partnerWorking=!l.family.partnerWorking;
  } else if(operation==='care-share') {if(!l.family.spouse)return fail(g,'先组成共同家庭。');l.family.careShare=l.family.careShare<.75?.85:.35;
  } else if (operation === 'follow') { if (!id) return fail(g, '先确认交往关系。'); l.family.following = !l.family.following;
  } else return fail(g, '没有这个家庭操作。');
  return { game: n, message: '关系与家庭记录已更新。' };
}
export function chooseLife(g: GameState, index: number): LifeResult {
  if (!g.life.active || g.life.death || !g.life.pending || ![0, 1].includes(index)) return fail(g, '没有待完成的选择。');
  const n = copy(g), l = n.life, pending = l.pending!; l.pending = null;
  if(pending==='school-transition'){if(index===0&&l.education.credits<120)return fail(g,'高中学习不足120学分，本次可先走职业路径；学业记录不会被凭空补齐。');l.stage=index===0?'university':'society';l.atlas=l.stage;l.region=index===0?'college-study':'recruitment';l.education.enrolled=index===0;l.education.credits=0;l.education.entered=l.weeks;l.education.school=index===0?'新世代大学':'自主职业路径';l.economy.rent=index===0?'dorm':'shared';}
  else if (pending.startsWith('confess:')) {
    const id = pending.slice(8) as RomanceId; if (!ROMANCE_IDS.includes(id) || lifePartner(g)) return fail(g, '当前不能确认交往。'); if (index === 0) { n.social.partner = id; n.social.bonds[id].route = 'dating'; n.romance.bonds[id].status = 'normal'; n.romance.bonds[id].sinceWeek = n.week; n.romance.bonds[id].episode = Math.min(40, n.romance.bonds[id].episode + 1); l.family.affection = n.social.bonds[id].affection; note(n, '双方答应的心意', `${CHARACTERS[id].name}愿意与你交往。彼此确认之后，新的约会与家庭入口才开放。`); }
  } else if (pending === 'proposal') { l.family.proposed = index === 0; l.family.partnerConsent = index === 0; note(n, '共同的决定', index === 0 ? '双方认真讨论了住房、收入和未来，愿意结婚。' : '先不结婚。心意不需要靠催促来证明。');
  } else if (pending === 'baby-plan' || pending === 'care-plan') {
    if (index === 0) { if (!l.family.spouse) return fail(g, '当前没有共同家庭。'); if (pending === 'baby-plan') { l.family.prenatal=[];l.family.pregnancy = { due: l.weeks + 40, gender: roll(n.seed, l.weeks + 93) > .5 ? 'male' : 'female', name: `予禾${l.family.children.length ? l.family.children.length + 1 : ''}` }; note(n, '共同孕育计划', '双方同意开启孕育计划，需要 40 周照护。私人过程略过。'); } else { medicalBill(n, 6500, '虚构共同养育计划费用'); l.family.children.push({ id: `child-${l.generation}-${l.weeks}-care`, name: `予禾${l.family.children.length + 1}`, gender: roll(n.seed, l.weeks) > .5 ? 'male' : 'female', bornWeek: l.weeks - 156, care: 70, education: 15 }); note(n, '共同照护', '加入的是虚构养育玩法，不对应现实收养办理条件。'); } }
  } else if (pending === 'separate') {
    if (index === 0) { const old = lifePartner(g); l.family.coParent=!!(l.family.children.length||l.family.pregnancy);l.family.spouse = null; l.family.partnerJob=null;l.family.proposed = false; l.family.partnerConsent = false; l.family.following = false; n.social.partner = null; n.romance.escort = null; n.romance.visitor = null; n.romance.attention.queued = null; if (old && old !== 'teacher') { n.social.bonds[old].route = 'friendship'; n.romance.bonds[old].status = 'broken'; } if (old === 'teacher') { n.graduate.partner = null; n.graduate.status = 'broken'; n.graduate.following = false; } note(n, '各自继续', '关系结束，已有孩子的照护与开支继续被承担。'); }
  } else {
    const e = LIFE_EVENTS.find(e => e.id === pending); if (!e) return fail(g, '没有这个事件。'); if(!l.seen.includes(e.id))l.seen.push(e.id);l.eventWeeks[e.id]=l.weeks; note(n, e.title, `${e.text} 你选择：${e.choices[index]}`); n.stats.stress = limit(n.stats.stress + (index === 0 ? -4 : 3));
    if(e.id==='tuition'&&index===0&&!l.claims.some(c=>c.kind==='tuition'))l.claims.push({kind:'tuition',due:l.weeks+4,amount:900});
    if (e.id === 'rent' && index === 1) cash(n, -180, '房租差额', true);
    if (e.id === 'layoff') {const j=JOBS.find(j=>j.id===l.work.job);cash(n,cents((j?.wage??0)*Math.min(4,.5+l.work.paidWeeks/52)),'按已领薪记录模拟离职结算'); l.work.job = null; }
    if(e.id==='salary-delay'){l.work.delayed=true;l.work.claimDue=index===0?l.weeks+3:-1;n.stats.stress=limit(n.stats.stress+6);note(n,'欠薪追索',index===0?'三周后调解结算；此前工资仍属应收，不是现金。':'欠薪继续记入应收，可以到人才市场登记追索。');}
    if(e.id==='insurance-wording'&&index===0&&l.economy.insurance!=='none'&&!l.claims.some(c=>c.kind==='insurance')){const paid=l.economy.ledger.filter(t=>l.weeks-t.week<=13&&t.amount<0&&t.label.includes('报销')).reduce((sum,t)=>sum-t.amount,0);if(paid>0)l.claims.push({kind:'insurance',due:l.weeks+4,amount:cents(Math.min(2000,paid*.1))});note(n,'票据审核申请',paid>0?'四周后核减模拟账单差额；已有欠款优先抵扣。':'暂无近期可审核医疗票据，条款已整理，未产生款项。');}
    if(e.id==='overtime'){if(index===1){cash(n,120,'额外工时补贴');n.stats.energy=limit(n.stats.energy-18);l.body.habits.sleep=limit(l.body.habits.sleep-6);l.body.habits.strain=limit(l.body.habits.strain+8);}else l.skills.communication=limit(l.skills.communication+1);}
    if(e.id==='gpa'){l.education.gpa=Math.min(4,l.education.gpa+(index===0?.04:.015));if(index===0)n.stats.energy=limit(n.stats.energy-10);}
    if(e.id==='authorship'||e.id==='school-filter'){l.skills.practical=limit(l.skills.practical+(index===0?3:1));l.skills.communication=limit(l.skills.communication+2);}
    if(e.id==='internship'){if(index===0)l.skills.communication=limit(l.skills.communication+3);else{l.work.hours+=20;l.skills.practical=limit(l.skills.practical+4);n.stats.energy=limit(n.stats.energy-15);note(n,'无偿试岗','20小时未领取报酬，技能增长并没有替代工资。');}}
    if(e.id==='family-labor'){l.family.careShare=index===0?.75:.35;if(index===1)cash(n,-260,'临时托育',true);}
    if(e.id==='bill'&&index===0&&l.economy.aidDue<0&&l.weeks-l.economy.aidCooldown>=52){l.economy.aidDue=l.weeks+4;l.economy.aidCooldown=l.weeks;}
    if(e.id==='burnout'){if(index===0){n.stats.energy=limit(n.stats.energy+15);cash(n,-100,'休工恢复周开支',true);}else{cash(n,180,'带病加班补贴');l.body.habits.strain=limit(l.body.habits.strain+10);l.body.habits.sleep=limit(l.body.habits.sleep-5);}}
    if(e.id==='child-school'){cash(n,index===0?-300:-100,'孩子教育材料',true);l.family.children.forEach(c=>{c.education=limit(c.education+(index===0?2:.5));});}
    if(e.id==='pregnancy-cost'){medicalBill(n,index===0?800:380,'产前评估');l.family.prenatal.push(l.weeks);}
    if(e.id==='review-wait'){if(index===0)cash(n,-160,'复诊交通 / 误工',true);else l.body.habits.strain=limit(l.body.habits.strain+5);}
    if(e.id==='school-pressure'){if(index===0){l.education.credits+=1;l.body.habits.sleep=limit(l.body.habits.sleep-4);}else n.stats.mood=limit(n.stats.mood+7);}
    if (e.id === 'quiet') n.stats.mood = limit(n.stats.mood + 10);
  }
  return { game: n, message: '选择已记入人生手帐。' };
}
export function jobLock(g: GameState, id: string): string | null {
  const busy = lifeBusy(g); if (busy) return busy; const j = JOBS.find(j => j.id === id); if (!j) return '没有这个岗位。';
  if(lifeAge(g)<18)return '成年后开放全职招聘。';
  if (g.life.work.retired) return '当前已经选择退休。';
  if (g.life.actions >= 3) return '本周行动已用完。'; if (g.life.work.lastApplication === g.life.weeks) return '本周已投递一次，下周再试。';
  if (j.degree && !g.life.education.degree) return '岗位筛选要求本科学历。'; if (g.life.education.prestige < j.prestige) return '这家单位先按学校背景筛选。这并不代表你的能力。';
  if (g.life.skills.technical < j.skill) return `专业技能需 ${j.skill}。`;
  if (!g.life.used.includes('game:interview') || (g.life.scores.interview ?? 0) < j.interview) return `先完成本周互动面试，成绩需 ${j.interview}。`;
  return null;
}
export function applyJob(g: GameState, id: string): LifeResult {
  const lock = jobLock(g, id); if (lock) return fail(g, lock); const n = copy(g), j = JOBS.find(j => j.id === id)!; n.life.actions++; n.life.used.push('apply'); n.life.work.job = j.id; n.life.work.lastApplication = n.life.weeks; n.life.work.missed = 0;n.life.work.partTime=n.life.education.enrolled&&!n.life.education.degree;n.life.work.wageFactor=Math.max(.7,Math.min(1.4,1+n.life.finance.news.slice(0,6).reduce((v,n)=>v+n.wages,0))); note(n, '新的工牌', `${j.name}，每周 ${n.life.work.partTime?20:j.hours} 小时，完成排班后周薪 ¥${cents(j.wage*n.life.work.wageFactor*(n.life.work.partTime?20/j.hours:1))}。`); return { game: n, message: '已签订模拟工作合同，下次完成排班后领取工资。' };
}
function medicalBill(g: GameState, amount: number, label: string, disease?:DiseaseId) {
  const e = g.life.economy, year=Math.floor((g.life.originWeek+g.life.weeks)/52);if(e.deductibleYear!==year){e.deductibleYear=year;e.deductibleSpent=0;} const eligible = e.insurance === 'basic' || e.insurance === 'commercial' && g.life.weeks - e.insuredSince >= 13;
  const deductible=Math.min(amount,Math.max(0,500-e.deductibleSpent));const covered=eligible&&!(e.insurance==='commercial'&&disease&&e.excluded.includes(disease));if(covered)e.deductibleSpent+=deductible;const benefit=covered?Math.max(0,amount-deductible)*(e.insurance==='basic'?.55:.7):0;
  cash(g, -(amount - benefit), `${label}（总额 ${amount}，报销 ${cents(benefit)}）`, true);
}
export function medicalOperation(g: GameState, id: string): LifeResult {
  if (!g.life.active || g.life.death) return fail(g, '当前不能就医。');
  const n = copy(g), l = n.life;
  if (id === 'rescue') {
    const emergency = l.body.emergency; if (!emergency) return fail(g, '当前没有急症。'); const disease = DISEASES[emergency]; medicalBill(n, disease.treatment, '急救与住院',emergency); l.body.emergency = null; l.body.emergencyWeek = -1;
    const survived = roll(n.seed, l.weeks + 199) < (emergency === 'sudden' ? .78 : .94);
    if (survived) { l.body.conditions = l.body.conditions.map(c => c.id === emergency ? { ...c, stage: 'stable', severity: 35, treated: l.weeks, discovered: true, care:true, review:l.weeks+13, remission:l.weeks+52 } : c); n.stats.energy = Math.max(25, n.stats.energy); note(n, '急救之后', '治疗先于收费完成，剩余费用已进入账本，继续复查与康复。'); } else die(n, emergency === 'sudden' ? '猝死 · 抢救未能恢复' : `病死 · ${disease.name}`);
    return { game: n, message: survived ? '抢救成功，后续费用可分期。' : '尽力抢救之后，这段人生结束了。' };
  }
  const busy = lifeBusy(g); if (busy) return fail(g, busy);
  if (id.startsWith('insurance:')) {
    const policy = id.slice(10); if (!['none', 'basic', 'commercial'].includes(policy)) return fail(g, '没有这个保险方案。'); if (l.economy.insurance === policy) return fail(g, '当前已经使用这个方案。'); l.economy.excluded=policy==='commercial'?l.body.conditions.filter(c=>c.discovered).map(c=>c.id):[]; l.economy.insurance = policy as typeof l.economy.insurance; l.economy.insuredSince = l.weeks; note(n, '保障条款', '费用与报销比例为游戏参数；商业等待期 13 周。基础方案当周生效。');
  } else if(id==='prenatal'){if(!l.family.pregnancy)return fail(g,'当前没有孕育计划。');const elapsed=l.weeks-(l.family.pregnancy.due-40),due=[12,24,36].filter(w=>elapsed>=w&&!l.family.prenatal.some(p=>p-(l.family.pregnancy!.due-40)>=w));if(!due.length)return fail(g,'本阶段尚未到检查时间或已完成。');if(l.actions>=3)return fail(g,'本周行动已用完。');l.actions++;l.used.push('test:prenatal');l.family.prenatal.push(l.weeks);medicalBill(n,600,'产前评估');note(n,'产前评估完成','共同照护记录已更新，仍需按阶段复查。');
  } else if(id.startsWith('pause:')){const c=l.body.conditions.find(c=>c.id===id.slice(6));if(!c)return fail(g,'没有这项治疗。');c.care=!c.care;note(n,'持续治疗安排',c.care?'恢复用药与随访。':'暂停持续治疗，复发和进展风险将增加。');
  } else if (id.startsWith('treat:')) {
    const disease = id.slice(6) as DiseaseId, c = l.body.conditions.find(c => c.id === disease); if (!c || !c.discovered) return fail(g, '先完成诊断。'); if(c.stage==='stable'&&(c.review??Infinity)>l.weeks)return fail(g,'当前未到复查时间。');
    if (l.actions >= 3) return fail(g, '本周行动已用完，非急诊治疗安排到下周。'); l.actions++; l.used.push(`treat:${disease}`);
    const review=c.stage==='stable';medicalBill(n,review?380:DISEASES[disease].treatment,c.stage==='stable'?'专科复查':'专科治疗',disease); c.care=true;c.review=l.weeks+13;if(!review){c.sessions=1;c.remission=l.weeks+52;c.severity=Math.max(10,c.severity*.55);c.treated=l.weeks;}c.stage='stable'; note(n, '治疗与复查', `${DISEASES[disease].name}进入稳定治疗；一次治疗不是永久治愈保证。`);
  } else { const lock = medicalLock(g, id); if (lock) return fail(g, lock); if (l.actions >= 3) return fail(g, '本周行动已用完，非急诊检查安排到下周。'); const t = MEDICAL_TESTS.find(t => t.id === id)!; medicalBill(n, t.price, t.name); const check = examine(n, id); l.body = check.body; l.actions++; l.used.push(`test:${id}`); return { game: n, message: check.text }; }
  return { game: n, message: '医疗与保障记录已更新。' };
}
export function economicOperation(g: GameState, action: string, value?: string): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy); const n = copy(g), l = n.life;
  if (action === 'rent' && ['dorm', 'shared', 'apartment'].includes(value ?? '')) { if (value === 'dorm' && (!l.education.enrolled || l.education.degree)) return fail(g, '非在读学生不能继续租住学生宿舍。'); l.economy.rent = value as typeof l.economy.rent;
  } else if (action === 'repay') { const amount = Math.min(l.economy.debt, n.stats.money); if (!amount) return fail(g, '当前没有可偿还的欠款或现金。'); cash(n, -amount, '主动偿还债务'); l.economy.debt = cents(l.economy.debt - amount);
  } else if(action==='aid'){if(l.economy.debt<=0)return fail(g,'当前没有困难生活欠款。');if(l.economy.aidDue>=0||l.weeks-l.economy.aidCooldown<52)return fail(g,'救助正在审核或尚未到下一次申请期。');if(l.actions>=3)return fail(g,'本周行动已用完。');l.actions++;l.used.push('aid');l.economy.aidDue=l.weeks+4;l.economy.aidCooldown=l.weeks;note(n,'救助材料已提交','四周后审核，核减最多1200元必要生活欠款。');
  } else if(action==='claim'){if(!l.work.arrears)return fail(g,'当前没有应收欠薪。');if(l.work.claimDue>=0)return fail(g,'追索已经登记。');if(l.actions>=3)return fail(g,'本周行动已用完。');l.actions++;l.used.push('claim');l.work.claimDue=l.weeks+3;
  } else if (action === 'retire') { if (lifeAge(g) < 60) return fail(g, '模拟退休入口在 60 岁开放。'); l.work.retired = true; l.work.job = null;
  } else if (action === 'quit') { l.work.job = null; note(n, '离开工位', '你主动结束了这份工作。下一周不再领取这个岗位的工资。');
  } else return fail(g, '没有这个操作。'); return { game: n, message: '生活安排已更新。' };
}
export function trade(g: GameState, kind: string, asset: string, amount: number, leverage = 1, side: 'long' | 'short' = 'long'): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy);if(lifeAge(g)<18)return fail(g,'模拟交易在成年后开放。'); if (!ASSETS.some(a => a.id === asset) || !Number.isFinite(amount) || amount < .01 || Math.abs(cents(amount)-amount)>1e-8 || amount > 999999 || ![1, 2, 3, 5, 10].includes(leverage) || !['long', 'short'].includes(side)) return fail(g, '交易参数无效。');
  const n = copy(g), f = n.life.finance, price = f.prices[asset];
  if (kind === 'buy') { const fee = cents(Math.max(.01,amount*.001)); if (!cash(n, -(amount + fee), `${asset}现货买入（含手续费）`)) return fail(g, '现金不足以支付本金和手续费。'); f.holdings[asset] += amount / price;f.basis[asset]+=amount+fee; f.fees += fee;
  } else if (kind === 'sell') { const quantity = amount / price; if (quantity > f.holdings[asset] + 1e-9) return fail(g, '卖出金额超过持仓市值。'); const cost=f.basis[asset]*quantity/Math.max(1e-12,f.holdings[asset]);f.basis[asset]=Math.max(0,f.basis[asset]-cost);f.realized+=amount-cents(Math.max(.01,amount*.001))-cost;f.holdings[asset] = Math.max(0, f.holdings[asset] - quantity); const fee = amount * .001; cash(n, amount - fee, `${asset}现货卖出`); f.fees += fee;
  } else if (kind === 'perpetual' || kind === 'delivery') { if (!['BTC', 'ETH'].includes(asset)) return fail(g, '此合约仅支持模拟 BTC / ETH。'); if (f.positions.length >= 12) return fail(g, '同时最多持有 12 个逐仓仓位。'); const fee = cents(Math.max(.01,amount*leverage*.001)); if (!cash(n, -(amount + fee), `${asset}逐仓保证金与开仓费`)) return fail(g, '现金不足以支付保证金和手续费。'); f.fees += fee;f.realized-=fee; f.positions.push({ id: f.nextId++, asset, kind, side, entry: price, quantity: amount * leverage / price, margin: amount, leverage, expiry: n.life.weeks + 4, funding: 0 });
  } else if (kind === 'swap-buy') { const out = swapQuote(f, 'buy', amount); if (!cash(n, -amount, 'AMM 兑换 ETH')) return fail(g, '现金不足。'); f.pool.cash += amount; f.pool.eth -= out; f.holdings.ETH += out;f.basis.ETH+=amount; f.fees += amount * .003;
  } else if (kind === 'swap-sell') { const quantity = amount / price; if (quantity > f.holdings.ETH) return fail(g, 'ETH 持仓不足。'); const out = swapQuote(f, 'sell', quantity); f.pool.eth += quantity; f.pool.cash -= out; const cost=f.basis.ETH*quantity/Math.max(1e-12,f.holdings.ETH);f.basis.ETH=Math.max(0,f.basis.ETH-cost);f.realized+=out-cost;f.holdings.ETH -= quantity; cash(n, out, 'AMM 兑换现金'); f.fees += amount * .003;
  } else if (kind === 'lp-add') { const eth = amount * f.pool.eth / f.pool.cash; if (eth > f.holdings.ETH || !cash(n, -amount, 'LP 现金投入')) return fail(g, '按池比例同时需要足够的 ETH 和现金。'); const shares = amount / f.pool.cash * f.pool.supply,cost=f.basis.ETH*eth/Math.max(1e-12,f.holdings.ETH); f.basis.ETH-=cost;f.holdings.ETH -= eth; f.pool.cash += amount; f.pool.eth += eth; f.pool.supply += shares; f.pool.shares += shares; f.pool.deposited += amount + cost;
  } else return fail(g, '没有这个交易类型。');
  f.trades.unshift({week:n.life.weeks,asset,kind,amount,price,pnl:f.realized-g.life.finance.realized});f.trades=f.trades.slice(0,100);
  return { game: n, message: '模拟交易已记录。行情每周变动，持仓与保证金保存在本地。' };
}
export function closePosition(g: GameState, id: number): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy); const n = copy(g), f = n.life.finance, p = f.positions.find(p => p.id === id); if (!p) return fail(g, '没有这个仓位。'); const fee = cents(Math.max(.01,p.quantity*f.prices[p.asset]*.001)), payout = cents(Math.max(0,positionEquity(p,f.prices[p.asset])-fee)); f.realized += payout - p.margin; f.fees += fee; f.positions = f.positions.filter(p => p.id !== id);f.trades.unshift({week:n.life.weeks,asset:p.asset,kind:'平仓',amount:payout,price:f.prices[p.asset],pnl:payout-p.margin});f.trades=f.trades.slice(0,100); cash(n, payout, '合约平仓返还'); return { game: n, message: `逐仓平仓，返还 ¥${payout.toFixed(2)}。` };
}
export function removeLiquidity(g: GameState): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy); const n = copy(g), f = n.life.finance, p = f.pool; if (p.shares <= 0) return fail(g, '当前没有 LP 份额。'); const ratio = p.shares / p.supply, eth = p.eth * ratio, money = p.cash * ratio; f.holdings.ETH += eth;f.basis.ETH+=eth*f.prices.ETH;f.realized+=money+eth*f.prices.ETH-p.deposited;f.trades.unshift({week:n.life.weeks,asset:'ETH',kind:'撤回LP',amount:money+eth*f.prices.ETH,price:f.prices.ETH,pnl:money+eth*f.prices.ETH-p.deposited});f.trades=f.trades.slice(0,100); cash(n, money, 'LP 撤回现金'); p.eth -= eth; p.cash -= money; p.supply -= p.shares; p.shares = 0; p.deposited = 0; return { game: n, message: '流动性已撤回，ETH 与现金按当前池比例返回。' };
}
export function die(g: GameState, cause: string) { g.life.death = { cause, age: lifeAge(g), week: g.life.weeks, settled: false }; g.life.pending = null; g.life.game = null; g.life.body.emergency = null; note(g, '人生终章', cause); }
export function inheritLife(g:GameState,childId:string,fresh:GameState):LifeResult{
 const child=g.life.family.children.find(c=>c.id===childId);if(!g.life.death||!child)return fail(g,'选择一个孩子，才能继续下一代。');
 const currentAge=(g.life.weeks-child.bornWeek)/52,age=Math.max(15,currentAge),grown=structuredClone(child);for(let w=g.life.weeks;w<g.life.weeks+Math.max(0,Math.round((15-currentAge)*52));w++)advanceChild(grown,w+1,0,grown.care>=60,0);const p=childProfile(grown,g.life.weeks+Math.max(0,Math.round((15-currentAge)*52)));
 const net=Math.max(0,g.stats.money+portfolioValue(g.life.finance)-g.life.economy.debt),estate=net*(g.life.family.spouse?.5:1)/Math.max(1,g.life.family.children.length);
 const n=copy(fresh);n.started=true;n.name=child.name;n.nameIsCustom=true;n.gender=child.gender;n.stats.money=cents(Math.min(1e10,estate));n.seed=(g.seed*16807)%2147483647;n.week=40;n.phase='ending';n.examAnswers=[0,0,0];n.examScore=400;
 const l=n.life;l.active=true;l.baseAge=age;l.originWeek=g.life.originWeek+g.life.weeks+Math.max(0,Math.round((15-currentAge)*52));l.generation=g.life.generation+1;l.ancestors=[...g.life.ancestors,{name:g.name,age:g.life.death.age,cause:g.life.death.cause,wealth:cents(estate),generation:g.life.generation}].slice(-12);l.body=structuredClone(p.body);l.skills.technical=p.technical;l.work.experience=p.workWeeks;l.work.pensionWeeks=p.workWeeks;l.work.paidWeeks=p.workWeeks;
 l.stage=age<18?'school':p.enrolled&&!p.degree?'university':'society';l.atlas=l.stage;l.region=l.stage==='university'?'college-study':'recruitment';
 l.education={enrolled:age<18||p.enrolled&&!p.degree,school:age<18?'新世代高中':p.enrolled?'新世代大学':'自主职业路径',major:'自主选择',prestige:p.prestige,credits:age<18?Math.max(0,(age-15)*40):p.credits,gpa:2.5,degree:p.degree,entered:age<18?0:-p.collegeWeeks};l.economy.rent=l.education.enrolled?'dorm':'shared';l.pending='generation-welcome';
 note(n,'另一页人生',currentAge<15?'时间跳到15岁的高中起点；财产先扣债务、保留在世伴侣份额，再在孩子间分配。':'保持孩子的当前年龄、实际学业与身体记录；上一代伴侣关系不会继承。');return{game:n,message:child.name+'，'+age.toFixed(1)+' 岁，新的一代开始了。'};
}
export function adjustMargin(g:GameState,id:number,amount:number):LifeResult{
 const busy=lifeBusy(g);if(busy)return fail(g,busy);if(!Number.isFinite(amount)||Math.abs(amount)<.01||Math.abs(cents(amount)-amount)>1e-8)return fail(g,'请输入有效保证金变动。');const n=copy(g),p=n.life.finance.positions.find(p=>p.id===id);if(!p)return fail(g,'仓位已结束。');const price=n.life.finance.prices[p.asset];if(amount<0&&(p.margin+amount<1||positionEquity(p,price)+amount<p.quantity*price*.02))return fail(g,'移出后权益不足风险缓冲。');if(!cash(n,-amount,'逐仓保证金调整'))return fail(g,'现金不足。');p.margin+=amount;return{game:n,message:'逐仓保证金已调整。'};
}
