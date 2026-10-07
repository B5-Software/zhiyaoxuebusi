import type { CharacterId, Choice, Scene, StoryEvent } from './types';

function episode(id: string, title: string, period: number, speaker: CharacterId, scene: Scene, paragraphs: string[], choices: Choice[]): StoryEvent {
  return { id, title, minWeek: period * 8, maxWeek: period * 8 + 7, chapter: ['九月 · 看见彼此', '深秋 · 生活的背面', '冬天 · 慢慢靠近', '春天 · 把选择还给自己', '盛夏 · 还有很多以后'][period], speaker, scene, paragraphs, choices };
}

export const EXTENDED_EVENTS: StoryEvent[] = [
  episode('growth-algorithm', '成长报告里的省略号', 0, 'teacher', 'campus', ['学校上线成长报告，每个人都有一张雷达图。报告把心情写成“待优化”，把爱发呆写成“时间利用不足”。', '老陈把屏幕关了：“报告里没写你会扶人、会给朋友留座位。这些也不是省略号。”'], [
    { text: '给自己的报告添一栏：这周认真生活的事。', effect: { autonomy: 6, mood: 8 }, result: '你写了给妈妈留的一碗汤。图表没法自动评分，你却知道它发生过。' },
    { text: '拿报告查薄弱知识，把其他标签暂时放下。', effect: { subjects: { math: 4 }, stress: -4, relations: { teacher: 3 } }, result: '工具用来帮你发现问题，没有被允许替你定义整个人。' },
  ]),
  episode('first-sketch', '第一次叫出你的名字', 0, 'zhixia', 'arts', ['许知夏在画室门口叫住你，声音比窗外的风小一点。她想借你坐过的那把椅子画一张静物。', '你起身时，她又补了一句：“其实，也想画画有人坐在这里的样子。”'], [
    { text: '我可以坐一会儿，你慢慢画。', effect: { mood: 10, relations: { zhixia: 7 }, bonds: { zhixia: { affection: 4, understanding: 5 } } }, result: '她不再急着擦掉每一条线。你的名字，被写在画纸背面。' },
    { text: '先听听她为什么喜欢这个角落。', effect: { autonomy: 3, relations: { zhixia: 6 }, bonds: { zhixia: { understanding: 7 } } }, result: '她讲起这里的光不催任何人。你们第一次聊了比借椅子更长的话。' },
  ]),
  episode('slow-answer', '抢答之外的三秒', 0, 'xinghe', 'laboratory', ['实验课要求抢答，顾星河明明想到了，却总在举手前多想三秒。答题统计把他记成“参与度低”。', '他说：“我只是想确定一下，不是没在想。”'], [
    { text: '提议先写答案，再让每个人解释。', effect: { autonomy: 5, relations: { xinghe: 7 }, subjects: { physics: 3 } }, result: '纸上有了更多种思路。那三秒没有消失，只是终于被允许存在。' },
    { text: '课后问他刚才想到的办法。', effect: { mood: 7, relations: { xinghe: 6 }, bonds: { xinghe: { understanding: 6 } } }, result: '他把本子转向你。没有抢到的一次发言，还是找到了愿意听的人。' },
  ]),
  episode('radio-name', '播音名单里不该有名次', 0, 'tangtang', 'arts', ['广播站招新把月考排名设成第一道筛选。唐棠拿着报名表：“有些同学说话特别有意思，但名字没能进这一页。”', '她想做一次匿名试听，让大家先听声音。'], [
    { text: '帮她组织匿名试听。', effect: { autonomy: 6, relations: { tangtang: 7 }, subjects: { chinese: 3 } }, result: '一段温柔的朗读来自平时不被叫到的同学。大家第一次在不知道排名时认真鼓掌。' },
    { text: '写一份建议，说明广播需要哪些实际能力。', effect: { autonomy: 5, relations: { tangtang: 5 }, subjects: { chinese: 4 } }, result: '筛选表多了朗读、倾听和合作。标准没有消失，但开始更像它要选的那件事。' },
  ]),
  episode('borrowed-weekend', '借走又还回来的周末', 1, 'mom', 'home', ['亲戚送来一份填得密密麻麻的周末课程表。妈妈看了很久，问你要不要试一试，语气里有担心，也有犹豫。', '你知道她怕你错过什么，也知道自己已经很累。'], [
    { text: '一起挑真正需要的一项，把休息也列上。', effect: { autonomy: 6, stress: -8, relations: { mom: 6 } }, result: '课程表变短了。不是所有别人给的安排，都需要变成你自己的生活。' },
    { text: '先用自己的方法学一周，再一起看效果。', effect: { autonomy: 8, relations: { mom: 4 }, subjects: { math: 3 } }, result: '你们约好了复盘时间。这次谈论的是方法，不是谁更懂事。' },
  ]),
  episode('portrait-permission', '画你之前先问一句', 1, 'zhixia', 'arts', ['社团想把许知夏画的人像用作宣传图。她问到被画的同学时，对方说不太想公开。负责人觉得没必要这么麻烦。', '知夏把画收起来：“喜欢一张画，也不能越过画里那个真实的人。”'], [
    { text: '支持她，另画一张得到同意的作品。', effect: { autonomy: 7, relations: { zhixia: 8 }, bonds: { zhixia: { trust: 6, understanding: 5 } } }, result: '作品换了一张，尊重留下来了。她说，和你一起做决定时很安心。' },
    { text: '帮她向负责人解释授权和感受。', effect: { autonomy: 6, subjects: { chinese: 4 }, relations: { zhixia: 6 } }, result: '最后宣传用了一张校园静物。事情照样完成，也没有谁被替别人决定。' },
  ]),
  episode('lab-copy', '共享答案还是共享思路', 1, 'xinghe', 'laboratory', ['同学向顾星河要实验报告，他想帮助，又担心整份照抄。大家说，朋友就不该这么小气。', '他问你：“不直接给答案，会不会显得我不够好？”'], [
    { text: '陪他讲思路，允许每个人完成自己的报告。', effect: { relations: { xinghe: 7 }, autonomy: 5, subjects: { physics: 4 } }, result: '你们分享了方法，没有替别人签好结论。帮助不再等于把自己的边界拿走。' },
    { text: '做一张常见问题卡片，放在实验台旁。', effect: { subjects: { physics: 5 }, relations: { xinghe: 5 }, mood: 6 }, result: '后来有人带着新的问题回来。分享开始长出真实的讨论。' },
  ]),
  episode('smile-duty', '笑容也有下班时间', 1, 'tangtang', 'market', ['夜市上，唐棠终于不再负责活跃气氛。朋友问她怎么不开心，她赶紧笑起来，又很快累了。', '“我今天只想普通一点。”她说完，看了你一眼。'], [
    { text: '不用逗大家笑，安静吃饭也可以。', effect: { mood: 9, relations: { tangtang: 8 }, bonds: { tangtang: { understanding: 6, affection: 3 } } }, result: '她把肩膀放松下来。今天没发生什么精彩的事，但她记住了可以不表演的这一刻。' },
    { text: '带她去听一首歌，不安排别的节目。', effect: { stress: -9, relations: { tangtang: 6 }, mood: 8 }, result: '她只负责当听众。歌唱完以后，笑容是自己回来的。' },
  ]),
  episode('winter-group', '群聊里被允许的晚回复', 2, 'su', 'library', ['复习群要求看到消息后立刻回复，夜里十一点也有人统计未响应名单。苏晓因为睡着没有回，被提醒要有集体意识。', '她翻着手机：“如果一直在线才算认真，休息到底什么时候才能开始？”'], [
    { text: '提议设一个安静时段，紧急消息另行说明。', effect: { autonomy: 7, health: 3, relations: { su: 6 } }, result: '群公告多了休息时间。已读不再被拿来审判每个人睡着的一晚。' },
    { text: '先关掉提醒，把今晚的睡眠保护好。', effect: { energy: 16, stress: -9, relations: { su: 4 } }, result: '屏幕暗下来。你们不需要整晚守着一盏别人可以随时按亮的灯。' },
  ]),
  episode('same-scarf', '借来的围巾与说出口的关心', 2, 'zhou', 'park', ['周野把围巾递给你，又装作只是带了多余的一条。河边的风一吹，他才发现自己脖子上只剩衣领。', '“行吧，没那么多余。”他笑了笑，“就是怕你冷。”'], [
    { text: '谢谢你，也一起回到暖和的地方。', effect: { mood: 11, relations: { zhou: 8 }, bonds: { zhou: { affection: 4, understanding: 4 } } }, result: '你们去买热饮。关心不用通过一个人挨冻，才能被另一个人看见。' },
    { text: '把围巾还给他，约好下次都记得多穿。', effect: { health: 4, relations: { zhou: 6 }, mood: 8 }, result: '他没有失落，反而笑得更轻松。被照顾的人，也可以认真照顾回来。' },
  ]),
  episode('unfinished-canvas', '没画完也能算一幅画', 2, 'zhixia', 'arts', ['冬天的画室里，知夏拿出一张留了大片空白的画。她总觉得必须填满，才配说自己完成了。', '你注意到那片空白刚好让窗边的光停下来。'], [
    { text: '问她想留下的东西，而不是还缺什么。', effect: { autonomy: 4, relations: { zhixia: 8 }, bonds: { zhixia: { understanding: 6 } } }, result: '她第一次给这张画写上日期。完成也许可以由画的人决定。' },
    { text: '陪她一起看一会儿，不急着给建议。', effect: { stress: -8, mood: 9, relations: { zhixia: 6 } }, result: '没有立刻出现更好的答案。只是她不再一个人坐在“还不够”的声音里。' },
  ]),
  episode('honest-score', '老师也有不会的那一道', 2, 'teacher', 'campus', ['老陈讲到一道题，算到一半发现条件有问题。他停下来改黑板，有同学低声说老师也会错。', '“会。”他回答，“所以你们更要学会检查，而不是只看是谁讲的。”'], [
    { text: '和大家一起检查题目，把错误过程也记下。', effect: { subjects: { math: 5 }, autonomy: 4, relations: { teacher: 5 } }, result: '笔记里多了一个被纠正的过程。权威没有因此消失，好奇却不用站在它后面。' },
    { text: '课后请教怎样发现条件不完整。', effect: { subjects: { physics: 4, math: 3 }, relations: { teacher: 6 } }, result: '老陈讲得比平时慢。你学到的，不只是最后那一行答案。' },
  ]),
  episode('spring-invitation', '邀请也可以被温柔地拒绝', 3, 'xinghe', 'laboratory', ['星河邀请你去观星，但你这周实在太累。他听你说完，第一句是：“那我们换个时间。”', '你以为还需要解释很多，他却已经收起了预约表。'], [
    { text: '谢谢他尊重，再认真约一个合适的时间。', effect: { mood: 10, relations: { xinghe: 8 }, bonds: { xinghe: { affection: 4, understanding: 5 } } }, result: '新的约定不再压在疲惫上。你开始明白，靠近也可以给人留下呼吸的空间。' },
    { text: '先不约日期，等自己状态好一点再联系。', effect: { autonomy: 6, energy: 12, relations: { xinghe: 5 } }, result: '他点头说好。没定日期，没有被翻译成不在乎。' },
  ]),
  episode('letter-envelope', '信封上的名字先不公开', 3, 'tangtang', 'arts', ['毕业广播征集给重要的人的信。唐棠收到几封没有署名的稿子，有人建议公开作者和收信人，收听率会更高。', '她把信封翻了过来：“写给谁，应该由写的人决定。”'], [
    { text: '陪她确认每位作者愿意公开的范围。', effect: { autonomy: 7, relations: { tangtang: 8 }, bonds: { tangtang: { trust: 6 } } }, result: '节目少了一点八卦，多了很多人敢认真写下的话。' },
    { text: '只读得到授权的段落，把原稿好好归还。', effect: { subjects: { chinese: 4 }, relations: { tangtang: 6 }, mood: 7 }, result: '有些话留在私人信里，也没有被辜负。你们让公开和重要不再绑在一起。' },
  ]),
  episode('spring-late', '比别人晚开的一朵花', 3, 'su', 'park', ['公园的花有些已经开了，有些还没有。苏晓说自己的计划也总比别人晚，好像每一件事都错过了最好的时候。', '你们坐在一棵还没开花的树下，枝条并没有因此停止生长。'], [
    { text: '一起写下正在发生的事，不只比较日期。', effect: { autonomy: 6, mood: 10, relations: { su: 7 } }, result: '清单里有最近读完的书，也有一次勇敢求助。你们其实一直在往前走。' },
    { text: '约好下周再来看它。', effect: { stress: -10, relations: { su: 8 }, bonds: { su: { affection: 3 } } }, result: '下周成了一个可以期待的时间，不再只是一场又该追上的考试。' },
  ]),
  episode('budget-meal', '一顿饭没有贫困体验环节', 3, 'zhou', 'market', ['班里要做“节约体验”，要求拍廉价午餐配感想。周野知道有同学平时就这样吃饭，怕镜头让他们难堪。', '“有些人的日常，”他说，“不该变成别人的体验作业。”'], [
    { text: '建议记录浪费和改进，别拍具体同学。', effect: { autonomy: 7, relations: { zhou: 6 }, mood: 7 }, result: '镜头对准了没吃完的公共餐盘，没有把任何人的生活拿来做样本。' },
    { text: '一起分享饭菜，先照顾眼前的人。', effect: { money: -8, energy: 16, relations: { zhou: 8 } }, result: '那顿饭没有附一篇被要求的感想。大家好好吃完了，这件事本身就有意义。' },
  ]),
  episode('summer-address', '毕业群不必每天证明友谊', 4, 'tangtang', 'arts', ['毕业群有人提出每天打卡，否则算“感情淡了”。唐棠想起那些会晚回复、却每次都认真说话的朋友。', '她问你：“能不能不把舍不得，变成另一份考勤表？”'], [
    { text: '约定有空时认真聊，也尊重新的生活。', effect: { autonomy: 7, relations: { tangtang: 8 }, stress: -8 }, result: '群公告删掉打卡要求，留下一个“随时欢迎回来”。联系终于不用靠惩罚缺席来维持。' },
    { text: '约一次具体见面，把期待写成日历。', effect: { mood: 13, relations: { tangtang: 7 } }, result: '一张日历，比每天证明没忘记彼此更让人安心。' },
  ]),
  episode('painting-gift', '一张画不负责证明你优秀', 4, 'zhixia', 'arts', ['知夏送你一张很小的画，没有画奖杯，画的是你坐在窗边喝水。她说，那一刻的你很安稳。', '你想到那些总用成绩介绍自己的时候，忽然觉得这张画有点珍贵。'], [
    { text: '谢谢她看见了成绩之外的我。', effect: { mood: 15, relations: { zhixia: 9 }, bonds: { zhixia: { affection: 5, understanding: 6 } } }, result: '画纸背面写着日期。一个普通的你，被一个认真看你的人好好留下。' },
    { text: '也给她写一张关于普通生活的感谢卡。', effect: { autonomy: 6, subjects: { chinese: 3 }, relations: { zhixia: 8 } }, result: '你写的不是获奖祝贺。她收下时，笑得比拿到优秀作品证书更放松。' },
  ]),
  episode('unfinished-map', '没有终点的星图', 4, 'xinghe', 'laboratory', ['星河整理观星记录，最后一页还空着。毕业以后大家会去不同的地方，他不知道该画哪一片天空。', '“那先留着。”他说，“以后有新的地方，再一起补。”'], [
    { text: '约好交换各自看到的天空。', effect: { mood: 13, relations: { xinghe: 9 }, bonds: { xinghe: { affection: 4 } } }, result: '未来没有被要求提前画完。你们给彼此留了一种可以继续说话的方式。' },
    { text: '把空白也保留在毕业记录里。', effect: { autonomy: 8, stress: -9, relations: { xinghe: 6 } }, result: '最后一页没有参考答案。它记录了你们还愿意继续好奇。' },
  ]),
  episode('last-key', '备用钥匙还在原来的地方', 4, 'mom', 'home', ['妈妈整理你的行李，一度想把每个抽屉都重新安排。最后她停下来，问你哪些东西想自己收。', '她把家里的备用钥匙递给你：“出门以后也记得，这里随时可以回来。”'], [
    { text: '一起收公共的东西，自己的物品自己决定。', effect: { autonomy: 8, relations: { mom: 8 }, mood: 11 }, result: '行李里有她的关心，也有你自己选择的空间。它们终于没有互相挤掉。' },
    { text: '谢谢她，约好到新地方后分享一件小事。', effect: { relations: { mom: 10 }, stress: -10, mood: 12 }, result: '约定不是每日汇报。只是让新的生活，和旧的家之间有一条温柔的线。' },
  ]),
];
