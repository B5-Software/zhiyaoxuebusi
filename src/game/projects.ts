import { CHARACTERS, ROMANCE_IDS } from './data';
import { EVENTS } from './events';
import { ROMANCE_PLACES } from './romanceData';
import { romanceBusy } from './romance';
import type { GameState, LongProject, ProjectProgress, QuestObjective } from './types';

const eventGoal = (ids: string[]): QuestObjective => ({ text: ids.length > 1 ? `完成「${EVENTS.find(event => event.id === ids[0])?.storyline}」的任一结局` : `阅读「${EVENTS.find(event => event.id === ids[0])?.title ?? '此地故事'}」`, goal: 1, eventIds: ids, progress: game => Number(ids.some(id => game.seenEvents.includes(id))), target: { placeId: EVENTS.find(event => event.id === ids[0])?.placeId } });

export function resolveObjectiveTarget(game: GameState, objective: QuestObjective) {
  const chosen = EVENTS.find(event => objective.eventIds?.includes(event.id) && (event.requires?.choiceIndex === undefined || game.history.some(entry => entry.eventId === event.requires?.eventId && entry.choiceIndex === event.requires?.choiceIndex)));
  return chosen?.placeId ? { ...objective.target, placeId: chosen.placeId } : objective.target;
}
const maps: [string, string, string, string, string, string, string][] = [
  ['zine', '一本属于我们的刊物', '从征稿、讨论到制作毕业刊物，把没有标准答案的生活留下。', 'reading-table', 'su', 'reading-circle', 'zine-start'],
  ['experiment', '把真实的数据留下', '测量、复核、做展示。数据不完美，也能成为下一组的起点。', 'physics-lab', 'teacher', 'experiment', 'experiment-start'],
  ['radio', '做一期自己的广播', '征集声音、排练节目，再把话筒交回同学们手中。', 'radio-room', 'tangtang', 'broadcast', 'stage-start'],
  ['family', '一次家人真正听见的对话', '先听彼此的担心，再共同约定边界，留时间把约定用在生活里。', 'river-path', 'mom', 'mom', 'walk-start'],
  ['market', '灯火里的小小书摊', '帮忙整理、听摊主讲故事，最后留下一份真实的生活记录。', 'secondhand-stall', 'zhou', 'stall-help', 'stall-start'],
  ['future', '给未来做一份生活地图', '先看课程与校园，再问自己的喜欢，为毕业后留下可以走的路线。', 'university-gate', 'teacher', 'open-day', 'future-start'],
];

// Resolve the authored arc by its first event, rather than tying progress to
// one particular ending. Both narrative branches count as a real conclusion.
export const LONG_PROJECTS: LongProject[] = maps.map(([id, title, description, placeId, character, actionId, startId]) => {
  const start = EVENTS.find(event => event.id === startId);
  const arc = EVENTS.filter(event => event.storyline === start?.storyline && !!start?.storyline);
  const first = arc.find(event => !event.requires)!;
  const middle = arc.find(event => event.requires?.eventId === first?.id)!;
  const endings = arc.filter(event => event.requires?.eventId === middle?.id);
  return { id: `project-${id}`, title, description, placeId, character: character as LongProject['character'], actionId, reward: { money: 65, mood: 8, autonomy: 5 }, stages: [
    { title: '筹备 · 找到想做的事', description: '先走进故事，并为这个项目认真投入一次行动。', weeks: 1, work: 1, objective: eventGoal([first?.id ?? startId]) },
    { title: '执行 · 让想法落地', description: '分两个游戏周继续投入。遇到分歧时，作出自己的选择。', weeks: 2, work: 2, objective: eventGoal([middle?.id ?? startId]) },
    { title: '收尾 · 留下自己的答案', description: '再用两个游戏周收好成果，把真正的结局记进手帐。', weeks: 2, work: 2, objective: eventGoal(endings.map(event => event.id)) },
  ] };
});

