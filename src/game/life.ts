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
  return { schema: 1, active: false, stage: 'university', atlas: 'school', region: 'college-study', baseAge: 18, weeks: 0, actions: 0, used: [], generation: 1,
    education: { enrolled: false, school: '', major: '', prestige: 0, credits: 0, gpa: 2.5, degree: false }, skills: { technical: 10, communication: 10, practical: 10 }, work: { job: null, experience: 0, hours: 0, missed: 0, lastApplication: -1, retired: false },
    economy: { debt: 0, income: 0, expenses: 0, rent: 'dorm', insurance: 'none', insuredSince: -1, ledger: [] },
    family: { spouse: null, proposed: false, affection: 50, partnerConsent: false, pregnancy: null, children: [], lastCare: -1, following: false }, body: createBody(), finance: createFinance(),
    pending: null, seen: [], memories: [], game: null, scores: {}, tasks: [], death: null, ancestors: [] };
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
  if (action === 'work' && g.stats.energy < (JOBS.find(j => j.id === g.life.work.job)?.cost ?? 28)) return '体力不足以完成整周排班，先休息。';
  if (action === 'date' && !lifePartner(g)) return '先确认双方的交往关系。';
  return null;
}
function note(g: GameState, title: string, text: string) { g.life.memories.unshift({ week: g.life.weeks, title, text }); g.life.memories = g.life.memories.slice(0, 180); }
function cash(g: GameState, amount: number, label: string, credit = false) {
  amount = cents(amount);
  if (amount < 0 && g.stats.money + amount < 0) {
    if (!credit) return false;
    g.life.economy.debt = cents(g.life.economy.debt - (g.stats.money + amount)); g.stats.money = 0;
  } else g.stats.money = cents(limit(g.stats.money + amount, 0, 999999));
  if (amount > 0) g.life.economy.income = cents(g.life.economy.income + amount); else g.life.economy.expenses = cents(g.life.economy.expenses - amount);
  g.life.economy.ledger.unshift({ week: g.life.weeks, label, amount }); g.life.economy.ledger = g.life.economy.ledger.slice(0, 160); return true;
}
export function startLife(g: GameState): LifeResult {
  if (!g.started || g.phase !== 'ending' || g.pendingEvent || g.romance.active || g.graduate.pending) return fail(g, '先完成高中故事与眼前的选择。');
  if (g.life.active) return { game: g, message: '下一段人生已经开始。' };
  const next = copy(g), l = next.life, school = UNIVERSITIES.find(u => u.id === g.admittedId);
  l.active = true; l.baseAge = 18 + g.week / 52; l.stage = school ? 'university' : 'society'; l.atlas = l.stage; l.region = school ? 'college-study' : 'recruitment';
  l.education = { enrolled: !!school, school: school?.name ?? '未进入本科', major: g.admittedMajor ?? '自主职业路径', prestige: school?.type === '985' ? 90 : school?.type === '211' ? 75 : school ? 50 : 0, credits: 0, gpa: 2.5, degree: false };
  l.economy.rent = school ? 'dorm' : 'shared'; l.pending = 'welcome';
  l.skills.technical = limit(Object.values(g.subjects).reduce((a, b) => a + b, 0) / 30); l.skills.communication = limit(g.stats.autonomy / 3 + g.counts.social); l.skills.practical = limit(g.counts.explore + g.counts.exercise);
  l.family.affection = g.social.partner ? g.social.bonds[g.social.partner].affection : g.graduate.partner ? g.graduate.affection : 50;
  cash(next, 2500, '毕业后的第一笔生活储备'); note(next, '围墙之外', '高中经历与身体习惯被带到下一段人生；这笔有限的储备不是稳定收入。');
  return { game: next, message: '大学与社会地图已开放，传送免费，时间按周推进。' };
}
export function teleportLife(g: GameState, atlas: AtlasId, region?: string): LifeResult {
  if (!g.life.active || g.life.death) return fail(g, '先开启下一段人生。');
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
  n.stats.energy = limit(n.stats.energy + (id === 'work' ? -(job?.cost ?? 28) : a.energy)); n.stats.stress = limit(n.stats.stress + (id === 'work' ? job?.stress ?? 14 : a.stress)); n.stats.mood = limit(n.stats.mood + a.mood);
  l.body = recordHabit(l.body, id);
  if (id === 'course') { l.education.credits++; l.education.gpa = Math.min(4, l.education.gpa + .003); l.skills.technical = limit(l.skills.technical + .5); }
  if (id === 'skill') { l.skills.technical = limit(l.skills.technical + 2); l.skills.practical = limit(l.skills.practical + 2); }
  if (id === 'social') l.skills.communication = limit(l.skills.communication + 2);
  if (id === 'work') { l.work.experience++; l.work.hours += job?.hours ?? 0; }
  if (id === 'date') l.family.affection = limit(l.family.affection + 7);
  if (id === 'care') { l.family.lastCare = l.weeks; l.family.affection = limit(l.family.affection + 5); l.family.children.forEach(c => { c.care = limit(c.care + 8); c.education = limit(c.education + .3); }); }
  note(n, a.name, a.hint); return { game: n, message: `${a.name}完成，本周剩余 ${3 - l.actions} 次行动。` };
}
export function advanceLife(g: GameState): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy);
  const n = copy(g), l = n.life, j = JOBS.find(job => job.id === l.work.job), age = lifeAge(g);
  if (j && l.used.includes('work')) { cash(n, j.wage, `${j.name}周工资`); l.work.missed = 0; }
  else if (j && !l.work.retired) { l.work.missed++; if (l.work.missed >= 3) { note(n, '排班中断', '连续三周未完成排班，合同结束。身体与生活没有因此停止。'); l.work.job = null; } }
  if (l.education.enrolled && !l.education.degree) cash(n, 280, '学生生活支持 / 助学补给');
  if (l.work.retired) cash(n, 430, '模拟退休收入');
  const housing = l.economy.rent === 'dorm' ? 35 : l.economy.rent === 'shared' ? 160 : 360;
  cash(n, -(95 + housing + (l.education.enrolled && !l.education.degree ? 110 : 0)), '饮食 / 住房 / 学费周均', true);
  if (l.family.spouse) { cash(n, 210, '伴侣共同生活收入'); cash(n, -140, '共同生活开支', true); l.family.affection = limit(l.family.affection - (l.used.includes('date') || l.used.includes('care') ? 0 : .5)); }
  for (const child of l.family.children) { const childAge = (l.weeks - child.bornWeek) / 52; cash(n, -(childAge < 6 ? 180 : childAge < 18 ? 130 : 40), `${child.name}的照护与教育`, true); child.care = limit(child.care - (l.family.lastCare === l.weeks ? 0 : 2)); }
  if (l.family.pregnancy) cash(n, -70, '孕育期照护与检查', true);
  if (l.economy.insurance !== 'none') cash(n, l.economy.insurance === 'basic' ? -18 : -75, '保险周均支出', true);
  const stable = l.body.conditions.filter(c => c.stage === 'stable'); if (stable.length) medicalBill(n, stable.length * 90, '长期随访与治疗');
  if (l.economy.debt > 0) { l.economy.debt = cents(l.economy.debt * 1.0008); const pay = Math.min(l.economy.debt, Math.max(0, n.stats.money - 500) * .08); if (pay > 0) { cash(n, -pay, '债务分期'); l.economy.debt = cents(l.economy.debt - pay); } }
  const market = stepMarket(l.finance, n.seed, l.weeks + 1); l.finance = market.finance; if (market.cash) cash(n, market.cash, '合约到期结算'); market.messages.forEach(text => note(n, '市场结算', text));
  l.weeks++; l.actions = 0; l.used = []; l.game = null;
  n.seed = (n.seed * 16807) % 2147483647; n.stats.energy = limit(n.stats.energy + 22); n.stats.stress = limit(n.stats.stress - 4); n.stats.mood = limit(n.stats.mood + 2);
  const health = advanceBody(n); l.body = health.body; n.stats.health = Math.round(Object.values(l.body.internal).reduce((a, b) => a + b, 0) / 7);
  if (health.fatal) die(n, `病死 · ${health.fatal}`);
  if (!l.death && (age > 85 && roll(n.seed, l.weeks + 133) < Math.min(.05, (age - 85) ** 2 * .00004) || age >= 110)) die(n, '寿终 · 时间走到了最后');
  if (!l.death && j && roll(n.seed, l.weeks + 577) < (j.id === 'delivery' ? .00009 : .000018)) die(n, '意外身故 · 通勤事故');
  if (!l.death && l.education.enrolled && !l.education.degree && l.weeks >= 208 && l.education.credits >= 160) { l.education.degree = true; l.stage = 'society'; if (l.economy.rent === 'dorm') l.economy.rent = 'shared'; note(n, '大学毕业', '你得到了学位。招聘表里的学校标签、家庭资源与工作经历仍会影响机会。'); }
  if (!l.death && l.family.pregnancy && l.weeks >= l.family.pregnancy.due) {
    const p = l.family.pregnancy; medicalBill(n, 8500, '分娩与住院'); l.family.children.push({ id: `child-${l.generation}-${l.weeks}`, name: p.name, gender: p.gender, bornWeek: l.weeks, education: 10, care: 70 }); l.family.pregnancy = null; note(n, '一个新的名字', `${p.name}来到了家里。照护、睡眠和费用需要共同安排。`);
  }
  if (!l.death && !l.body.emergency && l.weeks % 4 === 0) { const eligible = LIFE_EVENTS.filter(e => !l.seen.includes(e.id) && e.id !== 'welcome' && (e.stage === 'any' || e.stage === l.stage) && (e.id !== 'retirement' || l.work.retired) && (!['overtime', 'salary-delay', 'layoff'].includes(e.id) || !!l.work.job) && (e.id !== 'family-labor' || l.family.children.length > 0) && (e.id !== 'delivery-clock' || l.work.job === 'delivery')); if (eligible.length) l.pending = eligible[Math.floor(roll(n.seed, l.weeks) * eligible.length)].id; }
  return { game: n, message: l.death ? '这段人生走到了终章。' : l.body.emergency ? '出现急症，已进入医院急救提示。' : `第 ${l.weeks + 1} 周，${lifeAge(n).toFixed(1)} 岁。工资、账单、市场与身体状态已结算。` };
}
export function lifePartner(g: GameState) { return g.life.family.spouse ?? g.social.partner ?? g.graduate.partner; }
export function advanceLifePlan(g: GameState, weeks: number): LifeResult {
  if (![4, 13, 52].includes(weeks)) return fail(g, '请选择 4、13 或 52 周计划。');
  let n = g, completed = 0;
  for (let i = 0; i < weeks; i++) {
    if (lifeBusy(n)) break;
    const tasks = [n.life.education.enrolled && !n.life.education.degree ? 'course' : n.life.work.job && !n.life.work.retired ? 'work' : 'skill', n.life.family.children.length ? 'care' : 'exercise', 'rest'];
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
  if (operation === 'talk' && target && ROMANCE_IDS.includes(target)) {
    if (l.actions >= 3) return fail(g, '本周行动已用完。'); l.actions++; l.used.push('talk'); const b = n.social.bonds[target]; b.trust = limit(b.trust + 5); b.affection = limit(b.affection + 4); b.understanding = limit(b.understanding + 4); l.family.affection = limit(l.family.affection + (target === id ? 4 : 0)); note(n, '毕业后的相处', `与${CHARACTERS[target].name}认真聊了聊近况。`);
  } else if (operation === 'confess' && target && ROMANCE_IDS.includes(target)) {
    if (id) return fail(g, '先处理当前交往关系。'); if (n.social.bonds[target].trust < 60 || n.social.bonds[target].affection < 45) return fail(g, '先认真相处：信任 60、心动 45。'); l.pending = `confess:${target}`;
  } else if (operation === 'propose') { const lock = marriageLock(g); if (lock) return fail(g, lock); l.pending = 'proposal';
  } else if (operation === 'marry') {
    const lock = marriageLock(g); if (lock) return fail(g, lock); if (!l.family.proposed || !l.family.partnerConsent) return fail(g, '先确认双方愿意结婚。'); if (!cash(n, -480, '登记与共同庆祝')) return fail(g, '登记与简单庆祝需要 480 元。'); l.family.spouse = id; note(n, '把日子放在一起', '登记之后，双方仍保留边界、工作与生活选择。');
  } else if (operation === 'baby') {
    if (!l.family.spouse || l.family.pregnancy) return fail(g, '先组成家庭，当前没有正在进行的孕育计划。'); if (l.family.children.length >= 4) return fail(g, '当前家庭已需要很多照护，先照顾好已有的孩子。'); if (lifeAge(g) >= 48) return fail(g, '当前阶段不再开启孕育计划。'); if (g.gender === partnerGender(l.family.spouse)) return fail(g, '当前伴侣组合可使用共同养育计划。'); l.pending = 'baby-plan';
  } else if (operation === 'adopt') {
    if (!l.family.spouse || l.family.children.length >= 4) return fail(g, '先组成家庭并留出照护能力。'); l.pending = 'care-plan';
  } else if (operation === 'breakup') { if (!id) return fail(g, '当前没有交往关系。'); if (l.family.pregnancy) return fail(g, '先完成共同孕育期间的照护安排。'); l.pending = 'separate';
  } else if (operation === 'follow') { if (!id) return fail(g, '先确认交往关系。'); l.family.following = !l.family.following;
  } else return fail(g, '没有这个家庭操作。');
  return { game: n, message: '关系与家庭记录已更新。' };
}
export function chooseLife(g: GameState, index: number): LifeResult {
  if (!g.life.active || g.life.death || !g.life.pending || ![0, 1].includes(index)) return fail(g, '没有待完成的选择。');
  const n = copy(g), l = n.life, pending = l.pending!; l.pending = null;
  if (pending.startsWith('confess:')) {
    const id = pending.slice(8) as RomanceId; if (!ROMANCE_IDS.includes(id) || lifePartner(g)) return fail(g, '当前不能确认交往。'); if (index === 0) { n.social.partner = id; n.social.bonds[id].route = 'dating'; n.romance.bonds[id].status = 'normal'; n.romance.bonds[id].sinceWeek = n.week; n.romance.bonds[id].episode = Math.min(40, n.romance.bonds[id].episode + 1); l.family.affection = n.social.bonds[id].affection; note(n, '双方答应的心意', `${CHARACTERS[id].name}愿意与你交往。彼此确认之后，新的约会与家庭入口才开放。`); }
  } else if (pending === 'proposal') { l.family.proposed = index === 0; l.family.partnerConsent = index === 0; note(n, '共同的决定', index === 0 ? '双方认真讨论了住房、收入和未来，愿意结婚。' : '先不结婚。心意不需要靠催促来证明。');
  } else if (pending === 'baby-plan' || pending === 'care-plan') {
    if (index === 0) { if (!l.family.spouse) return fail(g, '当前没有共同家庭。'); if (pending === 'baby-plan') { l.family.pregnancy = { due: l.weeks + 40, gender: roll(n.seed, l.weeks + 93) > .5 ? 'male' : 'female', name: `予禾${l.family.children.length ? l.family.children.length + 1 : ''}` }; note(n, '共同孕育计划', '双方同意开启孕育计划，需要 40 周照护。私人过程略过。'); } else { medicalBill(n, 6500, '虚构共同养育计划费用'); l.family.children.push({ id: `child-${l.generation}-${l.weeks}-care`, name: `予禾${l.family.children.length + 1}`, gender: roll(n.seed, l.weeks) > .5 ? 'male' : 'female', bornWeek: l.weeks - 156, care: 70, education: 15 }); note(n, '共同照护', '加入的是虚构养育玩法，不对应现实收养办理条件。'); } }
  } else if (pending === 'separate') {
    if (index === 0) { const old = lifePartner(g); l.family.spouse = null; l.family.proposed = false; l.family.partnerConsent = false; l.family.following = false; n.social.partner = null; n.romance.escort = null; n.romance.visitor = null; n.romance.attention.queued = null; if (old && old !== 'teacher') { n.social.bonds[old].route = 'friendship'; n.romance.bonds[old].status = 'broken'; } if (old === 'teacher') { n.graduate.partner = null; n.graduate.status = 'broken'; n.graduate.following = false; } note(n, '各自继续', '关系结束，已有孩子的照护与开支继续被承担。'); }
  } else {
    const e = LIFE_EVENTS.find(e => e.id === pending); if (!e) return fail(g, '没有这个事件。'); l.seen.push(e.id); note(n, e.title, `${e.text} 你选择：${e.choices[index]}`); n.stats.stress = limit(n.stats.stress + (index === 0 ? -4 : 3));
    if (e.id === 'tuition' && index === 0) cash(n, 900, '助学补贴');
    if (e.id === 'rent' && index === 1) cash(n, -180, '房租差额', true);
    if (e.id === 'layoff') { cash(n, 600, '模拟离职结算'); l.work.job = null; }
    if (e.id === 'salary-delay') { n.stats.stress = limit(n.stats.stress + 6); note(n, '欠薪追索', '你保存了追索记录。工资不能只靠一句尽快，压力仍需要时间消化。'); }
    if (e.id === 'quiet') n.stats.mood = limit(n.stats.mood + 10);
  }
  return { game: n, message: '选择已记入人生手帐。' };
}
export function jobLock(g: GameState, id: string): string | null {
  const busy = lifeBusy(g); if (busy) return busy; const j = JOBS.find(j => j.id === id); if (!j) return '没有这个岗位。';
  if (g.life.work.retired) return '当前已经选择退休。';
  if (g.life.actions >= 3) return '本周行动已用完。'; if (g.life.work.lastApplication === g.life.weeks) return '本周已投递一次，下周再试。';
  if (j.degree && !g.life.education.degree) return '岗位筛选要求本科学历。'; if (g.life.education.prestige < j.prestige) return '这家单位先按学校背景筛选。这并不代表你的能力。';
  if (g.life.skills.technical < j.skill) return `专业技能需 ${j.skill}。`;
  if (!g.life.used.includes('game:interview') || (g.life.scores.interview ?? 0) < j.interview) return `先完成本周互动面试，成绩需 ${j.interview}。`;
  return null;
}
export function applyJob(g: GameState, id: string): LifeResult {
  const lock = jobLock(g, id); if (lock) return fail(g, lock); const n = copy(g), j = JOBS.find(j => j.id === id)!; n.life.actions++; n.life.used.push('apply'); n.life.work.job = j.id; n.life.work.lastApplication = n.life.weeks; n.life.work.missed = 0; note(n, '新的工牌', `${j.name}，每周 ${j.hours} 小时，完成排班后周薪 ¥${j.wage}。`); return { game: n, message: '已签订模拟工作合同，下次完成排班后领取工资。' };
}
function medicalBill(g: GameState, amount: number, label: string) {
  const e = g.life.economy, eligible = e.insurance === 'basic' || e.insurance === 'commercial' && g.life.weeks - e.insuredSince >= 13;
  const benefit = eligible ? Math.max(0, amount - 500) * (e.insurance === 'basic' ? .55 : .7) : 0;
  cash(g, -(amount - benefit), `${label}（总额 ${amount}，报销 ${cents(benefit)}）`, true);
}
export function medicalOperation(g: GameState, id: string): LifeResult {
  if (!g.life.active || g.life.death) return fail(g, '当前不能就医。');
  const n = copy(g), l = n.life;
  if (id === 'rescue') {
    const emergency = l.body.emergency; if (!emergency) return fail(g, '当前没有急症。'); const disease = DISEASES[emergency]; medicalBill(n, disease.treatment, '急救与住院'); l.body.emergency = null; l.body.emergencyWeek = -1;
    const survived = roll(n.seed, l.weeks + 199) < (emergency === 'sudden' ? .78 : .94);
    if (survived) { l.body.conditions = l.body.conditions.map(c => c.id === emergency ? { ...c, stage: 'stable', severity: 35, treated: l.weeks, discovered: true } : c); n.stats.energy = Math.max(25, n.stats.energy); note(n, '急救之后', '治疗先于收费完成，剩余费用已进入账本，继续复查与康复。'); } else die(n, emergency === 'sudden' ? '猝死 · 抢救未能恢复' : `病死 · ${disease.name}`);
    return { game: n, message: survived ? '抢救成功，后续费用可分期。' : '尽力抢救之后，这段人生结束了。' };
  }
  const busy = lifeBusy(g); if (busy) return fail(g, busy);
  if (id.startsWith('insurance:')) {
    const policy = id.slice(10); if (!['none', 'basic', 'commercial'].includes(policy)) return fail(g, '没有这个保险方案。'); if (l.economy.insurance === policy) return fail(g, '当前已经使用这个方案。'); if (policy === 'commercial' && l.body.conditions.some(c => c.discovered)) return fail(g, '商业方案对已确诊病况设置除外条件；可选择基础医保。'); l.economy.insurance = policy as typeof l.economy.insurance; l.economy.insuredSince = l.weeks; note(n, '保障条款', '费用与报销比例为游戏参数；商业等待期 13 周。基础方案当周生效。');
  } else if (id.startsWith('treat:')) {
    const disease = id.slice(6) as DiseaseId, c = l.body.conditions.find(c => c.id === disease); if (!c || !c.discovered) return fail(g, '先完成诊断。'); if (c.stage === 'stable') return fail(g, '已经进入稳定治疗，周末自动记录随访费用。');
    if (l.actions >= 3) return fail(g, '本周行动已用完，非急诊治疗安排到下周。'); l.actions++; l.used.push(`treat:${disease}`);
    medicalBill(n, DISEASES[disease].treatment, '专科治疗'); c.stage = 'stable'; c.severity = Math.max(10, c.severity * .55); c.treated = l.weeks; note(n, '治疗与复查', `${DISEASES[disease].name}进入稳定治疗；一次治疗不是永久治愈保证。`);
  } else { const lock = medicalLock(g, id); if (lock) return fail(g, lock); if (l.actions >= 3) return fail(g, '本周行动已用完，非急诊检查安排到下周。'); const t = MEDICAL_TESTS.find(t => t.id === id)!; medicalBill(n, t.price, t.name); const check = examine(n, id); l.body = check.body; l.actions++; l.used.push(`test:${id}`); return { game: n, message: check.text }; }
  return { game: n, message: '医疗与保障记录已更新。' };
}
export function economicOperation(g: GameState, action: string, value?: string): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy); const n = copy(g), l = n.life;
  if (action === 'rent' && ['dorm', 'shared', 'apartment'].includes(value ?? '')) { if (value === 'dorm' && (!l.education.enrolled || l.education.degree)) return fail(g, '非在读学生不能继续租住学生宿舍。'); l.economy.rent = value as typeof l.economy.rent;
  } else if (action === 'repay') { const amount = Math.min(l.economy.debt, n.stats.money); if (!amount) return fail(g, '当前没有可偿还的欠款或现金。'); cash(n, -amount, '主动偿还债务'); l.economy.debt = cents(l.economy.debt - amount);
  } else if (action === 'retire') { if (lifeAge(g) < 60) return fail(g, '模拟退休入口在 60 岁开放。'); l.work.retired = true; l.work.job = null;
  } else if (action === 'quit') { l.work.job = null; note(n, '离开工位', '你主动结束了这份工作。下一周不再领取这个岗位的工资。');
  } else return fail(g, '没有这个操作。'); return { game: n, message: '生活安排已更新。' };
}
export function trade(g: GameState, kind: string, asset: string, amount: number, leverage = 1, side: 'long' | 'short' = 'long'): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy); if (!ASSETS.some(a => a.id === asset) || !Number.isFinite(amount) || amount <= 0 || amount > 999999 || ![1, 2, 3, 5, 10].includes(leverage) || !['long', 'short'].includes(side)) return fail(g, '交易参数无效。');
  const n = copy(g), f = n.life.finance, price = f.prices[asset];
  if (kind === 'buy') { const fee = amount * .001; if (!cash(n, -(amount + fee), `${asset}现货买入（含手续费）`)) return fail(g, '现金不足以支付本金和手续费。'); f.holdings[asset] += amount / price; f.fees += fee;
  } else if (kind === 'sell') { const quantity = amount / price; if (quantity > f.holdings[asset] + 1e-9) return fail(g, '卖出金额超过持仓市值。'); f.holdings[asset] = Math.max(0, f.holdings[asset] - quantity); const fee = amount * .001; cash(n, amount - fee, `${asset}现货卖出`); f.fees += fee;
  } else if (kind === 'perpetual' || kind === 'delivery') { if (!['BTC', 'ETH'].includes(asset)) return fail(g, '此合约仅支持模拟 BTC / ETH。'); if (f.positions.length >= 12) return fail(g, '同时最多持有 12 个逐仓仓位。'); const fee = amount * leverage * .001; if (!cash(n, -(amount + fee), `${asset}逐仓保证金与开仓费`)) return fail(g, '现金不足以支付保证金和手续费。'); f.fees += fee; f.positions.push({ id: f.nextId++, asset, kind, side, entry: price, quantity: amount * leverage / price, margin: amount, leverage, expiry: n.life.weeks + 4, funding: 0 });
  } else if (kind === 'swap-buy') { const out = swapQuote(f, 'buy', amount); if (!cash(n, -amount, 'AMM 兑换 ETH')) return fail(g, '现金不足。'); f.pool.cash += amount; f.pool.eth -= out; f.holdings.ETH += out; f.fees += amount * .003;
  } else if (kind === 'swap-sell') { const quantity = amount / price; if (quantity > f.holdings.ETH) return fail(g, 'ETH 持仓不足。'); const out = swapQuote(f, 'sell', quantity); f.pool.eth += quantity; f.pool.cash -= out; f.holdings.ETH -= quantity; cash(n, out, 'AMM 兑换现金'); f.fees += amount * .003;
  } else if (kind === 'lp-add') { const eth = amount * f.pool.eth / f.pool.cash; if (eth > f.holdings.ETH || !cash(n, -amount, 'LP 现金投入')) return fail(g, '按池比例同时需要足够的 ETH 和现金。'); const shares = amount / f.pool.cash * f.pool.supply; f.holdings.ETH -= eth; f.pool.cash += amount; f.pool.eth += eth; f.pool.supply += shares; f.pool.shares += shares; f.pool.deposited += amount + eth * price;
  } else return fail(g, '没有这个交易类型。');
  return { game: n, message: '模拟交易已记录。行情每周变动，持仓与保证金保存在本地。' };
}
export function closePosition(g: GameState, id: number): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy); const n = copy(g), f = n.life.finance, p = f.positions.find(p => p.id === id); if (!p) return fail(g, '没有这个仓位。'); const fee = p.quantity * f.prices[p.asset] * .001, payout = Math.max(0, positionEquity(p, f.prices[p.asset]) - fee); f.realized += payout - p.margin; f.fees += fee; f.positions = f.positions.filter(p => p.id !== id); cash(n, payout, '合约平仓返还'); return { game: n, message: `逐仓平仓，返还 ¥${payout.toFixed(2)}。` };
}
export function removeLiquidity(g: GameState): LifeResult {
  const busy = lifeBusy(g); if (busy) return fail(g, busy); const n = copy(g), f = n.life.finance, p = f.pool; if (p.shares <= 0) return fail(g, '当前没有 LP 份额。'); const ratio = p.shares / p.supply, eth = p.eth * ratio, money = p.cash * ratio; f.holdings.ETH += eth; cash(n, money, 'LP 撤回现金'); p.eth -= eth; p.cash -= money; p.supply -= p.shares; p.shares = 0; p.deposited = 0; return { game: n, message: '流动性已撤回，ETH 与现金按当前池比例返回。' };
}
export function die(g: GameState, cause: string) { g.life.death = { cause, age: lifeAge(g), week: g.life.weeks, settled: false }; g.life.pending = null; g.life.game = null; g.life.body.emergency = null; note(g, '人生终章', cause); }
export function inheritLife(g: GameState, childId: string, fresh: GameState): LifeResult {
  const child = g.life.family.children.find(c => c.id === childId); if (!g.life.death || !child) return fail(g, '选择一个孩子，才能继续下一代。');
  const age = Math.max(18, (g.life.weeks - child.bornWeek) / 52), estate = Math.max(0, g.stats.money + portfolioValue(g.life.finance) - g.life.economy.debt) / Math.max(1, g.life.family.children.length);
  const n = copy(fresh); n.started = true; n.name = child.name; n.nameIsCustom = true; n.gender = child.gender; n.stats.money = cents(Math.min(999999, estate)); n.seed = (g.seed * 16807) % 2147483647;
  n.life.generation = g.life.generation + 1; n.life.ancestors = [...g.life.ancestors, { name: g.name, age: g.life.death.age, cause: g.life.death.cause, wealth: cents(estate), generation: g.life.generation }].slice(-12);
  if (age > 18) { n.week = 40; n.phase = 'ending'; n.examAnswers = [0, 0, 0]; n.examScore = 400; n.life.active = true; n.life.baseAge = age < 22 ? 18 : age; n.life.weeks = age < 22 ? Math.floor((age - 18) * 52) : 0; n.life.stage = age < 22 ? 'university' : 'society'; n.life.atlas = n.life.stage; n.life.region = age < 22 ? 'college-study' : 'recruitment'; n.life.education = { enrolled: age < 22, school: '新世代学校', major: '自主选择', prestige: 40, credits: age < 22 ? Math.min(159, Math.floor((age - 18) * 40)) : 160, gpa: 2.5, degree: age >= 22 }; n.life.skills.technical = limit(child.education); n.life.pending = 'welcome'; }
  note(n, '另一页人生', age === 18 ? '时间跳至成年高三。上一代的伴侣和社交关系没有被带入这一代。' : '保留孩子当前年龄，继续自己的生活；上一代关系已经归档。');
  return { game: n, message: `${child.name}，第 ${n.life.generation} 代，${age.toFixed(1)} 岁。` };
}
