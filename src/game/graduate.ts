import { CHARACTERS, ITEMS } from './data';
import type { GameState, GraduateOperation, GraduateState } from './types';

export const GRADUATE_CHAPTERS = [
  ['街角再遇见', '你们在一家旧书店重逢。这一次不谈排名和作业，各自聊最近读过的一本书，重新认识课桌之外的彼此。', '把对方当作一个具体的人，认真听完。', '各自选一本书，约定以后再交流。'],
  ['没有标准答案的晚餐', '一顿普通晚餐里，你们聊到不同的生活习惯。喜欢不意味着每件事都相同，各自的节奏都值得被听见。', '说清楚自己的习惯，也听对方的。', '一起安排一顿两个人都喜欢的饭。'],
  ['各自的忙碌', '大学课程、工作安排和日常生活挤在日历上。你们决定把期待说具体，不用随时在线证明感情。', '约定忙的时候怎样联系。', '把一次见面安排到双方都方便的时间。'],
  ['一张写着界限的便签', '你们认真讨论公开关系、亲近和独处。过去的身份已经结束，现在的相处由两个成年人一起作决定。', '把愿意与暂时不愿意的事情说明白。', '约定任何时候都可以调整边界。'],
  ['一起走过雨天', '这天的计划被雨打乱，你们在屋檐下聊起最近的疲惫。没有谁负责拯救另一个人，但可以把关心落实到具体的小事。', '听完对方的困难，再讨论能做什么。', '分享自己的近况，也保留各自的空间。'],
  ['下一页的两个人', '半年过去，最初的心动变成了许多认真履行的小约定。你们把下一次旅行和各自的目标写进日历，不急着替未来作出全部答案。', '写下共同的期待，也写下个人的目标。', '留一封以后再读的信，珍惜现在。'],
] as const;
const OPERATIONS: GraduateOperation[] = ['reunion', 'meet', 'talk', 'confess', 'date', 'hand', 'hug', 'kiss', 'birthday', 'breakup', ...GRADUATE_CHAPTERS.map((_, index) => `chapter-${index}` as GraduateOperation)];
const limit = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
export function createGraduate(): GraduateState { return { unlocked: false, month: 0, actions: 0, trust: 0, affection: 0, understanding: 0, status: 'friendship', partner: null, sinceMonth: -1, lastConfessMonth: -3, lastBreakupMonth: -1, meetMonths: [], contactMonths: [], giftMonths: [], dateMonths: [], touchMonths: [], touchAllowed: true, following: false, pending: null, memories: [] }; }
function patch(game: GameState, state: Partial<GraduateState>): GameState { return { ...game, graduate: { ...game.graduate, ...state }, updatedAt: new Date().toISOString() }; }
export function graduateLock(game: GameState) { return !game.started || game.phase !== 'ending' ? '完成高考、志愿投档与毕业后开放' : game.pendingEvent || game.romance.active ? '先收好当前故事' : null; }
export function unlockGraduate(game: GameState): { game: GameState; error?: string } {
  const error = graduateLock(game); if (error) return { game, error };
  return game.graduate.unlocked ? { game } : { game: patch(game, { unlocked: true, trust: Math.min(50, 20 + Math.round(game.relations.teacher * .3)), understanding: 10 }) };
}
export function graduateDate(game: GameState) { const date = new Date(Date.UTC(2027, 8 + game.graduate.month, 1)); return `${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月`; }
function ready(game: GameState) { return graduateLock(game) ?? (!game.graduate.unlocked ? '先开始毕业后的重逢' : game.graduate.pending ? '先收好当前这一页' : null); }
export function graduateSceneLock(game: GameState, operation: GraduateOperation) {
  const error = ready(game); if (error) return error;
  const state = game.graduate;
  if (!OPERATIONS.includes(operation)) return '没有这段故事';
  if (operation === 'reunion' && state.memories.some(memory => memory.operation === 'reunion')) return '重逢已经收进回忆';
  if (operation !== 'reunion' && !state.memories.some(memory => memory.operation === 'reunion')) return '先完成毕业后的重逢';
  if (operation === 'meet' && state.meetMonths.includes(state.month)) return '本月已经见面，下个月再约';
  if (operation === 'talk' && state.memories.some(memory => memory.operation === 'talk' && memory.month === state.month)) return '本月已经认真沟通过';
  if (operation === 'confess') {
    if (game.social.partner) return `你仍与${CHARACTERS[game.social.partner].name}交往，请先认真处理现有关系`;
    if (state.partner) return '已经是恋人';
    if (state.month - state.lastConfessMonth < 3) return '表白后给彼此至少 3 个月的时间';
    if (state.status === 'broken' && (state.month - state.lastBreakupMonth < 3 || !state.memories.some(memory => memory.operation === 'talk' && memory.month > state.lastBreakupMonth))) return '分开后先留出 3 个月并认真沟通，再讨论重新开始';
    if (state.trust < 65 || state.affection < 35 || state.understanding < 45 || state.meetMonths.length < 3) return `需要信任 65、心动 35、了解 45，以及 3 个不同月的见面（已 ${state.meetMonths.length} 月）`;
  }
  if (['date', 'hand', 'hug', 'kiss', 'breakup'].includes(operation) || operation.startsWith('chapter-')) {
    if (state.partner !== 'teacher') return '明确交往后解锁';
  }
  if (operation === 'date' && state.dateMonths.includes(state.month)) return '本月已经约会';
  if (['hand', 'hug', 'kiss'].includes(operation)) {
    if (!state.touchAllowed) return '尊重当前的亲近边界';
    if (state.touchMonths.includes(state.month)) return '本月已留下亲近回忆';
    if (operation === 'kiss' && (state.trust < 75 || state.affection < 60)) return '轻吻需要信任 75、心动 60';
  }
  if (operation === 'birthday') {
    if (state.month % 12 !== 1) return '老陈的生日在 10 月 26 日，10 月可庆祝';
    if (state.memories.some(memory => memory.operation === 'birthday' && memory.month === state.month)) return '今年的生日已经庆祝';
  }
  if (operation.startsWith('chapter-')) {
    const index = Number(operation.slice(-1));
    if (state.memories.some(memory => memory.operation === operation)) return '这一章已收好';
    const previous = state.memories.find(memory => memory.operation === `chapter-${index - 1}`);
    if (index > 0 && (!previous || previous.month >= state.month)) return '先完成上一章，并等到下一个月';
    if (state.month - state.sinceMonth < index) return `交往满 ${index} 个月后继续`;
  }
  return !['hand', 'hug', 'kiss', 'breakup'].includes(operation) && state.actions >= 2 ? '本月的 2 次相处行动已用完' : null;
}
export function beginGraduateScene(game: GameState, operation: GraduateOperation): { game: GameState; error?: string } {
  const error = graduateSceneLock(game, operation); if (error) return { game, error };
  const cost = ['hand', 'hug', 'kiss', 'breakup'].includes(operation) ? 0 : 1;
  return { game: patch(game, { pending: operation, actions: game.graduate.actions + cost }) };
}
export function graduateStory(game: GameState) {
  const operation = game.graduate.pending; if (!operation) return null;
  if (operation.startsWith('chapter-')) { const [title, text, first, second] = GRADUATE_CHAPTERS[Number(operation.slice(-1))]; return { title, text, choices: [first, second], results: ['这份共同的约定被认真收好。你们理解彼此，也保留各自的生活。', '你们一起写下了下一步。关系没有替任何人取消独立选择。'] }; }
  const stories: Record<string, [string, string, string, string, string, string]> = {
    reunion: ['毕业一年后的重逢', '2027 年 9 月，你已经在大学生活一年多。老陈不再承担你的授课、评分或管理；你们在校友活动后的书店重逢，先从各自的近况聊起。', '聊聊这一年的生活与变化。', '谈谈最近读过的一本书。', '过去的课堂留在过去。你们从普通朋友重新认识彼此。', '你们约定以后偶尔分享读书的心得，开始认识课桌之外的生活。'],
    meet: ['留给一次普通见面的时间', '你们各自确认了空闲时间，在书店旁坐下来。今天的聊天没有作业和成绩，是两个成年人的日常。', '听听他的近况，也分享自己的生活。', '聊聊各自最近喜欢的事情。', '这次见面让你们更理解彼此。下次仍要一起确认时间。', '共同的话题没有要求两个人变得一模一样。你们聊得很轻松。'],
    talk: ['把想法认真说清楚', '你们聊起近来的期待、距离与变化。沟通可以为了继续相处，也可以为了友好地保留距离。', '说清楚自己的期待，并认真倾听。', '承认需要空间，仍尊重彼此。', '你们认真听完了对方。下一次怎样相处，可以共同决定。', '这次谈话让距离也被理解，关系不需要靠催促维持。'],
    confess: ['这一次，把喜欢说清楚', '经过几个月的独立相处，你决定认真表达心意。老陈也已经表达过好感：“过去的身份不会成为你必须答应的理由，现在我们可以平等选择。”', '我也愿意。我们认真开始交往吧。', '我想继续做朋友，先不开始恋爱。', '你们明确答应了交往，也约好继续各自的学业、工作与生活。', '对方尊重了你的选择。友谊可以继续，喜欢不会变成一项义务。'],
    date: ['两个人选择的约会', '你们共同挑选了一场展览与一段散步。不需要把约会安排得完美，舒服的节奏比流程更值得被记住。', '一起慢慢看完展览。', '换成一段更安静的散步。', '这次约会被两个人认真记住，各自的喜好都被考虑。', '你们一起调整了计划，也一起度过一个普通而舒服的下午。'],
    hand: ['愿意的时候，牵一会儿手', '他先问你是否愿意。你可以答应，也可以保留现在的距离。', '双方愿意，轻轻牵手。', '今天先并肩走就好。', '你们轻轻牵住了手，把愿意说在了前面。', '你们继续并肩走。边界被尊重，今天一样很好。'],
    hug: ['一个征求过同意的拥抱', '你们问过对方的想法，再决定是否用一个拥抱表达关心。', '我愿意，抱一会儿吧。', '我现在更想安静聊一聊。', '拥抱之后，你们仍按各自舒服的节奏相处。', '你们认真聊了一会儿，没有把关心限定为某一种动作。'],
    kiss: ['一个轻轻的吻', '你们再次确认彼此愿意，才慢慢靠近。任何时候都可以改变主意。', '我愿意，轻轻吻一下。', '今天先不亲近，陪我坐一会儿。', '这个轻吻留在普通而温柔的回忆里。', '你们坐在一起，把一段安静的陪伴留给彼此。'],
    birthday: ['10 月的生日心意', game.graduate.partner ? '交往后的生日，你们把晚餐和一张亲手写的卡片留给彼此。愿望可以一起分享，也可以属于各自。' : '老陈的生日是 10 月 26 日。朋友之间的一句具体祝福和一段认真倾听，也可以让这一天变得特别。', '写一张认真具体的生日卡片。', '听听他这一年真正想做的事。', '生日祝福被收进回忆。被记住，不需要昂贵的礼物。', '你认真听完了他的愿望，也留下了属于朋友或恋人的祝福。'],
    breakup: ['认真决定下一步', '你们不回避这次谈话。可以明确分开，保留曾经的回忆，也可以继续交往并再讨论相处方式。', '明确分开，各自继续生活。', '继续交往，之后再认真沟通。', '你们好好说了再见。同行结束，已有回忆保留，以后重新开始仍需新的明确答应。', '你们继续交往，这次谈话也提醒彼此把期待认真说清楚。'],
  };
  const [title, text, first, second, one, two] = stories[operation]; return { title, text, choices: [first, second], results: [one, two] };
}
export function resolveGraduateScene(game: GameState, choice: number): { game: GameState; error?: string } {
  const operation = game.graduate.pending, story = graduateStory(game);
  if (graduateLock(game) || !operation || !story || ![0, 1].includes(choice)) return { game, error: '当前没有这段故事或选择无效' };
  const state = game.graduate, touching = ['hand', 'hug', 'kiss'].includes(operation), change: Partial<GraduateState> = { pending: null };
  if (!touching || choice === 0) { change.trust = limit(state.trust + 8); change.affection = limit(state.affection + 7); change.understanding = limit(state.understanding + 8); }
  if (operation === 'meet' || operation === 'reunion') change.meetMonths = [...new Set([...state.meetMonths, state.month])];
  if (operation === 'date') change.dateMonths = [...state.dateMonths, state.month];
  if (touching) change.touchMonths = [...state.touchMonths, state.month];
  if (operation === 'confess') { change.lastConfessMonth = state.month; if (choice === 0) { change.partner = 'teacher'; change.status = 'dating'; change.sinceMonth = state.month; } }
  if (operation === 'breakup' && choice === 0) { change.partner = null; change.status = 'broken'; change.sinceMonth = -1; change.following = false; change.lastBreakupMonth = state.month; change.affection = limit(state.affection - 15); }
  change.memories = [...state.memories, { id: `graduate:${operation}:${state.month}:${state.memories.length}`, operation, month: state.month, choice, title: story.title, result: story.results[choice] }];
  const next = patch(game, change);
  return { game: { ...next, social: { ...next.social, messages: [...next.social.messages, { id: `graduate-chat:${state.month}:${next.social.messages.length}`, character: 'teacher', side: 'incoming', text: `【毕业后第 ${state.month + 1} 月】${story.results[choice]}`, week: Math.min(39, game.week), read: false }] } } };
}
export function contactGraduate(game: GameState): { game: GameState; error?: string } {
  const error = ready(game); if (error) return { game, error };
  const state = game.graduate; if (!state.meetMonths.length) return { game, error: '先完成毕业后的重逢' }; if (state.contactMonths.includes(state.month)) return { game, error: '本月已经主动联系过，下个月再聊新话题' };
  const next = patch(game, { contactMonths: [...state.contactMonths, state.month], trust: limit(state.trust + 5), affection: limit(state.affection + 4), understanding: limit(state.understanding + 6) });
  return { game: { ...next, social: { ...next.social, messages: [...next.social.messages, { id: `graduate-letter:${state.month}:out`, character: 'teacher', side: 'outgoing', text: `【毕业后第 ${state.month + 1} 月】最近遇到一件想和你分享的事。你有空时再回就好。`, week: Math.min(39, game.week), read: true }, { id: `graduate-letter:${state.month}:in`, character: 'teacher', side: 'incoming', text: `【毕业后第 ${state.month + 1} 月】我会认真听，也想和你分享最近的生活。下次见面前，我们一起确认时间。`, week: Math.min(39, game.week), read: false }] } } };
}
export function giftGraduate(game: GameState, itemId: string): { game: GameState; error?: string } {
  const error = ready(game); if (error) return { game, error };
  if (!game.graduate.meetMonths.length) return { game, error: '先完成毕业后的重逢' };
  const state = game.graduate, item = ITEMS.find(item => item.id === itemId); if (!item) return { game, error: '没有这个礼物' };
  if (state.giftMonths.includes(state.month)) return { game, error: '本月已经送过礼物' };
  const owned = game.inventory[itemId] > 0; if (!owned && game.stats.money < item.price) return { game, error: '零花钱不足，可以先用一条消息表达关心' };
  const bonus = state.month % 12 === 1 ? 1.5 : 1;
  const next = patch({ ...game, inventory: owned ? { ...game.inventory, [itemId]: game.inventory[itemId] - 1 } : game.inventory, stats: { ...game.stats, money: game.stats.money - (owned ? 0 : item.price) } }, { giftMonths: [...state.giftMonths, state.month], trust: limit(state.trust + Math.ceil(6 * bonus)), affection: limit(state.affection + Math.ceil(4 * bonus)), understanding: limit(state.understanding + Math.ceil(3 * bonus)) });
  return { game: { ...next, social: { ...next.social, messages: [...next.social.messages, { id: `graduate-gift:${state.month}`, character: 'teacher', side: 'incoming', text: `【毕业后第 ${state.month + 1} 月】谢谢这份${item.name}。${bonus > 1 ? '也谢谢你记得我的生日。' : '下次见面时，我们再认真聊聊近况。'}`, week: Math.min(39, game.week), read: false }] } } };
}
export function advanceGraduateMonth(game: GameState): { game: GameState; error?: string } {
  const error = ready(game); if (error) return { game, error };
  if (game.graduate.month >= 23) return { game, error: '这两年的手记已经收好，可以继续回看与相处' };
  return { game: patch({ ...game, stats: { ...game.stats, money: Math.min(999999, game.stats.money + 60) } }, { month: game.graduate.month + 1, actions: 0 }) };
}
export function setGraduateFollowing(game: GameState, enabled: boolean): { game: GameState; error?: string } { const error = ready(game); return error ? { game, error } : game.graduate.partner !== 'teacher' ? { game, error: '明确交往后可邀请同行' } : { game: patch(game, { following: enabled }) }; }
export function setGraduateBoundary(game: GameState, enabled: boolean): { game: GameState; error?: string } { const error = ready(game); return error ? { game, error } : { game: patch(game, { touchAllowed: enabled }) }; }
export function validateGraduate(raw: unknown, game: GameState): GraduateState | null {
  if (raw === undefined) return createGraduate();
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as GraduateState, numeric = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;
  if (typeof value.unlocked !== 'boolean' || !numeric(value.month, 0, 23) || !numeric(value.actions, 0, 2) || ['trust', 'affection', 'understanding'].some(key => !numeric(value[key as 'trust'], 0, 100))) return null;
  if (!['friendship', 'dating', 'broken'].includes(value.status) || ![null, 'teacher'].includes(value.partner) || (value.partner === 'teacher') !== (value.status === 'dating') || value.partner && game.social.partner) return null;
  if (value.unlocked && (!game.started || game.phase !== 'ending') || !numeric(value.sinceMonth, -1, value.month) || !numeric(value.lastConfessMonth, -3, value.month) || !numeric(value.lastBreakupMonth, -1, value.month) || value.partner && value.sinceMonth < 0) return null;
  if (typeof value.touchAllowed !== 'boolean' || typeof value.following !== 'boolean' || value.following && value.partner !== 'teacher' || value.pending !== null && !OPERATIONS.includes(value.pending)) return null;
  const keys = ['meetMonths', 'contactMonths', 'giftMonths', 'dateMonths', 'touchMonths'] as const;
  if (keys.some(key => !Array.isArray(value[key]) || value[key].length > 24 || new Set(value[key]).size !== value[key].length || value[key].some(month => !numeric(month, 0, value.month)))) return null;
  if (!Array.isArray(value.memories) || value.memories.length > 256 || new Set(value.memories.map(memory => memory?.id)).size !== value.memories.length || value.memories.some(memory => !memory || typeof memory.id !== 'string' || !OPERATIONS.includes(memory.operation) || !numeric(memory.month, 0, value.month) || !numeric(memory.choice, 0, 1) || typeof memory.title !== 'string' || memory.title.length > 100 || typeof memory.result !== 'string' || memory.result.length > 1000)) return null;
  if (value.pending && (game.pendingEvent || game.romance.active)) return null;
  if (value.pending && (['date', 'hand', 'hug', 'kiss', 'breakup'].includes(value.pending) || value.pending.startsWith('chapter-')) && value.partner !== 'teacher') return null;
  if (value.pending === 'birthday' && value.month % 12 !== 1) return null;
  if (!value.unlocked && (value.status !== 'friendship' || value.sinceMonth !== -1 || value.lastConfessMonth !== -3 || value.lastBreakupMonth !== -1 || value.following || !value.touchAllowed)) return null;
  if (!value.unlocked && (value.month || value.actions || value.trust || value.affection || value.understanding || value.partner || value.pending || value.memories.length || keys.some(key => value[key].length))) return null;
  const result = { ...createGraduate(), ...Object.fromEntries(Object.keys(createGraduate()).map(key => [key, value[key as keyof GraduateState]])) } as GraduateState;
  for (const key of keys) result[key] = [...value[key]];
  result.memories = value.memories.map(memory => ({ ...memory }));
  return result;
}
