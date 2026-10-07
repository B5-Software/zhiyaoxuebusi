import { CHARACTERS, PLACES, ROMANCE_IDS } from './data';
import { matureAllowed } from './audience';
import { ROMANCE_OPERATION_IDS, ROMANCE_PLACES, ROMANCE_SCENES } from './romanceData';
import type { Audience, GameState, RomanceBond, RomanceId, RomanceState } from './types';

const limit = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
export const romanceBusy = (game: GameState) => !!game.romance.active;
export function createRomance(): RomanceState {
  return { bonds: Object.fromEntries(ROMANCE_IDS.map(id => [id, { status: 'normal', sinceWeek: -1, episode: 0, meetWeeks: [], lastConfessWeek: -10, lastTouchWeek: -1, lastDateWeek: -1, lastHomeWeek: -1, lastTalkWeek: -1, boundaries: { publicAffection: false, homeVisits: true, touch: true }, handmade: null }])) as unknown as RomanceState['bonds'], memories: [], active: null, escort: null, visitor: null, cancelledAppointments: [], attention: { school: 0, family: 0, rumor: 0, lastConcernWeek: -10, queued: null } };
}
function patchBond(game: GameState, id: RomanceId, patch: Partial<RomanceBond>): GameState {
  return { ...game, updatedAt: new Date().toISOString(), romance: { ...game.romance, bonds: { ...game.romance.bonds, [id]: { ...game.romance.bonds[id], ...patch } } } };
}
export function rememberMeeting(game: GameState, id: RomanceId): GameState {
  const bond = game.romance.bonds[id];
  return bond.meetWeeks.includes(game.week) ? game : patchBond(game, id, { meetWeeks: [...bond.meetWeeks, game.week] });
}
export function rememberConfession(game: GameState, id: RomanceId): GameState { return patchBond(game, id, { lastConfessWeek: game.week }); }
function reward(game: GameState, id: RomanceId, trust = 3, affection = 3, understanding = 4): GameState {
  const bond = game.social.bonds[id];
  return { ...game, stats: { ...game.stats, mood: limit(game.stats.mood + 4), stress: limit(game.stats.stress - 3) }, social: { ...game.social, bonds: { ...game.social.bonds, [id]: { ...bond, trust: limit(bond.trust + trust), affection: limit(bond.affection + affection), understanding: limit(bond.understanding + understanding) } } } };
}
function chat(game: GameState, id: RomanceId, outgoing: string, incoming: string): GameState {
  const serial = `love-chat-${id}-${game.week}-${game.social.messages.length}`;
  return { ...game, social: { ...game.social, messages: [...game.social.messages, { id: `${serial}-out`, character: id, side: 'outgoing', text: outgoing, week: game.week, read: true }, { id: `${serial}-in`, character: id, side: 'incoming', text: incoming, week: game.week, read: false }] } };
}
export function romanceBaseLock(game: GameState) {
  if (!game.started || game.phase !== 'school') return '开启校园生活后可以相处';
  if (game.pendingEvent || romanceBusy(game)) return '先收好眼前的故事';
  return null;
}
export function confessionLock(game: GameState, id: RomanceId) {
  const base = romanceBaseLock(game); if (base) return base;
  const bond = game.social.bonds[id], detail = game.romance.bonds[id];
  if (game.social.partner) return game.social.partner === id ? '已经是恋人，可以在心事里继续相处' : `你已与${CHARACTERS[game.social.partner].name}约定恋爱关系`;
  if (game.week - detail.lastConfessWeek < 3) return '给彼此一点时间，距上次表白至少 3 个游戏周';
  if (detail.status === 'broken' && (game.week - detail.sinceWeek < 3 || detail.lastTalkWeek <= detail.sinceWeek)) return '分开后先留出 3 周，并认真沟通一次，再讨论重新开始';
  const missing = [bond.trust < 60 && `信任 ${bond.trust}/60`, bond.affection < 55 && `心动 ${bond.affection}/55`, bond.understanding < 30 && `了解 ${bond.understanding}/30`, detail.meetWeeks.length < 2 && `在不同周见面 ${detail.meetWeeks.length}/2`, !game.history.some(entry => entry.eventId.startsWith(`meeting-${id}-`)) && !game.social.replies.some(entry => entry.scriptId === `${id}-heart`) && '完成一次专属约见或心事回复'].filter(Boolean);
  return missing.length ? `还需要：${missing.join(' · ')}` : null;
}
export function establishRelationship(game: GameState, id: RomanceId): GameState {
  const detail = game.romance.bonds[id];
  const next = patchBond(game, id, { status: 'normal', sinceWeek: game.week, episode: detail.episode + 1 });
  return { ...next, social: { ...next.social, partner: id, bonds: { ...next.social.bonds, [id]: { ...next.social.bonds[id], route: 'dating' } } } };
}
export function sceneLock(game: GameState, id: RomanceId, sceneId: string, audience: Audience = { age: 'unknown', skipPrivate: false }) {
  if (sceneId === 'confess') return confessionLock(game, id);
  const base = romanceBaseLock(game); if (base) return base;
  if (game.social.partner !== id && !(sceneId === 'talk' && game.romance.bonds[id].status === 'broken')) return '确定恋爱关系后解锁';
  const detail = game.romance.bonds[id], bond = game.social.bonds[id];
  if (detail.status === 'cooling' && sceneId !== 'talk') return '冷静期间先沟通，不安排亲密互动';
  if (['hand', 'hug', 'kiss'].includes(sceneId)) {
    if (!detail.boundaries.touch) return '对方希望暂时保留身体距离，先在约定中沟通';
    if (detail.lastTouchWeek === game.week) return '本周已认真相处过，下周再留下新的亲密回忆';
    if (sceneId === 'kiss' && (bond.trust < 70 || bond.affection < 65)) return '轻吻需要信任 70、心动 65';
  }
  if (sceneId === 'home') {
    if (!detail.boundaries.homeVisits) return '先取得对方对回家做客的明确同意';
    if (detail.lastHomeWeek === game.week) return '本周已经邀请过，下周再约';
    if (bond.trust < 65) return '信任达到 65 后，对方才愿意来家里做客';
  }
  if (sceneId === 'private') {
    if (!matureAllowed(game, audience)) return '当前内容设置不允许进入';
    if (game.romance.visitor !== id) return '先邀请对方到家里做客';
    if (!detail.boundaries.touch) return '尊重对方现在希望保留的距离';
    if (bond.trust < 75 || bond.affection < 70) return '需要信任 75、心动 70，且双方愿意';
    if (game.romance.memories.some(memory => memory.character === id && memory.week === game.week && memory.id.startsWith('private:'))) return '本周的私密时光已经收好';
  }
  const scene = ROMANCE_SCENES.find(item => item.id === sceneId && item.character === id);
  if (scene) {
    if (game.romance.memories.some(memory => memory.id.startsWith(`${scene.id}:`))) return '这段专属剧情已收进回忆';
    const previous = ROMANCE_SCENES.find(item => item.character === id && item.stage === scene.stage - 1);
    const memory = game.romance.memories.find(item => previous && item.id.startsWith(`${previous.id}:`));
    if (previous && !memory) return '先完成上一段专属剧情';
    if (previous && memory && game.week <= memory.week) return '下一游戏周再继续，给相处留出时间';
    if (game.week - detail.sinceWeek < scene.stage) return `交往满 ${scene.stage} 周后继续`;
  } else if (!(ROMANCE_OPERATION_IDS as readonly string[]).includes(sceneId)) return '没有这段剧情';
  if (['walk', 'date'].includes(sceneId) && detail.lastDateWeek === game.week) return '本周已安排约会，下周再一起出门';
  if (sceneId === 'talk' && detail.lastTalkWeek === game.week) return '本周已经认真聊过，下周再继续';
  if (['school', 'family', 'rumor'].includes(sceneId)) return '关心剧情会随生活进度自然到来';
  const costsAction = !!scene || ['walk', 'date', 'home', 'talk'].includes(sceneId);
  if (costsAction && game.actions >= 3) return '本周行动已用完，下周再约';
  if (costsAction && game.stats.energy < 8) return '需要 8 体力，先补充一点能量';
  return null;
}
export function beginRomanceScene(game: GameState, id: RomanceId, sceneId: string, audience?: Audience): { game: GameState; error?: string } {
  const error = sceneLock(game, id, sceneId, audience); if (error) return { game, error };
  const scene = ROMANCE_SCENES.find(item => item.id === sceneId);
  const costs = !!scene || ['walk', 'date', 'home', 'talk'].includes(sceneId);
  let next = game;
  if (costs) next = rememberMeeting({ ...game, actions: game.actions + 1, weeklyActions: [...game.weeklyActions, id], counts: { ...game.counts, social: game.counts.social + 1 }, stats: { ...game.stats, energy: game.stats.energy - 8 }, actionLog: [{ week: game.week, text: `${CHARACTERS[id].name} · ${scene?.title ?? ({ walk: '一起散步', date: '两个人的约会', home: '到家里做客', talk: '认真沟通' } as Record<string, string>)[sceneId]}` }, ...game.actionLog].slice(0, 180), social: { ...game.social, bonds: { ...game.social.bonds, [id]: { ...game.social.bonds[id], meetings: game.social.bonds[id].meetings + 1, lastMeetWeek: game.week } } } }, id);
  const patch: Partial<RomanceBond> = sceneId === 'confess' ? { lastConfessWeek: game.week } : ['walk', 'date'].includes(sceneId) ? { lastDateWeek: game.week } : sceneId === 'home' ? { lastHomeWeek: game.week } : sceneId === 'talk' ? { lastTalkWeek: game.week } : ['hand', 'hug', 'kiss'].includes(sceneId) ? { lastTouchWeek: game.week } : {};
  next = patchBond(next, id, patch);
  const stayHere = ['hand', 'hug', 'kiss', 'talk'].includes(sceneId);
  const location = PLACES.find(place => place.id === (scene?.placeId ?? (stayHere ? game.world.placeId : sceneId === 'home' || sceneId === 'private' ? 'family' : sceneId === 'walk' ? 'river-path' : ROMANCE_PLACES[id])))!;
  return { game: { ...next, world: { scene: location.scene, placeId: location.id, x: location.x, y: Math.min(94, location.y + 8) }, romance: { ...next.romance, active: { id: sceneId, character: id, week: game.week } } } };
}
export function romanceStory(game: GameState) {
  const active = game.romance.active; if (!active) return null;
  const name = CHARACTERS[active.character].name;
  const scene = ROMANCE_SCENES.find(item => item.id === active.id);
  if (scene) return scene;
  const ordinary: Record<string, [string, string, string[], string[]]> = {
    confess: ['把喜欢认真说给你听', `你想清楚了自己的心意，也准备尊重${name}的回答。${name}看着你：“我们已经一起走过不少事。我也想试着，认真和你在一起。”`, ['说出喜欢，约定认真交往。', '我想再慢一点，先继续了解。', '还是做朋友，珍惜已经有的关系。'], ['你们明确答应了彼此。喜欢不用靠猜，关系从今天认真开始。', '你们决定放慢一点。没有人需要为了答复而勉强。', '你们把友情说清楚，继续尊重彼此。']],
    walk: ['把这一段路留给我们', `河边的风很轻。${name}与你并肩走着，你们可以牵手，也可以隔着舒适的距离。`, ['一起聊最近的小事。', '安静走一会儿。'], ['两个人认真听完了对方的小事，也约定该休息时先照顾自己。', '沉默没有变成压力。你们走到桥边，在天黑之前各自回家。']],
    date: ['两个人的约会', `${name}为今天留了一段时间。你们先确认彼此的安排，不让喜欢变成耽误，也不把约会当成需要展示的成绩。`, ['选一件双方都喜欢的事。', '先问问对方今天的心情。'], ['你们把想做的事一起完成。下次什么时候见，也认真商量好了。', '今天的计划改成更轻松的相处。能坦白疲惫，也是一种信任。']],
    home: ['家里的灯，也为你亮着', `${name}在门口确认了离开的时间，带来一点小点心。你提前向家人说明来访，先一起坐到客厅里。`, ['一起读书、听音乐，按约定时间回家。', '请家人一起吃饭，好好介绍彼此。'], ['书页翻过，音乐播完。这是一次自在的做客，想结束时随时可以说。', '餐桌上的话从学习聊到喜欢的事情。家人的担心也被认真听见。']],
    hand: ['可以牵你的手吗', `你先问${name}愿不愿意。得到清楚的回应后，两只手轻轻握在一起。松开也可以，不用解释。`, ['按彼此舒服的节奏走一会儿。', '今天还是并肩走就好。'], ['牵手的温度很轻。两个人都记得，愿意随时可以改变。', '你们把手放回各自口袋。尊重让这段路一样温暖。']],
    hug: ['一个得到回应的拥抱', `${name}说今天有一点累。你问能不能抱一会儿，得到愿意的回应后才靠近。`, ['轻轻抱一会儿，等对方想结束。', '坐在旁边，陪对方说说话。'], ['拥抱没有催促。分开时，两个人都觉得今天被认真照顾了。', '你留在对方身边听着。表达关心有很多种方式。']],
    kiss: ['靠近之前，先问你愿不愿意', `你和${name}都清楚表达了愿意。一个轻轻的吻停在温柔的片刻，随后又笑着拉开舒适的距离。`, ['把这一刻温柔收好。', '今天先停在拥抱就好。'], ['没有更进一步的要求。你们记得，喜欢和边界可以同时存在。', '两个人都接受停下来。今天的亲近仍然被认真珍惜。']],
    talk: ['把猜测换成对话', `你和${name}各自说出这段时间的需要，约定不偷看消息、不追问行踪，也不把考试成绩作为关系的条件。`, ['认真听完，约定恢复正常相处。', '暂时继续冷静，留一些个人空间。'], ['你们把担心说明白，决定按新的约定继续相处。', '暂时慢一点也可以。你们约定需要帮助时直接开口。']],
    private: ['把这一晚留给彼此', `这是双方清楚表达愿意之后的一段私人时间。你们确认任何时候都能停下，镜头停在窗边的灯光，随后慢慢淡出。`, ['镜头转场，收好这段私人回忆。', '跳过这段描写，直接继续。'], ['夜色过去，故事停在两个人互相照顾的日常。私密细节留在画面之外。', '你们度过一段被认真照顾的时间。故事直接接回普通生活。']],
    school: ['课表之外，也需要边界', '老陈请你谈一谈：“我担心的是熬夜和缺课。你已经成年，我们可以商量，怎样同时照顾学业和关系。”', ['说明安排，约定不在上课时约会。', '请对方一起沟通，保留合理的个人空间。'], ['你把休息、学习和相处的安排说清楚。老师接受了这份能执行的约定。', '两个人明确自己的责任，也请老师尊重隐私。担心开始变成可以讨论的事情。']],
    family: ['家里的担心，不只是一句不许', '妈妈问起最近的来访：“不是要替你选谁，我只是怕你委屈自己，也怕你把休息忘了。”', ['认真介绍对方，商量回家与来访时间。', '说出自己的边界，也听听家人的担心。'], ['你们把来访和休息时间约好。家人的关心不再只剩下追问。', '你没有用隐瞒回应担心，也说明了哪些私人消息不需要被检查。']],
    rumor: ['不把别人的议论当判决', '走廊里传来几句起哄。你和恋人先问彼此的感受，不急着公开，也不要求对方配合表演。', ['一起说明不希望被起哄。', '请可信任的老师帮助划清边界。'], ['你们说清楚不舒服的地方，没有让传言决定这段关系。', '有人帮你们制止不必要的追问。私人生活不用向所有人交代。']],
  };
  const [title, paragraph, texts, results] = ordinary[active.id] ?? ordinary.date;
  return { id: active.id, character: active.character, title, paragraphs: [paragraph], choices: texts.map((text, i) => ({ text, result: results[i] })), placeId: game.world.placeId, stage: 0 };
}
export function resolveRomanceScene(game: GameState, index: number, audience: Audience = { age: 'unknown', skipPrivate: false }, consent = false): { game: GameState; error?: string } {
  const active = game.romance.active, story = romanceStory(game);
  if (!active || !story?.choices[index]) return { game, error: '这段故事已经收好' };
  if (active.id === 'private' && index === 0 && (!matureAllowed(game, audience) || !consent)) return { game, error: '先确认成年及本次内容提示，或跳过这段剧情' };
  let next = reward(game, active.character, 3, 3, 4);
  if (active.id === 'confess') {
    if (index === 0) next = establishRelationship(next, active.character);
    if (index === 2) next = { ...next, social: { ...next.social, bonds: { ...next.social.bonds, [active.character]: { ...next.social.bonds[active.character], route: 'friendship' } } } };
  }
  if (active.id === 'talk' && game.social.partner === active.character) {
    next = patchBond(next, active.character, { status: index === 0 ? 'normal' : 'cooling' });
    if (index === 1) next = { ...next, romance: { ...next.romance, escort: null, visitor: null } };
  }
  const attention = { ...next.romance.attention };
  if (['date', 'hand', 'hug', 'kiss'].includes(active.id) && game.romance.bonds[active.character].boundaries.publicAffection && ['campus', 'arts', 'laboratory'].includes(game.world.scene)) { attention.school = limit(attention.school + 18); attention.rumor = limit(attention.rumor + 14); }
  if (active.id === 'home') attention.family = limit(attention.family + (index === 1 ? -18 : 12));
  if (['school', 'family', 'rumor'].includes(active.id)) { attention[active.id as 'school' | 'family' | 'rumor'] = limit(attention[active.id as 'school' | 'family' | 'rumor'] - 35); attention.queued = null; }
  const detail = next.romance.bonds[active.character];
  const memory = { id: `${active.id}:${detail.episode}:${game.week}:${game.romance.memories.length}`, character: active.character, week: game.week, title: story.title, result: story.choices[index].result, ...(active.id === 'private' ? { skipped: index === 1 } : {}) };
  next = { ...next, updatedAt: new Date().toISOString(), romance: { ...next.romance, active: null, visitor: active.id === 'home' ? active.character : next.romance.visitor, attention, memories: [...next.romance.memories, memory] } };
  next = chat(next, active.character, story.choices[index].text, memory.result);
  return { game: flushConcern(next) };
}
export function updateBoundary(game: GameState, id: RomanceId, key: keyof RomanceBond['boundaries'], enabled: boolean): { game: GameState; error?: string } {
  const error = romanceBaseLock(game); if (error) return { game, error };
  if (game.social.partner !== id) return { game, error: '交往后可以共同约定边界' };
  if (game.romance.bonds[id].status === 'cooling' && enabled && key !== 'publicAffection') return { game, error: '冷静期间先认真沟通，再讨论恢复亲近' };
  const detail = game.romance.bonds[id];
  return { game: patchBond(game, id, { boundaries: { ...detail.boundaries, [key]: enabled } }) };
}
export function setCompanion(game: GameState, id: RomanceId, follow: boolean): { game: GameState; error?: string } {
  const error = romanceBaseLock(game); if (error) return { game, error };
  if (follow && (game.social.partner !== id || game.romance.bonds[id].status !== 'normal')) return { game, error: '正常交往时，可以邀请恋人一起走' };
  return { game: { ...game, romance: { ...game.romance, escort: follow ? id : null }, updatedAt: new Date().toISOString() } };
}
export function changeRelationship(game: GameState, id: RomanceId, operation: 'cooling' | 'breakup'): { game: GameState; error?: string } {
  const error = romanceBaseLock(game); if (error) return { game, error };
  if (game.social.partner !== id) return { game, error: '当前没有这段恋爱关系' };
  let next = patchBond(game, id, { status: operation === 'breakup' ? 'broken' : 'cooling', ...(operation === 'breakup' ? { sinceWeek: game.week } : {}) });
  next = { ...next, romance: { ...next.romance, escort: null, visitor: null, attention: { ...next.romance.attention, queued: null }, cancelledAppointments: operation === 'breakup' ? [...new Set([...next.romance.cancelledAppointments, `${id}-invite`, `${id}-invite-out`])] : next.romance.cancelledAppointments }, social: operation === 'breakup' ? { ...next.social, partner: null, bonds: { ...next.social.bonds, [id]: { ...next.social.bonds[id], route: 'friendship' } } } : next.social };
  const result = operation === 'breakup' ? '你们明确结束了恋爱关系，保留共同回忆。没有人被迫承诺重新开始。' : '你们约定暂时放慢相处，暂停跟随与亲密互动，等准备好再沟通。';
  next = { ...next, romance: { ...next.romance, memories: [...next.romance.memories, { id: `${operation}:${game.week}:${next.romance.memories.length}`, character: id, week: game.week, title: operation === 'breakup' ? '好好说再见' : '给彼此一点空间', result }] } };
  return { game: chat(next, id, operation === 'breakup' ? '我们认真谈过了，就在这里结束交往吧。' : '我们先留一点空间，等准备好再认真聊。', result) };
}
export function makeHandmadeGift(game: GameState, id: RomanceId): { game: GameState; error?: string } {
  const error = romanceBaseLock(game); if (error) return { game, error };
  const detail = game.romance.bonds[id];
  if (game.social.partner !== id || detail.status !== 'normal') return { game, error: '正常交往时可以准备专属礼物' };
  if (detail.handmade?.gifted) return { game, error: '这份专属纪念已经送出' };
  if (!detail.handmade) {
    if (!game.inventory.notes) return { game, error: '需要一份笔记材料（学长的笔记），可以在小卖部购买' };
    return { game: patchBond({ ...game, inventory: { ...game.inventory, notes: game.inventory.notes - 1 } }, id, { handmade: { startedWeek: game.week, weeks: [], gifted: false } }) };
  }
  if (detail.handmade.weeks.includes(game.week)) return { game, error: '本周已经制作过，下周再接着做' };
  if (detail.handmade.weeks.length < 3) {
    if (game.actions >= 3 || game.stats.energy < 5) return { game, error: '制作需要 1 次行动和 5 体力' };
    return { game: patchBond({ ...game, actions: game.actions + 1, weeklyActions: [...game.weeklyActions, id], stats: { ...game.stats, energy: game.stats.energy - 5 }, counts: { ...game.counts, social: game.counts.social + 1 }, actionLog: [{ week: game.week, text: `为${CHARACTERS[id].name}制作纪念册` }, ...game.actionLog].slice(0, 180) }, id, { handmade: { ...detail.handmade, weeks: [...detail.handmade.weeks, game.week] } }) };
  }
  if (game.social.bonds[id].lastGiftWeek === game.week) return { game, error: '本周已经送过礼物，下周再送出这份纪念' };
  const next = patchBond(reward(game, id, 8, 8, 8), id, { handmade: { ...detail.handmade, gifted: true } });
  return { game: chat({ ...next, social: { ...next.social, bonds: { ...next.social.bonds, [id]: { ...next.social.bonds[id], lastGiftWeek: game.week } } } }, id, '这是我分了几周做好的纪念册，想送给你。', '每一页我都会认真看。谢谢你把时间和心意留给我。') };
}
export function flushConcern(game: GameState): GameState {
  const queued = game.romance.attention.queued;
  if (!queued || !game.social.partner || game.pendingEvent || game.romance.active || game.phase !== 'school') return game;
  return { ...game, romance: { ...game.romance, active: { id: queued, character: game.social.partner, week: game.week } } };
}
export function advanceRomance(game: GameState): GameState {
  const old = game.romance.attention;
  const attention = { ...old, school: limit(old.school - 6), family: limit(old.family - 5), rumor: limit(old.rumor - 8) };
  if (game.social.partner && game.week - old.lastConcernWeek >= 2 && !old.queued) {
    const thresholds = { school: 40 + game.relations.teacher / 3, family: 40 + game.relations.mom / 3, rumor: 45 };
    const concern = (['school', 'family', 'rumor'] as const).find(key => attention[key] >= thresholds[key] + (game.difficulty === 'gentle' ? 15 : 0));
    if (concern) { attention.queued = concern; attention.lastConcernWeek = game.week; }
  }
  return { ...game, world: { scene: 'campus', placeId: 'classroom', x: 54, y: 74 }, romance: { ...game.romance, escort: null, visitor: null, attention } };
}
export function endHomeVisit(game: GameState): GameState { return { ...game, romance: { ...game.romance, visitor: null, escort: game.romance.escort === game.romance.visitor ? null : game.romance.escort }, updatedAt: new Date().toISOString() }; }

