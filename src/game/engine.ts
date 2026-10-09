import { ACTIONS, CHARACTERS, EXAM_QUESTIONS, FAVORITE_GIFTS, ITEMS, PLACES, ROMANCE_IDS, SUBJECTS, UNIVERSITIES } from './data';
import { EVENTS } from './events';
import { MESSAGE_SCRIPTS } from './socialData';
import { createSocial, deliverMessages, isRomanceId, proactiveLock, replyLock, validateSocial } from './social';
import { PROACTIVE_TOPICS } from './proactiveData';
import { QUESTS, createQuestState, questView, validateQuests } from './quests';
import { LONG_PROJECTS, advanceProjects, projectStartLock } from './projects';
import { createGraduate, validateGraduate } from './graduate';
import { createLife } from './life';
import { advanceBody, recordHabit } from './lifeHealth';
import { validateLife } from './lifeSave';
import { DEFAULT_PLAYER_NAME, migratePlayerName } from './player';
import { getAppointments } from './appointments';
import { birthdayEventFor, birthdayInfo, birthdayStatus, CHARACTER_BIRTHDAYS } from './birthdays';
import { advanceRomance, beginRomanceScene, createRomance, establishRelationship, flushConcern, rememberConfession, rememberMeeting, romanceBusy, validateRomance } from './romance';
import type { CharacterId, Effect, GameAction, GameState, RomanceId, SaveSlot, Scene, Settings, StatKey, StoryEvent } from './types';

export const SAVE_KEY = 'shiguang-school-save-v2';
export const LEGACY_SAVE_KEY = 'shiguang-school-save-v1';
export const AUTO_BACKUP_KEY = 'shiguang-school-auto-backups-v2';
export const SLOTS_KEY = 'shiguang-school-slots-v1';
export const SETTINGS_KEY = 'shiguang-school-settings-v1';
export const TOTAL_WEEKS = 40;
export const DEFAULT_SETTINGS: Settings = { sound: true, music: true, musicVolume: 24, effectsVolume: 48, reducedMotion: false };
const MILESTONES: Record<number, string> = { 8: 'midterm', 16: 'winter-holiday', 26: 'hundred-days', 32: 'mock-two', 35: 'wish-form', 37: 'graduation-photo', 38: 'last-lesson', 39: 'last-night' };

export function createGame(): GameState {
  return {
    version: 3, started: false, startStage: 'highschool', name: DEFAULT_PLAYER_NAME, nameIsCustom: false, gender: 'male', difficulty: 'standard', targetSchool: 'xjtu',
    romance: createRomance(), graduate: createGraduate(), life: createLife(), birthdayGifts: [], world: { scene: 'campus', placeId: 'classroom', x: 54, y: 74 },
    week: 0, actions: 0, weeklyActions: [],
    stats: { energy: 80, mood: 75, stress: 28, health: 85, money: 120, autonomy: 35 },
    subjects: { chinese: 90, math: 86, english: 94, physics: 64, chemistry: 58, biology: 66 },
    relations: { su: 25, zhou: 30, mom: 45, teacher: 20, zhixia: 15, xinghe: 15, tangtang: 15 }, social: createSocial(), quests: createQuestState(),
    inventory: { milk: 2, bread: 1, tea: 1, coffee: 0, notes: 1 },
    seenEvents: [], history: [], actionLog: [], pendingEvent: null, claimedWeeks: [],
    counts: { study: 0, rest: 0, exercise: 0, social: 0, explore: 0 },
    plan: ['balanced', 'read', 'rest'], phase: 'school', wishes: [], examAnswers: [],
    examScore: null, admittedId: null, admittedMajor: null,
    seed: Math.max(1, Date.now() % 2147483647), updatedAt: new Date().toISOString(),
  };
}

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
export const predictedScore = (game: GameState) => Math.round(Object.values(game.subjects).reduce((sum, grade) => sum + grade, 0));
export const dateFor = (game: GameState) => new Date(2025, 8, 1 + Math.min(279, game.week * 7 + Math.min(2, game.actions) * 2));
export const daysRemaining = (game: GameState) => Math.max(0, 279 - game.week * 7 - Math.min(2, game.actions) * 2);
export const gameDate = (game: GameState) => dateFor(game).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });

export function actionEffect(game: GameState, action: GameAction): Effect {
  const effect: Effect = { ...action.effect };
  if (effect.energy && effect.energy < 0 && game.difficulty === 'gentle') effect.energy = Math.ceil(effect.energy * 0.75);
  if (effect.stress && effect.stress > 0 && game.difficulty === 'gentle') effect.stress = Math.ceil(effect.stress * 0.7);
  if (effect.subjects) {
    const efficiency = (game.stats.stress > 75 ? 0.65 : 1) * (game.stats.energy < 25 ? 0.75 : 1) * (game.difficulty === 'gentle' ? 1.2 : 1);
    effect.subjects = Object.fromEntries(Object.entries(effect.subjects).map(([key, amount]) => [key, (amount ?? 0) * efficiency]));
  }
  return effect;
}

