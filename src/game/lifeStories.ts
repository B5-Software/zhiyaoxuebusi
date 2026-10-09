import { LIFE_ARCS, type LifeArc, type StoryEffect } from './lifeStoryData';
import { limit } from './lifeHealth';
import type { GameState } from './types';
import type { LifeStories } from './lifeTypes';
import type { LifeResult } from './life';

export function createLifeStories(): LifeStories { return { version: 1, routes: {}, log: [], receipt: null, lastOffered: -2 }; }
export function storyPending(arc: string, step: number) { return `story:${arc}:${step}`; }
export function pendingChapter(g: GameState) {
  const [, id, rawStep] = g.life.pending?.match(/^story:([a-z-]+):(\d+)$/) ?? [];
  const arc = LIFE_ARCS.find(a => a.id === id), step = Number(rawStep);
  return arc && Number.isInteger(step) && arc.chapters[step] ? { arc, chapter: arc.chapters[step], step } : null;
}
export function storyProgress(g: GameState, arc: LifeArc) {
  const route = g.life.stories.routes[arc.id], step = route?.choices.length ?? 0;
  const finished = step >= arc.chapters.length;
  const due = route ? route.lastWeek + (arc.chapters[step]?.gap ?? 0) : g.life.weeks;
  const visible = !!route || arc.visible(g);
  return { route, step, finished, due, visible, ready: visible && !finished && due <= g.life.weeks };
}
export function storyStartLock(g: GameState, id: string): string | null {
  const arc = LIFE_ARCS.find(a => a.id === id); if (!arc) return '没有这段故事。';
  if (!g.life.active || g.life.death) return '当前人生不能继续这段故事。';
  if (g.life.body.emergency || g.life.pending || g.life.game || g.life.stories.receipt) return '先完成眼前的事情。';
  if (g.life.actions >= 3) return '本周行动已用完，下周再来。';
  const p = storyProgress(g, arc);
  return !p.visible ? arc.condition : p.finished ? '这段故事已完整收录，可以回看。' : !p.ready ? `第 ${p.due + 1} 周继续，仍需 ${p.due - g.life.weeks} 周。` : null;
}
export function beginStoryMutable(g: GameState, arc: LifeArc) {
  const s = g.life.stories, p = storyProgress(g, arc);
  s.routes[arc.id] ??= { started: g.life.weeks, lastWeek: g.life.weeks, choices: [] };
  g.life.pending = storyPending(arc.id, p.step);
  g.life.actions++; g.life.used.push(`story:${arc.id}`); s.lastOffered = g.life.weeks;
}
export function startLifeStory(g: GameState, id: string): LifeResult {
  const lock = storyStartLock(g, id); if (lock) return { game: g, error: lock, message: '' };
  const n = structuredClone(g); n.updatedAt = new Date().toISOString(); beginStoryMutable(n, LIFE_ARCS.find(a => a.id === id)!);
  return { game: n, message: '这一章消耗1次行动，选择与后续时间会自动保存。' };
}
export function offerContinuingStory(g: GameState) {
  if (g.life.stories.lastOffered + 2 > g.life.weeks) return false;
  const candidates = LIFE_ARCS.filter(a => !!g.life.stories.routes[a.id] && !storyStartLock(g, a.id));
  candidates.sort((a, b) => Number(b.kind === '主线') - Number(a.kind === '主线') || storyProgress(g, a).due - storyProgress(g, b).due);
  if (!candidates.length) return false;
  beginStoryMutable(g, candidates[0]); return true;
}
export function storyChoiceLock(g: GameState, index: number) {
  const p = pendingChapter(g); if (!p || ![0, 1].includes(index)) return '没有这项选择。';
  const money = p.chapter.effects[index].money ?? 0;
  return money < 0 && g.stats.money < -money ? `需要现金 ¥${-money}，可以选择另一项安排。` : null;
}
export function storyEcho(g: GameState, arc: LifeArc) {
  const choice = g.life.stories.routes[arc.id]?.choices[0];
  if (choice === undefined) return '';
  const context = arc.id === 'hours' && !g.life.work.job ? '那份工作已经结束；你带着真实留下的经验继续这段回访。' : arc.id === 'table' && !(g.social.partner || g.graduate.partner || g.life.family.spouse) ? '关系已经改变。下面的对话是当时相处的回忆，不会恢复已经结束的关系。' : '';
  return arc.echoes[choice] + context;
}
const REVISITS: Record<string, [string, string]> = {
  outside: ['你最初写下的休息时间，后来被划掉过几次。这次你把那些日期也保留下来，提醒自己不必把让步叫作成长。', '最初的预算已经改过几轮。你开始在每一笔价格旁边加上工时，因为支付的从来不只有钱。'],
  'dorm-light': ['许宁把你们核对过的清单递来，这次少写了几项没有必要公开的家庭细节。她说：至少这份材料是我自己决定怎样交的。', '许宁仍记得你先陪她吃饭的那一晚。她把新来的同学叫到台灯旁，先问吃过没有，再拿出申请表。'],
  'credit-line': ['新同学翻到你保存的版本差异，终于看清贡献怎样从一个人的工时变成另一个人的头衔。记录没有解决全部争议，却保住了追问的起点。', '新同学看了你后来自己完成的练习，问退出会不会就此失去机会。你把真实的得失讲完，没有把任何一条路说成没有代价。'],
  hours: ['罗姐找出你当时留下的工时表，核对那几次深夜的任务。有了具体日期，讨论不再只能停在大家都辛苦了。', '罗姐说，那天看见你按时离开，她才意识到合同上的时间也可以被说出来。她没有立刻照做，但开始认真计算自己需要的退路。'],
  rental: ['室友翻出当时的交接照片，受潮之前的墙面还在。你们不必只凭谁声音更大来回忆那间房的原样。', '你又走了一次最初的通勤路线，把等待和换乘也算进去。便宜一点的房子，也可能每天多拿走一段自己的生活。'],
  waiting: ['周姨看了你按时间写下的症状记录，也开始把自己的问题分条整理。医生仍需检查，而你们不再只在门口反复说我记不清了。', '你保存的费用与检查单摆在一起，终于能问清哪些是重复项目。提问没有自动变成减免，但困惑可以有具体的对象。'],
  table: ['那张分工表被你们重新拿出来，一些任务后面写着两个人的名字。曾经谈好的事也需要回看，不能用我以为你愿意就跳过讨论。', '你们记得最初一起做家务的晚上。后来真正难的，是不让那一次的体贴变成谁理所当然应该一直承担的暗示。'],
  ticker: ['你最初分开的生活预算仍在，阿林看了以后没有说你错过机会。他说，至少还有一笔钱不用替每一次波动承受后果。', '你翻到最初深夜盯盘的记录，那里写的不是策略，而是怕自己又落后了。能把这句话认出来，也是重新决定的开始。'],
  'slow-time': ['缴费记录和老工牌收在同一个袋子里。你没有把空缺假装补齐，而是把需要争取、需要核对的事情具体写出来。', '你记得最初没有安排的那个上午。后来有了更多事情，也还是愿意留一点时间，不向任何人证明自己没有闲着。'],
};
export function storyRevisit(g: GameState, arc: LifeArc) {
  const first = g.life.stories.routes[arc.id]?.choices[0];
  return first === undefined ? '' : REVISITS[arc.id]?.[first] ?? '';
}
export function resolveStoryMutable(g: GameState, index: number, pay: (amount: number, label: string) => void) {
  const p = pendingChapter(g); if (!p) return false;
  const { arc, chapter, step } = p, s = g.life.stories, route = s.routes[arc.id];
  if (!route || route.choices.length !== step || storyChoiceLock(g, index)) return false;
  const e: StoryEffect = chapter.effects[index];
  for (const key of ['energy', 'stress', 'mood'] as const) g.stats[key] = limit(g.stats[key] + (e[key] ?? 0));
  for (const key of ['technical', 'communication', 'practical'] as const) g.life.skills[key] = limit(g.life.skills[key] + (e[key] ?? 0));
  for (const key of ['sleep', 'strain'] as const) g.life.body.habits[key] = limit(g.life.body.habits[key] + (e[key] ?? 0));
  if (e.affection && (g.social.partner || g.graduate.partner || g.life.family.spouse)) g.life.family.affection = limit(g.life.family.affection + e.affection);
  if (e.money) pay(e.money, `剧情：${chapter.title}`);
  if (e.rentFactor) g.life.economy.rentIndex = Math.max(.7, Math.min(3, g.life.economy.rentIndex * e.rentFactor));
  let result = chapter.results[index];
  if (e.application === 'tuition') {
    if (!g.life.claims.some(c => c.kind === 'tuition')) g.life.claims.push({ kind: 'tuition', due: g.life.weeks + 4, amount: 900 });
  }
  if (e.application === 'wages' && g.life.work.arrears > 0 && g.life.work.claimDue < 0) g.life.work.claimDue = g.life.weeks + 3;
  if (e.application === 'aid') {
    if (g.life.economy.aidDue < 0 && g.life.weeks - g.life.economy.aidCooldown >= 52) { g.life.economy.aidDue = g.life.weeks + 4; g.life.economy.aidCooldown = g.life.weeks; }
    else result += ' 当前已有申请或仍在年度冷却期，本次只补充记录，不重复领取。';
  }
  route.choices.push(index); route.lastWeek = g.life.weeks;
  if (step > 0) result += ' ' + storyEcho(g, arc);
  if (step === arc.chapters.length - 1) {
    result += ' ' + storyRevisit(g, arc);
    // The first decision also changes the capability carried out of the completed arc.
    if (route.choices[0] === 0) { g.life.skills.communication = limit(g.life.skills.communication + 2); result += ' 延续最初的记录与沟通，沟通能力额外提高2点。'; }
    else { g.life.body.habits.sleep = limit(g.life.body.habits.sleep + 2); result += ' 延续最初留给生活的空间，睡眠习惯额外改善2点。'; }
  }
  const record = { id: `${arc.id}:${step}:${g.life.weeks}`, arc: arc.id, step, week: g.life.weeks, choice: index, result };
  s.log.unshift(record); s.log = s.log.slice(0, 60); s.receipt = record.id;
  g.life.pending = null;
  g.life.memories.unshift({ week: g.life.weeks, title: chapter.title, text: result }); g.life.memories = g.life.memories.slice(0, 180);
  return true;
}
export function acknowledgeLifeStory(g: GameState): LifeResult {
  if (!g.life.stories.receipt) return { game: g, message: '' };
  const n = structuredClone(g); n.updatedAt = new Date().toISOString(); n.life.stories.receipt = null;
  return { game: n, message: '故事、选择和后续安排已收进人生手帐。' };
}
