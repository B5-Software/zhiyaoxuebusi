import type { CharacterId, Effect, GameAction, IconName, RomanceId, Scene, SubjectKey } from './types';
import { asset } from '../utils/asset';

export const SUBJECTS: { id: SubjectKey; name: string; max: number; color: string; note: string }[] = [
  { id: 'chinese', name: '语文', max: 150, color: '#bb7c66', note: '文字里，也有另一种人生。' },
  { id: 'math', name: '数学', max: 150, color: '#7e9b77', note: '解不开的题，先换个思路。' },
  { id: 'english', name: '英语', max: 150, color: '#7c9bad', note: '让世界比试卷大一点。' },
  { id: 'physics', name: '物理', max: 100, color: '#b89962', note: '好奇心是最初的动力。' },
  { id: 'chemistry', name: '化学', max: 100, color: '#a08bac', note: '生活也需要一点化学反应。' },
  { id: 'biology', name: '生物', max: 100, color: '#82a093', note: '先照顾好你这个生命体。' },
];

export const CHARACTERS: Record<CharacterId, { name: string; role: string; image: string; description: string; quote: string }> = {
  su: { name: '苏晓', role: '同桌 / 文学少女', image: 'companion', description: '把诗写在错题本背面的女孩。她想去看更大的世界，也想让你看看窗外。', quote: '我们不只是成绩单上的一行数字，对吧？' },
  zhou: { name: '周野', role: '好友 / 篮球搭子', image: 'friend', description: '看起来总是无忧无虑，其实也把梦想藏在了篮球里。最拿手的是在你低落时逗你笑。', quote: '一道题不会，天又不会塌。走，投个三分！' },
  mom: { name: '妈妈', role: '家人 / 焦虑的守护者', image: 'mother', description: '她用切好的水果表达关心，也用别人家的孩子表达恐惧。她也在学习怎样做妈妈。', quote: '汤给你留着呢。今天……累不累？' },
  teacher: { name: '老陈', role: '班主任 / 嘴硬心软', image: 'teacher', description: '一边喊着“再坚持一下”，一边偷偷给全班争取体育课。夹在升学指标和孩子们之间。', quote: '卷子可以慢点交。你先把饭吃了。' },
  zhixia: { name: '许知夏', role: '同级同学 / 美术社', image: 'zhixia', description: '把不敢说的话画进速写本。她喜欢观察光，也在慢慢练习被人看见。', quote: '如果今天有颜色，我想画一点属于自己的。' },
  xinghe: { name: '顾星河', role: '同级同学 / 实验搭档', image: 'xinghe', description: '在纸边记满问题的理科少年。说话有点慢，但答应你的事会认真记住。', quote: '不知道的时候，也可以一起找答案。' },
  tangtang: { name: '唐棠', role: '同级同学 / 广播站', image: 'tangtang', description: '总在帮别人把话说清楚的广播员。热闹散去时，她也希望有人愿意听她说。', quote: '今天的话筒先交给你。我会认真听。' },
};

export const ROMANCE_IDS: RomanceId[] = ['su', 'zhou', 'zhixia', 'xinghe', 'tangtang'];
export const FAVORITE_GIFTS: Record<RomanceId, string> = { su: 'notes', zhou: 'milk', zhixia: 'tea', xinghe: 'notes', tangtang: 'bread' };