export function applyEffect(game: GameState, effect: Effect): GameState {
  const stats = { ...game.stats };
  for (const key of Object.keys(stats) as StatKey[]) {
    stats[key] = Math.round(clamp(stats[key] + (effect[key] ?? 0), 0, key === 'money' ? 999999 : 100));
  }
  const subjects = { ...game.subjects };
  // Diminishing returns make mastering a subject harder than learning its basics.
  for (const subject of SUBJECTS) {
    const gain = effect.subjects?.[subject.id] ?? 0;
    const factor = gain > 0 ? 0.1 + 0.9 * (1 - subjects[subject.id] / subject.max) : 1;
    subjects[subject.id] = Math.round(clamp(subjects[subject.id] + gain * factor, 0, subject.max) * 100) / 100;
  }
  const relations = { ...game.relations };
  for (const key of Object.keys(relations) as (keyof typeof relations)[]) {
    relations[key] = clamp(relations[key] + (effect.relations?.[key] ?? 0));
  }
  const bonds = { ...game.social.bonds };
  for (const id of ROMANCE_IDS) {
    const old = bonds[id];
    const change = effect.bonds?.[id];
    const relationshipGain = effect.relations?.[id] ?? 0;
    bonds[id] = { ...old, trust: clamp(old.trust + (change?.trust ?? (relationshipGain > 0 ? Math.ceil(relationshipGain / 2) : relationshipGain))), affection: clamp(old.affection + (change?.affection ?? 0)), understanding: clamp(old.understanding + (change?.understanding ?? 0)) };
  }
  return { ...game, stats, subjects, relations, social: { ...game.social, bonds }, updatedAt: new Date().toISOString() };
}

export function canAct(game: GameState, action: GameAction): string | null {
  if (!game.started) return '先为你的高三故事写下名字吧。';
  if (game.phase !== 'school') return '这一年的校园行动已经结束，去看看你的下一段旅程吧。';
  if (game.pendingEvent || romanceBusy(game)) return '先听完眼前这个故事吧。';
  if (game.actions >= 3) return '本周的三个行动已完成，休整后进入下一周吧。';
  const effect = actionEffect(game, action);
  if (game.stats.energy + (effect.energy ?? 0) < 0) return '体力不够啦，先休息一下，或用背包里的食物补充体力。';
  if (game.stats.money + (effect.money ?? 0) < 0) return '零花钱不够了。散步和休息都不花钱，下周也会收到生活费。';
  return null;
}

export function performAction(game: GameState, actionId: string): { game: GameState; error?: string; message: string } {
  const action = ACTIONS.find(item => item.id === actionId);
  if (!action) return { game, error: '没有找到这个行动。', message: '' };
  const error = canAct(game, action);
  if (error) return { game, error, message: '' };
  const before = predictedScore(game);
  const next = applyEffect(game, actionEffect(game, action));
  next.actions += 1;
  next.weeklyActions = [...game.weeklyActions, actionId];
  next.life = { ...next.life, body: recordHabit(next.life.body, actionId) };
  next.counts = { ...next.counts, [action.category]: next.counts[action.category] + 1 };
  next.actionLog = [{ week: game.week, text: action.name }, ...game.actionLog].slice(0, 180);
  if (isRomanceId(actionId)) {
    const bond = next.social.bonds[actionId];
    const firstThisWeek = bond.lastMeetWeek !== game.week;
    next.social = { ...next.social, bonds: { ...next.social.bonds, [actionId]: { ...bond, meetings: bond.meetings + 1, lastMeetWeek: game.week, affection: clamp(bond.affection + (firstThisWeek ? 5 : 0)), understanding: clamp(bond.understanding + (firstThisWeek ? 4 : 0)) } } };
  }
  const gain = predictedScore(next) - before;
  return { game: deliverMessages(isRomanceId(actionId) ? rememberMeeting(next, actionId) : next), message: `${action.name}，${gain > 0 ? `学力成长 +${gain}` : '给自己充了一点电'}。${next.actions === 3 ? '本周已圆满结束！' : `本周还可行动 ${3 - next.actions} 次。`}` };
}

export function advanceWeek(game: GameState): GameState {
  if (game.phase !== 'school' || game.pendingEvent || romanceBusy(game)) return game;
  const week = game.week + 1;
  let next = applyEffect(game, { energy: 28, mood: 3, stress: -5, money: 40, health: game.stats.stress > 80 ? -5 : 2 });
  next = { ...next, week, actions: 0, weeklyActions: [], quests: advanceProjects(game, week), seed: (game.seed * 16807) % 2147483647 };
  next = advanceRomance(next);
  next.life = { ...next.life, body: advanceBody(next).body };
  if (next.stats.health < 25) {
    next = applyEffect(next, { health: 30, energy: 30, stress: -25 });
    next.actionLog = [{ week, text: '在家人和老师的支持下，安排了一次必要的休养。' }, ...next.actionLog];
  }
  if (week >= TOTAL_WEEKS) return { ...next, week: TOTAL_WEEKS, phase: 'exam', pendingEvent: null };
  const milestone = EVENTS.find(event => event.id === MILESTONES[week] && !game.seenEvents.includes(event.id));
  const eligible = EVENTS.filter(event => !event.placeId && !event.appointmentSource && event.id !== 'first-day' && !Object.values(MILESTONES).includes(event.id) && event.minWeek <= week && event.maxWeek >= week && !game.seenEvents.includes(event.id));
  const recent = EVENTS.find(event => event.id === game.history.at(-1)?.eventId);
  const varied = eligible.filter(event => event.speaker !== recent?.speaker || event.scene !== recent?.scene);
  const pool = varied.length ? varied : eligible;
  const selected = milestone ?? pool[next.seed % Math.max(1, pool.length)];
  return deliverMessages({ ...next, pendingEvent: selected?.id ?? null });
}