const peerProjects = {
  su: ['两个人的共读手册', '一起选书、交换批注，最后把想留给彼此的文字装订起来。', 'reading-table'],
  zhou: ['毕业前一起弹完的歌', '选一首歌，分周练习，再留一场不用比较名次的演出。', 'music-room'],
  zhixia: ['看见彼此的速写册', '从观察一束光到交换一页速写，把了解放在评分前面。', 'art-studio'],
  xinghe: ['一起补完整的星图', '记录问题、对照观察，最后把星图和未来的想法一起留下。', 'observatory'],
  tangtang: ['两个人的声音日记', '每周认真听一次，整理平常的小事，留一段只属于自己的声音。', 'radio-room'],
};
LONG_PROJECTS.push(...ROMANCE_IDS.map(character => {
  const [title, description, placeId] = peerProjects[character];
  const contact = { character };
  return { id: `project-${character}`, title, description, placeId, character, actionId: character, minTrust: 20, reward: { mood: 9, bonds: { [character]: { trust: 6, affection: 8, understanding: 8 } } }, stages: [
    { title: '筹备 · 由你先开口', description: `主动找${CHARACTERS[character].name}聊一件小事，再投入一次行动。`, weeks: 1, work: 1, objective: { text: '主动发送 1 组消息', goal: 1, progress: (game: GameState) => game.social.initiatives.filter(item => item.topicId.startsWith(`${character}-`)).length, target: contact } },
    { title: '执行 · 把相处留给彼此', description: '在不同游戏周安排两次投入，见面时也认真了解对方。', weeks: 2, work: 2, objective: { text: '彼此了解达到 15', goal: 15, progress: (game: GameState) => game.social.bonds[character].understanding, target: contact } },
    { title: '收尾 · 给关系留一份纪念', description: '再投入两周，第二次主动联系，把自己的心意说清楚。友情也能完成。', weeks: 2, work: 2, objective: { text: '主动发送 2 组不同消息', goal: 2, progress: (game: GameState) => game.social.initiatives.filter(item => item.topicId.startsWith(`${character}-`)).length, target: contact } },
  ] };
}));

const datingTitles = { su: '把盛夏写进共读册', zhou: '只给彼此的毕业合奏', zhixia: '两座城市的光与留白', xinghe: '下一次一起抬头的星图', tangtang: '给未来的双人声音日记' };
LONG_PROJECTS.push(...ROMANCE_IDS.map(character => ({
  id: `project-love-${character}`, title: datingTitles[character], description: `和${CHARACTERS[character].name}用至少六周留下专属纪念。四个阶段同时检查投入、时间和专属剧情；冷静或分手时暂停，回忆与进度保留。`,
  placeId: ROMANCE_PLACES[character], character, actionId: character, datingOnly: true,
  reward: { mood: 12, autonomy: 5, bonds: { [character]: { trust: 8, affection: 8, understanding: 10 } } },
  stages: [0, 1, 3, 5].map((scene, index) => ({
    title: ['开场 · 留一个共同的想法', '相处 · 允许不同的声音', '磨合 · 把分歧说清楚', '纪念 · 给未来留一页'][index],
    description: '每周投入一次行动，再在心事界面完成对应专属剧情。时间与条件都满足，周末继续下一阶段。',
    weeks: [1, 2, 2, 1][index], work: [1, 2, 2, 1][index],
    objective: { text: `完成第 ${scene + 1} 段恋爱专属剧情`, goal: 1, progress: (game: GameState) => Number(game.romance.memories.some(memory => memory.id.startsWith(`love-${character}-${scene}:`))), target: { panel: 'romance' as const, character } },
  })),
})));

export function projectStartLock(game: GameState, project: LongProject) {
  if (!game.started) return '开启高三后可接受';
  if (game.phase !== 'school') return '校园篇已结束，可以回看项目';
  if (game.pendingEvent || romanceBusy(game)) return '先收好眼前的故事';
  if (project.datingOnly && (game.social.partner !== project.character || game.romance.bonds[project.character as typeof ROMANCE_IDS[number]].status !== 'normal')) return '与对方正常交往后解锁这条专属长期任务';
  if (game.quests.projects[project.id]) return '已经接受这个长期任务';
  const duration = project.stages.reduce((sum, stage) => sum + Math.max(stage.weeks, stage.work), 0);
  if (game.week + duration > 40) return `至少需要 ${duration} 个游戏周，毕业前的时间不足`;
  if (project.minTrust && game.social.bonds[project.character as typeof ROMANCE_IDS[number]].trust < project.minTrust) return `先与${CHARACTERS[project.character].name}建立 ${project.minTrust} 信任`;
  return null;
}