export const ACTIONS: GameAction[] = [
  ...SUBJECTS.map((subject): GameAction => ({ id: subject.id, name: `${subject.name}专项学习`, description: subject.note, icon: 'book', category: 'study', effect: { energy: -17, mood: -3, stress: 7, subjects: { [subject.id]: 8 } } })),
  { id: 'balanced', name: '认真听一堂课', description: '不贪多，把今天的知识真正弄明白。', icon: 'book', category: 'study', effect: { energy: -19, stress: 8, mood: -2, subjects: { chinese: 2, math: 3, english: 2, physics: 2, chemistry: 2, biology: 2 }, relations: { teacher: 2 } } },
  { id: 'read', name: '窗边静静读书', description: '试卷之外，还有值得读的句子。', icon: 'journal', category: 'study', effect: { energy: -10, mood: 5, stress: -3, autonomy: 2, subjects: { chinese: 5, english: 3 } } },
  { id: 'review', name: '整理错题本', description: '比起盲目刷题，先和老错误告别。', icon: 'notes', category: 'study', effect: { energy: -13, stress: 4, subjects: { math: 4, physics: 3, chemistry: 3 } } },
  { id: 'rest', name: '好好睡一觉', description: '睡眠不是浪费时间，你不是永动机。', icon: 'moon', category: 'rest', effect: { energy: 38, health: 7, mood: 10, stress: -16 } },
  { id: 'nap', name: '树荫下发会儿呆', description: '什么也不做，也是一种被允许的选择。', icon: 'leaf', category: 'rest', effect: { energy: 25, mood: 12, stress: -13, autonomy: 2 } },
  { id: 'exercise', name: '去操场跑两圈', description: '让脑子里的声音，暂时输给风声。', icon: 'ball', category: 'exercise', effect: { energy: -9, health: 9, mood: 17, stress: -18, relations: { zhou: 4 } } },
  { id: 'meal', name: '吃一碗热乎的面', description: '油泼面的香气，是西安式的治愈。', icon: 'food', category: 'rest', effect: { money: -16, energy: 28, health: 3, mood: 10, stress: -7 } },
  { id: 'su', name: '和苏晓聊聊天', description: '交换一件最近的小事，也交换一点勇气。', icon: 'friends', category: 'social', effect: { energy: -5, mood: 14, stress: -11, autonomy: 3, relations: { su: 9 } } },
  { id: 'zhou', name: '和周野投会儿篮', description: '三分可以不中，朋友不能不见。', icon: 'ball', category: 'social', effect: { energy: -10, mood: 17, stress: -12, health: 4, relations: { zhou: 10 } } },
  { id: 'mom', name: '认真和妈妈谈谈', description: '试着把“我没事”，换成真实的心情。', icon: 'heart', category: 'social', effect: { energy: -5, stress: -10, mood: 9, autonomy: 3, relations: { mom: 10 } } },
  { id: 'teacher', name: '向老陈请教', description: '问一道题，也可以问一句“为什么”。', icon: 'book', category: 'social', effect: { energy: -8, stress: -5, subjects: { math: 4, physics: 3 }, relations: { teacher: 10 } } },
  { id: 'zhixia', name: '陪知夏画一会儿', description: '不评价画得好不好，先听她想画什么。', icon: 'journal', category: 'social', effect: { energy: -7, mood: 13, stress: -9, autonomy: 3, relations: { zhixia: 9 } } },
  { id: 'xinghe', name: '和星河讨论一个问题', description: '不用立刻聪明，也可以认真好奇。', icon: 'energy', category: 'social', effect: { energy: -8, mood: 9, stress: -7, subjects: { physics: 3 }, relations: { xinghe: 9 } } },
  { id: 'tangtang', name: '听唐棠讲今天的事', description: '让总在倾听的人，也有机会说话。', icon: 'letter', category: 'social', effect: { energy: -6, mood: 12, stress: -9, autonomy: 3, relations: { tangtang: 9 } } },
  { id: 'walk', name: '沿着城墙散散步', description: '这座城见过很多朝代，也见过很多次考试。', icon: 'leaf', category: 'explore', effect: { energy: -8, mood: 20, stress: -17, autonomy: 5, health: 3 } },
  { id: 'bookshop', name: '逛逛旧书摊', description: '在参考答案以外，找一点自己的答案。', icon: 'journal', category: 'explore', effect: { energy: -7, money: -10, mood: 10, autonomy: 5, subjects: { chinese: 4 } } },
  { id: 'research', name: '查一份真正的资料', description: '先追问出处，再接受一个答案。', icon: 'notes', category: 'study', effect: { energy: -12, autonomy: 4, subjects: { chinese: 4, english: 4 } } },
  { id: 'reading-circle', name: '参加小小读书会', description: '同一本书，也可以有不同的理解。', icon: 'friends', category: 'social', effect: { energy: -7, mood: 12, autonomy: 4, stress: -8, relations: { su: 7 } } },
  { id: 'quiet-reading', name: '在窗边读一本闲书', description: '让一段安静，成为今天的留白。', icon: 'book', category: 'rest', effect: { energy: 22, mood: 11, stress: -12, subjects: { chinese: 2 } } },
  { id: 'experiment', name: '亲手做一次实验', description: '把“应该如此”，变成一次真实的验证。', icon: 'energy', category: 'study', effect: { energy: -16, mood: 5, autonomy: 3, subjects: { physics: 5, chemistry: 5 } } },
  { id: 'plant', name: '照顾温室的幼苗', description: '记录生长，也允许它慢一点。', icon: 'leaf', category: 'rest', effect: { energy: 15, mood: 12, stress: -10, health: 3, subjects: { biology: 3 } } },
  { id: 'stargaze', name: '和朋友一起认星星', description: '抬头看，宇宙没有年级排名。', icon: 'moon', category: 'explore', effect: { energy: -7, mood: 16, stress: -12, autonomy: 4, subjects: { physics: 3 }, relations: { zhou: 4 } } },
  { id: 'rehearsal', name: '参加一场小排练', description: '不必拿奖，先把喜欢的旋律弹完。', icon: 'smile', category: 'social', effect: { energy: -9, mood: 17, stress: -13, autonomy: 4, relations: { zhou: 6 } } },
  { id: 'paint', name: '画一张没有评分的画', description: '把世界画成你看见的样子。', icon: 'journal', category: 'explore', effect: { energy: -8, mood: 14, stress: -9, autonomy: 6 } },
  { id: 'broadcast', name: '录一段校园广播', description: '让自己的声音，也成为校园的背景音。', icon: 'letter', category: 'social', effect: { energy: -8, autonomy: 6, mood: 10, subjects: { chinese: 3 }, relations: { su: 6 } } },
  { id: 'river-walk', name: '沿着河岸慢慢走', description: '水往前流，你可以暂时停下来。', icon: 'leaf', category: 'exercise', effect: { energy: -6, health: 7, mood: 15, stress: -15 } },
  { id: 'picnic', name: '和朋友分享一顿野餐', description: '一块面包，也可以把一个下午变柔软。', icon: 'food', category: 'social', effect: { energy: 18, money: -12, mood: 13, stress: -8, relations: { su: 5, zhou: 5 } } },
  { id: 'volunteer', name: '参加河岸志愿活动', description: '帮助具体的人，做具体的小事。', icon: 'heart', category: 'explore', effect: { energy: -12, mood: 10, autonomy: 5, health: 3, relations: { teacher: 3 } } },
  { id: 'market-snack', name: '尝一份夜市小吃', description: '热乎的香气，比励志标语管用。', icon: 'food', category: 'rest', effect: { money: -12, energy: 24, mood: 12, stress: -8 } },
  { id: 'stall-help', name: '帮摊主整理旧书', description: '赚一点零花钱，也听一点书外的人生。', icon: 'shop', category: 'explore', effect: { energy: -16, money: 24, mood: 5, autonomy: 3 } },
  { id: 'street-music', name: '听完一首街头的歌', description: '这次不跳过，也不加速。', icon: 'smile', category: 'rest', effect: { energy: 18, mood: 16, stress: -14 } },
  { id: 'open-day', name: '参加校园开放日', description: '把大学从一个分数，变成一种生活。', icon: 'university', category: 'explore', effect: { energy: -12, autonomy: 7, mood: 12, stress: -5 } },
  { id: 'major-talk', name: '听学长聊专业日常', description: '除了就业标签，再问问每天会做什么。', icon: 'friends', category: 'social', effect: { energy: -7, autonomy: 6, stress: -7, mood: 8, relations: { teacher: 3 } } },
  { id: 'workshop', name: '体验一次大学工作坊', description: '动手试试，好奇心也可以指路。', icon: 'energy', category: 'study', effect: { energy: -15, mood: 8, autonomy: 4, subjects: { math: 3, physics: 4, chemistry: 3 } } },
];

