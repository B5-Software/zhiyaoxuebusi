import { CHARACTERS, PLACES, ROMANCE_IDS } from './data';
import { PROACTIVE_TOPICS } from './proactiveData';
import { MESSAGE_SCRIPTS } from './socialData';
import type { GameState, RomanceId, StoryEvent } from './types';

// Invitations already live in the saved IM records. Deriving appointments from
// those records also restores accepted invitations from older saves.
export const APPOINTMENT_SOURCES = [
  ...PROACTIVE_TOPICS.filter(topic => topic.invitePlace).map(topic => ({ id: topic.id, character: topic.character as RomanceId, placeId: topic.invitePlace!, kind: 'topic' as const })),
  ...MESSAGE_SCRIPTS.filter(script => script.invitePlace && script.romantic).map(script => ({ id: script.id, character: script.character as RomanceId, placeId: script.invitePlace!, kind: 'script' as const })),
].filter(source => ROMANCE_IDS.includes(source.character));

export function getAppointments(game: GameState, character?: RomanceId) {
  return APPOINTMENT_SOURCES.flatMap(source => {
    if (character && source.character !== character) return [];
    const invitation = source.kind === 'topic'
      ? game.social.initiatives.find(item => item.topicId === source.id)
      : game.social.replies.find(item => item.scriptId === source.id && item.choiceIndex < 2);
    if (!invitation) return [];
    const eventId = `meeting-${source.id}`;
    return [{ ...source, eventId, week: invitation.week, completed: game.seenEvents.includes(eventId) }];
  }).sort((a, b) => a.week - b.week);
}

export type Appointment = ReturnType<typeof getAppointments>[number];

const moments: Record<RomanceId, [string, string, string, string, string, string]> = {
  su: ['留给你的那一页', '苏晓把书翻到夹着银杏叶的一页，旁边还放着一本空白的小册子。“这次不讨论考点，读到喜欢的地方就停下来。”', '一起读出各自喜欢的句子。', '你们读到不同的地方，却都认真听完了对方的解释。书页之间，多了一段只有彼此知道的回忆。', '告诉她最近藏在心里的担心。', '苏晓没有急着给答案，只把书轻轻合上。“那我先陪你坐一会儿。”这段安静，比漂亮的安慰更让你安心。'],
  zhou: ['球落地以后', '周野把水放在场边，没有拿出记分牌。“说好了不计分。今天累了，就一起坐下来。”', '练几个传球，笑着接住失误。', '球偏了一次又一次，你们却没有互相催促。周野笑起来：“和你打球，输了也愿意再来。”', '坐在场边，听他讲没说完的烦恼。', '周野第一次没有用玩笑带过失落。你认真听着，直到夕阳慢慢挪过空着的球框。'],
  zhixia: ['把空白也画进去', '许知夏已经铺好了两张纸，窗边的灰绿颜料还没有干。“给你留的纸还在。画什么都可以，不想画也可以。”', '画下窗外，也画下今天的心情。', '你们没有交换评分，只交换了画纸。知夏在边角添了一束暖色的光：“这一点，像你今天来找我。”', '放下画笔，认真听她讲这幅画。', '她讲起没有涂满的地方，你没有替她补齐。许知夏抬起头，发现有人愿意理解空白，而不是急着把它填满。'],
  xinghe: ['星图以外的答案', '顾星河把星图压在栏杆上，留出一块能一起看的位置。“阴天也没关系，今天想见的又不只是星星。”', '一起认出一颗星，记下自己的猜想。', '你们查证了几次，才找到那颗不算耀眼的星。顾星河在记录旁写下两个人的发现，没有把它变成一次竞赛。', '先聊未来，也允许暂时没有答案。', '星河收起了笔：“那我们可以慢慢找。”风吹过屋顶，你们都没有急着为未来定下唯一正确的路线。'],
  tangtang: ['今天只做你的听众', '唐棠把话筒的开关拨到关闭，给你拉出旁边的椅子。“这段不录下来，也不用主持。今天我们都可以停顿。”', '轮流讲一件这一周的小事。', '你们说着没能进入广播稿的普通日子。唐棠笑着说：“原来不用想开场白，也可以一直聊下去。”', '请她先讲，你认真听完。', '唐棠慢慢说起自己的疲惫。你没有把她的话剪成一句励志结语，她也终于不用替所有人把今天说得圆满。'],
};

export const MEETING_EVENTS: StoryEvent[] = APPOINTMENT_SOURCES.map(source => {
  const place = PLACES.find(item => item.id === source.placeId)!;
  const [title, paragraph, firstChoice, firstResult, secondChoice, secondResult] = moments[source.character];
  const name = CHARACTERS[source.character].name;
  return {
    id: `meeting-${source.id}`, appointmentSource: source.id, title: source.kind === 'script' ? `两个人的约定 · ${title}` : title,
    chapter: `与${name}的约见`, minWeek: 0, maxWeek: 39, speaker: source.character, scene: place.scene,
    paragraphs: [`{{player}}按照聊天里的约定来到${place.name}。${name}看到你，向身旁空着的位置招了招手。`, paragraph],
    choices: [
      { text: firstChoice, result: firstResult, effect: { mood: 4, bonds: { [source.character]: { trust: 3, affection: 4, understanding: 5 } } } },
      { text: secondChoice, result: secondResult, effect: { stress: -3, bonds: { [source.character]: { trust: 5, affection: 2, understanding: 7 } } } },
    ],
  };
});
