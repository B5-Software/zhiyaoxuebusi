import type { CharacterId, Choice, StoryEvent } from './types';
import { EXPLORATION_EVENTS } from './explorationEvents';
import { EXTENDED_EVENTS } from './extendedEvents';
import { MEETING_EVENTS } from './appointments';

const chapters = ['第一章 · 风从九月来', '第二章 · 被排名的秋天', '第三章 · 冬天没有标准答案', '第四章 · 把春天还给我们', '第五章 · 盛夏与自己的路'];
const makeEvent = (id: string, title: string, period: number, speaker: CharacterId, scene: StoryEvent['scene'], paragraphs: string[], choices: Choice[]): StoryEvent => ({
  id, title, chapter: chapters[period], minWeek: period * 8, maxWeek: period * 8 + 7, speaker, scene, paragraphs, choices,
});

export const EVENTS: StoryEvent[] = [
  ...MEETING_EVENTS,
  ...EXTENDED_EVENTS,
  ...EXPLORATION_EVENTS,
  makeEvent('first-day', '你的名字，不只是一个考号', 0, 'teacher', 'classroom', [
    '九月的西安还有点热。黑板上写着“只要学不死，就往死里学”，最后一个感叹号被描了三遍。老陈拿着新座位表走进教室。',
    '“还有二百多天。”他说完停了一下，又把窗户推开。“{{player}}同学，先自我介绍吧。除了目标分数，也说一件你喜欢的事。”',
  ], [
    { text: '我想考好大学，也想好好过这一年。', effect: { mood: 8, autonomy: 5, relations: { teacher: 3, su: 3 } }, result: '后排有人小声说“我也是”。原来这个愿望并不只有你一个人有。' },
    { text: '我喜欢读书，不只是参考书。', effect: { subjects: { chinese: 3 }, autonomy: 7, relations: { su: 6 } }, result: '苏晓悄悄在纸条上写了一本书名。你的高三，先多了一个可以交换书的人。' },
    { text: '先定个小目标，把数学补上来。', effect: { subjects: { math: 4 }, stress: 3, relations: { teacher: 5 } }, result: '老陈点点头：“目标具体一点就很好。但别忘了，数学以外也有生活。”' },
  ]),
  makeEvent('ranking-wall', '透明得只剩分数', 0, 'su', 'classroom', [
    '第一次摸底考试后，年级把排名贴在了走廊最亮的地方。名字、总分、进退箭头，一项都没落下。',
    '苏晓盯着自己的名字：“他们说公开透明，可我的委屈怎么不公开一下？”有人站在榜前拍照，准备发进家长群。',
  ], [
    { text: '只记下自己的薄弱项，陪她离开。', effect: { subjects: { math: 3 }, mood: 4, relations: { su: 7 }, autonomy: 3 }, result: '你们坐到了楼梯拐角。比起一整面墙，眼前一个人的感受更真实。' },
    { text: '把名次抄进本子，给自己加压。', effect: { subjects: { math: 5, english: 3 }, stress: 12, mood: -7 }, result: '排名被你圈了起来。它确实点燃了一点斗志，也悄悄挤占了睡前的安宁。' },
  ]),
  makeEvent('voluntary-class', '百分之百自愿', 0, 'teacher', 'classroom', [
    '周末补课通知写着“完全自愿”。第二行写着：“不参加的同学，请家长到校说明情况。”',
    '老陈收回执时压低声音：“真有事就写。我来解释。”表格上只有同意选项，但背面是空白的。',
  ], [
    { text: '在背面写下：我需要半天休息。', effect: { autonomy: 8, energy: 16, stress: -5, relations: { teacher: 3 } }, result: '回执被单独放进抽屉。你没有改变整个制度，但保住了属于自己的半天。' },
    { text: '先参加，把不会的题当面问清。', effect: { energy: -12, stress: 7, subjects: { physics: 5, chemistry: 4 } }, result: '这半天并非毫无收获。只是你仍然记得，“自愿”本来应该有另一个选项。' },
  ]),
  makeEvent('other-child', '别人家的孩子', 0, 'mom', 'home', [
    '饭桌上，妈妈说楼上阿姨的孩子这次考了年级前十。她把最大的一块排骨夹给你，又说：“人家怎么就能做到呢？”',
    '排骨很香，这句话却有点难咽。电视正播放一则“幸福家庭”的广告。',
  ], [
    { text: '“我也在努力。能先听听我今天的事吗？”', effect: { autonomy: 6, relations: { mom: 8 }, stress: -5, mood: 5 }, result: '妈妈先沉默了一下，随后把电视声音调小了。对话没有立刻完美，但终于不是单向广播。' },
    { text: '不争辩，吃完回房多做一套题。', effect: { subjects: { math: 5 }, energy: -9, stress: 9, relations: { mom: 2 } }, result: '妈妈以为你懂事了。只有台灯知道，你其实还有很多没说出口的话。' },
  ]),
  makeEvent('basketball', '最后一节体育课', 0, 'zhou', 'campus', [
    '体育老师又“有事”，黑板上多了两道压轴题。周野抱着篮球站在门口，像一个被取消了发射计划的宇航员。',
    '“就十分钟。”他说，“总得有人证明操场不是学校宣传片的布景。”',
  ], [
    { text: '去找老陈，争取真正的体育课。', effect: { autonomy: 5, mood: 12, health: 5, relations: { zhou: 8, teacher: -2 } }, result: '老陈看了看课表，最后挥挥手：“二十分钟。回来别一身汗吹风。”' },
    { text: '下课后一起打，把这道题先做完。', effect: { subjects: { math: 4 }, energy: -5, relations: { zhou: 5 }, mood: 3 }, result: '放学后只剩最后一缕阳光。球还是进了，虽然篮筐看起来有点模糊。' },
  ]),
  makeEvent('poem', '错题本背面的诗', 0, 'su', 'classroom', [
    '苏晓的错题本掉在地上。你帮忙捡起来，发现最后一页不是公式，是一首写给秦岭的诗。',
    '“别笑。”她抢过本子，“语文老师说考试不能这么写，太像我自己的话了。”',
  ], [
    { text: '“像你自己的话，才值得写。”', effect: { mood: 7, autonomy: 6, relations: { su: 9 }, subjects: { chinese: 2 } }, result: '她把那一页撕下来送给你。不是所有值得收藏的纸，都需要右上角有个分数。' },
    { text: '一起研究，怎样兼顾表达和得分。', effect: { subjects: { chinese: 6 }, relations: { su: 5 }, energy: -5 }, result: '你们给作文留了两种写法：一种过关，一种留给自己。' },
  ]),
  makeEvent('camera', '连发呆也有记录', 0, 'zhou', 'classroom', [
    '教室新装了“智慧课堂”摄像头，据说能识别抬头率。周野问：“它能识别我抬头看钟还是看黑板吗？”',
    '没人回答。校会上说，这是为了每一个学生的成长。没有人问学生想不想被这样看见。',
  ], [
    { text: '写下隐私和误判的疑问，交给老陈。', effect: { autonomy: 9, stress: 4, relations: { teacher: 3, zhou: 4 } }, result: '老陈没有承诺结果，但认真收下了纸。提出问题本身，就比把疑问吞回去多走了一步。' },
    { text: '暂时适应，把注意力留给自己的节奏。', effect: { stress: 5, subjects: { english: 4 }, energy: -4 }, result: '你没有说服摄像头，只提醒自己：被算法看见的，不等于完整的你。' },
  ]),
  makeEvent('cat', '校猫没有考号', 0, 'su', 'campus', [
    '图书馆台阶上，一只橘猫睡在“珍惜每一分钟”的标语下面。它足足睡了四十分钟。',
    '苏晓蹲在旁边：“它怎么一点都不焦虑呢？”你们决定先不告诉它下个月还有月考。',
  ], [
    { text: '陪猫晒一会儿太阳。', effect: { mood: 13, stress: -10, energy: 8, relations: { su: 4 } }, result: '橘猫翻了个身。今天，你从一位没有学历的老师那里学到了休息。' },
    { text: '画下它，夹进生物笔记。', effect: { subjects: { biology: 4 }, mood: 7, autonomy: 3 }, result: '笔记里多了一只歪歪扭扭的猫。生物突然不只是需要背诵的名词。' },
  ]),
  makeEvent('moon-cake', '一块被分成四份的月饼', 0, 'mom', 'home', [
    '中秋晚自习放得很晚。回家时，桌上的月饼被切成四份，妈妈坐在沙发上打瞌睡。',
    '“听说高三不能吃太饱，影响大脑。”她指着月饼。你笑了，忽然觉得她也被各种“据说”困住了。',
  ], [
    { text: '陪她吃一块，聊聊她上学时的事。', effect: { relations: { mom: 10 }, mood: 10, stress: -7, energy: 5 }, result: '原来妈妈也逃过一次晚自习。说到这里，她自己先笑了起来。' },
    { text: '把营养常识讲清楚，再认真道谢。', effect: { relations: { mom: 6 }, subjects: { biology: 3 }, autonomy: 4, mood: 4 }, result: '你们约好，明天不再按照家长群的偏方安排菜单。' },
  ]),
  makeEvent('anonymous', '实名填写匿名意见', 1, 'teacher', 'classroom', [
    '学校开展“倾听学生心声”活动。匿名问卷第一栏：班级。第二栏：姓名。第三栏：你是否对学校管理非常满意。',
    '“选项只有非常满意和满意？”你问。老陈把备用纸放在讲台上：“想补充的，另写。”',
  ], [
    { text: '认真写下食堂、睡眠和体育课的问题。', effect: { autonomy: 9, stress: 4, relations: { teacher: 4 } }, result: '反馈不一定立刻改变什么，但至少“没有人反对”不再是事实。' },
    { text: '先不交，找几个同学一起提出具体建议。', effect: { autonomy: 6, relations: { su: 5, zhou: 5 }, mood: 4 }, result: '你们把吐槽整理成了三条可以实施的建议。大家站在一起的时候，声音没那么抖了。' },
  ]),
  makeEvent('phone-check', '手机里的不及格', 1, 'mom', 'home', [
    '妈妈看见你手机上的聊天记录。她说不是不信任你，只是“这个年纪没有隐私，只有学习”。',
    '其实你和苏晓只是交换了两张晚霞的照片。可你突然不想解释照片了。',
  ], [
    { text: '温和但明确地谈隐私边界。', effect: { autonomy: 10, stress: 5, relations: { mom: -3 }, mood: 3 }, result: '谈话有点僵。你没有摔门，也没有交出密码。边界有时就是从一次不舒服的对话开始。' },
    { text: '提议约定使用时间，但不翻聊天记录。', effect: { autonomy: 6, relations: { mom: 7 }, stress: -4 }, result: '妈妈没完全放心，不过答应先试一周。这不是投降，也不是大获全胜，是一次协商。' },
  ]),
  makeEvent('art-poster', '消失的社团海报', 1, 'zhou', 'campus', [
    '周野给校园艺术节画的海报被撤了。理由是“高三不应分心”。宣传栏新贴上了“全面发展，五育并举”。',
    '他把颜料盒盖得很响：“我画得再好，也不能算进总分，对吧？”',
  ], [
    { text: '把画收藏起来，认真谈谈他的美术梦。', effect: { relations: { zhou: 12 }, mood: 6, autonomy: 7 }, result: '这是第一次有人问他想画什么，而不是画画能加多少分。' },
    { text: '帮他做一份不占课堂时间的展览申请。', effect: { relations: { zhou: 8, teacher: 3 }, energy: -8, autonomy: 6 }, result: '申请还在等待答复。你们已经在教室后面的黑板上，画了一小片星空。' },
  ]),
  makeEvent('cold', '请假条的含金量', 1, 'teacher', 'classroom', [
    '你发着低烧，盯着同一道题看了很久。值班老师说高三请假影响进度，最好坚持一下。',
    '老陈路过，摸了摸你桌上已经凉掉的水：“别拿身体证明态度。”',
  ], [
    { text: '去医务室，按医嘱休息。', effect: { energy: 20, health: 13, stress: -8, relations: { teacher: 5 } }, result: '落下的笔记同桌帮你留了。原来世界不会因为你休息半天就停止转动。' },
    { text: '先借好笔记，再安心回家。', effect: { health: 10, energy: 13, relations: { su: 5, mom: 4 } }, result: '回家后你睡了一觉。醒来时，妈妈留的粥还是热的。' },
  ]),
  makeEvent('essay', '自由命题的唯一答案', 1, 'su', 'classroom', [
    '作文题目是《我的理想》。范文里的理想整齐得像广播体操：宏大、正确，最好没有个人烦恼。',
    '苏晓问：“如果我只想开一家小书店，养活自己，也算理想吗？”',
  ], [
    { text: '写一篇真诚的文章，讲清小理想的价值。', effect: { autonomy: 9, subjects: { chinese: 4 }, stress: 3, relations: { su: 5 } }, result: '老师在旁边写了“论证可以更充分”。至少你的愿望，被完整地写在了纸上。' },
    { text: '掌握应试结构，但保留真实的核心。', effect: { subjects: { chinese: 7 }, autonomy: 3, energy: -5 }, result: '你发现结构可以学习，内容不必全部借用。技巧不一定是自己的敌人。' },
  ]),
  makeEvent('parent-meeting', '家长会的空座位', 1, 'mom', 'classroom', [
    '家长会时，妈妈因为加班来晚了。老师讲到“家庭投入决定孩子未来”，她坐在最后一排，反复搓着手。',
    '回家路上，她买了两个肉夹馍，小声问你：“是不是妈妈做得不够好？”',
  ], [
    { text: '“不是所有事情，都该算在我们头上。”', effect: { relations: { mom: 12 }, autonomy: 5, mood: 8, stress: -6 }, result: '你们边走边吃，油渗到了纸袋上。那一刻，你们不是互相考核的两个人。' },
    { text: '一起做一个负担得起的学习计划。', effect: { relations: { mom: 8 }, subjects: { english: 3 }, stress: -4, money: 20 }, result: '昂贵的补习班被从清单上划掉了。省下的钱，留给了真实需要的东西。' },
  ]),
  makeEvent('neighbor', '灯光竞赛', 1, 'mom', 'home', [
    '晚上十一点，对面楼的灯还亮着。妈妈说：“你看别人还没睡。”你想，也许对面正在等洗衣机。',
    '台灯照着同一页练习册。你已经连续把同一个数看错三次了。',
  ], [
    { text: '合上书，解释效率和睡眠的关系。', effect: { energy: 23, health: 5, autonomy: 6, stress: -5 }, result: '对面的灯什么时候熄灭，你不知道。你终于睡了一个完整的觉。' },
    { text: '只完成这道题，定好停止时间。', effect: { subjects: { math: 4 }, energy: -5, autonomy: 3, relations: { mom: 3 } }, result: '你在闹钟响起时停下了笔。这一次，停止也是计划的一部分。' },
  ]),
  makeEvent('inspection', '只存在一天的素质教育', 1, 'zhou', 'campus', [
    '上级来检查，锁了很久的音乐教室突然开门了。课表上的体育、美术、劳动课，一夜之间全部复活。',
    '周野问：“要不我们申请让他们在这儿住下？”你差点笑出声。',
  ], [
    { text: '珍惜这一天，去上真正的美术课。', effect: { mood: 15, stress: -10, autonomy: 4, relations: { zhou: 5 } }, result: '你画了一张不需要批改的画。这种久违的轻松，原来不该是临时奖励。' },
    { text: '把课表拍下来，询问能否长期执行。', effect: { autonomy: 9, stress: 3, relations: { teacher: 4 } }, result: '得到的答复是“正在统筹”。你把照片留着，记住正常的生活曾经长什么样。' },
  ]),
  makeEvent('rain', '两个人，一把伞', 1, 'su', 'campus', [
    '放学突然下雨。你站在屋檐下，苏晓撑着一把小伞折返回来。',
    '“别想太多。”她说，“明天的数学还得借你讲呢。”雨点在伞上打出乱七八糟的节拍。',
  ], [
    { text: '一起走慢一点，聊聊想去的大学。', effect: { relations: { su: 12 }, mood: 10, stress: -8, autonomy: 3 }, result: '原来她也没想好。你们约定，先收集世界的样子，不急着给未来判卷。' },
    { text: '认真地说声谢谢，明天带热牛奶。', effect: { relations: { su: 9 }, mood: 6, money: -8 }, result: '第二天，她把牛奶捂在手里笑了。校园里不只有令人紧张的消息。' },
  ]),
  makeEvent('midterm', '分数背后没有摄像头', 1, 'teacher', 'classroom', [
    '期中成绩出来，有人进步，有人退步。年级会上，所有原因被概括为两个字：态度。',
    '老陈回班后没训话，只发了空白纸：“写一道真正没弄懂的题。今天我们解决问题，不解决人。”',
  ], [
    { text: '诚实列出自己的知识漏洞。', effect: { subjects: { math: 5, physics: 4 }, stress: -6, relations: { teacher: 5 } }, result: '第一次，错题没有变成品德审判。你知道接下来具体该做什么了。' },
    { text: '组织一个不比排名的互助小组。', effect: { subjects: { chemistry: 4, biology: 3 }, relations: { su: 5, zhou: 5 }, autonomy: 4 }, result: '擅长不同科目的人坐在一起。你们发现，同学也可以不是竞争对手。' },
  ]),
  makeEvent('winter-holiday', '寒假只有一个名字', 2, 'teacher', 'classroom', [
    '寒假作业发下来，摞起来比你的水杯还高。通知要求每天上传学习照片，精确到起床时间。',
    '周野翻了一下：“放假的是教室，不是我们。”',
  ], [
    { text: '按薄弱项排序，给自己留出休息日。', effect: { autonomy: 7, energy: 12, subjects: { math: 3 }, stress: -6 }, result: '你把一座作业山拆成了可以走的小路，也给日历留下了几格空白。' },
    { text: '和老师商量，免做已经掌握的重复题。', effect: { autonomy: 8, relations: { teacher: 5 }, subjects: { physics: 4 }, stress: 3 }, result: '老陈要求你先做一组检测。不是完全自由，但一小部分时间回到了你手里。' },
  ]),
  makeEvent('new-year', '拜年变成答辩', 2, 'mom', 'home', [
    '年夜饭还没开始，亲戚已经问完了成绩、名次、目标院校。有人宣布：“考不上重点，这辈子就完了。”',
    '妈妈看了看你，筷子悬在半空。窗外有人放了一盏小小的灯。',
  ], [
    { text: '“路不只有一条。咱们先好好吃饭吧。”', effect: { autonomy: 10, stress: -5, mood: 5, relations: { mom: 4 } }, result: '话题终于转到了菜上。你不必在每张饭桌上，为整个人生答辩。' },
    { text: '向妈妈求助，请她替你结束这个话题。', effect: { relations: { mom: 10 }, stress: -9, mood: 7 }, result: '妈妈说：“孩子的事让孩子慢慢想。”她声音不大，但这一句你会记很久。' },
  ]),
  makeEvent('happiness-form', '请如实填写：非常幸福', 2, 'su', 'classroom', [
    '学校要申报“幸福校园”。调查里有人选了“不太快乐”，班级因此被要求重新填写。',
    '苏晓说：“原来幸福是可以补考的。只要改到标准答案为止。”',
  ], [
    { text: '保留真实答案，并写下具体需要。', effect: { autonomy: 10, stress: 4, relations: { su: 5 } }, result: '你的答案不够漂亮，但很真实。再整齐的报告，也不能代替真实的休息和倾听。' },
    { text: '找信任的老师单独谈，不公开自己的脆弱。', effect: { stress: -12, relations: { teacher: 7 }, mood: 5, autonomy: 3 }, result: '保护自己不等于认同表格。你找到一个愿意真正听你说话的人。' },
  ]),
  makeEvent('burnout', '不是所有疲惫都叫懒', 2, 'su', 'classroom', [
    '你对着练习册发呆，明明睡了，还是觉得很累。宣传栏说“成功来自绝不松懈”，却没告诉你松不开的弦也会断。',
    '苏晓把一颗糖放在你桌上：“先别证明自己。去找心理老师，好吗？”',
  ], [
    { text: '预约校内心理支持，暂停额外加练。', effect: { stress: -24, mood: 12, health: 7, energy: 12, autonomy: 4 }, result: '老师没有说你不够坚强。你们一起把过重的计划减了一半，约好继续聊。' },
    { text: '先告诉家人，安排一段真正的休息。', effect: { stress: -18, energy: 20, health: 6, relations: { mom: 6 } }, result: '你第一次坦诚地说“我很累”。有人开始知道，那句“我没事”并不总是真的。' },
  ]),
  makeEvent('snow', '西安的第一场雪', 2, 'zhou', 'campus', [
    '雪落在银杏枝上，操场白了一小半。广播提醒所有同学立即回班，不要因天气影响学习秩序。',
    '周野在窗边呵了一口气，画出一个很丑的雪人。',
  ], [
    { text: '课间出去接一片雪，准时回来。', effect: { mood: 16, stress: -12, relations: { zhou: 5 }, energy: -3 }, result: '雪在掌心融化得很快。你终于拥有了一段不需要回忆课本就能想起的冬天。' },
    { text: '写下窗外的雪，给苏晓看。', effect: { subjects: { chinese: 5 }, mood: 8, relations: { su: 6 } }, result: '“比满分范文好。”苏晓在旁边批了四个字：“因为是你。”' },
  ]),
  makeEvent('tutor-ad', '焦虑打八折', 2, 'mom', 'home', [
    '家长群里转来一份“名师保分班”，广告说现在不投资，将来孩子会怨你。价格相当于妈妈一个月的工资。',
    '她问你要不要报，语气像在问自己是不是一个合格的家长。',
  ], [
    { text: '拒绝恐吓营销，一起核对实际需求。', effect: { autonomy: 7, relations: { mom: 7 }, stress: -6, money: 30 }, result: '你们没有买下那句承诺，而是制定了一个具体、可负担的复习计划。' },
    { text: '先听一节免费试听，再决定。', effect: { subjects: { math: 4 }, autonomy: 4, energy: -6, relations: { mom: 3 } }, result: '试听内容并不神奇。你学会了把广告里的“保证”，换成自己能检验的问题。' },
  ]),
  makeEvent('friend-failure', '他不笑的那一天', 2, 'zhou', 'campus', [
    '周野这次考砸了。平时最吵的人，一整天没怎么说话。他爸爸说要把篮球扔掉，“把没用的东西都戒了”。',
    '他靠着栏杆：“是不是我喜欢的东西，都算没用？”',
  ], [
    { text: '陪他坐一会儿，不急着给建议。', effect: { relations: { zhou: 14 }, mood: 5, autonomy: 4, stress: -4 }, result: '等了很久，他终于开口。不是所有难过，都能被一句“加油”处理掉。' },
    { text: '帮他找回学习节奏，也保留篮球时间。', effect: { relations: { zhou: 10 }, subjects: { math: 3 }, energy: -7, autonomy: 4 }, result: '你们的计划上同时写着错题和投篮。一个人不应该被削得只剩一个用途。' },
  ]),
  makeEvent('speech', '整齐的感动', 2, 'teacher', 'classroom', [
    '励志演讲要求全体起立喊口号，镜头扫过时必须热泪盈眶。你没哭，被问是不是缺乏感恩。',
    '老陈递给你一张纸巾，轻轻说：“不想哭就擦擦汗。别难为自己。”',
  ], [
    { text: '安静站着，不表演自己的感受。', effect: { autonomy: 10, stress: 3, relations: { teacher: 4 } }, result: '你没有破坏谁的活动，也没有交出自己对情绪的解释权。' },
    { text: '回家写封真诚的信，而不是喊口号。', effect: { autonomy: 5, relations: { mom: 10 }, subjects: { chinese: 3 }, mood: 5 }, result: '妈妈读信的时候确实哭了。这一次，没有摄像机，也没有人要求她哭。' },
  ]),
  makeEvent('old-books', '旧书里的旧车票', 2, 'su', 'city', [
    '旧书摊一本小说里掉出一张十年前的火车票，终点是一个你还没去过的城市。旁边写着：“终于出发了。”',
    '苏晓把票放回书里：“不知道写这句话的人，后来过得怎样。”',
  ], [
    { text: '买下书，写一张给未来自己的纸条。', effect: { money: -10, mood: 12, autonomy: 6, relations: { su: 5 } }, result: '你写：“希望你仍然会抬头看天。”它不够远大，但很认真。' },
    { text: '记住那座城市，查查那里的生活。', effect: { autonomy: 7, subjects: { english: 3 }, mood: 7 }, result: '大学不再只是校名和分数，而是一条街、一座图书馆、一种可能的生活。' },
  ]),
  makeEvent('winter-teacher', '办公室最后一盏灯', 2, 'teacher', 'classroom', [
    '去办公室交本子时，你看见老陈在填三份内容几乎一样的考核表。桌边的盒饭已经凉了。',
    '“你们有排名，我们也有。”他说着笑了一下，“所以才更不能把所有压力都往下传。”',
  ], [
    { text: '认真道谢，顺便问一道真正困惑的题。', effect: { relations: { teacher: 10 }, subjects: { physics: 4 }, stress: -3 }, result: '聊到题目时，他终于不再皱着眉。有些人也在努力，不让制度把自己变得太硬。' },
    { text: '把班里的真实困难整理给他。', effect: { autonomy: 5, relations: { teacher: 8 }, energy: -5, mood: 3 }, result: '你们一起把“坚持”改成了几件具体的改善：热水、课间、可以求助的时间。' },
  ]),
  makeEvent('hundred-days', '倒计时开始替人说话', 3, 'teacher', 'campus', [
    '百日誓师的气球升上天空。广播说：“一百天，决定你的一生。”你想，一生那么长，怎么会只剩下一百天？',
    '老陈把誓词收起来：“目标要有。也记住，考试是人生的一部分，不是人生的全部。”',
  ], [
    { text: '制定可执行的计划，而不是惩罚自己的誓言。', effect: { subjects: { math: 4, english: 4 }, autonomy: 5, stress: -6 }, result: '你写下每天可以完成的事。纸上没有“必须成功”，只有清楚的下一步。' },
    { text: '和朋友约定，不管分数如何都一起走出考场。', effect: { relations: { su: 8, zhou: 8 }, mood: 12, stress: -9 }, result: '你们没有对天发誓，只碰了碰拳。这个约定反而很有分量。' },
  ]),
  makeEvent('politics-question', '被划掉的“为什么”', 3, 'su', 'classroom', [
    '讨论课上，苏晓问：“如果一种制度真的自信，为什么不允许我们讨论它的问题？”教室安静下来。',
    '老师让大家回到标准答案。课后她把那个问题写进本子：“我知道考试怎么答，可我还是想知道为什么。”',
  ], [
    { text: '和她查找不同观点，练习区分事实与判断。', effect: { autonomy: 12, energy: -7, subjects: { chinese: 3 }, relations: { su: 7 } }, result: '你们没有一夜想通世界。但学会了保留疑问，不把一种声音误认成所有声音。' },
    { text: '提醒她保护自己，私下继续讨论。', effect: { autonomy: 7, stress: -3, relations: { su: 9 } }, result: '谨慎不是停止思考。在暂时不适合公开说话的地方，你们先守住了彼此的信任。' },
  ]),
  makeEvent('mock-one', '一模不是判决书', 3, 'teacher', 'classroom', [
    '一模的最后一道数学题，你还是没做出来。有人把模考称为“命运预演”，好像所有未来已经提前盖了章。',
    '老陈在你的卷子上画了三个圈：“这三处能补。我们先解决能解决的。”',
  ], [
    { text: '按错因复盘，不再重复惩罚自己。', effect: { subjects: { math: 7, physics: 3 }, stress: -5, energy: -8 }, result: '错误被拆成了计算、理解和时间分配。它们忽然没有“我不行”那么庞大了。' },
    { text: '先缓一缓，明天再和老师一起看。', effect: { energy: 13, mood: 10, stress: -13, relations: { teacher: 4 } }, result: '第二天的题目没有变，做题的人却不再被情绪淹没。这也是一种准备。' },
  ]),
  makeEvent('spring-flower', '春天不在考纲里', 3, 'su', 'campus', [
    '校园的花突然开了。有人说等考完再看，可这些花大概不会等到六月。',
    '苏晓带了一台旧相机：“不耽误一辈子，只耽误五分钟。”',
  ], [
    { text: '一起拍一张普通的春天。', effect: { mood: 16, stress: -12, relations: { su: 8 }, autonomy: 3 }, result: '照片里你没有看镜头，正在笑。以后翻到它时，你也许会感谢今天的五分钟。' },
    { text: '叫上周野，给大家留一张合影。', effect: { mood: 12, relations: { su: 5, zhou: 7 }, stress: -8 }, result: '周野比了个很傻的手势。青春终于不是一张只有考号的证件照。' },
  ]),
  makeEvent('dream-major', '热门，是谁的温度', 3, 'mom', 'home', [
    '妈妈转来一张“最有前途专业排行榜”。她说喜欢可以以后再喜欢，现在先选稳妥的。',
    '你问她稳妥是什么，她想了很久：“就是希望你少吃点苦。”',
  ], [
    { text: '查课程、职业和成本，再一起比较。', effect: { autonomy: 9, relations: { mom: 6 }, stress: -4, energy: -5 }, result: '你们把模糊的担忧，变成了可以查证的信息。兴趣和现实，终于可以坐在一张桌前。' },
    { text: '告诉她自己真正喜欢什么，也听听她的担心。', effect: { autonomy: 7, relations: { mom: 10 }, mood: 7 }, result: '她还没有完全同意，却开始认真听你的理由。你的未来，逐渐有了你的声音。' },
  ]),
  makeEvent('collective-punishment', '一个人的错，全班的跑圈', 3, 'zhou', 'campus', [
    '有人晚自习说话，年级要求全班加跑十圈。“培养集体荣誉感。”通知这样解释。',
    '周野看着脚伤还没好的同学：“集体荣誉为什么总是从集体受罚开始？”',
  ], [
    { text: '和班干部一起提出合理、具体的异议。', effect: { autonomy: 10, relations: { zhou: 7, teacher: 3 }, stress: 5 }, result: '惩罚最终被改成一次班会。没有谁赢得很漂亮，但受伤的同学不用跑了。' },
    { text: '先帮助受伤的同学申请免跑，再记录经过。', effect: { autonomy: 6, relations: { zhou: 8 }, health: 3, mood: 4 }, result: '你从能保护的具体的人开始。小小的行动，也不是没有意义。' },
  ]),
  makeEvent('confiscated-novel', '与学习无关的东西', 3, 'su', 'classroom', [
    '苏晓课间看的小说被没收，理由是“与学习无关”。语文试卷恰好选用了同一位作家的文章。',
    '她摊开双手：“所以同一句话，印在试卷上才算有价值？”',
  ], [
    { text: '陪她说明情况，约定课间阅读的边界。', effect: { autonomy: 8, relations: { su: 9 }, subjects: { chinese: 3 }, stress: 3 }, result: '书拿回来了，但需要带回家。并不理想，不过你们没有承认阅读本身有错。' },
    { text: '把书单记下来，约好毕业后慢慢读。', effect: { mood: 7, relations: { su: 7 }, autonomy: 4 }, result: '“考完以后”清单多了一项。你也提醒她，今天能读的几页不必全部推迟。' },
  ]),
  makeEvent('small-progress', '没有上榜的进步', 3, 'teacher', 'classroom', [
    '你的年级排名变化不大，但之前一直不会的电学题，这次独立做出来了。表彰名单上没有你的名字。',
    '老陈路过你的桌子，用笔轻轻点了点那道题：“我看到了。”',
  ], [
    { text: '把这次进步记下来，继续自己的节奏。', effect: { mood: 10, autonomy: 5, subjects: { physics: 4 }, stress: -7 }, result: '原来有些成长，名次变化表没有能力显示。你决定自己记住它。' },
    { text: '给还不会的同学讲一遍。', effect: { subjects: { physics: 6 }, relations: { zhou: 6 }, mood: 7, energy: -5 }, result: '讲到第二遍时，你理解得更深了。一次进步，变成了两个人的好消息。' },
  ]),
  makeEvent('city-wall', '城墙上的风', 3, 'zhou', 'city', [
    '你们终于抽空走到城墙边。墙砖见过的春天，比学校荣誉榜上的年份多得多。',
    '周野说：“以后回来看，咱们还会觉得这次月考能决定世界吗？”',
  ], [
    { text: '不谈考试，认真看看这座城市。', effect: { mood: 18, stress: -17, autonomy: 6, energy: -4 }, result: '车流、晚霞、卖甑糕的小摊。世界很具体，也比你这阵子的担心大很多。' },
    { text: '聊聊十年后，想成为什么样的大人。', effect: { autonomy: 9, relations: { zhou: 8 }, mood: 10 }, result: '“至少别用一句‘为你好’，就替别人决定一切。”你们达成了一条共识。' },
  ]),
  makeEvent('quiet-mom', '今天不问成绩', 4, 'mom', 'home', [
    '回家时，妈妈没有立刻问模拟考。她端来一碗面，只说：“今天风大，骑车累不累？”',
    '你忽然有点不习惯。她看着你笑：“我也在学。有时候学得慢一点。”',
  ], [
    { text: '抱抱她，说说今天真正的心情。', effect: { relations: { mom: 15 }, mood: 15, stress: -15 }, result: '你们聊了很久。没有总结，没有打分，也没有把一段话变成一次教育。' },
    { text: '一起吃面，也认真感谢她的改变。', effect: { relations: { mom: 12 }, energy: 15, mood: 10, stress: -9 }, result: '面有点烫。你们慢慢吃，第一次觉得“慢慢来”也可以出现在高三。' },
  ]),
  makeEvent('mock-two', '二模后的岔路口', 4, 'teacher', 'classroom', [
    '最后几次模拟考，分数仍然会上下浮动。有人开始到处搜“逆袭奇迹”，恨不得找到一夜之间改变人生的按钮。',
    '老陈说：“没有这种按钮。把会的做稳，把睡眠补足，比再买十本资料有用。”',
  ], [
    { text: '回归基础，把已掌握的知识稳住。', effect: { subjects: { chinese: 3, math: 3, english: 3, physics: 2, chemistry: 2, biology: 2 }, energy: -10, stress: -3 }, result: '你停止追逐神奇方法，开始相信那些已经踏实走过的路。' },
    { text: '优先调整作息，练习限时答题。', effect: { energy: 16, health: 6, stress: -12, subjects: { math: 3 } }, result: '清醒的脑子终于比凌晨两点的意志力更可靠。' },
  ]),
  makeEvent('wish-form', '志愿，首先是谁的愿', 4, 'mom', 'home', [
    '第一次模拟填报志愿，爸爸妈妈的意见、亲戚的经验、短视频的建议挤满了桌面。你的那一张纸，反而在最下面。',
    '妈妈问：“你自己想好了没有？”这次，她是真的在等答案。',
  ], [
    { text: '拿出学校与专业资料，说清自己的排序。', effect: { autonomy: 12, relations: { mom: 7 }, stress: -5 }, result: '你不再只报一个校名，而是谈起课程、城市、预算和你愿意投入的事情。' },
    { text: '承认还在探索，请他们留一些选择空间。', effect: { autonomy: 9, relations: { mom: 8 }, mood: 7 }, result: '不知道不是不负责任。你们约定一起查证，而不是让最大的声音自动获胜。' },
  ]),
  makeEvent('graduation-photo', '最后一排的阳光', 4, 'zhou', 'campus', [
    '拍毕业照那天，周野站在最后一排，苏晓在你旁边整理衣领。摄影师说：“大家笑一笑。”',
    '你忽然发现，这可能是这一群人最后一次如此整齐地站在一起。以后再也没有人按成绩安排你们的座位了。',
  ], [
    { text: '认真笑一下，记住此刻的每个人。', effect: { mood: 16, relations: { su: 7, zhou: 7 }, stress: -9 }, result: '快门响的时候，你没有想分数。阳光把每个人都照得一样明亮。' },
    { text: '在照片背面，写下给朋友的话。', effect: { relations: { su: 10, zhou: 10 }, autonomy: 5, mood: 10 }, result: '你没有写“前程似锦”，而是写：“以后累了，也可以来找我。”' },
  ]),
  makeEvent('last-lesson', '老陈没讲完的最后一课', 4, 'teacher', 'classroom', [
    '最后一节正式班会，老陈没带课件。他先讲答题卡，再讲证件，最后沉默了一会儿。',
    '“有些话我以前说得太重了。”他说，“你们考成什么样，都先好好吃饭，平平安安回来。”',
  ], [
    { text: '认真说声谢谢，也记住自己应得的温柔。', effect: { relations: { teacher: 15 }, mood: 14, stress: -12, autonomy: 4 }, result: '你没有把所有委屈都忘掉，但允许这段关系也有一个温柔的结尾。' },
    { text: '告诉他，体育课和那杯热水，你都记得。', effect: { relations: { teacher: 18 }, mood: 10, stress: -10 }, result: '老陈摘下眼镜擦了擦，说教室灰有点大。窗外刚下过雨，其实一点灰也没有。' },
  ]),
  makeEvent('letter-future', '给考完以后的自己', 4, 'su', 'classroom', [
    '苏晓带来几张信纸，说要给六月的自己写封信。没有字数要求，也不判卷面分。',
    '你握着笔，突然觉得这种题比模拟卷更难一点：如果不需要证明优秀，你想要什么？',
  ], [
    { text: '“希望你没有把自己弄丢。”', effect: { autonomy: 12, mood: 12, stress: -10, relations: { su: 5 } }, result: '这封信没有豪言壮语。你写了睡个好觉、读一本书、和朋友看一次日落。' },
    { text: '“无论结果如何，感谢你走到这里。”', effect: { mood: 17, stress: -16, health: 4, relations: { su: 4 } }, result: '落笔时，你第一次不是用未来的成功，去交换现在对自己的认可。' },
  ]),
  makeEvent('exam-kit', '比护身符可靠一点', 4, 'mom', 'home', [
    '妈妈替你检查考试袋，检查了三遍。准考证、身份证、黑色签字笔，排得像一支小小的队伍。',
    '她还拿出一根红绳，笑着说：“这个没科学依据。就是想祝你平安。”',
  ], [
    { text: '收下心意，再一起核对考试用品。', effect: { relations: { mom: 9 }, stress: -12, mood: 10 }, result: '你不必相信红绳能改变题目，也能接住它背后的关心。' },
    { text: '整理好出行和睡眠计划，让她也安心。', effect: { energy: 15, stress: -14, relations: { mom: 7 }, autonomy: 4 }, result: '不确定的事还有很多，但证件、路线和闹钟都准备好了。你已经做了能做的。' },
  ]),
  makeEvent('empty-desk', '抽屉里的一整个高三', 4, 'zhou', 'classroom', [
    '清理抽屉时，你翻出半块橡皮、一张食堂小票、苏晓的纸条，还有周野画的那只很丑的雪人。',
    '习题册摞在旁边很高，但真正让你停下来的，是这些没有分值的东西。',
  ], [
    { text: '把它们好好收进书包。', effect: { mood: 15, autonomy: 7, relations: { su: 6, zhou: 6 } }, result: '这一年当然有压力，也确实有值得带走的东西。你不必只记住其中一种。' },
    { text: '和朋友交换一件小小的纪念品。', effect: { relations: { su: 9, zhou: 9 }, stress: -10, mood: 10 }, result: '周野说以后他成了画家，这张雪人要涨价。大家笑了很久。' },
  ]),
  makeEvent('school-motto', '校训背面的一行小字', 4, 'su', 'campus', [
    '毕业前，学校请同学们在留言墙上写一句话。上方依然挂着“只要学不死，就往死里学”的横幅，阳光把红色晒得有点褪色。',
    '苏晓拿着粉笔问：“如果让你给下一届留一句话，你会照着横幅抄吗？”你发现，这一次没有老师给出标准答案。',
  ], [
    { text: '“只要还在长大，就有重新选择的可能。”', effect: { autonomy: 10, mood: 12, relations: { su: 6 } }, result: '有人在旁边画了一棵小树。你们没有擦掉旧横幅，但给后来的人留下了另一种声音。' },
    { text: '“可以认真学习，也要认真吃饭、睡觉和生活。”', effect: { autonomy: 7, stress: -12, health: 5, relations: { teacher: 5 } }, result: '老陈站在旁边看了一会儿，往上添了两个字：“同意。”这次签名不是一张考核表。' },
  ]),
  makeEvent('last-night', '允许世界安静一晚', 4, 'mom', 'home', [
    '夜色落下来。家长群仍在转发押题，书桌上还有没做完的卷子。你忽然明白，题目永远不可能全部做完。',
    '妈妈把手机放到客厅：“今晚不看这些了。”窗外的西安，和每一个普通夜晚一样。',
  ], [
    { text: '合上书，给明天留一个清醒的自己。', effect: { energy: 30, health: 8, stress: -20, mood: 10 }, result: '灯熄灭了。你不是放弃努力，而是终于让努力有了边界。' },
    { text: '只看一遍易错提醒，然后按时睡觉。', effect: { energy: 20, stress: -14, subjects: { math: 3, english: 2 } }, result: '你没有打开新的试卷。最后一页上写着：看清题目，也照顾好自己。' },
  ]),
];