// Entering a location story spends one weekly action; weekly milestones stay
// separate so an automatic chapter never charges the player twice.
export function eventLock(game: GameState, event: StoryEvent): string | null {
  if (!game.started) return '开启高三故事后可阅读';
  if (game.seenEvents.includes(event.id)) return '已收进青春手帐';
  if (game.phase !== 'school') return '校园篇已结束，可在手帐回看';
  if (game.pendingEvent || romanceBusy(game)) return '先收好眼前的故事';
  if (event.placeId && game.actions >= 3) return '本周行动已用完，下周再来继续这段故事。';
  if (event.requires) {
    const previous = game.history.find(entry => entry.eventId === event.requires!.eventId);
    if (!previous) return `先读「${EVENTS.find(item => item.id === event.requires!.eventId)?.title ?? '前一段故事'}」`;
    if (event.requires.choiceIndex !== undefined && previous.choiceIndex !== event.requires.choiceIndex) return '这段故事属于另一条选择';
  }
  if (game.week < event.minWeek) return `第 ${event.minWeek + 1} 周继续这段故事`;
  if (game.week > event.maxWeek) return '这一段故事已经错过';
  return null;
}

function followsChosenBranch(game: GameState, event: StoryEvent) {
  if (event.requires?.choiceIndex === undefined) return true;
  return game.history.some(entry => entry.eventId === event.requires!.eventId && entry.choiceIndex === event.requires!.choiceIndex);
}

export function placeStories(game: GameState, placeId: string) {
  return EVENTS.filter(event => event.placeId === placeId && followsChosenBranch(game, event)).map(event => birthdayEventFor(game, event));
}

export function regionStories(game: GameState, scene: Scene) {
  return EVENTS.filter(event => event.placeId && event.scene === scene && followsChosenBranch(game, event)).map(event => birthdayEventFor(game, event));
}

export function beginMapStory(game: GameState, id: string): { game: GameState; error?: string } {
  const original = EVENTS.find(item => item.id === id && item.placeId);
  const event = original && birthdayEventFor(game, original);
  if (!event) return { game, error: '这里暂时没有这段故事。' };
  const error = eventLock(game, event);
  return error ? { game, error } : { game: { ...game, actions: game.actions + 1, weeklyActions: [...game.weeklyActions, `story:${id}`], counts: { ...game.counts, explore: game.counts.explore + 1 }, actionLog: [{ week: game.week, text: `走进${event.title}` }, ...game.actionLog].slice(0, 180), pendingEvent: id, updatedAt: new Date().toISOString() } };
}

export function getStorylines(game: GameState) {
  const names = [...new Set(EVENTS.flatMap(event => event.storyline ? [event.storyline] : []))];
  return names.map(name => {
    const events = EVENTS.filter(event => event.storyline === name && followsChosenBranch(game, event));
    const complete = events.filter(event => game.seenEvents.includes(event.id)).length;
    const next = events.find(event => !game.seenEvents.includes(event.id));
    const place = PLACES.find(item => item.id === next?.placeId);
    return { name, scene: events[0].scene as Scene, complete, next, place, hint: next ? eventLock(game, next) ?? `前往${place?.name ?? '地图'}继续` : '这段旅程已完成，结局收进了故事收藏。' };
  });
}

export function resolveEvent(game: GameState, choiceIndex: number): { game: GameState; message: string } {
  const original = EVENTS.find(item => item.id === game.pendingEvent);
  const event = original && birthdayEventFor(game, original);
  const choice = event?.choices[choiceIndex];
  if (!event || !choice) return { game, message: '' };
  if ((choice.effect.money ?? 0) + game.stats.money < 0) return { game, message: '零花钱不足，试试另一个选择。' };
  const next = applyEffect(game, choice.effect);
  return {
    game: flushConcern(deliverMessages({ ...next, pendingEvent: null, seenEvents: [...game.seenEvents, event.id], history: [...game.history, { eventId: event.id, choiceIndex, week: game.week, result: choice.result }] })),
    message: choice.result,
  };
}

