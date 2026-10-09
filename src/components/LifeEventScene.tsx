import GameIcon from './GameIcon';
import { asset } from '../utils/asset';
import type { IconName } from '../game/types';

const scenes: Record<string, { image: string; speaker: string; line: string; detail: string; icon: IconName }> = {
  welcome: { image:'station',icon:'train',speaker:'你',line:'我已经走出校门，可为什么还是要一遍遍证明自己？',detail:'车票、缴费单和第一份日程放在同一个文件袋里。未来还没有发生，支付与排队已经开始。' },
  internship: { image:'work',icon:'briefcase',speaker:'实习同伴',line:'如果报酬可以以后再谈，工时为什么不能以后再交？',detail:'办公区的灯一盏盏暗下来，留下的人开始把今晚的任务复制到明早。表格有截止日期，承诺没有。' },
  gpa: { image:'dorm',icon:'book',speaker:'许宁',line:'他生病了，不是把我们的排名拿去浪费了。',detail:'寝室里一边亮着作业窗口，一边放着药盒。大家担心小组分数，却没有谁先问过，他今晚能不能睡着。' },
  authorship: { image:'dorm',icon:'lab',speaker:'项目同学',line:'资料是我整理的，可成果表上没有我的位置。',detail:'你翻出那些深夜修改的文件。版本号在增长，真正做过什么的人却在汇报中变得越来越模糊。' },
  tuition: { image:'dorm',icon:'letter',speaker:'许宁',line:'我可以需要帮助，也可以不愿意公开家里所有的事情。',detail:'台灯下的申请表要求把难处写清。难处并不总能装进一个空格，填写的人却要为每一行负责。' },
  'school-filter': { image:'work',icon:'briefcase',speaker:'招聘队伍里的人',line:'我的项目还没被点开，学校那一栏已经替我回答完了。',detail:'队伍慢慢向前，后台筛选只需要一瞬间。有些人还没说到自己的能力，就已经被推到了另一条队伍。' },
  overtime: { image:'work',icon:'clock',speaker:'罗姐',line:'他说自愿的时候，没有问我家里的晚饭怎么办。',detail:'同事把手机翻过去，又看了一眼时间。会议室的门可以出去，离开的代价却没有写在加班表上。' },
  rent: { image:'home',icon:'home',speaker:'合租室友',line:'如果市场决定了一切，为什么只决定我们多付钱？',detail:'续租通知躺在饭桌旁。通勤、维修和押金还没理清，下一份价格已经要求你作出答复。' },
  'insurance-wording': { image:'clinic',icon:'shield',speaker:'周姨',line:'我记得买的时候说都能保障，现在每一页又都在解释不一定。',detail:'票据装在透明文件袋里，你们按日期一张张排开。每一个被解释为条件的地方，都对应一个人已经付出的生活。' },
  'salary-delay': { image:'work',icon:'coin',speaker:'罗姐',line:'房租也能告诉房东，钱还在流程里吗？',detail:'财务回复的日期不断往后移动。大家把实际出勤、承诺与到账时间分别记下来，不能把应收当作已经可以吃饭的现金。' },
  layoff: { image:'work',icon:'briefcase',speaker:'被通知离开的同事',line:'昨天还说像一家人，今天就只剩下成本了。',detail:'纸箱还没有装满，门禁权限已经变化。你们核对留下的劳动与应有的结算，不把一份通知当成对整个人的评判。' },
  'delivery-clock': { image:'station',icon:'train',speaker:'配送同伴',line:'那个倒计时里，好像没有一个真实会等红灯的人。',detail:'路口的灯亮着，提示音继续催促。迟到的扣分很具体，安全的价值却不该等到事故以后再被看见。' },
  'family-labor': { image:'home',icon:'home',speaker:'伴侣',line:'我也愿意照顾家里，但我不该因为先看见，就永远负责。',detail:'采购、预约、清理和提醒都挤在饭后。需要讨论的不只有谁动手，还有谁一直记得这些事。' },
  bill: { image:'clinic',icon:'medical',speaker:'周姨',line:'病治了，可醒来以后，又开始担心下一张单子。',detail:'医院出口就在几步之外，分期和援助的流程却还没有走完。生活不会因为一纸出院通知自动恢复支付能力。' },
  quiet: { image:'home',icon:'food',speaker:'老朋友',line:'今天不用证明过得很好，吃完饭再慢慢说。',detail:'菜不贵，桌子也不大。你们没有交换排名和成就，只是把这一天真实发生过的事情放到彼此面前。' },
  retirement: { image:'station',icon:'clock',speaker:'老同事',line:'我不用再赶车了，可闹钟还是每天把我叫醒。',detail:'旧工牌在抽屉里，缴费记录在文件袋里。你们慢慢核对保障，也慢慢学习怎样不把每个上午都填满。' },
  'school-pressure': { image:'dorm',icon:'book',speaker:'同学',line:'好像只要坐得不够久，休息就会变成一项错误。',detail:'窗外的天已经黑了。学习是必要的，身体却不该被当作可以无限压缩的课表空隙。' },
  burnout: { image:'work',icon:'energy',speaker:'罗姐',line:'一直说忍过这一周，可每次下一周都长得差不多。',detail:'屏幕上的工作还没结束，身体先给出了自己的期限。额外收入与长期负荷，需要放在同一张账上计算。' },
  'child-school': { image:'home',icon:'school',speaker:'家人',line:'我们是不是又在把当年的那张排名表，交给一个更小的人？',detail:'教育材料和家庭账单放在一起。你们希望孩子有机会，也不想让希望只剩下更昂贵的一种竞争。' },
  'pregnancy-cost': { image:'clinic',icon:'home',speaker:'伴侣',line:'我们可以期待新的生活，也要把照护和费用具体安排好。',detail:'预约、检查和工作日程开始互相占用。共同决定之后，日常责任也需要共同被看见。' },
  'review-wait': { image:'clinic',icon:'calendar',speaker:'周姨',line:'等到不忙了再来，我怕就一直等下去了。',detail:'复查时间与排班重叠。你把症状、误工和交通记下来，让身体的需要不再只靠临时忍耐维持。' },
  'generation-welcome': { image:'station',icon:'journal',speaker:'你',line:'这是我自己的时间。我会带着留下的记录，重新认识它。',detail:'上一代的经历没有替你安排好答案。身体、学习与家庭记录被保留下来，而新的关系需要从头认真建立。' },
};
export default function LifeEventScene({ id, text }: { id: string; text: string }) {
  const scene = scenes[id] ?? scenes.quiet;
  return <div className="life-event-scene"><img src={asset(`images/story-${scene.image}-v3.2.webp`)} alt="人生事件插画"/><div><p>{text}</p><p>{scene.detail}</p><blockquote><GameIcon name={scene.icon} size={38}/><span><small>{scene.speaker}</small>「{scene.line}」</span></blockquote></div></div>;
}
