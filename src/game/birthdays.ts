import { ADULT_BIRTHDAYS } from './audience';
import { CHARACTERS, PLACES, ROMANCE_IDS } from './data';
import type { CharacterId, GameState, StoryEvent } from './types';

export const CHARACTER_BIRTHDAYS: Record<CharacterId, string> = { su: ADULT_BIRTHDAYS.su, zhou: ADULT_BIRTHDAYS.zhou, zhixia: ADULT_BIRTHDAYS.zhixia, xinghe: ADULT_BIRTHDAYS.xinghe, tangtang: ADULT_BIRTHDAYS.tangtang, mom: '1983-11-08', teacher: '1985-10-26' };
const start = Date.UTC(2025, 8, 1), day = 86400000;
const stories: Record<CharacterId, [string, string, string, string, string, string]> = {
  su: ['reading-table', '夹在书页里的生日', '苏晓收到一张写着日期的书签。她说这次想听一句和成绩、排名都无关的祝福，窗边的小蛋糕也只需要两个人慢慢分。', '写下希望她继续喜欢自己的祝福。', '陪她读完一直想读的那篇短诗。', '苏晓把书签夹好：“原来生日也可以不需要证明自己又进步了多少。”'],
  zhou: ['track', '最后一球之后的生日', '周野说今天的球赛不记比分。队友把一块小蛋糕放在看台上，他希望这一年的愿望是大家忙起来以后也别失去联系。', '陪他打一场没有比分的球。', '约定考试后再聚一次，写进日历。', '周野收下了约定。今天最让他开心的，是有人记得这个普通又特别的日子。'],
  zhixia: ['art-studio', '留给未来的一抹颜色', '许知夏的生日在高考之后。你们决定提前在画室留一张共同的画，把未来生日的祝福写在背面，考试忙也不会把这一天忘掉。', '给她画一片没有评分的天空。', '在画背面写一段认真具体的祝福。', '她把画放在窗边，说生日那天还会再看一次。祝福没有因为提前而变轻。'],
  xinghe: ['observatory', '冬夜里的一颗生日星', '顾星河在星图上圈出今晚能看见的一颗星，说生日愿望不用被每个人听到。你们带着一杯热饮，在冬夜里给好奇心留了一点时间。', '认真听他讲今年最想弄懂的问题。', '一起给星图写下下次观测的约定。', '他把今天的日期记在星图上：“被记住的感觉，比星星的名字还容易辨认。”'],
  tangtang: ['radio-room', '只播给朋友的生日节目', '唐棠把录音灯关掉，今天的祝福不需要播放给全校。她想留一段没有主持腔的声音，记录这一年喜欢过的旋律和遇到的人。', '录一段只留给她的生日祝福。', '陪她挑一首真正喜欢的歌。', '她把这一段录音保存好。今天不用负责活跃气氛，也一样有人愿意听她说话。'],
  mom: ['family', '妈妈也有自己的生日愿望', '妈妈正要照常张罗晚饭，你把她请到餐桌旁。你问起她年轻时喜欢的事情，第一次发现，家人的名字之外还有她自己的愿望。', '接过晚饭的安排，让她休息一晚。', '听她讲年轻时最想去的地方。', '妈妈笑着说，今天被关心的是她。饭桌上的话题没有变成下一次考试。'],
  teacher: ['classroom', '老师收到的一封普通来信', '老陈的生日没有挂在黑板上。同学们把一封具体写着感谢的信放在教案边：不是感谢分数，而是感谢某次愿意听完的话。', '写下他曾经认真倾听的一件事。', '和同学一起给他一段朴素的祝福。', '老陈把信折好放进教案：“谢谢。老师也会记得，有些事比成绩更长久。”'],
};
export function birthdayInfo(id: CharacterId | 'player') {
  const birthday = id === 'player' ? ADULT_BIRTHDAYS.player : CHARACTER_BIRTHDAYS[id];
  const [, month, date] = birthday.split('-').map(Number), year = month >= 9 ? 2025 : 2026;
  const time = Date.UTC(year, month - 1, date), week = Math.min(39, Math.floor((time - start) / (7 * day)));
  return { id, birthday, month, date, year, time, week, early: time >= start + 40 * 7 * day, eventId: `birthday-${id}`, giftKey: `${id}:${year}`, placeId: id === 'player' ? 'family' : stories[id][0] };
}
export function birthdayStatus(game: GameState, id: CharacterId | 'player') {
  const info = birthdayInfo(id), today = start + (game.week * 7 + Math.min(2, game.actions) * 2) * day;
  return { ...info, daysUntil: Math.max(0, Math.ceil((info.time - today) / day)), thisWeek: game.phase === 'school' && game.week === info.week, celebrated: game.seenEvents.includes(info.eventId), bonusAvailable: id !== 'player' && game.week === info.week && !(game.birthdayGifts ?? []).includes(info.giftKey) };
}
export function birthdayEventFor(game: GameState, event: StoryEvent): StoryEvent {
  const id = event.id.replace('birthday-', '') as CharacterId;
  if (!event.id.startsWith('birthday-') || !ROMANCE_IDS.includes(id as typeof ROMANCE_IDS[number])) return event;
  const record = game.history.find(entry => entry.eventId === event.id);
  const couple = record ? record.result.startsWith('这份情侣生日回忆') : game.social.partner === id && game.romance.bonds[id as typeof ROMANCE_IDS[number]].status === 'normal';
  if (!couple) return event;
  const moments: Record<string, [string, string]> = {
    su: ['只写给恋人的生日书签', '苏晓在书签背面给你留了一句只有两个人懂的话。你们把蛋糕分好，认真说出今年想一起完成的一件小事。'],
    zhou: ['生日愿望里的两个人', '周野把球收好，今天想把傍晚留给恋人。你们坐到看台边，约定忙碌的时候也把一句真实的问候留给彼此。'],
    zhixia: ['画背面，两个人的生日约定', '许知夏把提前庆祝的画翻过来，让你们一起写下毕业后的约定。画里不必只有一种颜色，关系里也可以保留各自的愿望。'],
    xinghe: ['星图上的情侣生日', '顾星河把今天圈在星图上，说今年最想留住的是一起抬头的时间。你们安静分享热饮，商量下一次属于两个人的夜空。'],
    tangtang: ['只给恋人的生日晚安', '唐棠把这次生日录音留成只有两个人的声音。你们聊了一段无需剪辑的日常，也认真听完对方对下一岁的期待。'],
  };
  const [title, paragraph] = moments[id];
  return { ...event, title, chapter: '情侣生日 · 两个人的祝福', paragraphs: [event.paragraphs[0], paragraph, '先庆祝生日，再决定之后怎样相处。邀请回家、亲近与私人时间都需要另外确认，拒绝或跳过同样被尊重。'], choices: [
    { text: '说出自己的生日祝福，也听恋人的愿望。', result: '这份情侣生日回忆被认真收好。你们把愿望说清楚，没有把喜欢变成必须配合的要求。', effect: { ...event.choices[0].effect, bonds: { [id]: { trust: 7, affection: 6, understanding: 7 } } } },
    { text: '写下两个人都愿意的下一次约定。', result: '这份情侣生日回忆留在手帐里。未来还有很多变化，但约定可以一起认真调整。', effect: { ...event.choices[1].effect, bonds: { [id]: { trust: 6, affection: 6, understanding: 8 } } } },
  ] };
}
export const BIRTHDAY_EVENTS: StoryEvent[] = (Object.keys(CHARACTER_BIRTHDAYS) as CharacterId[]).map(id => {
  const info = birthdayInfo(id), [placeId, title, text, first, second, result] = stories[id], place = PLACES.find(p => p.id === placeId)!;
  const peer = ['su', 'zhou', 'zhixia', 'xinghe', 'tangtang'].includes(id);
  return { id: info.eventId, title, chapter: '生日手记 · 被认真记住的一天', minWeek: info.week, maxWeek: info.week, speaker: id, scene: place.scene, placeId, paragraphs: [`${CHARACTERS[id].name}的生日是 ${info.month} 月 ${info.date} 日。${info.early ? '高考前，你们先把这份祝福好好留住。' : '今天，把祝福留给一个具体的人。'}`, text], choices: [first, second].map(text => ({ text, result, effect: { mood: 12, stress: -6, relations: { [id]: 8 }, ...(peer ? { bonds: { [id]: { trust: 5, affection: 3, understanding: 6 } } } : {}) } })) };
});
const player = birthdayInfo('player');
BIRTHDAY_EVENTS.push({ id: player.eventId, title: '属于你的生日，不只属于考试', chapter: '生日手记 · 你也值得被记住', minWeek: player.week, maxWeek: player.week, speaker: 'mom', scene: 'home', placeId: 'family', paragraphs: ['今天，妈妈把倒计时的小纸条暂时收起来。朋友的祝福一条条亮起：“{{player}}，生日快乐。你不需要先考到一个分数，才值得过一个开心的生日。”'], choices: [{ text: '把这一天留给家人和朋友。', result: '这一年的愿望里，也有好好睡觉、认真生活和继续选择自己的路。', effect: { mood: 18, stress: -12, money: 24, relations: { mom: 6, su: 4, zhou: 4 } } }, { text: '给下一岁的自己写一封信。', result: '你写下自己的名字，也写下希望保留下来的好奇心。这个愿望不用被排名。', effect: { mood: 12, autonomy: 8, stress: -10, money: 24 } }] });

export function deliverBirthdayReminders(game: GameState): GameState {
  if (!game.started || game.phase !== 'school') return game;
  const messages = [...game.social.messages];
  for (const id of [...Object.keys(CHARACTER_BIRTHDAYS), 'player'] as (CharacterId | 'player')[]) {
    const info = birthdayInfo(id), key = `birthday-reminder:${id}`;
    if (game.week < info.week - 1 || game.week > info.week || messages.some(message => message.id === key)) continue;
    const name = id === 'player' ? '你的' : `${CHARACTERS[id].name}的`;
    const place = PLACES.find(place => place.id === info.placeId)!;
    messages.push({ id: key, character: id === 'player' ? 'mom' : id, side: 'incoming', text: `${name}生日是 ${info.month} 月 ${info.date} 日。${info.early ? '高考前可以先到' : game.week === info.week ? '这周可以到' : '下周可以到'}${place.name}留一段生日祝福，不用准备贵重礼物。`, week: game.week, read: false });
  }
  return messages.length === game.social.messages.length ? game : { ...game, social: { ...game.social, messages } };
}