export function replyMessage(game: GameState, scriptId: string, index: number): { game: GameState; error?: string; message?: string } {
  const script = MESSAGE_SCRIPTS.find(item => item.id === scriptId);
  if (!script) return { game, error: '没有找到这条消息。' };
  const error = replyLock(game, script, index);
  if (error) return { game, error };
  const choice = script.choices[index];
  const effected = applyEffect(game, choice.effect);
  const next = script.id.endsWith('-confession') && isRomanceId(script.character) ? rememberConfession(effected, script.character) : effected;
  let social = next.social;
  if (choice.route && isRomanceId(script.character)) {
    social = { ...social, partner: choice.route === 'dating' ? script.character : social.partner, bonds: { ...social.bonds, [script.character]: { ...social.bonds[script.character], route: choice.route } } };
  }
  next.social = { ...social, replies: [...social.replies, { scriptId, choiceIndex: index, week: game.week }], messages: [...social.messages.map(item => item.character === script.character ? { ...item, read: true } : item), { id: `${scriptId}-out`, character: script.character, side: 'outgoing', text: choice.text, week: game.week, read: true }, { id: `${scriptId}-response`, character: script.character, side: 'incoming', text: choice.result, week: game.week, read: true }] };
  return { game: deliverMessages(choice.route === 'dating' && isRomanceId(script.character) ? establishRelationship(next, script.character) : next), message: choice.route === 'dating' ? `你与${CHARACTERS[script.character].name}开始了恋爱路线。` : choice.route === 'friendship' ? '你们约定继续认真做朋友。' : '消息已发送，聊天已自动保存。' };
}

export function initiateMessage(game: GameState, topicId: string): { game: GameState; error?: string; message?: string } {
  const topic = PROACTIVE_TOPICS.find(item => item.id === topicId);
  if (!topic) return { game, error: '没有这个话题。' };
  const error = proactiveLock(game, topic);
  if (error) return { game, error };
  const next = applyEffect(game, topic.effect);
  next.social = { ...next.social, initiatives: [...next.social.initiatives, { topicId, week: game.week }], messages: [...next.social.messages, { id: `${topicId}-proactive-out`, character: topic.character, side: 'outgoing', text: topic.text, week: game.week, read: true, topicId }, { id: `${topicId}-proactive-in`, character: topic.character, side: 'incoming', text: topic.response, week: game.week, read: false, topicId }] };
  return { game: deliverMessages(next), message: `你主动联系了${CHARACTERS[topic.character].name}，对方的回应已经收到。` };
}

export function appointmentLock(game: GameState, eventId: string): string | null {
  const appointment = getAppointments(game).find(item => item.eventId === eventId);
  if (!appointment) return '先在消息里和对方约好见面。';
  if (appointment.completed) return '这次约见已经收进青春手帐。';
  return canAct(game, ACTIONS.find(action => action.id === appointment.character)!);
}

export function attendAppointment(game: GameState, eventId: string): { game: GameState; error?: string } {
  const error = appointmentLock(game, eventId);
  if (error) return { game, error };
  const appointment = getAppointments(game).find(item => item.eventId === eventId)!;
  const next = performAction(game, appointment.character).game;
  const place = PLACES.find(item => item.id === appointment.placeId)!;
  return { game: { ...next, pendingEvent: eventId, actionLog: [{ week: game.week, text: `与${CHARACTERS[appointment.character].name}在${place.name}赴约` }, ...next.actionLog.slice(1)] } };
}

export function claimQuest(game: GameState, id: string): { game: GameState; error?: string } {
  const quest = QUESTS.find(item => item.id === id);
  if (!quest || game.pendingEvent || romanceBusy(game) || questView(game, quest).status !== 'ready') return { game, error: '任务尚未完成，或奖励已经领过。' };
  const next = applyEffect(game, quest.reward);
  return { game: { ...next, quests: { ...next.quests, claimed: [...next.quests.claimed, id] } } };
}

export function startProject(game: GameState, id: string): { game: GameState; error?: string } {
  const project = LONG_PROJECTS.find(item => item.id === id);
  if (!project) return { game, error: '没有这个长期任务。' };
  const error = projectStartLock(game, project);
  if (error) return { game, error };
  return { game: { ...game, updatedAt: new Date().toISOString(), quests: { ...game.quests, projects: { ...game.quests.projects, [id]: { startedWeek: game.week, stage: 0, stageStartedWeeks: [game.week], contributions: [], completedWeek: null, claimed: false } } } } };
}

export function projectWorkLock(game: GameState, id: string) {
  const project = LONG_PROJECTS.find(item => item.id === id);
  const progress = game.quests.projects[id];
  if (!project || !progress) return '先接受这个长期任务';
  if (project.datingOnly && (game.social.partner !== project.character || game.romance.bonds[project.character as RomanceId].status !== 'normal')) return '恋爱暂停或结束，这个项目保留进度，恢复交往后可继续';
  if (progress.completedWeek !== null) return '项目已经完成';
  if (progress.contributions.some(item => item.week === game.week)) return '本周已经投入，下一周继续';
  if (progress.contributions.filter(item => item.stage === progress.stage).length >= project.stages[progress.stage].work) return '本阶段投入已满，完成剧情条件并结束本周后推进';
  return canAct(game, ACTIONS.find(action => action.id === project.actionId)!);
}