export const ITEMS: { id: string; name: string; icon: IconName; description: string; price: number; effect: Effect }[] = [
  { id: 'milk', name: '常温纯牛奶', icon: 'milk', description: '体力 +12 / 健康 +4', price: 8, effect: { energy: 12, health: 4 } },
  { id: 'bread', name: '红豆面包', icon: 'bread', description: '体力 +18 / 心情 +3', price: 10, effect: { energy: 18, mood: 3 } },
  { id: 'tea', name: '冰峰汽水', icon: 'tea', description: '心情 +12 / 压力 -8', price: 6, effect: { mood: 12, stress: -8 } },
  { id: 'coffee', name: '罐装咖啡', icon: 'coffee', description: '体力 +22 / 压力 +5 / 健康 -2', price: 12, effect: { energy: 22, stress: 5, health: -2 } },
  { id: 'notes', name: '学长的笔记', icon: 'notes', description: '数学 +3 / 物理 +2', price: 28, effect: { subjects: { math: 3, physics: 2 } } },
];

export { UNIVERSITIES } from './universities';

export interface Place {
  id: string;
  name: string;
  subtitle: string;
  icon: IconName;
  x: number;
  y: number;
  scene: Scene;
  image: string;
  actions: string[];
}

export interface Region {
  id: Scene;
  name: string;
  subtitle: string;
  description: string;
  greeting: string;
  icon: IconName;
  group: '校园内' | '城市里' | '日常与未来';
  x: number;
  y: number;
}

