import { CHARACTERS, ROMANCE_IDS } from './data';
import { MESSAGE_SCRIPTS } from './socialData';
import { PROACTIVE_TOPICS } from './proactiveData';
import { confessionLock, romanceBusy } from './romance';
import type { CharacterId, GameState, MessageScript, ProactiveTopic, RomanceId, SocialState } from './types';

export const isRomanceId = (id: string): id is RomanceId => ROMANCE_IDS.includes(id as RomanceId);
export function createSocial(): SocialState {
  return { bonds: Object.fromEntries(ROMANCE_IDS.map(id => [id, { trust: 15, affection: 0, understanding: 0, route: 'open', meetings: 0, lastMeetWeek: -1, lastGiftWeek: -1 }])) as SocialState['bonds'], messages: [], delivered: [], replies: [], partner: null, initiatives: [] };
}

export function proactiveLock(game: GameState, topic: ProactiveTopic) {
  if (!game.started || game.phase !== 'school') return '开启校园生活后可以主动联系';
  if (game.pendingEvent || romanceBusy(game)) return '先收好眼前的故事';
  if (game.social.initiatives.some(item => item.topicId === topic.id)) return '这段话题已经聊过了';
  if (game.week < topic.minWeek) return `第 ${topic.minWeek + 1} 周可以聊`;
  if (topic.weekly && game.week !== topic.minWeek) return '这周的话题已留在聊天回忆里';
  if (isRomanceId(topic.character)) {
    const bond = game.social.bonds[topic.character];
    if (topic.datingOnly && bond.route !== 'dating') return '确定恋爱关系后解锁';
    if (bond.trust < (topic.minTrust ?? 0)) return `信任达到 ${topic.minTrust} 后可以邀请`;
  }
  if (game.social.initiatives.some(item => item.week === game.week && PROACTIVE_TOPICS.find(entry => entry.id === item.topicId)?.character === topic.character)) return '本周已经主动聊过，下一周再分享新的话题';
  return null;
}

export function bondStage(game: GameState, id: RomanceId) {
  const bond = game.social.bonds[id];
  if (game.romance.bonds[id].status === 'cooling') return '恋人 · 暂时冷静';
  if (game.romance.bonds[id].status === 'broken') return '已分开 · 保留回忆';
  return bond.route === 'dating' ? '恋人 · 慢慢同行' : bond.route === 'friendship' ? '珍惜的朋友' : bond.affection >= 45 && bond.trust >= 45 ? '彼此心动' : bond.trust >= 35 ? '渐渐靠近' : bond.trust >= 22 ? '开始熟悉' : '故事刚开始';
}

export function unreadCount(game: GameState, id?: CharacterId) {
  return game.social.messages.filter(message => message.side === 'incoming' && !message.read && (!id || message.character === id)).length;
}

export function pendingChat(game: GameState, id: CharacterId) {
  const eligibleMessages = game.social.messages.filter(item => item.character === id && item.scriptId && !game.social.replies.some(reply => reply.scriptId === item.scriptId));
  return eligibleMessages.map(item => MESSAGE_SCRIPTS.find(script => script.id === item.scriptId)).find(script => script && (!isRomanceId(id) || (!script.datingOnly || game.social.partner === id && game.romance.bonds[id].status === 'normal') && (!script.romantic || game.social.bonds[id].route === 'open' && (!game.social.partner || game.social.partner === id))));
}

export function messageEligible(game: GameState, script: MessageScript) {
  if (game.social.delivered.includes(script.id) || game.week < script.minWeek) return false;
  if (script.requires && !game.social.replies.some(reply => reply.scriptId === script.requires)) return false;
  if (isRomanceId(script.character)) {
    const bond = game.social.bonds[script.character];
    if (script.romantic && (bond.route === 'friendship' || game.social.partner && game.social.partner !== script.character)) return false;
    if (script.datingOnly && bond.route !== 'dating') return false;
    if (script.datingOnly && game.romance.bonds[script.character].status !== 'normal') return false;
    if (script.id.endsWith('-confession') && confessionLock(game, script.character)) return false;
    if (bond.trust < (script.minTrust ?? 0) || bond.affection < (script.minAffection ?? 0)) return false;
  }
  return true;
}

