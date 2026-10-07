import { ACTIONS, CHARACTERS, PLACES, ROMANCE_IDS } from './data';
import { EVENTS } from './events';
import { validateProjects } from './projects';
import type { CharacterId, GameState, QuestDefinition, QuestObjective, QuestState } from './types';

const eventObjective = (id: string): QuestObjective => ({ text: `完成「${EVENTS.find(event => event.id === id)?.title ?? id}」`, goal: 1, progress: game => Number(game.seenEvents.includes(id)), target: { panel: 'week' } });
const actionObjective = (ids: string[], goal: number, placeId: string): QuestObjective => ({ text: `${ids.map(id => ACTIONS.find(action => action.id === id)?.name).join(' / ')}，累计 ${goal} 次`, goal, progress: game => game.actionLog.filter(log => ids.some(id => ACTIONS.find(action => action.id === id)?.name === log.text)).length, target: { placeId } });
const main: [string, string, string, number][] = [
  ['first-day', '开场 · 我的名字', '在第一天写下自己的答案，高三从这里开始。', 0],
  ['midterm', '秋天 · 分数之外', '走过第一次期中考试，再看看排名以外的自己。', 8],
  ['winter-holiday', '冬天 · 留一点自己的时间', '寒假不只有计划表，也有可以自己安排的生活。', 16],
  ['hundred-days', '春天 · 走自己的百日', '听见百日倒计时，也记得这一百天属于你。', 26],
  ['mock-two', '再出发 · 面对第二次模拟', '承认紧张，整理状态，继续走向自己的答案。', 32],
  ['wish-form', '选择 · 先问自己的喜欢', '志愿单上的学校与专业，慢慢成为你想过的生活。', 35],
  ['graduation-photo', '告别 · 把身边的人留下', '合影里不只是一排座位，还有这一年一起走过的人。', 37],
  ['last-lesson', '最后一课 · 认真听见自己', '把这堂课收好，再去写下一段新的故事。', 38],
];
export const QUESTS: QuestDefinition[] = main.map(([eventId, title, description, minWeek], index) => ({ id: `main-${index + 1}`, kind: 'main', chain: '属于我的高三', title, description, minWeek, requires: index ? `main-${index}` : undefined, objectives: [eventObjective(eventId)], reward: { mood: 4, autonomy: 2, money: 20 } }));
QUESTS.push(
  { id: 'main-9', kind: 'main', chain: '属于我的高三', title: '考场 · 写完自己的答卷', description: '认真走过模拟高考。成绩是一段记录，不是你全部的名字。', minWeek: 40, requires: 'main-8', objectives: [{ text: '完成模拟高考并查看成绩', goal: 1, progress: game => Number(game.examScore !== null), target: { panel: 'exam' } }], reward: { mood: 5, autonomy: 3 } },
  { id: 'main-10', kind: 'main', chain: '属于我的高三', title: '盛夏 · 人生继续向前', description: '完成志愿与毕业纪念，把未来交还给自己。', minWeek: 40, requires: 'main-9', objectives: [{ text: '完成志愿投档，进入毕业终章', goal: 1, progress: game => Number(game.phase === 'ending'), target: { panel: 'universities' } }], reward: { mood: 8, autonomy: 5 } },
);