export const REGIONS: Region[] = [
  { id: 'home', name: '我的小家', subtitle: '灯亮着，就有归处', description: '书桌、小床和餐桌。把没说完的话，慢慢说给家人听。', greeting: '到家啦。台灯等着你，小床也等着你。先问问自己，现在最需要的是什么？', icon: 'home', group: '日常与未来', x: 22, y: 24 },
  { id: 'library', name: '城市图书馆', subtitle: '答案之外，还有书页', description: '借阅大厅、窗边座位和读书会。一份小刊物，从这里长出来。', greeting: '这里的书不按考试频率排队。苏晓留了一个窗边的位置，也给你留了一个可以慢慢想的问题。', icon: 'book', group: '城市里', x: 48, y: 23 },
  { id: 'university', name: '大学开放日', subtitle: '把未来走成一条路', description: '穿过大学校门，听专业日常、体验工作坊，给未来写一张自己的地图。', greeting: '先别问要考多少分。走进去看看，未来的自己想在这里怎样生活。', icon: 'university', group: '日常与未来', x: 77, y: 24 },
  { id: 'campus', name: '拾光校园', subtitle: '我们故事的起点', description: '教学楼、操场、食堂和银杏小径。认真学习，也认真过每一个普通的日子。', greeting: '回到校园啦。除了黑板上的倒计时，窗外还有今天的风。', icon: 'school', group: '校园内', x: 28, y: 45 },
  { id: 'laboratory', name: '科学实验楼', subtitle: '好奇心不必有标准答案', description: '实验室、温室和观星台。和朋友把一个“不知道”，变成一次亲手验证。', greeting: '今天的任务是允许自己不知道。实验可以失败，问题可以继续问。', icon: 'energy', group: '校园内', x: 50, y: 45 },
  { id: 'arts', name: '社团活动中心', subtitle: '课表外，也有自己的声音', description: '琴房、画室、广播站和小剧场。一场没有奖状的演出，也值得被看见。', greeting: '吉他、画笔和话筒都在这里等着。不必先证明天赋，喜欢就可以成为开始的理由。', icon: 'friends', group: '校园内', x: 73, y: 47 },
  { id: 'city', name: '古城街巷', subtitle: '城墙下，日子慢慢过', description: '沿古城墙散步，去旧书摊翻书，再坐进巷口的面馆。', greeting: '城墙下的风，不会问你考了多少分。偶尔走出校园，才知道世界有多大。', icon: 'journal', group: '城市里', x: 25, y: 70 },
  { id: 'market', name: '灯火夜市', subtitle: '给疲惫一点烟火气', description: '小吃摊、旧物摊和街头音乐。一次帮忙，会让你读到摊主自己的故事。', greeting: '灯笼亮起来了。先吃点热乎的，再听一首没有剪成十五秒的歌。', icon: 'shop', group: '城市里', x: 49, y: 75 },
  { id: 'park', name: '河畔公园', subtitle: '给忙碌的人一个下午', description: '河岸步道、石桥和草地。野餐、志愿活动，以及一次终于听见彼此的散步。', greeting: '河水有自己的速度，树也有自己的季节。在这里，慢一点是被允许的。', icon: 'leaf', group: '城市里', x: 75, y: 72 },
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map(region => [region.id, region])) as Record<Scene, Region>;
export const NEW_ART = ['world-map', 'library', 'laboratory', 'arts', 'park', 'market', 'university', 'zhixia', 'xinghe', 'tangtang'];
export const imagePath = (name: string) => asset(`images/${name}.${NEW_ART.includes(name) ? 'webp' : 'jpg'}`);