export function workOnProject(game: GameState, id: string): { game: GameState; error?: string } {
  const error = projectWorkLock(game, id);
  if (error) return { game, error };
  const project = LONG_PROJECTS.find(item => item.id === id)!;
  const progress = game.quests.projects[id];
  const next = performAction(game, project.actionId).game;
  return { game: { ...next, quests: { ...next.quests, projects: { ...next.quests.projects, [id]: { ...progress, contributions: [...progress.contributions, { week: game.week, stage: progress.stage }] } } } } };
}

export function claimProject(game: GameState, id: string): { game: GameState; error?: string } {
  const project = LONG_PROJECTS.find(item => item.id === id);
  const progress = game.quests.projects[id];
  if (!project || !progress || progress.completedWeek === null || progress.claimed || game.pendingEvent || romanceBusy(game)) return { game, error: '长期任务还没完成，或奖励已经领过。' };
  const next = applyEffect(game, project.reward);
  return { game: { ...next, quests: { ...next.quests, projects: { ...next.quests.projects, [id]: { ...progress, claimed: true } } } } };
}

export function confirmRelationship(game: GameState, id: RomanceId): { game: GameState; error?: string } {
  return beginRomanceScene(game, id, 'confess');
}

export function giveCharacterGift(game: GameState, id: CharacterId, itemId = 'milk'): { game: GameState; error?: string; message?: string } {
  const item = ITEMS.find(item => item.id === itemId);
  if (!game.started || game.phase !== 'school' || game.pendingEvent || romanceBusy(game)) return { game, error: '先继续眼前的故事，再把心意送出去吧。' };
  if (!item || !(game.inventory[itemId] > 0)) return { game, error: '背包里没有这个物品，可以先补充一点。' };
  const peer = isRomanceId(id);
  if (peer && game.social.bonds[id].lastGiftWeek === game.week) return { game, error: '本周的心意已经收到啦，下次见面再带一点。' };
  const favorite = peer && FAVORITE_GIFTS[id] === itemId;
  const birthday = birthdayStatus(game, id), bonus = birthday.bonusAvailable;
  const giftValue = (value: number) => bonus ? Math.ceil(value * 1.5) : value;
  const next = applyEffect(game, { mood: bonus ? 6 : 3, relations: { [id]: giftValue(favorite ? 9 : 6) }, ...(peer ? { bonds: { [id]: { trust: giftValue(favorite ? 6 : 3), affection: giftValue(favorite ? 5 : 2), understanding: giftValue(favorite ? 4 : 1) } } } : {}) });
  if (bonus) {
    next.birthdayGifts = [...game.birthdayGifts, birthday.giftKey];
    next.social = { ...next.social, messages: [...next.social.messages, { id: `birthday-gift:${birthday.giftKey}`, character: id, side: 'incoming', text: `谢谢你记得我的生日。这份${item.name}已经好好收下，今天的祝福会留在心里。`, week: game.week, read: false }] };
  }
  next.inventory = { ...next.inventory, [itemId]: next.inventory[itemId] - 1 };
  if (peer) next.social = { ...next.social, bonds: { ...next.social.bonds, [id]: { ...next.social.bonds[id], lastGiftWeek: game.week } } };
  return { game: deliverMessages(next), message: `${CHARACTERS[id].name}收到了${item.name}${bonus ? '，生日祝福获得额外 50% 心意加成。' : favorite ? '，这是对方喜欢的小礼物。' : '，心意被好好收下了。'}` };
}

export function getAchievements(game: GameState) {
  return [
    { id: 'hello', name: '故事的第一页', description: '开始属于自己的高三故事', unlocked: game.started, icon: 'book' as const },
    { id: 'study', name: '一点一点，也很远', description: '完成 15 次学习行动', unlocked: game.counts.study >= 15, icon: 'notes' as const },
    { id: 'friend', name: '不是一个人在战斗', description: '与任意一位角色的关系达到 70', unlocked: Object.values(game.relations).some(value => value >= 70), icon: 'friends' as const },
    { id: 'rest', name: '理直气壮地休息', description: '完成 10 次休息行动', unlocked: game.counts.rest >= 10, icon: 'moon' as const },
    { id: 'voice', name: '自己的声音', description: '自主达到 70', unlocked: game.stats.autonomy >= 70, icon: 'leaf' as const },
    { id: 'six', name: '题海里的灯塔', description: '预估总分达到 600', unlocked: predictedScore(game) >= 600, icon: 'trophy' as const },
    { id: 'story', name: '我们共同的青春', description: '经历 20 段校园故事', unlocked: game.history.length >= 20, icon: 'journal' as const },
    { id: 'explore', name: '课表之外的世界', description: '完成 12 次探索行动', unlocked: game.counts.explore >= 12, icon: 'leaf' as const },
    { id: 'storyline', name: '把一个故事走到最后', description: '完成任意一条三段地图支线', unlocked: getStorylines(game).some(line => line.complete >= 3), icon: 'journal' as const },
    { id: 'end', name: '夏天，终于来了', description: '完成高考与志愿填报', unlocked: game.phase === 'ending', icon: 'letter' as const },
  ];
}