const names = [...new Set(EVENTS.flatMap(event => event.storyline ? [event.storyline] : []))];
for (const [lineIndex, name] of names.entries()) {
  const events = EVENTS.filter(event => event.storyline === name);
  const first = events.find(event => !event.requires)!;
  const middle = events.find(event => event.requires?.eventId === first.id)!;
  const endings = events.filter(event => event.requires?.eventId === middle.id);
  for (const [stageIndex, options] of [[first], [middle], endings].entries()) {
    QUESTS.push({ id: `story-${lineIndex + 1}-${stageIndex + 1}`, kind: 'side', chain: name, title: `${['起笔', '转折', '结局'][stageIndex]} · ${options[0].title}`, description: stageIndex === 2 ? '之前的选择会改变这一页。两条结局都能完成这段旅程。' : options[0].paragraphs[0], minWeek: options[0].minWeek, requires: stageIndex ? `story-${lineIndex + 1}-${stageIndex}` : undefined, character: options[0].speaker, objectives: [{ text: `阅读这一阶段的${options.length > 1 ? '任一结局' : '地点故事'}`, goal: 1, eventIds: options.map(event => event.id), progress: game => Number(options.some(event => game.seenEvents.includes(event.id))), target: { placeId: options[0].placeId } }], reward: { money: 15 + stageIndex * 10, mood: 3, autonomy: 2 } });
  }
}
const exploreObjective = (goal: number): QuestObjective => ({ text: `探索 ${goal} 个不同区域的地点`, goal, progress: game => new Set(game.quests.visitedPlaces.map(id => PLACES.find(place => place.id === id)?.scene)).size, target: { panel: 'world-map' } });
QUESTS.push(
  ...[3, 6, 9].map((goal, index): QuestDefinition => ({ id: `explore-${index + 1}`, kind: 'side', chain: '自己的城市地图', title: ['城市初识', '熟悉的街区', '把自己的生活地图画完整'][index], description: '离开熟悉的课桌，去不同区域的地点看看。已经去过的地点会保留记录。', minWeek: 0, requires: index ? `explore-${index}` : undefined, objectives: [exploreObjective(goal)], reward: { money: 25 + index * 10, autonomy: 3 } })),
  { id: 'side-reading', kind: 'side', chain: '好奇心的练习', title: '读书不是只为考试', description: '在不同的一天留一点阅读时间，把一件不在考纲里的事弄明白。', minWeek: 0, objectives: [actionObjective(['read', 'research', 'quiet-reading'], 3, 'library-shelves')], reward: { mood: 6, autonomy: 3 } },
  { id: 'side-science', kind: 'side', chain: '好奇心的练习', title: '向真实世界提问', description: '用双手做实验，也看看生命真正怎样生长。', minWeek: 0, objectives: [actionObjective(['experiment'], 1, 'physics-lab'), actionObjective(['plant'], 1, 'greenhouse')], reward: { money: 25, autonomy: 4 } },
  { id: 'side-voice', kind: 'side', chain: '好奇心的练习', title: '留一段自己的声音', description: '画、排练和广播都可以只是喜欢，不必先变成特长证明。', minWeek: 0, objectives: [actionObjective(['paint'], 1, 'art-studio'), actionObjective(['rehearsal'], 1, 'music-room'), actionObjective(['broadcast'], 1, 'radio-room')], reward: { mood: 8, autonomy: 4 } },
  { id: 'side-help', kind: 'side', chain: '街区里的生活', title: '认真帮助一个人', description: '多去几次，再帮忙整理书摊。帮助不必先拍成果照片。', minWeek: 0, objectives: [actionObjective(['volunteer'], 2, 'volunteer-hut'), actionObjective(['stall-help'], 1, 'secondhand-stall')], reward: { money: 35, autonomy: 4 } },
  { id: 'side-future', kind: 'side', chain: '街区里的生活', title: '未来不止一个分数', description: '看一次校园，听一次专业日常，选一个自己想了解的方向。', minWeek: 0, objectives: [actionObjective(['open-day'], 1, 'university-gate'), actionObjective(['major-talk'], 1, 'university-lake'), { text: '收藏至少 1 个院校与专业志愿', goal: 1, progress: game => game.wishes.length, target: { panel: 'universities' } }], reward: { money: 25, autonomy: 5 } },
);
for (const character of ROMANCE_IDS) {
  const target = { character };
  const initiatives = (game: GameState) => game.social.initiatives.filter(item => item.topicId.startsWith(`${character}-`)).length;
  const replies = (game: GameState) => game.social.replies.filter(item => item.scriptId.startsWith(`${character}-`)).length;
  const stages: [string, string, number, QuestObjective[]][] = [
    ['第一句，由我先发', '不只等对方找来。主动开口，也认真回应对方。', 0, [{ text: '主动发送 1 组消息', goal: 1, progress: initiatives, target }, { text: '回复对方 1 组消息', goal: 1, progress: replies, target }]],
    ['一点一点了解彼此', '见面、主动联系，在普通的日子里建立信任。', 0, [{ text: '主动发送 2 组不同消息', goal: 2, progress: initiatives, target }, { text: '信任达到 35', goal: 35, progress: game => game.social.bonds[character].trust, target }, { text: '见面至少 1 次', goal: 1, progress: game => game.social.bonds[character].meetings, target }]],
    ['心意，也包括边界', '可以回应心动，也可以选择友情。把自己的答案认真告诉对方。', 8, [{ text: '回应心动消息，或明确选择友情', goal: 1, progress: game => Number(game.social.replies.some(item => item.scriptId === `${character}-heart`) || game.social.bonds[character].route === 'friendship'), target }]],
    ['各自有路，也记得彼此', '用整个学年的相处，走到一次认真告别。友情与恋爱都有自己的结尾。', 34, [{ text: '完成 6 段日常聊天', goal: 6, progress: game => game.social.replies.filter(item => item.scriptId.startsWith(`${character}-daily-`)).length, target }, { text: '读完恋爱纪念，或珍惜地继续做朋友', goal: 1, progress: game => Number(game.social.bonds[character].route === 'friendship' || game.social.replies.some(item => item.scriptId === `${character}-summer`)), target }]],
  ];
  stages.forEach(([title, description, minWeek, objectives], index) => QUESTS.push({ id: `character-${character}-${index + 1}`, kind: 'character', chain: `和${CHARACTERS[character].name}的一年`, title, description, minWeek, requires: index ? `character-${character}-${index}` : undefined, character, objectives, reward: { mood: 4, bonds: { [character]: { trust: 2, understanding: 3 } } } }));
}
for (const character of ['mom', 'teacher'] as CharacterId[]) {
  [1, 3].forEach((goal, index) => QUESTS.push({ id: `character-${character}-${index + 1}`, kind: 'character', chain: `和${CHARACTERS[character].name}的一年`, title: index ? '把真实的话慢慢说完' : '换我先来找你', description: '关系不只由成绩组成。主动问一句，也认真听完回答。', minWeek: index ? 16 : 0, requires: index ? `character-${character}-1` : undefined, character, objectives: [{ text: `主动发送 ${goal} 组不同消息`, goal, progress: game => game.social.initiatives.filter(item => item.topicId.startsWith(`${character}-`)).length, target: { character } }], reward: { mood: 4, autonomy: 2 } }));
}