export const PLACES: Place[] = [
  { id: 'classroom', name: '教学楼', subtitle: '今天也要离梦想近一点', icon: 'school', x: 54, y: 31, scene: 'campus', image: 'classroom', actions: ['balanced', 'review', 'teacher'] },
  { id: 'library', name: '图书馆', subtitle: '在书页里，遇见更大的世界', icon: 'book', x: 31, y: 43, scene: 'campus', image: 'classroom', actions: ['read', 'review', 'su'] },
  { id: 'track', name: '操场', subtitle: '把烦恼交给风', icon: 'ball', x: 77, y: 56, scene: 'campus', image: 'campus', actions: ['exercise', 'zhou', 'nap'] },
  { id: 'canteen', name: '食堂', subtitle: '天大地大，好好吃饭最大', icon: 'food', x: 32, y: 70, scene: 'campus', image: 'campus', actions: ['meal', 'su', 'nap'] },
  { id: 'shop', name: '小卖部', subtitle: '补给一点小小的快乐', icon: 'shop', x: 68, y: 78, scene: 'campus', image: 'campus', actions: [] },
  { id: 'garden', name: '银杏小径', subtitle: '去见见那个等你的朋友', icon: 'leaf', x: 53, y: 62, scene: 'campus', image: 'campus', actions: ['su', 'nap', 'zhou'] },
  { id: 'desk', name: '我的书桌', subtitle: '台灯下，写下自己的答案', icon: 'book', x: 41, y: 51, scene: 'home', image: 'home', actions: ['review', 'read', 'math'] },
  { id: 'bed', name: '温暖的小床', subtitle: '今天已经做得够好了', icon: 'moon', x: 74, y: 64, scene: 'home', image: 'home', actions: ['rest', 'nap'] },
  { id: 'family', name: '和妈妈说说话', subtitle: '有些话，可以慢慢说', icon: 'heart', x: 27, y: 73, scene: 'home', image: 'home', actions: ['mom', 'meal'] },
  { id: 'wall', name: '古城墙', subtitle: '城墙下的风，不问你的分数', icon: 'leaf', x: 56, y: 33, scene: 'city', image: 'city', actions: ['walk', 'zhou'] },
  { id: 'books', name: '旧书摊', subtitle: '偶遇一本没有标准答案的书', icon: 'journal', x: 36, y: 64, scene: 'city', image: 'city', actions: ['bookshop', 'su'] },
  { id: 'noodles', name: '巷口面馆', subtitle: '来碗油泼面，日子慢慢过', icon: 'food', x: 72, y: 63, scene: 'city', image: 'city', actions: ['meal', 'mom'] },
  { id: 'library-shelves', name: '借阅大厅', subtitle: '找一本不会考的书', icon: 'book', x: 32, y: 40, scene: 'library', image: 'library', actions: ['research', 'read'] },
  { id: 'reading-table', name: '共读长桌', subtitle: '把想说的话，印成一份小刊物', icon: 'friends', x: 56, y: 53, scene: 'library', image: 'library', actions: ['reading-circle', 'su'] },
  { id: 'library-window', name: '窗边座位', subtitle: '可以暂时不追赶任何人', icon: 'leaf', x: 75, y: 35, scene: 'library', image: 'library', actions: ['quiet-reading', 'nap'] },
  { id: 'return-desk', name: '还书柜台', subtitle: '把别人的故事轻轻归还', icon: 'notes', x: 38, y: 72, scene: 'library', image: 'library', actions: ['research', 'quiet-reading'] },
  { id: 'physics-lab', name: '物理实验室', subtitle: '不要替真实的数据修改答案', icon: 'energy', x: 31, y: 42, scene: 'laboratory', image: 'laboratory', actions: ['experiment', 'teacher'] },
  { id: 'chemistry-lab', name: '化学实验台', subtitle: '多问一句为什么', icon: 'notes', x: 62, y: 42, scene: 'laboratory', image: 'laboratory', actions: ['experiment', 'chemistry'] },
  { id: 'greenhouse', name: '小小温室', subtitle: '种子也不按排行榜生长', icon: 'leaf', x: 39, y: 73, scene: 'laboratory', image: 'laboratory', actions: ['plant', 'biology'] },
  { id: 'observatory', name: '屋顶观星台', subtitle: '试卷以外，还有整片星空', icon: 'moon', x: 72, y: 72, scene: 'laboratory', image: 'laboratory', actions: ['stargaze', 'xinghe', 'zhou'] },
  { id: 'music-room', name: '旧琴房', subtitle: '喜欢的旋律，不必成为特长', icon: 'smile', x: 32, y: 41, scene: 'arts', image: 'arts', actions: ['rehearsal', 'zhou'] },
  { id: 'art-studio', name: '阳光画室', subtitle: '允许颜色走出边框', icon: 'journal', x: 67, y: 42, scene: 'arts', image: 'arts', actions: ['paint', 'zhixia', 'nap'] },
  { id: 'radio-room', name: '校园广播站', subtitle: '听见未被排名的声音', icon: 'letter', x: 38, y: 71, scene: 'arts', image: 'arts', actions: ['broadcast', 'tangtang', 'su'] },
  { id: 'little-stage', name: '小剧场', subtitle: '一次只为喜欢而来的演出', icon: 'friends', x: 70, y: 73, scene: 'arts', image: 'arts', actions: ['rehearsal', 'broadcast'] },
  { id: 'river-path', name: '河岸步道', subtitle: '终于有空听彼此说话', icon: 'leaf', x: 32, y: 43, scene: 'park', image: 'park', actions: ['river-walk', 'mom'] },
  { id: 'stone-bridge', name: '柳荫石桥', subtitle: '在水声里，把排名放远一点', icon: 'leaf', x: 68, y: 39, scene: 'park', image: 'park', actions: ['river-walk', 'zhou'] },
  { id: 'picnic-lawn', name: '野餐草地', subtitle: '和朋友分享一点普通的快乐', icon: 'food', x: 40, y: 71, scene: 'park', image: 'park', actions: ['picnic', 'nap'] },
  { id: 'volunteer-hut', name: '志愿小站', subtitle: '帮助，不必先拍照', icon: 'heart', x: 72, y: 72, scene: 'park', image: 'park', actions: ['volunteer', 'plant'] },
  { id: 'snack-stall', name: '灯笼小吃摊', subtitle: '先好好吃饭，再慢慢长大', icon: 'food', x: 31, y: 43, scene: 'market', image: 'market', actions: ['market-snack', 'meal'] },
  { id: 'secondhand-stall', name: '旧物书摊', subtitle: '认真收好一本书背后的日子', icon: 'shop', x: 65, y: 39, scene: 'market', image: 'market', actions: ['stall-help', 'bookshop'] },
  { id: 'street-stage', name: '街头音乐角', subtitle: '听完一首歌，也听见自己', icon: 'smile', x: 39, y: 72, scene: 'market', image: 'market', actions: ['street-music', 'zhou'] },
  { id: 'night-table', name: '夜市长桌', subtitle: '把热乎的饭留给一起长大的人', icon: 'friends', x: 73, y: 70, scene: 'market', image: 'market', actions: ['market-snack', 'su'] },
  { id: 'university-gate', name: '大学校门', subtitle: '未来不是一张排行榜', icon: 'university', x: 30, y: 44, scene: 'university', image: 'university', actions: ['open-day', 'major-talk'] },
  { id: 'workshop-hall', name: '体验工作坊', subtitle: '先试一次，再决定喜欢不喜欢', icon: 'energy', x: 67, y: 42, scene: 'university', image: 'university', actions: ['workshop', 'experiment'] },
  { id: 'university-lake', name: '湖畔长椅', subtitle: '给未来写一封没有标准格式的信', icon: 'letter', x: 40, y: 72, scene: 'university', image: 'university', actions: ['major-talk', 'nap'] },
  { id: 'society-fair', name: '社团体验集市', subtitle: '成绩之外，还有很多种你', icon: 'friends', x: 74, y: 72, scene: 'university', image: 'university', actions: ['open-day', 'rehearsal'] },
];