export function finishExam(game: GameState): GameState {
  if (game.examAnswers.length !== EXAM_QUESTIONS.length || game.phase !== 'exam') return game;
  const correct = EXAM_QUESTIONS.filter((question, index) => question.answer === game.examAnswers[index]).length;
  const pressure = Math.round(Math.max(0, game.stats.stress - 50) / 3);
  const wellbeing = game.stats.mood >= 60 && game.stats.health >= 50 ? 5 : 0;
  return { ...game, phase: 'application', examScore: clamp(predictedScore(game) + correct * 4 - pressure + wellbeing, 0, 750), updatedAt: new Date().toISOString() };
}

export function submitWishes(game: GameState): GameState {
  if (game.phase !== 'application' || game.examScore === null || !game.wishes.length) return game;
  const admitted = game.wishes.find(wish => (UNIVERSITIES.find(school => school.id === wish.schoolId)?.threshold ?? 751) <= game.examScore!);
  return { ...game, phase: 'ending', admittedId: admitted?.schoolId ?? null, admittedMajor: admitted?.major ?? null, updatedAt: new Date().toISOString() };
}

const statLabels: Record<StatKey, string> = { energy: '体力', mood: '心情', stress: '压力', health: '健康', money: '零花钱', autonomy: '自主' };
export function effectSummary(effect: Effect): string[] {
  const result = (Object.keys(statLabels) as StatKey[]).filter(key => effect[key]).map(key => `${statLabels[key]} ${effect[key]! > 0 ? '+' : ''}${Math.round(effect[key]!)}`);
  if (effect.subjects) {
    const names = Object.keys(effect.subjects).map(key => SUBJECTS.find(subject => subject.id === key)?.name).filter(Boolean);
    result.push(`${names.length > 2 ? '多科学力' : names.join('、')}成长`);
  }
  if (effect.relations) result.push('关系发生变化');
  if (effect.bonds) result.push('信任与心动发生变化');
  return result;
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const validNumber = (value: unknown, max = 100) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;

export function validateGame(raw: unknown): GameState | null {
  if (!isRecord(raw)) return null;
  if (isRecord(raw.game)) raw = raw.game;
  if (!isRecord(raw)) return null;
  if (raw.version === 1) {
    const legacyRelations = raw.relations;
    if (!isRecord(legacyRelations) || !['su', 'zhou', 'mom', 'teacher'].every(id => validNumber(legacyRelations[id]))) return null;
    const social = createSocial();
    social.bonds.su.trust = Number(legacyRelations.su);
    social.bonds.zhou.trust = Number(legacyRelations.zhou);
    raw = { ...raw, version: 2, relations: { ...legacyRelations, zhixia: 15, xinghe: 15, tangtang: 15 }, social };
  }
  if (!isRecord(raw) || raw.version !== 2 && raw.version !== 3 || typeof raw.name !== 'string' || !raw.name.trim() || raw.name.length > 16 || typeof raw.started !== 'boolean') return null;
  if (raw.gender !== undefined && raw.gender !== 'male' && raw.gender !== 'female') return null;
  if (raw.nameIsCustom !== undefined && typeof raw.nameIsCustom !== 'boolean') return null;
  const startStage = raw.startStage === undefined ? 'highschool' : raw.startStage;
  if (typeof startStage !== 'string' || !['highschool', 'university', 'society', 'retirement'].includes(startStage)) return null;
  const directStart = startStage !== 'highschool';
  if (directStart && (raw.started !== true || raw.phase !== 'ending' || raw.week !== 0 || !isRecord(raw.life) || raw.life.active !== true)) return null;
  if (!validNumber(raw.week, 40) || !Number.isInteger(raw.week) || !validNumber(raw.actions, 3) || !Number.isInteger(raw.actions)) return null;
  if (!['gentle', 'standard'].includes(String(raw.difficulty)) || !['school', 'exam', 'application', 'ending'].includes(String(raw.phase))) return null;
  if (!isRecord(raw.stats) || !isRecord(raw.subjects) || !isRecord(raw.relations) || !isRecord(raw.counts) || !isRecord(raw.inventory)) return null;
  const base = createGame();
  const social = validateSocial(raw.social);
  if (!social) return null;
  const quests = validateQuests(raw.quests, Number(raw.week));
  if (!quests) return null;
  for (const key of Object.keys(base.stats)) if (!validNumber(raw.stats[key], key === 'money' ? 1e10 : 100)) return null;
  for (const subject of SUBJECTS) if (!validNumber(raw.subjects[subject.id], subject.max)) return null;
  for (const key of Object.keys(base.relations)) if (!validNumber(raw.relations[key])) return null;
  for (const key of Object.keys(base.counts)) if (!validNumber(raw.counts[key], 9999)) return null;
  for (const item of ITEMS) if (!validNumber(raw.inventory[item.id], 9999) || !Number.isInteger(raw.inventory[item.id])) return null;
  const actionIds = ACTIONS.map(action => action.id);
  if (!Array.isArray(raw.plan) || raw.plan.length !== 3 || !raw.plan.every(id => typeof id === 'string' && actionIds.includes(id))) return null;
  if (!Array.isArray(raw.weeklyActions) || raw.weeklyActions.length !== raw.actions || !raw.weeklyActions.every(id => typeof id === 'string' && (actionIds.includes(id) || EVENTS.some(event => event.placeId && id === `story:${event.id}`)))) return null;
  if (!Array.isArray(raw.seenEvents) || raw.seenEvents.length > EVENTS.length || !raw.seenEvents.every(id => EVENTS.some(event => event.id === id))) return null;
  if (new Set(raw.seenEvents).size !== raw.seenEvents.length || raw.seenEvents.includes(raw.pendingEvent)) return null;
  if (raw.pendingEvent !== null && !EVENTS.some(event => event.id === raw.pendingEvent)) return null;
  if (!Array.isArray(raw.history) || raw.history.length > EVENTS.length || !raw.history.every(entry => isRecord(entry) && EVENTS.some(event => event.id === entry.eventId && typeof entry.choiceIndex === 'number' && !!event.choices[entry.choiceIndex]) && validNumber(entry.week, 40) && typeof entry.result === 'string' && entry.result.length < 1000)) return null;
  if (raw.history.length !== raw.seenEvents.length || new Set(raw.history.map(entry => (entry as Record<string, unknown>).eventId)).size !== raw.history.length) return null;
  if (!Array.isArray(raw.actionLog) || raw.actionLog.length > 200 || !raw.actionLog.every(entry => isRecord(entry) && validNumber(entry.week, 40) && typeof entry.text === 'string' && entry.text.length < 200)) return null;
  if (!Array.isArray(raw.claimedWeeks) || raw.claimedWeeks.length > 40 || !raw.claimedWeeks.every(week => validNumber(week, 39) && Number.isInteger(week))) return null;
  if (!Array.isArray(raw.wishes) || raw.wishes.length > 5 || !raw.wishes.every(wish => isRecord(wish) && UNIVERSITIES.some(school => school.id === wish.schoolId && school.majors.includes(String(wish.major))))) return null;
  if (new Set(raw.wishes.map(wish => (wish as Record<string, unknown>).schoolId)).size !== raw.wishes.length) return null;
  if (!Array.isArray(raw.examAnswers) || raw.examAnswers.length > 3 || !raw.examAnswers.every(answer => validNumber(answer, 3) && Number.isInteger(answer))) return null;
  if (raw.examScore !== null && !validNumber(raw.examScore, 750)) return null;
  if (directStart && (raw.examScore !== null || raw.examAnswers.length !== 0 || raw.admittedId !== null || raw.admittedMajor !== null)) return null;
  if (!directStart && (raw.phase === 'application' || raw.phase === 'ending') && raw.examScore === null) return null;
  if (raw.admittedId !== null && !UNIVERSITIES.some(school => school.id === raw.admittedId && school.majors.includes(String(raw.admittedMajor)))) return null;
  if (raw.admittedId === null && raw.admittedMajor !== null) return null;
  if (!UNIVERSITIES.some(school => school.id === raw.targetSchool) || !validNumber(raw.seed, 2147483646)) return null;
  if (raw.phase === 'school' && (raw.week as number) >= TOTAL_WEEKS) return null;
  if (raw.phase !== 'school' && raw.pendingEvent !== null) return null;
  if (!directStart && raw.phase !== 'school' && raw.week !== TOTAL_WEEKS) return null;
  if (!directStart && (raw.phase === 'application' || raw.phase === 'ending') && raw.examAnswers.length !== EXAM_QUESTIONS.length) return null;
  // Copy only known fields; imported JSON never becomes an executable configuration.
  const result = Object.fromEntries(Object.keys(base).map(key => [key, raw[key] ?? (key === 'pendingEvent' || key === 'examScore' || key === 'admittedId' || key === 'admittedMajor' ? null : base[key as keyof GameState])])) as unknown as GameState;
  result.stats = Object.fromEntries(Object.keys(base.stats).map(key => [key, (raw.stats as Record<string, number>)[key]])) as GameState['stats'];
  result.subjects = Object.fromEntries(SUBJECTS.map(subject => [subject.id, (raw.subjects as Record<string, number>)[subject.id]])) as GameState['subjects'];
  result.relations = Object.fromEntries(Object.keys(base.relations).map(key => [key, (raw.relations as Record<string, number>)[key]])) as GameState['relations'];
  result.counts = Object.fromEntries(Object.keys(base.counts).map(key => [key, (raw.counts as Record<string, number>)[key]])) as GameState['counts'];
  result.inventory = Object.fromEntries(ITEMS.map(item => [item.id, (raw.inventory as Record<string, number>)[item.id]]));
  result.social = social;
  const birthdayGifts = raw.birthdayGifts ?? [];
  const giftKeys = Object.keys(CHARACTER_BIRTHDAYS).map(id => birthdayInfo(id as CharacterId).giftKey);
  if (!Array.isArray(birthdayGifts) || birthdayGifts.length > giftKeys.length || birthdayGifts.some(key => !giftKeys.includes(key)) || new Set(birthdayGifts).size !== birthdayGifts.length) return null;
  result.birthdayGifts = [...birthdayGifts];
  result.quests = quests;
  result.version = 3;
  const romance = validateRomance(raw.romance, result, raw.version === 2);
  if (!romance) return null;
  result.romance = romance;
  const graduate = validateGraduate(raw.graduate, result);
  if (!graduate) return null;
  result.graduate = graduate;
  const life = validateLife(raw.life, result);
  if (!life) return null;
  result.life = life;
  if (raw.version === 3) {
    const world = raw.world;
    if (!isRecord(world) || !PLACES.some(place => place.scene === world.scene && place.id === world.placeId) || !validNumber(world.x) || !validNumber(world.y)) return null;
    result.world = { scene: world.scene as Scene, placeId: String(world.placeId), x: Number(world.x), y: Number(world.y) };
  }
  result.history = result.history.map(({ eventId, choiceIndex, week, result: outcome }) => ({ eventId, choiceIndex, week, result: outcome }));
  result.actionLog = result.actionLog.map(({ week, text }) => ({ week, text }));
  result.wishes = result.wishes.map(({ schoolId, major }) => ({ schoolId, major }));
  Object.assign(result, migratePlayerName(result.name, raw.nameIsCustom as boolean | undefined));
  result.seed = Math.max(1, Math.floor(result.seed));
  result.updatedAt = typeof raw.updatedAt === 'string' && !Number.isNaN(Date.parse(raw.updatedAt)) ? raw.updatedAt : new Date().toISOString();
  return result;
}

export function loadGame(): GameState {
  for (const key of [SAVE_KEY, LEGACY_SAVE_KEY]) {
    try {
      const value = localStorage.getItem(key);
      const loaded = value ? validateGame(JSON.parse(value)) : null;
      if (loaded) return deliverMessages(loaded);
    } catch { /* Try rolling backups and legacy data independently. */ }
    if (key === SAVE_KEY) {
      const recovered = loadAutoBackups()[0]?.game;
      if (recovered) return deliverMessages(recovered);
    }
  }
  return createGame();
}

export function persistGame(game: GameState): boolean {
  try {
    const serialized = JSON.stringify(game);
    const previousText = localStorage.getItem(SAVE_KEY);
    if (previousText === serialized) return true;
    let previous: GameState | null = null;
    try { previous = previousText ? validateGame(JSON.parse(previousText)) : null; } catch { /* Preserve valid backups if the primary is damaged. */ }
    if (previous?.started) {
      const fingerprint = (value: GameState) => `${value.seed}:${value.week}:${value.phase}:${value.actions}:${value.history.length}:${value.social.replies.length}:${value.social.initiatives.length}:${value.quests.claimed.length}:${value.quests.visitedPlaces.length}:${JSON.stringify(value.quests.projects)}:${JSON.stringify(value.romance)}:${JSON.stringify(value.graduate)}:${JSON.stringify(value.life)}`;
      const backups = loadAutoBackups().filter(slot => fingerprint(slot.game) !== fingerprint(previous!));
      backups.unshift({ game: previous, savedAt: previous.updatedAt });
      localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backups.slice(0, 6)));
    }
    localStorage.setItem(SAVE_KEY, serialized);
    return true;
  } catch { return false; }
}

