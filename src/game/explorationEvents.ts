import type { CharacterId, Choice, Scene, StoryEvent } from './types';

function story(id: string, title: string, scene: Scene, placeId: string, speaker: CharacterId, paragraphs: string[], choices: Choice[], minWeek = 0, storyline?: string, requires?: StoryEvent['requires']): StoryEvent {
  return { id, title, scene, placeId, speaker, paragraphs, choices, minWeek, maxWeek: 39, chapter: storyline ? `地图支线 · ${storyline}` : '拾光漫游 · 路上的小事', storyline, requires };
}

export const EXPLORATION_EVENTS: StoryEvent[] = [
  story('zine-start', '一本没有排名的刊物', 'library', 'reading-table', 'su', [
    '苏晓把一张折成四页的纸放在长桌上。第一页不是名次，是食堂阿姨的油泼面；第二页是一首没有被选进范文集的诗。',
    '“班级刊物必须展示优秀成果。”指导表格这样写。她拿起橡皮：“那普通的一天，能不能算我们的成果？”',
  ], [
    { text: '一起做一期《普通人的一天》。', effect: { autonomy: 6, mood: 9, relations: { su: 7 } }, result: '你们在封面画了一个没有刻度的钟。今天从此有了一种新的记录方式。' },
    { text: '先收集匿名投稿，让更多人参与。', effect: { autonomy: 4, subjects: { chinese: 4 }, relations: { su: 5 } }, result: '借阅台旁放了一只小纸盒。第一张投稿只写着：“我昨天终于睡了八小时。”' },
  ], 0, '没有标准答案的小刊物'),
  story('zine-edit', '红笔之外的空白', 'library', 'reading-table', 'su', [
    '小刊物收到了十七份稿子，也收到一张修改意见：“建议删除疲惫、迷茫等消极词汇，突出积极向上的精神面貌。”',
    '苏晓把稿子铺开。删掉这些词以后，十七个人好像只剩同一个人。她问你：“这次，我们想留下什么？”',
  ], [
    { text: '保留真实感受，请投稿者自己确认。', effect: { autonomy: 8, stress: 3, relations: { su: 8 } }, result: '你们逐一问过作者，也给不愿公开的人留了撤稿的权利。刊物不完美，却终于像它的作者们。' },
    { text: '换成隐喻，把想说的话藏在故事里。', effect: { subjects: { chinese: 6 }, autonomy: 4, relations: { su: 5 } }, result: '“疲惫”变成一盏快没电的台灯。读过的人依然认出了自己，表达也长出了另一条路。' },
  ], 8, '没有标准答案的小刊物', { eventId: 'zine-start' }),
  story('zine-honest', '被允许的十七种心情', 'library', 'return-desk', 'su', [
    '春天，借阅台上多了薄薄一叠刊物。之前那十七份稿子保留了各自的语气，旁边的留言页写满了“原来不只我一个人”。',
    '老陈翻到最后，没用红笔。他留下一句话：“下期如果还有空，我也想写一个普通老师的一天。”',
  ], [
    { text: '把这期刊物交给下一届继续做。', effect: { autonomy: 8, mood: 15, relations: { su: 8, teacher: 5 } }, result: '你们交出去的不是一份标准模板，是允许每个人有自己声音的空白纸。有人接住了它。' },
    { text: '留一本给自己，也给每位作者一本。', effect: { mood: 17, stress: -9, relations: { su: 9 } }, result: '一本不列入综评的薄册子，成了这一年最厚的纪念。封底印着所有愿意署名的人。' },
  ], 20, '没有标准答案的小刊物', { eventId: 'zine-edit', choiceIndex: 0 }),
  story('zine-metaphor', '台灯与不会熄灭的句子', 'library', 'return-desk', 'su', [
    '你们写进小刊物的台灯故事，被读书会选来讨论。有人读懂了熬夜，有人读懂了孤独，也有人说他看到的是家。',
    '苏晓笑了：“原来绕一点路，句子也能到达。下一期，要不要把解释权还给读者？”',
  ], [
    { text: '邀请大家写下自己的读法。', effect: { autonomy: 7, subjects: { chinese: 5 }, relations: { su: 8 } }, result: '留言页没有参考答案。不同的读法都被留下，那盏台灯照亮了比你们想象更远的地方。' },
    { text: '把原稿也收进私人的毕业纪念册。', effect: { mood: 15, autonomy: 6, relations: { su: 7 } }, result: '正式刊物和原稿并排放在抽屉里。你记得每一次措辞背后的犹豫，也记得自己没有停止表达。' },
  ], 20, '没有标准答案的小刊物', { eventId: 'zine-edit', choiceIndex: 1 }),
  story('library-margin', '书页里的一张旧车票', 'library', 'library-shelves', 'su', [
    '一本地理随笔里夹着一张旧车票，背面写着：“毕业以后，去看看不在考纲里的山。”',
    '苏晓指着那一行字：“这位前辈，可能和我们一样，在很小的桌子前想过很大的世界。”',
  ], [
    { text: '把车票交给管理员，另写一张自己的心愿。', effect: { autonomy: 5, mood: 9, relations: { su: 4 } }, result: '旧车票留在失物盒里，你的心愿留在自己的本子上。向往不需要借走别人的纪念。' },
    { text: '记下那座山的名字，查查它在哪里。', effect: { subjects: { chinese: 3, english: 3 }, mood: 6 }, result: '地图上多了一个点。今晚的笔记里，终于有一页不属于考试。' },
  ]),
  story('library-seat', '窗边的位置不属于名次', 'library', 'library-window', 'teacher', [
    '自习室贴了新通知：“前排采光区优先提供给模拟考前五十名。”最喜欢窗边的同学收起书包，往角落走。',
    '老陈看着那扇窗：“图书馆的阳光，也开始按成绩分配了？”他准备向管理员提建议。',
  ], [
    { text: '建议采用预约轮换，让每个人都能坐到。', effect: { autonomy: 7, relations: { teacher: 5 }, mood: 7 }, result: '新预约表按时间排序。没有解决所有不公平，至少今天的阳光没有再看成绩单。' },
    { text: '先把自己的座位让给她，陪她读一会儿。', effect: { mood: 10, stress: -6, relations: { su: 5 } }, result: '你们各分到半扇窗。她把书往中间推了一点，今天的阅读不再孤单。' },
  ], 12),

  story('experiment-start', '不肯落在标准值上的摆钟', 'laboratory', 'physics-lab', 'teacher', [
    '实验表格要求测量单摆周期。标准值印在页脚，同组同学低声说：“抄那个就能交了，何必再测十次。”',
    '你们测出的结果总是偏一点。老陈蹲下来看支架：“如果真实世界不配合参考答案，先别急着责怪真实世界。”',
  ], [
    { text: '如实记录，把误差也写进报告。', effect: { autonomy: 5, subjects: { physics: 5 }, relations: { teacher: 5 } }, result: '最后一列写上“暂未解释”。你发现承认不知道，反而是研究真正开始的地方。' },
    { text: '和周野重新检查装置，再测一轮。', effect: { energy: -7, subjects: { physics: 6 }, relations: { zhou: 5 } }, result: '你们找到了松动的夹子。答案没有自己出现，但你们亲手缩小了与它的距离。' },
  ], 0, '误差也是答案'),
  story('experiment-display', '获奖报告里的完美曲线', 'laboratory', 'chemistry-lab', 'teacher', [
    '科技展报名表只留了“成功成果”一栏。你们的重复实验有失败记录，指导同学建议把那几组数据删掉，曲线就漂亮了。',
    '老陈把原始记录还给你：“漂亮和可信，有时需要你自己选择先保护哪一个。”',
  ], [
    { text: '连同失败记录一起展出。', effect: { autonomy: 8, subjects: { physics: 4, chemistry: 3 }, stress: 3 }, result: '展板上多了一块“我们怎样发现自己错了”。它没有最完美的曲线，却最经得起追问。' },
    { text: '做成现场实验，请大家亲手试。', effect: { energy: -8, mood: 9, relations: { teacher: 5, zhou: 5 } }, result: '你们把结论变成一个可以被挑战的实验。别人按下计时器时，科学不再只是展板上的口号。' },
  ], 8, '误差也是答案', { eventId: 'experiment-start' }),
  story('experiment-record', '给下一组留下真实的数据', 'laboratory', 'physics-lab', 'teacher', [
    '展览结束了，你们展示过的失败数据留了下来。一个高二同学拿着本子来问：“为什么第三次和第四次差那么多？”',
    '老陈笑着让出实验台：“你们愿意教他怎样找错，比教他怎样得满分更难得。”',
  ], [
    { text: '一起从原始记录重新分析。', effect: { subjects: { physics: 6, math: 3 }, autonomy: 6, relations: { teacher: 6 } }, result: '那一页失败记录，成了另一组实验的起点。你的好奇心终于可以传给别人。' },
    { text: '整理一份包含失败过程的操作手册。', effect: { autonomy: 7, mood: 10, subjects: { chemistry: 4 } }, result: '手册第一页写着：“如果和我们不同，请先相信你的记录。”这句话没有标准分，却有分量。' },
  ], 20, '误差也是答案', { eventId: 'experiment-display', choiceIndex: 0 }),
  story('experiment-live', '台下也可以问为什么', 'laboratory', 'observatory', 'zhou', [
    '现场实验里，有人真的做出了和你们不同的结果。你们沿着这个问题查到晚上，最后把讨论搬到了屋顶。',
    '周野望着望远镜：“原来演示没有把所有人变成观众。有的人会走过来，和我们一起做。”',
  ], [
    { text: '邀请他们加入下次的开放实验。', effect: { mood: 14, autonomy: 7, relations: { zhou: 8 } }, result: '名单没有“优秀代表”这一栏。愿意提问的人，都可以把手伸向实验台。' },
    { text: '把新问题写成给下一届的挑战。', effect: { subjects: { physics: 5 }, autonomy: 6, relations: { teacher: 5 } }, result: '你们交出去一个没有写死的结论。以后有人经过，也许会继续问下去。' },
  ], 20, '误差也是答案', { eventId: 'experiment-display', choiceIndex: 1 }),
  story('plant-ranking', '优秀幼苗评比', 'laboratory', 'greenhouse', 'zhou', [
    '温室的活动表要求选出“生长最快的优秀幼苗”。周野看着向阳的一排和背阴的一排，拿尺子的手停了下来。',
    '“它们连得到的阳光都不一样。”他说，“怎么能只看谁长得最高？”',
  ], [
    { text: '记录光照和水量，调整每盆的位置。', effect: { subjects: { biology: 5 }, autonomy: 5, health: 3 }, result: '你们给记录表加了环境条件。最慢的那盆没有变成冠军，却得到了一点原本缺少的光。' },
    { text: '取消名次，为每盆写一张成长观察卡。', effect: { mood: 12, stress: -7, relations: { zhou: 5 } }, result: '叶子的颜色、根的长度、新芽的方向，都被认真记下。生长终于有了不止一种描述。' },
  ]),
  story('star-cloud', '今晚的星星没有到齐', 'laboratory', 'observatory', 'su', [
    '观星活动准备了两周，今晚却来了云。宣传材料已经写好“满天繁星，圆满成功”，同学举着相机等一张合适的图。',
    '苏晓给望远镜盖上防尘罩：“看不见星星的夜晚，也算一个真实的夜晚吧？”',
  ], [
    { text: '如实写下阴天，改听大家讲星空故事。', effect: { mood: 13, autonomy: 5, relations: { su: 6 } }, result: '报道没有满天繁星。你们却在云下面，第一次知道每个人为什么想抬头。' },
    { text: '查查云层资料，约下一次观测。', effect: { subjects: { physics: 4 }, stress: -5, relations: { su: 4 } }, result: '计划表上写了“天气允许时”。等待从一次失败，变成好奇心的一部分。' },
  ], 12),

  story('stage-start', '没有奖项的演出', 'arts', 'music-room', 'zhou', [
    '旧琴房门上贴着“高三暂停社团”。周野还没把准备好的歌弹给任何人听，琴弦已经先被要求安静。',
    '“活动可以申请。”通知的最后又写，“需提供预期获奖等级。”他问：“如果我们只是喜欢，怎么填这一格？”',
  ], [
    { text: '申请午休的一场小演出，理由写“喜欢”。', effect: { autonomy: 7, relations: { zhou: 7 }, mood: 9 }, result: '申请被退回一次，又递上去一次。老陈在旁边补签：“不影响正常休息，我同意。”' },
    { text: '先约几个人在琴房里听完这首歌。', effect: { mood: 13, stress: -7, relations: { zhou: 8 } }, result: '只有五个听众。最后一个音落下时，五个人都没有急着起身。小小的开始也算开始。' },
  ], 0, '把声音还给我们'),
  story('stage-program', '节目单上缺了一种声音', 'arts', 'radio-room', 'su', [
    '演出终于得到一个午休时段。节目单审查时，有人建议所有歌曲换成励志主题，主持词只保留“努力”和“成功”。',
    '苏晓把原稿夹在广播稿下面：“我们想让大家听见的，也包括累的时候，和不知道怎么办的时候。”',
  ], [
    { text: '保留原来的歌，邀请老师先听一次排练。', effect: { autonomy: 8, relations: { teacher: 4, zhou: 5 }, stress: 3 }, result: '听完以后，老陈没有再要求改成口号。他说：“唱清楚一点，让后排也听见。”' },
    { text: '加入匿名心愿朗读，让听众也有一段节目。', effect: { autonomy: 6, subjects: { chinese: 4 }, relations: { su: 6 } }, result: '广播站收到很多小纸条。节目单多了一栏“大家的声音”，不再只靠台上几个人。' },
  ], 8, '把声音还给我们', { eventId: 'stage-start' }),
  story('stage-song', '掌声不需要计入综评', 'arts', 'little-stage', 'zhou', [
    '春天的小剧场坐满了人。你们坚持留下的那首歌开始时，前排同学悄悄把错题本合上。',
    '周野唱完，后台没有奖状。只有一瓶别人递来的水，和一句“谢谢，我今天特别需要听见这个”。',
  ], [
    { text: '告诉他，这就是演出的意义。', effect: { mood: 18, stress: -10, relations: { zhou: 10 } }, result: '他把那句话抄进琴谱首页。以后再有人问预期奖项，他已经有了自己的回答。' },
    { text: '留一段录音，送给没能到场的同学。', effect: { autonomy: 7, mood: 12, relations: { su: 6, zhou: 6 } }, result: '录音不是成果汇报。它流进晚自习后的耳机里，陪一些人走完回家的路。' },
  ], 20, '把声音还给我们', { eventId: 'stage-program', choiceIndex: 0 }),
  story('stage-voices', '这一次，后台也是舞台', 'arts', 'little-stage', 'su', [
    '你们加入的匿名心愿被一张张读出来：“想给妈妈做一次饭。”“想睡个没有闹钟的午觉。”“想再踢一次球。”',
    '观众席安静了一会儿，随后响起掌声。苏晓说：“这次最好的节目，是没有人知道作者名字的那一段。”',
  ], [
    { text: '把每周的广播留出一段匿名心愿。', effect: { autonomy: 8, mood: 13, relations: { su: 9 } }, result: '广播站从此不只播表扬名单。某个普通的周三，也可以有人听见自己的愿望。' },
    { text: '把心愿纸条做成可以带走的小册子。', effect: { subjects: { chinese: 4 }, mood: 14, relations: { su: 7, zhou: 5 } }, result: '你们没有替任何愿望打分。散场时，每个人都可以拿走一张与自己相像的纸。' },
  ], 20, '把声音还给我们', { eventId: 'stage-program', choiceIndex: 1 }),
  story('paint-outside', '天空不只有一种蓝', 'arts', 'art-studio', 'su', [
    '画室作业范例里的天空蓝得很标准。你的纸上是西安阴天的灰蓝，老师旁边的评分细则写着“色彩积极，主题明朗”。',
    '苏晓把窗帘拉开：“要是窗外也来参加这次评比，它能得几分？”',
  ], [
    { text: '画自己看见的天，写上观察说明。', effect: { autonomy: 7, mood: 10, subjects: { chinese: 2 } }, result: '你没有把阴天涂成晴天。画旁边的字写着：“灰蓝也是今天的一部分。”' },
    { text: '和她一起画下傍晚慢慢变化的颜色。', effect: { mood: 13, stress: -8, relations: { su: 6 } }, result: '纸上的天从灰蓝到淡粉，没有一刻完全符合范例。你们却觉得每一刻都很好看。' },
  ]),
  story('radio-silence', '广播里空出的一分钟', 'arts', 'radio-room', 'teacher', [
    '校园广播一连播了七条喜报。老陈走进广播站时，刚有人要求再加一条“奋斗宣言”。',
    '他把水杯放下：“能不能留一分钟，什么也不催？午休总该像午休。”',
  ], [
    { text: '播放校园的风声，给大家一分钟安静。', effect: { energy: 12, stress: -10, relations: { teacher: 5 } }, result: '喇叭里传来银杏叶的沙沙声。没人因此耽误一生，有人终于把午饭吃慢了一点。' },
    { text: '读一段同学写的普通生活。', effect: { mood: 11, autonomy: 4, subjects: { chinese: 3 } }, result: '今天的广播说起一只校园猫。那一分钟里，操场和窗台都重新属于生活。' },
  ], 12),

  story('walk-start', '不问成绩的一段路', 'park', 'river-path', 'mom', [
    '妈妈难得周末有空，陪你到河边走。走了不到五分钟，她就问起模拟考。你们的脚步没有变，空气却变紧了。',
    '她指着长椅说：“其实我也不知道，除了成绩，还应该怎么问你最近好不好。”',
  ], [
    { text: '约定今天先不谈分数，互相说一件小事。', effect: { autonomy: 6, stress: -8, relations: { mom: 8 } }, result: '她讲起同事弄丢钥匙的糗事，你讲起食堂的猫。河边忽然多了两个不必扮演角色的人。' },
    { text: '告诉她最近最累的一刻，也听她的担心。', effect: { mood: 8, relations: { mom: 10 }, stress: -6 } , result: '你们没有立刻达成一致，但这一段路第一次没有谁只负责提问，谁只负责回答。' },
  ], 0, '河边的家庭会议'),
  story('walk-boundary', '担心也需要休息日', 'park', 'stone-bridge', 'mom', [
    '妈妈又在睡前转发了一份提分清单。第二天见面，她说自己只是担心，不发点什么就像没有尽到责任。',
    '你们停在石桥边。水一直往下流，担心却总在同一个地方打转。你想试着给它找一个边界。',
  ], [
    { text: '约定每周固定谈一次学习，其余时间正常生活。', effect: { autonomy: 8, stress: -9, relations: { mom: 7 } }, result: '手机里多了一个周末提醒，睡前少了很多推送。关心终于可以按约定抵达，而不是随时闯入。' },
    { text: '让她陪你认识一件你喜欢的事。', effect: { mood: 12, relations: { mom: 9 }, autonomy: 4 } , result: '你们谈了半小时画画和音乐。妈妈发现她担心的那个孩子，已经有很多成绩之外的自己。' },
  ], 8, '河边的家庭会议', { eventId: 'walk-start' }),
  story('walk-agreement', '春天的清单只有三行', 'park', 'river-path', 'mom', [
    '你们坚持了一阵每周学习对话的约定。今天妈妈拿来一张清单，上面没有排名，只有“吃饭”“睡觉”“想说的事”。',
    '她说：“我有时还是忍不住想催。但想催的时候，先等到约好的那天。”',
  ], [
    { text: '谢谢她，也诚实说出自己还需要的空间。', effect: { autonomy: 9, relations: { mom: 9 }, stress: -12 } , result: '边界没有让你们离得更远。它让每次走近都不再那么疼。' },
    { text: '把下一次河边散步也写进日历。', effect: { mood: 17, health: 4, relations: { mom: 8 } }, result: '日历里多了一个和成绩无关的约定。它不保证未来完美，但保证还有机会好好说话。' },
  ], 20, '河边的家庭会议', { eventId: 'walk-boundary', choiceIndex: 0 }),
  story('walk-understand', '妈妈第一次坐在观众席', 'park', 'picnic-lawn', 'mom', [
    '你带妈妈看过一次喜欢的活动。回到河边，她主动问起你那张画、那首歌，没有把话题拐回“对升学有用吗”。',
    '她说：“以前我总怕你走偏，现在才发现，我连你想走的路都没认真看过。”',
  ], [
    { text: '邀请她讲讲自己年轻时喜欢什么。', effect: { relations: { mom: 12 }, mood: 14, stress: -8 } , result: '她讲起没学完的缝纫课，也讲起一次没有去成的旅行。你们看见了彼此没有写在身份里的部分。' },
    { text: '约定继续分享，也保留各自独处的时间。', effect: { autonomy: 9, relations: { mom: 8 }, mood: 10 } , result: '你们没有变成完全一样的人。只是彼此不同的时候，也可以坐在同一块野餐垫上。' },
  ], 20, '河边的家庭会议', { eventId: 'walk-boundary', choiceIndex: 1 }),
  story('volunteer-photo', '劳动之前先摆好姿势', 'park', 'volunteer-hut', 'teacher', [
    '志愿活动刚开始，负责人就要求大家举着垃圾袋合影。有人捡起同一片叶子拍了三次，河岸的垃圾还在原处。',
    '老陈把相机收好：“先干活。需要记录的话，最后拍真正做完的地方。”',
  ], [
    { text: '认真清理一段河岸，再如实记录。', effect: { energy: -8, autonomy: 6, health: 3, relations: { teacher: 5 } }, result: '照片里没有整齐的笑容，只有干净了一些的步道。你知道自己今天到底帮了什么。' },
    { text: '和大家分工，照顾体力不好的同学。', effect: { mood: 10, relations: { zhou: 5, teacher: 4 }, stress: -5 } , result: '没有人被要求证明自己最能吃苦。活动完成以后，大家也还有力气一起坐下喝水。' },
  ]),
  story('picnic-rain', '被天气改写的计划', 'park', 'picnic-lawn', 'zhou', [
    '野餐刚铺好垫子，就落了几滴雨。周野看着计划表里“阳光、草地、快乐”的三个勾，一时不知该勾哪一个。',
    '苏晓抱着面包往亭子里跑：“快乐可能不用等阳光签字。”',
  ], [
    { text: '躲到亭子里分享面包，听一会儿雨。', effect: { energy: 15, mood: 14, stress: -10, relations: { su: 4, zhou: 4 } }, result: '照片没有草地，下午却没有因此作废。你们记住了雨落在亭顶的声音。' },
    { text: '收好东西去面馆，把计划改成热汤。', effect: { money: -12, energy: 22, mood: 11, relations: { zhou: 5 } }, result: '计划表被水洇开了一个角。你们没有补写“圆满成功”，只在旁边画了一碗热面。' },
  ], 12),

  story('stall-start', '摊位后面的错题本', 'market', 'secondhand-stall', 'zhou', [
    '夜市旧书摊的纸箱散了，摊主正一边收拾一边接电话。一本封皮磨白的错题本落在地上，里面的字迹从工整变得越来越急。',
    '周野蹲下来帮忙：“原来这些书背后，都有人真的熬过那些晚上。”摊主说今天忙不开，问你们愿不愿意帮一小时。',
  ], [
    { text: '帮忙分类，也请摊主讲讲这些旧书。', effect: { energy: -8, money: 16, autonomy: 4, relations: { zhou: 5 } }, result: '你们听到一个从参考书摊转成旧书摊的人生。今晚的劳动费不多，故事却比书名长。' },
    { text: '先把散落的书收好，留一个周末再来。', effect: { mood: 10, autonomy: 3, relations: { zhou: 5 } }, result: '摊主记下你们的名字，给错题本加了一层纸封。一本没人再考的书，也值得被好好对待。' },
  ], 0, '灯火里的人生课'),
  story('stall-label', '只卖成功故事的标签', 'market', 'secondhand-stall', 'zhou', [
    '摊主想做一排“学霸同款”书架，书签上只印“逆袭”“状元”。上次那本错题本的主人没有逆袭，只是换了一条路。',
    '周野问：“如果只留下成功的故事，买书的人会不会以为，其他人都没有认真活过？”',
  ], [
    { text: '建议写真实来历，让书保留各自的人生。', effect: { autonomy: 8, subjects: { chinese: 3 }, relations: { zhou: 6 } }, result: '标签变成“一个爱画画的人用过的数学笔记”。没有承诺复制成功，却让旧书重新有了温度。' },
    { text: '做一架实用分类，帮需要的人找到便宜的书。', effect: { autonomy: 5, mood: 8, money: 12 }, result: '书架按年级、学科和内容整理。一个低年级学生只花几块钱，就找到了自己需要的笔记。' },
  ], 8, '灯火里的人生课', { eventId: 'stall-start' }),
  story('stall-stories', '书架上，没有失败者', 'market', 'night-table', 'zhou', [
    '摊主留下了你们写的真实标签。有人循着标签回来，给那本旧笔记补上一张明信片：“我后来在学设计，数学也没有白学。”',
    '你们坐在夜市长桌前读完。周野说：“人生继续写下去的时候，旧标题真的会不够用。”',
  ], [
    { text: '征得同意，把明信片也留在书旁。', effect: { autonomy: 8, mood: 15, relations: { zhou: 8 } }, result: '下一位读者可以看见故事的后来。书架上没有谁被定格在一场考试里。' },
    { text: '给未来的自己写一张不以成绩开头的明信片。', effect: { autonomy: 9, stress: -9, subjects: { chinese: 3 } }, result: '第一句话是“你最近喜欢做什么”。未来终于不只是一串用来证明过去的数字。' },
  ], 20, '灯火里的人生课', { eventId: 'stall-label', choiceIndex: 0 }),
  story('stall-useful', '卖出去的书，留下来的善意', 'market', 'secondhand-stall', 'zhou', [
    '实用分类书架旁放了一只交换箱。上次买笔记的学生又来了，这次带来自己整理的复习卡片，让别人免费带走。',
    '摊主说：“这箱子不赚钱。但大家以后找不到书，知道可以来问我。”',
  ], [
    { text: '把自己的学习资料也整理进去。', effect: { subjects: { math: 4, english: 3 }, mood: 12, relations: { zhou: 6 } }, result: '整理时你也重新理解了知识。有人带走一张卡片，你没有少一个竞争优势，多了一点分享的勇气。' },
    { text: '和周野做一张借还登记表。', effect: { autonomy: 6, mood: 13, relations: { zhou: 8 } }, result: '登记表不问年级名次。几本普通的书，连接起一些原本不会碰面的日子。' },
  ], 20, '灯火里的人生课', { eventId: 'stall-label', choiceIndex: 1 }),
  story('market-change', '少了两块钱的一碗馄饨', 'market', 'snack-stall', 'mom', [
    '妈妈请你吃馄饨，摊主找钱时少找了两块。她正想责备，你看到摊主另一只手一直扶着旧手机，屏幕上是医院的消息。',
    '事情还是需要说清，但一句话也许可以有不同的开头。',
  ], [
    { text: '平静地提醒，再确认一次金额。', effect: { autonomy: 4, mood: 7, relations: { mom: 4 } }, result: '摊主补回两块钱，也松了一口气。你没有放弃自己的权益，也没有把对方的慌乱变成另一场审判。' },
    { text: '帮妈妈把话说缓一点，先让摊主核对。', effect: { relations: { mom: 7 }, stress: -6, mood: 6 } , result: '妈妈吃完后说，你刚才比她沉得住气。她第一次认真听你讲，温和也可以是一种清晰。' },
  ]),
  story('street-listen', '没有人扫码的最后一首歌', 'market', 'street-stage', 'su', [
    '街头歌手唱到最后一首，围观的人陆续走了。苏晓没有拿手机，也没有要求他唱热门片段，只安静地站着。',
    '“有人愿意听完，”她说，“也许和多少播放量，是两件事。”',
  ], [
    { text: '和她一起听完，再认真鼓掌。', effect: { mood: 15, stress: -10, relations: { su: 6 } }, result: '最后一个音落下时，歌手看见了你们。今晚至少有一首歌，没有被谁匆匆划走。' },
    { text: '点一首妈妈年轻时喜欢的歌。', effect: { money: -5, mood: 13, relations: { mom: 5, su: 4 } }, result: '你把旋律记在心里。回家哼起来时，妈妈停下洗碗的手，笑着接出了下一句。' },
  ], 12),

  story('future-start', '先问喜欢，再问分数', 'university', 'university-gate', 'teacher', [
    '开放日资料袋里塞满了榜单。几个家长围着“热门专业”展板，问题全是就业和薪水。老陈却让你先走一圈。',
    '“也问问每天做什么。”他说，“你不是只要考进一个名字，还要在那个专业里过很多普通的日子。”',
  ], [
    { text: '挑一个自己好奇的方向，问真实的课程。', effect: { autonomy: 7, mood: 9, relations: { teacher: 4 } }, result: '学长讲起实验失败和小组作业，未来忽然有了日常的形状。你记下的不是一个标签，是几件想试的事。' },
    { text: '多去几个展台，先允许自己还没决定。', effect: { autonomy: 6, stress: -7, mood: 8 } , result: '你没有当天做出答案。资料袋里多了几种可能，空白也终于不再像一种落后。' },
  ], 0, '给未来画一张地图'),
  story('future-choice', '兴趣与热门之间的长椅', 'university', 'workshop-hall', 'teacher', [
    '体验课上，你做了一个小装置，第一次对某个方向有了具体的喜欢。回家查资料，却发现亲戚推荐的“热门”不在同一条路上。',
    '老陈陪你坐到门口：“别把喜欢神化，也别因为它不够热门就直接划掉。下一步怎么验证，是你能决定的。”',
  ], [
    { text: '继续验证自己的兴趣，也记录现实的困难。', effect: { autonomy: 9, subjects: { physics: 4 }, relations: { teacher: 5 } }, result: '你写了一张包含好奇、课程、费用和难点的表。喜欢没有被当成万能理由，也没有被一句热门抹去。' },
    { text: '比较几个方向，把选择留成可调整的草稿。', effect: { autonomy: 7, stress: -8, subjects: { math: 3 } }, result: '草稿不是犹豫的证据。它帮助你把别人的期待，和自己的生活条件分别看清。' },
  ], 8, '给未来画一张地图', { eventId: 'future-start' }),
  story('future-curiosity', '未来地图的第一条线', 'university', 'university-lake', 'teacher', [
    '你查过课程，也问过真正学习那个专业的人。湖边的长椅上，旧资料袋已经有点破，关于喜欢的记录却越来越具体。',
    '老陈翻过那几页：“你现在说的，不再只是‘我觉得有意思’。这是你认真认识过的一种可能。”',
  ], [
    { text: '把它作为一个意向，继续保留其他可能。', effect: { autonomy: 10, mood: 13, relations: { teacher: 6 } }, result: '地图上终于有了一条由你自己画的线。它可以修改，也可以继续延伸。未来没有因此被锁死。' },
    { text: '向妈妈讲清喜欢的原因和准备面对的困难。', effect: { autonomy: 8, relations: { mom: 8, teacher: 5 }, stress: -7 } , result: '这次对话里，你拿出的不是任性宣言。是你为自己认真做过的一份功课。' },
  ], 20, '给未来画一张地图', { eventId: 'future-choice', choiceIndex: 0 }),
  story('future-draft', '可以修改的答案', 'university', 'university-lake', 'teacher', [
    '你整理的比较表里，有两个方向仍然难分。看到朋友已经有明确目标，你一度想随便选一个，让自己显得不落后。',
    '老陈把表格推回来：“能说清自己还在犹豫什么，已经比盲目确定更接近选择了。”',
  ], [
    { text: '写下还需验证的问题，继续寻找信息。', effect: { autonomy: 9, stress: -10, mood: 12 } , result: '你不再用“必须马上确定”惩罚自己。地图保留几条路，也保留你继续了解世界的时间。' },
    { text: '和家人讨论条件，把最终决定留给自己。', effect: { autonomy: 8, relations: { mom: 7, teacher: 5 } }, result: '别人的经验成了路标，没有变成方向盘。你慢慢学会让支持和自主同时存在。' },
  ], 20, '给未来画一张地图', { eventId: 'future-choice', choiceIndex: 1 }),
  story('major-label', '专业介绍没有写的普通星期二', 'university', 'society-fair', 'su', [
    '专业宣传册把每个毕业生都写成未来精英。一个正在值班的学姐给你们看了自己的课程表：周二早八、实验、图书馆、洗衣服。',
    '苏晓笑了：“原来梦想抵达以后，也还是要洗衣服。”学姐说，那些普通日子才最能告诉你喜欢不喜欢。',
  ], [
    { text: '问她最喜欢和最难熬的各一门课。', effect: { autonomy: 6, subjects: { english: 3 }, mood: 7 } , result: '你得到两个不在宣传册上的答案。它们并不负责劝你来，却更接近你需要知道的生活。' },
    { text: '和苏晓记录各自想尝试的普通一天。', effect: { mood: 10, autonomy: 5, relations: { su: 6 } }, result: '你们的未来清单里，多了一次社团排练和一顿自己做的饭。远方终于没有那么抽象。' },
  ]),
  story('workshop-fail', '工作坊里的半成品', 'university', 'workshop-hall', 'zhou', [
    '体验工作坊快结束了，你们的装置还没亮。隔壁组已经开始合影，周野看着桌上的半成品，有点不好意思。',
    '大学志愿者拿来万用表：“还没做出来，也可以问问题。这不是一张必须交满分答案的考卷。”',
  ], [
    { text: '问清一个故障，把过程带回去继续试。', effect: { subjects: { physics: 5, math: 3 }, autonomy: 5, relations: { zhou: 5 } }, result: '你们带走了一张电路草图，没有成功照片。好奇却没有在活动结束时一起断电。' },
    { text: '观察其他组的方法，交换各自踩过的坑。', effect: { mood: 11, autonomy: 4, subjects: { physics: 3 }, relations: { zhou: 6 } }, result: '谁都不是一次成功的。半成品被放到桌子中间，变成了大家可以一起思考的东西。' },
  ], 12),

  story('home-fruit', '切好的水果与没发出的消息', 'home', 'family', 'mom', [
    '妈妈把水果放在桌上，手机停在家长群的输入框。她想问怎么让孩子更自律，又删掉，改成“最近都睡得好吗”。',
    '你坐在她旁边看见了这一幕。也许有些改变，最先发生在没人看见的删除键上。',
  ], [
    { text: '和她分一半水果，说说今晚的打算。', effect: { energy: 10, mood: 9, relations: { mom: 6 } }, result: '她没有把计划检查一遍。只是说，困了就睡，水果明天也还会有。' },
    { text: '谢谢她问睡眠，也问问她最近累不累。', effect: { autonomy: 4, relations: { mom: 8 }, stress: -7 } , result: '手机屏幕暗下来。你们终于有了一次双方都能说“有点累”的谈话。' },
  ]),
  story('desk-empty', '计划表上故意空着的一格', 'home', 'desk', 'su', [
    '你把下周的计划写满了，又想起苏晓在电话里说，她每周都会留一格“不安排”。',
    '“空白不是没有发生。”她说，“也许只是让没预料到的生活，有地方坐下。”',
  ], [
    { text: '擦去一项重复刷题，写上自由时间。', effect: { autonomy: 6, stress: -9, mood: 8 } , result: '那一格还不知道要做什么。你第一次没有因为不知道，就急着把它塞满。' },
    { text: '保留重点学习，也认真写下一次休息。', effect: { energy: 15, health: 4, stress: -7 } , result: '“休息”有了和“数学”一样清楚的字。计划终于开始同时照顾努力和努力的人。' },
  ], 8),
  story('wall-shadow', '城墙的影子，不止照过一代人', 'city', 'wall', 'zhou', [
    '你们沿城墙走，碰到一个带孙子散步的老人。孩子问古人是不是也要考试，老人笑着说，当然也有，但人并不只有考试。',
    '周野看了看手机里的倒计时，第一次把屏幕按灭了。城墙的影子很长，你们还能再走一段。',
  ], [
    { text: '听老人讲完，再聊聊自己想过的生活。', effect: { mood: 14, autonomy: 5, relations: { zhou: 6 } }, result: '未来依然不知道会怎样。但你们不再把一个倒计时，当成全部时间的主人。' },
    { text: '安静走完这段路，让脑子暂时休息。', effect: { energy: 12, stress: -12, health: 3 } , result: '没有新知识点的一段路，也让你带回了一点继续向前的力气。' },
  ], 8),
  story('canteen-thanks', '食堂窗口外的一封感谢信', 'campus', 'canteen', 'teacher', [
    '优秀学生评选要求交一份感谢老师的作文。食堂阿姨看到通知，笑着说她不懂教书，只懂面要煮到什么程度。',
    '老陈说，陪大家长大的人，不一定都站在讲台上。你想起她每次提醒你别只吃馒头。',
  ], [
    { text: '写一封信给食堂阿姨，认真说说她的帮助。', effect: { autonomy: 6, mood: 11, subjects: { chinese: 3 } }, result: '信没有提交评选，被贴在灶台旁边。阿姨仔细读完，说今天这锅面要多加一点青菜。' },
    { text: '吃完饭主动收好餐盘，当面说谢谢。', effect: { mood: 9, health: 3, relations: { teacher: 4 } }, result: '没有合影，也没有登记一次美德。谢谢确实被她听见了，这就足够。' },
  ]),
];
