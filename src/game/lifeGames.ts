import { MINI_GAMES } from './lifeData';
import { lifeBusy, type LifeResult } from './life';
import { limit, roll } from './lifeHealth';
import type { GameState } from './types';
export const LOGIC_QUESTIONS = [
  { text: '2、4、8、16，下一项？', options: ['18', '24', '32'], correct: 2 },
  { text: '3、6、11、18，下一项？', options: ['27', '25', '30'], correct: 0 },
  { text: '1、1、2、3、5，下一项？', options: ['6', '8', '10'], correct: 1 },
  { text: '所有 A 都是 B；部分 B 是 C。一定有 A 是 C 吗？', options: ['一定有', '不能确定', '一定没有'], correct: 1 },
  { text: 'A 比 B 大，B 比 C 大。谁最小？', options: ['A', 'B', 'C'], correct: 2 },
];
export const INTERVIEW_QUESTIONS = [
  { text: '任务要求含糊，你怎么开始？', options: ['先核对目标、验收和期限', '立即做完再说', '等别人分配每一步'], correct: 0 },
  { text: '项目出现错误，你怎么处理？', options: ['悄悄遮盖', '报告影响，提出修复方案', '只解释不是自己的责任'], correct: 1 },
  { text: '面试官要求无薪试岗一整月。', options: ['先签下任何文件', '免费越久越有诚意', '要求明确薪酬与试用合同'], correct: 2 },
  { text: '你不熟悉的一项技能被问到了。', options: ['说自己精通', '坦诚边界，说明学习与实践方法', '拒绝继续交流'], correct: 1 },
  { text: '团队进度落后，你如何协调？', options: ['明确优先级和分工，重新确认期限', '要求所有人一直熬夜', '只催促不沟通'], correct: 0 },
];
export const BUDGET_QUESTIONS = [
  { text: '本周预算 400，住房 160、饮食 95。先安排什么？', options: ['买全部新装饰', '先留 255 支付必需支出', '先全投高杠杆合约'], correct: 1 },
  { text: '支付必需支出后剩 145，怎样留余地？', options: ['留应急金 100，再安排娱乐', '剩下全部花完', '借更多钱消费'], correct: 0 },
  { text: '有稳定治疗的每周支出，应如何记账？', options: ['忘掉，下次再说', '列入固定必要支出', '当成意外不管'], correct: 1 },
  { text: '未来 4 周收入不确定。', options: ['按最高收入安排支出', '按保守收入做预算并留缓冲', '用所有储备支付娱乐'], correct: 1 },
  { text: '一项交易承诺高回报零风险。', options: ['不必核对', '借钱追加', '检查费用与损失边界，保留生活费'], correct: 2 },
];
export function memoryBoard(seed: number) { const board = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]; for (let i = board.length - 1; i > 0; i--) { const j = Math.floor(roll(seed, i + 43) * (i + 1)); [board[i], board[j]] = [board[j], board[i]]; } return board; }
export function matchedCards(seed: number, answers: number[]) { const board = memoryBoard(seed), matched = new Set<number>(); for (let i = 0; i + 1 < answers.length; i += 2) if (answers[i] !== answers[i + 1] && board[answers[i]] === board[answers[i + 1]]) { matched.add(answers[i]); matched.add(answers[i + 1]); } return matched; }
export function startMiniGame(g: GameState, id: string, target = ''): LifeResult {
  const lock = lifeBusy(g); if (lock) return { game: g, error: lock, message: '' }; const mini = MINI_GAMES.find(m => m.id === id);
  if (!mini || g.life.actions >= 3 || g.life.used.includes(`game:${id}`) || g.stats.money < mini.price) return { game: g, error: '本周行动不足、已经玩过该游戏，或现金不足。', message: '' };
  const n = structuredClone(g); n.updatedAt = new Date().toISOString(); n.stats.money -= mini.price;n.life.economy.expenses+=mini.price;n.life.economy.ledger.unshift({week:n.life.weeks,label:mini.name+'入场费',amount:-mini.price});n.life.economy.ledger=n.life.economy.ledger.slice(0,160); n.life.actions++; n.life.used.push(`game:${id}`); n.life.game = { id, seed: n.seed, week: n.life.weeks, answers: [], target }; return { game: n, message: '小游戏已开始，完成或退出后继续生活。' };
}
export function answerMiniGame(g: GameState, answer: number): LifeResult {
  const mini = g.life.game; if (!mini || g.life.death || !Number.isInteger(answer)) return { game: g, error: '没有进行中的游戏。', message: '' };
  const max = mini.id === 'memory' ? 11 : mini.id === 'rhythm' ? 1000 : 2;
  if (answer < 0 || answer > max || mini.id === 'memory' && (matchedCards(mini.seed, mini.answers).has(answer) || mini.answers.length % 2 === 1 && mini.answers.at(-1) === answer)) return { game: g, error: '这次输入无效。', message: '' };
  const n = structuredClone(g); n.updatedAt = new Date().toISOString(); n.life.game!.answers.push(answer); const answers = n.life.game!.answers;
  const done = mini.id === 'memory' ? matchedCards(mini.seed, answers).size === 12 || answers.length >= 48 : answers.length >= (mini.id === 'rhythm' ? 8 : 5);
  if (!done) return { game: n, message: '' };
  let score = 0;
  if (mini.id === 'memory') score = Math.round(matchedCards(mini.seed, answers).size / 12 * Math.max(20, 100 - (answers.length - 12) * 2));
  else if (mini.id === 'rhythm') score = Math.round(answers.reduce((sum, ms) => sum + Math.max(0, 100 - Math.abs(ms - 500) / 3), 0) / 8);
  else { const questions = mini.id === 'interview' ? INTERVIEW_QUESTIONS : mini.id === 'budget' ? BUDGET_QUESTIONS : LOGIC_QUESTIONS; score = questions.filter((q, i) => q.correct === answers[i]).length * 20; }
  n.life.scores[mini.id] = score; n.stats.mood = limit(n.stats.mood + Math.round(score / 12));
  if (mini.id === 'logic') n.life.skills.technical = limit(n.life.skills.technical + score / 100); if (mini.id === 'interview') n.life.skills.communication = limit(n.life.skills.communication + 1);
  n.life.memories.unshift({ week: n.life.weeks, title: MINI_GAMES.find(m => m.id === mini.id)!.name, text: `本次成绩 ${score} 分。${mini.id === 'interview' ? '成绩可用于本周求职。' : '娱乐没有现金奖池。'}` }); n.life.memories = n.life.memories.slice(0, 180); n.life.game = null;
  return { game: n, message: `完成，${score} 分${mini.id === 'interview' ? '，可以投递符合条件的岗位。' : '。'}` };
}
export function abandonMiniGame(g: GameState): LifeResult { if (!g.life.game) return { game: g, message: '' }; const n = structuredClone(g); n.updatedAt = new Date().toISOString(); n.life.scores[n.life.game!.id] = 0; n.life.game = null; return { game: n, message: '已退出，本周行动与入场费不退回。' }; }