export const createQuestState = (): QuestState => ({ claimed: [], tracked: ['story-1-1', 'story-2-1'], visitedPlaces: [], projects: {} });
export function questComplete(game: GameState, quest: QuestDefinition): boolean {
  return game.started && game.week >= quest.minWeek && (!quest.requires || questComplete(game, QUESTS.find(item => item.id === quest.requires)!)) && quest.objectives.every(objective => objective.progress(game) >= objective.goal);
}
export function questView(game: GameState, quest: QuestDefinition) {
  const objectives = quest.objectives.map(objective => ({ ...objective, current: Math.min(objective.goal, Math.max(0, objective.progress(game))) }));
  const lock = !game.started ? '开启高三后解锁' : quest.requires && !questComplete(game, QUESTS.find(item => item.id === quest.requires)!) ? `先完成「${QUESTS.find(item => item.id === quest.requires)?.title}」` : game.week < quest.minWeek ? `第 ${Math.min(40, quest.minWeek + 1)} 周继续` : null;
  const complete = !lock && objectives.every(objective => objective.current >= objective.goal);
  return { ...quest, objectives, lock, complete, status: game.quests.claimed.includes(quest.id) ? 'claimed' as const : lock ? 'locked' as const : complete ? 'ready' as const : 'active' as const };
}
export const getQuestViews = (game: GameState) => QUESTS.map(quest => questView(game, quest));
export function recordPlaceVisit(game: GameState, placeId: string): GameState {
  if (!game.started || !PLACES.some(place => place.id === placeId) || game.quests.visitedPlaces.includes(placeId)) return game;
  return { ...game, quests: { ...game.quests, visitedPlaces: [...game.quests.visitedPlaces, placeId] }, updatedAt: new Date().toISOString() };
}
export function toggleQuestTracking(game: GameState, id: string): GameState {
  if (!QUESTS.some(quest => quest.id === id && quest.kind !== 'main')) return game;
  const tracked = game.quests.tracked.includes(id) ? game.quests.tracked.filter(item => item !== id) : [...game.quests.tracked, id].slice(-2);
  return { ...game, quests: { ...game.quests, tracked }, updatedAt: new Date().toISOString() };
}
export function validateQuests(raw: unknown, week: number): QuestState | null {
  if (raw === undefined) return createQuestState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const item = raw as QuestState;
  const validIds = (ids: unknown, limit: number) => Array.isArray(ids) && ids.length <= limit && new Set(ids).size === ids.length && ids.every(id => typeof id === 'string' && QUESTS.some(quest => quest.id === id));
  if (!validIds(item.claimed, QUESTS.length) || !validIds(item.tracked, 2) || !Array.isArray(item.visitedPlaces) || item.visitedPlaces.length > PLACES.length || new Set(item.visitedPlaces).size !== item.visitedPlaces.length || !item.visitedPlaces.every(id => PLACES.some(place => place.id === id))) return null;
  const projects = item.projects === undefined ? {} : validateProjects(item.projects, week);
  return projects ? { claimed: [...item.claimed], tracked: [...item.tracked], visitedPlaces: [...item.visitedPlaces], projects } : null;
}