export function loadAutoBackups(): SaveSlot[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, 6).flatMap(slot => {
      if (!isRecord(slot) || typeof slot.savedAt !== 'string' || Number.isNaN(Date.parse(slot.savedAt))) return [];
      const game = validateGame(slot.game);
      return game ? [{ game, savedAt: slot.savedAt }] : [];
    });
  } catch { return []; }
}

export function loadSettings(): Settings {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    if (!isRecord(raw)) return DEFAULT_SETTINGS;
    return {
      sound: typeof raw.sound === 'boolean' ? raw.sound : true,
      music: typeof raw.music === 'boolean' ? raw.music : true,
      musicVolume: validNumber(raw.musicVolume) ? Number(raw.musicVolume) : 24,
      effectsVolume: validNumber(raw.effectsVolume) ? Number(raw.effectsVolume) : 48,
      reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : false,
    };
  } catch { return DEFAULT_SETTINGS; }
}

export function loadSlots(): (SaveSlot | null)[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SLOTS_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [null, null, null];
    return [0, 1, 2].map(index => {
      const slot: unknown = raw[index];
      if (!isRecord(slot)) return null;
      const game = validateGame(slot.game);
      return game && typeof slot.savedAt === 'string' ? { game, savedAt: slot.savedAt } : null;
    });
  } catch { return [null, null, null]; }
}
