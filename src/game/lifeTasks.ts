import type { GameState } from './types';
import { lifeBusy, type LifeResult } from './life';
export const LIFE_TASKS = [
  { id: 'first-term', title: '走过第一个学期', detail: '完成 16 周，积累 12 学分。课程每周一次，不能一天刷完。', target: 'place' as const, reward: 300, progress: (g: GameState) => Math.min(1, Math.max(0,g.life.weeks-(g.life.education.entered??0)) / 16, g.life.education.credits / 12), visible: (g: GameState) => g.life.education.enrolled },
  { id: 'degree', title: '围墙以外的毕业证', detail: '至少 208 周与 160 学分，在大学度过完整的四年。', target: 'place' as const, reward: 1000, progress: (g: GameState) => Math.min(1, Math.max(0,g.life.weeks-(g.life.education.entered??0)) / 208, g.life.education.credits / 160), visible: (g: GameState) => g.life.education.enrolled },
  { id: 'work-month', title: '第一份完整的工资', detail: '找到工作，完成至少 4 周排班。', target: 'work' as const, reward: 200, progress: (g: GameState) => Math.min(1, g.life.work.paidWeeks / 4), visible: () => true },
  { id: 'craft', title: '经验写在工时之外', detail: '完成 52 周排班，实践技能达到 35。', target: 'work' as const, reward: 650, progress: (g: GameState) => Math.min(1, g.life.work.experience / 52, g.life.skills.practical / 35), visible: () => true },
  { id: 'reserve', title: '留给明天的一点余地', detail: '走过 12 周，保留 5000 元现金且没有欠款。', target: 'overview' as const, reward: 150, progress: (g: GameState) => Math.min(1, g.life.weeks / 12, g.stats.money / 5000, g.life.economy.debt ? 0 : 1), visible: () => true },
  { id: 'check', title: '认真听见身体', detail: '在不同周完成基础化验、心脏评估和血糖检查。', target: 'health' as const, reward: 100, progress: (g: GameState) => Math.min(1, new Set(g.life.body.tests.filter(t => ['blood', 'cardio', 'glucose'].includes(t.test)).map(t => t.test)).size / 3, new Set(g.life.body.tests.map(t => t.week)).size / 3), visible: () => true },
  { id: 'home', title: '一个需要共同维护的家', detail: '双方登记结婚，走过至少一年；亲密保持 75。', target: 'family' as const, reward: 350, progress: (g: GameState) => Math.min(1, Math.max(0,g.life.weeks-g.life.family.marriedWeek) / 52, g.life.family.affection / 75, g.life.family.spouse ? 1 : 0), visible: () => true },
  { id: 'child', title: '陪一个人慢慢长大', detail: '照顾孩子满 6 年，照护状态保持 60。', target: 'family' as const, reward: 500, progress: (g: GameState) => Math.max(0, ...g.life.family.children.map(c => Math.min(1, (g.life.weeks - c.bornWeek) / 312, c.care / 60))), visible: (g: GameState) => g.life.family.children.length > 0 },
];
export function claimLifeTask(g: GameState, id: string): LifeResult {
  const t = LIFE_TASKS.find(t => t.id === id), busy = lifeBusy(g); if (busy || !t || !t.visible(g) || t.progress(g) < 1 || g.life.tasks.includes(id)) return { game: g, error: busy ?? '任务还没完成或已领取。', message: '' };
  const n = structuredClone(g); n.updatedAt = new Date().toISOString(); n.life.tasks.push(id); n.stats.money = Math.min(1e10, n.stats.money + t.reward); n.life.economy.income += t.reward; n.life.economy.ledger.unshift({ week: n.life.weeks, label: `长任务：${t.title}`, amount: t.reward }); n.life.economy.ledger = n.life.economy.ledger.slice(0, 160); return { game: n, message: `任务完成，补给 ¥${t.reward}。` };
}