export function validateRomance(raw: unknown, game: GameState, migrate = false): RomanceState | null {
  const base = createRomance();
  if (migrate) {
    for (const id of ROMANCE_IDS) {
      base.bonds[id].meetWeeks = [...new Set(game.actionLog.filter(entry => entry.text.includes(CHARACTERS[id].name)).map(entry => entry.week))];
      if (game.social.partner === id) { base.bonds[id].sinceWeek = game.social.replies.find(reply => reply.scriptId === `${id}-confession`)?.week ?? Math.max(0, game.week - 1); base.bonds[id].episode = 1; }
    }
    return base;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const state = raw as RomanceState;
  const week = (n: unknown, min = -10) => typeof n === 'number' && Number.isInteger(n) && n >= min && n <= game.week;
  const character = (id: unknown): id is RomanceId => ROMANCE_IDS.includes(id as RomanceId);
  const knownScene = (id: string) => (ROMANCE_OPERATION_IDS as readonly string[]).includes(id) || ROMANCE_SCENES.some(scene => scene.id === id);
  if (!state.bonds || !Array.isArray(state.memories) || state.memories.length > 2500 || !Array.isArray(state.cancelledAppointments) || !state.cancelledAppointments.every(id => typeof id === 'string' && id.length < 100)) return null;
  for (const id of ROMANCE_IDS) {
    const b = state.bonds[id];
    if (!b || !['normal', 'cooling', 'broken'].includes(b.status) || !week(b.sinceWeek) || !Number.isInteger(b.episode) || b.episode < 0 || b.episode > 40 || !Array.isArray(b.meetWeeks) || b.meetWeeks.length > 40 || new Set(b.meetWeeks).size !== b.meetWeeks.length || !b.meetWeeks.every(n => week(n, 0)) || ![b.lastConfessWeek, b.lastDateWeek, b.lastHomeWeek, b.lastTalkWeek, b.lastTouchWeek].every(n => week(n)) || !b.boundaries || !['publicAffection', 'homeVisits', 'touch'].every(key => typeof b.boundaries[key as keyof typeof b.boundaries] === 'boolean')) return null;
    if (b.status === 'cooling' && game.social.partner !== id || b.status === 'broken' && game.social.partner === id) return null;
    if (game.social.partner === id && (b.sinceWeek < 0 || b.episode < 1)) return null;
    if (b.handmade !== null && (!b.handmade || !week(b.handmade.startedWeek, 0) || typeof b.handmade.gifted !== 'boolean' || !Array.isArray(b.handmade.weeks) || b.handmade.weeks.length > 3 || new Set(b.handmade.weeks).size !== b.handmade.weeks.length || !b.handmade.weeks.every(n => week(n, b.handmade!.startedWeek)) || b.handmade.gifted && b.handmade.weeks.length !== 3)) return null;
  }
  if (!state.memories.every(m => m && typeof m.id === 'string' && m.id.length < 120 && character(m.character) && week(m.week, 0) && typeof m.title === 'string' && m.title.length < 150 && typeof m.result === 'string' && m.result.length < 1500 && (m.skipped === undefined || typeof m.skipped === 'boolean')) || new Set(state.memories.map(m => m.id)).size !== state.memories.length) return null;
  if (state.active !== null && (!state.active || !character(state.active.character) || !knownScene(state.active.id) || state.active.week !== game.week || game.pendingEvent || game.phase !== 'school' || !['confess', 'talk'].includes(state.active.id) && game.social.partner !== state.active.character)) return null;
  if (state.active && ROMANCE_SCENES.some(scene => scene.id === state.active!.id && scene.character !== state.active!.character)) return null;
  if (state.active?.id === 'private' && state.visitor !== state.active.character) return null;
  if ([state.escort, state.visitor].some(id => id !== null && (!character(id) || id !== game.social.partner || state.bonds[id].status !== 'normal'))) return null;
  const a = state.attention;
  if (!a || ![a.school, a.family, a.rumor].every(n => Number.isFinite(n) && n >= 0 && n <= 100) || !week(a.lastConcernWeek) || a.queued !== null && !['school', 'family', 'rumor'].includes(a.queued)) return null;
  // Rebuild known fields; preferences or consent from imported saves are ignored.
  return { bonds: Object.fromEntries(ROMANCE_IDS.map(id => { const b = state.bonds[id]; return [id, { status: b.status, sinceWeek: b.sinceWeek, episode: b.episode, meetWeeks: [...b.meetWeeks], lastConfessWeek: b.lastConfessWeek, lastTouchWeek: b.lastTouchWeek, lastDateWeek: b.lastDateWeek, lastHomeWeek: b.lastHomeWeek, lastTalkWeek: b.lastTalkWeek, boundaries: { publicAffection: b.boundaries.publicAffection, homeVisits: b.boundaries.homeVisits, touch: b.boundaries.touch }, handmade: b.handmade ? { startedWeek: b.handmade.startedWeek, weeks: [...b.handmade.weeks], gifted: b.handmade.gifted } : null }]; })) as RomanceState['bonds'], memories: state.memories.map(({ id, character, week, title, result, skipped }) => ({ id, character, week, title, result, ...(skipped === undefined ? {} : { skipped }) })), active: state.active ? { id: state.active.id, character: state.active.character, week: state.active.week } : null, escort: state.escort, visitor: state.visitor, cancelledAppointments: [...new Set(state.cancelledAppointments)], attention: { school: a.school, family: a.family, rumor: a.rumor, lastConcernWeek: a.lastConcernWeek, queued: a.queued } };
}