export function advanceProjects(game: GameState, nextWeek: number): GameState['quests'] {
  let projects = game.quests.projects;
  for (const project of LONG_PROJECTS) {
    const progress = projects[project.id];
    if (!progress || progress.completedWeek !== null) continue;
    if (project.datingOnly && (game.social.partner !== project.character || game.romance.bonds[project.character as typeof ROMANCE_IDS[number]].status !== 'normal')) continue;
    const stage = project.stages[progress.stage];
    const work = progress.contributions.filter(item => item.stage === progress.stage).length;
    if (work < stage.work || nextWeek - progress.stageStartedWeeks[progress.stage] < stage.weeks || stage.objective.progress(game) < stage.objective.goal) continue;
    const nextStage = progress.stage + 1;
    projects = { ...projects, [project.id]: { ...progress, stage: nextStage, stageStartedWeeks: nextStage < project.stages.length ? [...progress.stageStartedWeeks, nextWeek] : progress.stageStartedWeeks, completedWeek: nextStage === project.stages.length ? nextWeek : null } };
  }
  return projects === game.quests.projects ? game.quests : { ...game.quests, projects };
}

export function projectStatus(game: GameState, project: LongProject) {
  const progress = game.quests.projects[project.id];
  if (!progress) return { progress, stage: project.stages[0], work: 0, weeks: 0, status: 'available' as const };
  const stage = project.stages[Math.min(progress.stage, project.stages.length - 1)];
  return { progress, stage, work: progress.contributions.filter(item => item.stage === progress.stage).length, weeks: Math.max(0, game.week - progress.stageStartedWeeks[Math.min(progress.stage, project.stages.length - 1)]), status: progress.claimed ? 'claimed' as const : progress.completedWeek !== null ? 'ready' as const : 'active' as const };
}

export function validateProjects(raw: unknown, week: number): Record<string, ProjectProgress> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const output: Record<string, ProjectProgress> = {};
  for (const [id, value] of Object.entries(raw)) {
    const project = LONG_PROJECTS.find(item => item.id === id);
    if (!project || !value || typeof value !== 'object') return null;
    const entry = value as ProjectProgress;
    const validWeek = (number: unknown) => typeof number === 'number' && Number.isInteger(number) && number >= 0 && number <= week;
    if (!validWeek(entry.startedWeek) || !Number.isInteger(entry.stage) || entry.stage < 0 || entry.stage > project.stages.length || typeof entry.claimed !== 'boolean' || !Array.isArray(entry.stageStartedWeeks) || entry.stageStartedWeeks.length !== Math.min(entry.stage + 1, project.stages.length) || entry.stageStartedWeeks[0] !== entry.startedWeek || !entry.stageStartedWeeks.every((start, index, array) => validWeek(start) && (!index || start >= array[index - 1] + project.stages[index - 1].weeks))) return null;
    if (!Array.isArray(entry.contributions) || entry.contributions.length > project.stages.reduce((sum, stage) => sum + stage.work, 0) || new Set(entry.contributions.map(item => item?.week)).size !== entry.contributions.length) return null;
    if (!entry.contributions.every((item, index, array) => item && validWeek(item.week) && Number.isInteger(item.stage) && item.stage >= 0 && item.stage < project.stages.length && item.stage <= entry.stage && item.week >= entry.stageStartedWeeks[item.stage] && (index === 0 || item.week > array[index - 1].week && item.stage >= array[index - 1].stage) && (entry.stageStartedWeeks[item.stage + 1] === undefined || item.week < entry.stageStartedWeeks[item.stage + 1]))) return null;
    for (let stage = 0; stage < project.stages.length; stage++) {
      const count = entry.contributions.filter(item => item.stage === stage).length;
      if (count > project.stages[stage].work || stage < entry.stage && count !== project.stages[stage].work) return null;
    }
    if (entry.stage === project.stages.length ? !validWeek(entry.completedWeek) || Number(entry.completedWeek) < entry.stageStartedWeeks.at(-1)! + project.stages.at(-1)!.weeks : entry.completedWeek !== null || entry.claimed) return null;
    output[id] = { startedWeek: entry.startedWeek, stage: entry.stage, stageStartedWeeks: [...entry.stageStartedWeeks], contributions: entry.contributions.map(({ week, stage }) => ({ week, stage })), completedWeek: entry.completedWeek, claimed: entry.claimed };
  }
  return output;
}