export function deliverMessages(game: GameState): GameState {
  if (!game.started || game.phase !== 'school') return game;
  let social = game.social;
  for (const character of Object.keys(CHARACTERS) as CharacterId[]) {
    const working = { ...game, social };
    if (pendingChat(working, character) || social.messages.some(message => message.scriptId && message.character === character && message.week === game.week)) continue;
    const eligible = MESSAGE_SCRIPTS.filter(script => script.character === character && messageEligible(working, script));
    // Romantic milestones are prioritized once earned; routine threads stay
    // queued and every incoming script can only be delivered once.
    const selected = eligible.find(script => script.romantic || script.datingOnly) ?? eligible[0];
    if (!selected) continue;
    social = { ...social, delivered: [...social.delivered, selected.id], messages: [...social.messages, { id: `${selected.id}-in`, character, side: 'incoming', text: selected.text, week: game.week, read: false, scriptId: selected.id }] };
  }
  return social === game.social ? game : { ...game, social, updatedAt: new Date().toISOString() };
}

export function markConversationRead(game: GameState, id: CharacterId): GameState {
  if (!unreadCount(game, id)) return game;
  return { ...game, social: { ...game.social, messages: game.social.messages.map(message => message.character === id ? { ...message, read: true } : message) }, updatedAt: new Date().toISOString() };
}

export function replyLock(game: GameState, script: MessageScript, index: number) {
  const choice = script.choices[index];
  if (!choice) return '没有这条回复';
  if (!game.started || game.phase !== 'school') return '校园消息已成为纪念，可以回看聊天';
  if (game.pendingEvent || romanceBusy(game)) return '先读完眼前的故事';
  if (pendingChat(game, script.character)?.id !== script.id) return '这条消息已经回复过了';
  if (game.stats.money + (choice.effect.money ?? 0) < 0) return '零花钱不足';
  if (choice.route === 'dating' && game.social.partner && game.social.partner !== script.character) return `你已与${CHARACTERS[game.social.partner].name}约定恋爱关系`;
  if (choice.route === 'dating' && isRomanceId(script.character)) return confessionLock(game, script.character);
  return null;
}

