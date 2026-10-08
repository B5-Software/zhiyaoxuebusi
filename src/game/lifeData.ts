import type { AtlasId, DiseaseId, LifePanel } from './lifeTypes';
export const LIFE_ATLASES = [{ id: 'school', name: '高中', image: 'world-map' }, { id: 'university', name: '大学', image: 'university-world' }, { id: 'society', name: '社会', image: 'society-world' }] as const;
export interface LifeRegion { id: string; atlas: AtlasId; name: string; description: string; image: string; x: number; y: number; places: { name: string; panel?: LifePanel; action?: string; game?: string }[] }
export const LIFE_REGIONS: LifeRegion[] = [
  { id: 'college-study', atlas: 'university', name: '教学与图书馆', description: '从统一课表到绩点排名，标准答案仍在追赶生活。', image: 'map-college-study', x: 45, y: 35, places: [{ name: '资料室自习', action: 'skill' }, { name: '专业课程', action: 'course' }, { name: '逻辑实验课', game: 'logic' }] },
  { id: 'college-dorm', atlas: 'university', name: '宿舍与食堂', description: '床位、饭卡、助学申请。成年不等于已经有能力支付生活。', image: 'map-college-dorm', x: 22, y: 64, places: [{ name: '宿舍补眠', action: 'rest' }, { name: '食堂规律吃饭', action: 'meal' }, { name: '学生账本', panel: 'overview' }] },
  { id: 'college-research', atlas: 'university', name: '科研与实习', description: '成果署名、免费实习和被包装成机会的劳动。', image: 'map-college-research', x: 72, y: 33, places: [{ name: '项目实践', action: 'skill' }, { name: '实习招聘', panel: 'work' }, { name: '面试训练室', game: 'interview' }] },
  { id: 'college-life', atlas: 'university', name: '湖畔与文体', description: '有人教你竞争，也有人陪你把自己的声音找回来。', image: 'map-college-life', x: 68, y: 72, places: [{ name: '慢跑与拉伸', action: 'exercise' }, { name: '湖边约会', action: 'date' }, { name: '社团记忆挑战', game: 'memory' }] },
  { id: 'recruitment', atlas: 'society', name: '人才市场', description: '先筛学校，再看经验，最后问你能不能接受加班。', image: 'map-recruitment', x: 20, y: 30, places: [{ name: '招聘大厅', panel: 'work' }, { name: '互动面试', game: 'interview' }, { name: '简历与技能', action: 'skill' }] },
  { id: 'workplace', atlas: 'society', name: '工作街区', description: '工牌可以买来工资，却买不到一整天属于自己的时间。', image: 'map-workplace', x: 22, y: 58, places: [{ name: '去上班', action: 'work' }, { name: '劳动合同', panel: 'work' }, { name: '同事互助', action: 'social' }] },
  { id: 'exchange', atlas: 'society', name: '交易所', description: '收益写在大屏幕上，风险藏在最小的一行字里。全部为游戏虚拟资金。', image: 'map-exchange', x: 48, y: 28, places: [{ name: '股票大厅', panel: 'finance' }, { name: 'Crypto 现货与合约', panel: 'finance' }, { name: 'Uniswap 流动性池', panel: 'finance' }] },
  { id: 'hospital', atlas: 'society', name: '医院', description: '门诊、化验、影像与病理。急救先救人，账单留在醒来之后。', image: 'map-hospital', x: 78, y: 27, places: [{ name: '挂号与化验', panel: 'health' }, { name: '影像与病理', panel: 'health' }, { name: '住院与急救', panel: 'health' }] },
  { id: 'insurance', atlas: 'society', name: '保险与办事大厅', description: '等待期、起付线与除外条款，窗口解释一遍，人就要学会一遍。', image: 'map-insurance', x: 79, y: 52, places: [{ name: '医保登记', panel: 'health' }, { name: '商业保险柜台', panel: 'health' }, { name: '收支与债务', panel: 'overview' }] },
  { id: 'nightlife', atlas: 'society', name: '夜生活街区', description: '游戏厅、网吧和 KTV，允许一天的疲惫暂时没有意义。', image: 'map-nightlife', x: 72, y: 77, places: [{ name: '游戏厅 · 翻牌', game: 'memory' }, { name: '网吧 · 逻辑闯关', game: 'logic' }, { name: 'KTV · 节奏练习', game: 'rhythm' }, { name: '预算挑战', game: 'budget' }] },
  { id: 'residence', atlas: 'society', name: '住宅与生活', description: '房租、菜价和小小的餐桌。一家人的生活不是一张合照。', image: 'map-residence', x: 38, y: 80, places: [{ name: '家人与伴侣', panel: 'family' }, { name: '菜市场', action: 'meal' }, { name: '家中休息', action: 'rest' }, { name: '租住与家庭账单', panel: 'overview' }] },
];
export const LIFE_ACTIONS: Record<string, { name: string; energy: number; stress: number; mood: number; price: number; hint: string }> = {
  rest: { name: '认真休息', energy: 35, stress: -14, mood: 5, price: 0, hint: '改善睡眠，给长期疲劳留出恢复时间。' },
  meal: { name: '规律吃饭', energy: 16, stress: -4, mood: 3, price: 18, hint: '改善饮食习惯；一次吃饭不能抹去长期风险。' },
  exercise: { name: '运动与拉伸', energy: -10, stress: -10, mood: 8, price: 0, hint: '改善活动习惯和心肺状态。' },
  course: { name: '完成本周课程', energy: -20, stress: 9, mood: -1, price: 0, hint: '每周一次，学分 +1，技能 +0.5；本科需 160 学分、208 周。' },
  skill: { name: '练习专业技能', energy: -16, stress: 4, mood: 2, price: 0, hint: '专业与实践技能 +2，不能替代学历门槛。' },
  social: { name: '和朋友互相支持', energy: -5, stress: -9, mood: 12, price: 12, hint: '交流与沟通技能 +2。' },
  work: { name: '完成本周排班', energy: -28, stress: 14, mood: -4, price: 0, hint: '占 1 次关键行动，代表整周工时；工资周末结算。' },
  date: { name: '和恋人约会', energy: -8, stress: -10, mood: 13, price: 60, hint: '双方同意的相处，关系升温。' },
  care: { name: '分担照护与家务', energy: -12, stress: -3, mood: 6, price: 0, hint: '照护不是自然落在一个人身上的义务。' },
};
export const JOBS = [
  { id: 'shop', name: '便利店店员', wage: 720, hours: 48, degree: false, skill: 0, prestige: 0, cost: 22, stress: 11, interview: 35 },
  { id: 'delivery', name: '配送骑手', wage: 1000, hours: 60, degree: false, skill: 8, prestige: 0, cost: 34, stress: 18, interview: 35 },
  { id: 'factory', name: '流水线操作员', wage: 950, hours: 60, degree: false, skill: 10, prestige: 0, cost: 33, stress: 17, interview: 40 },
  { id: 'assistant', name: '行政助理', wage: 1000, hours: 44, degree: true, skill: 15, prestige: 0, cost: 24, stress: 12, interview: 50 },
  { id: 'developer', name: '软件开发', wage: 2300, hours: 52, degree: true, skill: 50, prestige: 0, cost: 28, stress: 20, interview: 65 },
  { id: 'research', name: '研发助理', wage: 1900, hours: 48, degree: true, skill: 40, prestige: 70, cost: 25, stress: 16, interview: 70 },
  { id: 'caregiver', name: '护理陪护', wage: 1150, hours: 56, degree: false, skill: 20, prestige: 0, cost: 30, stress: 15, interview: 50 },
  { id: 'tutor', name: '课后助教', wage: 850, hours: 24, degree: false, skill: 25, prestige: 0, cost: 17, stress: 10, interview: 55 },
] as const;
export const DISEASES: Record<DiseaseId, { name: string; acute: boolean; system: string; symptom: string; tests: string[]; treatment: number }> = {
  diabetes: { name: 'II型糖尿病', acute: false, system: 'metabolic', symptom: '持续口渴、尿频或疲乏，需要检查血糖', tests: ['blood', 'glucose'], treatment: 380 },
  hemorrhage: { name: '脑出血', acute: true, system: 'vascular', symptom: '突然剧烈头痛、意识改变', tests: ['scan'], treatment: 62000 },
  sudden: { name: '心搏骤停 / 猝死风险', acute: true, system: 'cardiac', symptom: '突然失去意识，需要立即急救', tests: ['cardio'], treatment: 48000 },
  stroke: { name: '卒中', acute: true, system: 'vascular', symptom: '突然单侧无力或说话困难', tests: ['scan'], treatment: 45000 },
  scoliosis: { name: '脊柱侧弯', acute: false, system: 'skeletal', symptom: '肩背不对称或背部不适，姿势不良不能单独解释侧弯', tests: ['posture', 'scan'], treatment: 3500 },
  infarction: { name: '心肌梗死', acute: true, system: 'cardiac', symptom: '突发持续胸部不适、冷汗或呼吸困难', tests: ['cardio'], treatment: 55000 },
  mitral: { name: '二尖瓣反流', acute: false, system: 'cardiac', symptom: '活动时气短或心悸，需要心脏评估', tests: ['echo'], treatment: 6500 },
  kidneyCancer: { name: '肾癌', acute: false, system: 'renal', symptom: '血尿或持续腰部不适，不等于已经确诊', tests: ['scan', 'biopsy'], treatment: 76000 },
  lungCancer: { name: '肺癌', acute: false, system: 'respiratory', symptom: '持续咳嗽、咳血或呼吸不适', tests: ['scan', 'biopsy'], treatment: 88000 },
  ovarianCancer: { name: '卵巢癌', acute: false, system: 'renal', symptom: '持续腹胀或盆腹部不适', tests: ['scan', 'biopsy'], treatment: 82000 },
  aml: { name: 'AML（急性髓系白血病）', acute: false, system: 'marrow', symptom: '不明原因发热、易淤青与明显疲劳', tests: ['blood', 'marrow'], treatment: 110000 },
  all: { name: 'ALL（急性淋巴细胞白血病）', acute: false, system: 'marrow', symptom: '反复感染、淤青或骨痛', tests: ['blood', 'marrow'], treatment: 115000 },
};
export const MEDICAL_TESTS = [
  { id: 'blood', name: '血常规与基础化验', price: 280, hint: '造血与代谢线索；异常仍需进一步检查。' },
  { id: 'glucose', name: '血糖与糖化血红蛋白', price: 360, hint: '评估持续代谢异常。' },
  { id: 'cardio', name: '血压 / 心电与心脏评估', price: 520, hint: '循环和心脏检查；不能保证未来没有急症。' },
  { id: 'posture', name: '骨骼与脊柱评估', price: 260, hint: '查体发现线索，需要时进一步拍片。' },
  { id: 'echo', name: '心脏超声', price: 860, hint: '瓣膜结构与功能评估。' },
  { id: 'scan', name: '按指征影像检查', price: 2200, hint: '需要症状或异常线索；影像不能代替病理诊断。' },
  { id: 'biopsy', name: '病理活检确认', price: 4800, hint: '仅在影像发现待查病灶后开放。' },
  { id: 'marrow', name: '骨髓与分型检查', price: 6200, hint: '仅在血常规提示异常后开放。' },
] as const;
export const ASSETS = [{ id: 'stock-school', name: '学途教育 · 虚构股票', price: 30, volatility: .055 }, { id: 'stock-city', name: '城桥生活 · 虚构股票', price: 65, volatility: .035 }, { id: 'BTC', name: 'BTC · 模拟', price: 480000, volatility: .13 }, { id: 'ETH', name: 'ETH · 模拟', price: 18000, volatility: .16 }] as const;
export const MINI_GAMES = [{ id: 'memory', name: '记忆翻牌', price: 8, description: '找出六对相同符号，失误会降低评分。' }, { id: 'logic', name: '逻辑解题', price: 5, description: '五道规律题，逐题作答。' }, { id: 'rhythm', name: '节奏练习', price: 15, description: '等标记进入绿色区，点击或按空格；共八拍。' }, { id: 'budget', name: '一周预算', price: 0, description: '有限预算先分配必需支出，再留应急金。' }, { id: 'interview', name: '互动面试', price: 0, description: '在五种工作情境中选择；本周成绩用于求职。' }] as const;
export const LIFE_EVENTS = [
  { id: 'welcome', title: '围墙以外，仍有围墙', text: '毕业通知说未来无限。缴费单、租赁合同与招聘表却先问：你能付出多少？', choices: ['先整理自己的预算', '找人聊聊这份不安'], stage: 'any' },
  { id: 'internship', title: '用热爱抵扣工资', text: '实习招聘写着“成长机会”，面试官说津贴可以以后再谈。劳动不是因为年轻就不值钱。', choices: ['索要明确的薪酬合同', '接受短期试岗，记下工时'], stage: 'university' },
  { id: 'gpa', title: '绩点小数点后的竞争', text: '一位同学病了，群里却在讨论这会不会拉低小组成绩。评价把人变成了互相防备的数字。', choices: ['重新分担小组任务', '先守住自己的截止时间'], stage: 'university' },
  { id: 'authorship', title: '署名名单没有你', text: '你做了大半的整理工作，成果汇报的名单却按照头衔排列。', choices: ['留存工作记录，提出署名要求', '退出后续无偿工作'], stage: 'university' },
  { id: 'tuition', title: '助学申请的证明', text: '窗口让你证明生活有多难，却没有给你证明自己的体面留位置。', choices: ['申请助学补贴', '陪另一位同学一起办理'], stage: 'university' },
  { id: 'school-filter', title: '简历还没有被打开', text: '招聘系统先把学校分了档。能力需要解释，学校名称却只用一秒钟。', choices: ['继续投递其他岗位', '把项目经验整理出来'], stage: 'society' },
  { id: 'overtime', title: '自愿加班的表格', text: '没有人强迫你签字，主管只是站在旁边等待。合同写着八小时，群消息却在午夜响起。', choices: ['拒绝额外排班，保存记录', '这次留下，安排补休'], stage: 'any' },
  { id: 'rent', title: '房租涨了，工资没涨', text: '房东说这是市场决定。你的生活只好在市场决定以后重新计算。', choices: ['协商并寻找合租', '保留原住处，支付这次差额'], stage: 'any' },
  { id: 'insurance-wording', title: '第十七页的除外条款', text: '宣传说“全方位保障”，理赔却把那四个字拆成一串条件。你决定把条款一条条读完。', choices: ['整理病历和票据申诉', '请朋友帮助核对条款'], stage: 'any' },
  { id: 'salary-delay', title: '工资还在流程里', text: '房租有截止日，工资却只有“尽快”。公司的流程不能替你吃饭。', choices: ['书面追索，留下证据', '和同事一起核对欠薪'], stage: 'society' },
  { id: 'layoff', title: '优化是一个没有主语的词', text: '通知把离开称为调整，把同事称为成本。被裁掉的不只是工位，还有原先安排好的一整段生活。', choices: ['核对结算，重新找工作', '先休整，再整理履历'], stage: 'society' },
  { id: 'delivery-clock', title: '倒计时不认识红灯', text: '平台催促送达，路口却需要等待。一个人的安全，不能被五颗星抵押。', choices: ['遵守交通规则，接受延误', '申诉不合理的配送时间'], stage: 'society' },
  { id: 'family-labor', title: '谁的时间可以被拿走', text: '照护孩子的排班表是空白的。家务如果不被讨论，总会落到那个最不忍心拒绝的人身上。', choices: ['重新安排共同照护', '申请托育，重新算账'], stage: 'any' },
  { id: 'bill', title: '出院之后的清单', text: '治疗保住了生命，账单却要求你为未来重新签一份分期。健康不能只有支付能力一种入口。', choices: ['申请分期与援助', '核对费用与报销'], stage: 'any' },
  { id: 'quiet', title: '没有绩效的一顿晚饭', text: '晚饭没有提升任何排名。朋友来敲门，你们都没有把今天过得足够优秀，却依然值得坐下来。', choices: ['留一点时间给彼此', '吃完早点休息'], stage: 'any' },
  { id: 'retirement', title: '终于不再打卡', text: '退休不是停止生活。离开绩效表以后，你慢慢学习怎样把时间重新说成“我的”。', choices: ['整理走过的日子', '去看看孩子和老朋友'], stage: 'society' },
] as const;