export const EXAM_QUESTIONS = [
  { subject: '语文', question: '“长风破浪会有时”的下一句是？', options: ['直挂云帆济沧海', '独上高楼望尽天涯路', '一览众山小', '轻舟已过万重山'], answer: 0, explanation: '出自李白《行路难》。愿你也有直挂云帆的勇气。' },
  { subject: '数学', question: '函数 f(x) = x² - 2x 在实数范围内的最小值是？', options: ['0', '1', '-1', '-2'], answer: 2, explanation: '配方得到 (x - 1)² - 1，最小值为 -1。' },
  { subject: '物理', question: '物体做匀速直线运动时，它的加速度为？', options: ['随速度增大', '0', '9.8 m/s²', '无法确定'], answer: 1, explanation: '速度的大小与方向均不改变，因此加速度为 0。' },
];

export const LITTLE_NOTES = [
  '路过操场的时候，风刚好吹过来。原来秋天不只在阅读理解里。',
  '今天的油泼面多给了一勺辣子。食堂阿姨说，年轻人要好好吃饭。',
  '错题本又厚了一页，但窗台的绿萝也长出了一片新叶子。',
  '如果青春是一道选择题，希望至少有一题，答案由我自己决定。',
  '苏晓说，落叶的速度也不一样。我们当然也不用长成同一个样子。',
  '妈妈今天没有问排名，问的是冷不冷。我说，有一点。',
];