export function validateSocial(raw: unknown): SocialState | null {
  const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
  const number = (value: unknown, max: number, min = 0) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
  if (!record(raw) || !record(raw.bonds) || !Array.isArray(raw.messages) || !Array.isArray(raw.delivered) || !Array.isArray(raw.replies)) return null;
  const validScript = (id: unknown) => MESSAGE_SCRIPTS.some(script => script.id === id);
  const initiatives = raw.initiatives === undefined ? [] : raw.initiatives;
  if (!Array.isArray(initiatives) || initiatives.length > PROACTIVE_TOPICS.length || new Set(initiatives.map(item => record(item) ? item.topicId : undefined)).size !== initiatives.length || !initiatives.every(item => record(item) && number(item.week, 39) && Number.isInteger(item.week) && PROACTIVE_TOPICS.some(topic => topic.id === item.topicId && Number(item.week) >= topic.minWeek && (!topic.weekly || item.week === topic.minWeek)))) return null;
  const contactWeeks = initiatives.map(item => { const entry = item as Record<string, unknown>; return `${PROACTIVE_TOPICS.find(topic => topic.id === entry.topicId)?.character}:${entry.week}`; });
  if (new Set(contactWeeks).size !== contactWeeks.length) return null;
  if (raw.delivered.length > MESSAGE_SCRIPTS.length || new Set(raw.delivered).size !== raw.delivered.length || !raw.delivered.every(validScript)) return null;
  if (raw.replies.length > raw.delivered.length || new Set(raw.replies.map(reply => record(reply) ? reply.scriptId : undefined)).size !== raw.replies.length) return null;
  if (!raw.replies.every(reply => record(reply) && raw.delivered instanceof Array && raw.delivered.includes(reply.scriptId) && number(reply.week, 39) && Number.isInteger(reply.week) && MESSAGE_SCRIPTS.some(script => script.id === reply.scriptId && Number.isInteger(reply.choiceIndex) && !!script.choices[Number(reply.choiceIndex)]))) return null;
  if (raw.messages.length > 6000 || new Set(raw.messages.map(message => record(message) ? message.id : undefined)).size !== raw.messages.length) return null;
  if (!raw.messages.every(message => record(message) && typeof message.id === 'string' && message.id.length < 100 && Object.prototype.hasOwnProperty.call(CHARACTERS, String(message.character)) && ['incoming', 'outgoing'].includes(String(message.side)) && typeof message.text === 'string' && message.text.length < 1000 && typeof message.read === 'boolean' && number(message.week, 39) && Number.isInteger(message.week) && (message.scriptId === undefined || validScript(message.scriptId)))) return null;
  const social = createSocial();
  for (const id of ROMANCE_IDS) {
    const bond = raw.bonds[id];
    if (!record(bond) || !number(bond.trust, 100) || !number(bond.affection, 100) || !number(bond.understanding, 100) || !number(bond.meetings, 120) || !Number.isInteger(bond.meetings) || !number(bond.lastMeetWeek, 39, -1) || !Number.isInteger(bond.lastMeetWeek) || !number(bond.lastGiftWeek, 39, -1) || !Number.isInteger(bond.lastGiftWeek) || !['open', 'friendship', 'dating'].includes(String(bond.route))) return null;
    social.bonds[id] = { trust: Number(bond.trust), affection: Number(bond.affection), understanding: Number(bond.understanding), route: bond.route as SocialState['bonds'][RomanceId]['route'], meetings: Number(bond.meetings), lastMeetWeek: Number(bond.lastMeetWeek), lastGiftWeek: Number(bond.lastGiftWeek) };
  }
  if (raw.partner !== null && !isRomanceId(String(raw.partner))) return null;
  const dating = ROMANCE_IDS.filter(id => social.bonds[id].route === 'dating');
  if (dating.length !== (raw.partner ? 1 : 0) || raw.partner && dating[0] !== raw.partner) return null;
  social.partner = raw.partner as RomanceId | null;
  social.initiatives = initiatives.map(item => { const entry = item as Record<string, unknown>; return { topicId: String(entry.topicId), week: Number(entry.week) }; });
  social.delivered = raw.delivered as string[];
  for (const message of raw.messages) if (record(message) && message.topicId !== undefined && !PROACTIVE_TOPICS.some(topic => topic.id === message.topicId && topic.character === message.character) || record(message) && message.topicId && !social.initiatives.some(item => item.topicId === message.topicId)) return null;
  social.messages = raw.messages.map(message => { const item = message as Record<string, unknown>; return { id: String(item.id), character: item.character as CharacterId, side: item.side as 'incoming' | 'outgoing', text: String(item.text), week: Number(item.week), read: Boolean(item.read), ...(item.scriptId ? { scriptId: String(item.scriptId) } : {}), ...(item.topicId ? { topicId: String(item.topicId) } : {}) }; });
  social.replies = raw.replies.map(reply => { const item = reply as Record<string, unknown>; return { scriptId: String(item.scriptId), choiceIndex: Number(item.choiceIndex), week: Number(item.week) }; });
  for (const id of social.delivered) if (!social.messages.some(message => message.scriptId === id && message.side === 'incoming')) return null;
  for (const item of social.initiatives) if (!['incoming', 'outgoing'].every(side => social.messages.some(message => message.topicId === item.topicId && message.side === side && message.week === item.week))) return null;
  return social;
}
