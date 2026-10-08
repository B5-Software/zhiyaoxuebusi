import type { GameState, Panel, Scene } from './types';

export const GUIDE_KEY = 'shiguang-guide-v1';
export interface GuideStep { title: string; text: string; targets: string[]; panel?: Panel | 'stage'; scene?: Scene; tab?: string; click?: 'world-map' | 'campus' | 'classroom' }
export interface GuideModule { id: string; title: string; description: string; steps: GuideStep[] }
const step = (title: string, text: string, targets: string[], panel?: GuideStep['panel']): GuideStep => ({ title, text, targets, panel });
export const GUIDE_MODULES: GuideModule[] = [
  { id: 'basics', title: '第一次校园漫步', description: '认识界面，亲手打开地图与教室', steps: [
    step('属于你的一年', '这段高三有 40 周，每周 3 次关键行动。指引只带你浏览界面，不会替你花钱、推进时间或完成行动。高亮以外暂时锁定；可以随时跳过。', ['.world'], null),
    step('先照顾好状态', '体力决定能做多少事，压力过高会影响状态。休息、运动、补给都能帮助恢复。点击状态条可在成长手册查看六科学力和个人信息。', ['.resources', '.student-sheet'], null),
    step('一周只有三个关键时刻', '学习、地点故事、赴约和任务投入通常各用 1 次行动。消息、送礼和浏览地图不消耗行动；用完后可互动的红点与任务标记会隐藏。', ['.action-counter'], null),
    { ...step('先打开大地图', '点击高亮的“大地图”。它是所有区域的入口，地图切换不消耗行动。此步需要你亲手点击。', ['[data-guide="nav-world-map"]'], null), click: 'world-map' },
    { ...step('进入校园小地图', '点击高亮的校园地标。其他区域暂时锁定，完成教学后可自由进入全部 9 个区域。', ['[data-guide="atlas-campus"]'], 'world-map'), click: 'campus' },
    step('拖动和缩放', '小地图默认 150%。触屏用单指拖动、双指缩放；鼠标拖动，或使用 + / −。重置按钮恢复视角。感叹号表示任务，新故事标签表示可以阅读的地点剧情。', ['.map-controls'], null),
    { ...step('找到教室', '打开高亮的地点列表，选择“高三教室”。地点列表让小屏幕上也能直接找到目标，屏幕边缘的箭头还可以定位任务。', ['[data-guide="place-select"]'], null), scene: 'campus', click: 'classroom' },
    step('地点里的故事', '这里列出行动、故事与约见。进入一段新地点故事扣 1 次行动，阅读后会进入选择与结果。已读故事留在手帐，不会重复抽到。教学不会替你点击剧情选项。', ['.location-stories', '.location-actions', '.modal-content'], 'location'),
    step('任务不只是一瞬间', '任务手帐有主线、支线、角色和长期项目。长期任务需要跨周投入；接受、进度、追踪和奖励都会保存。之后可从手册进入“长任务”专题演示。', ['.task-toolbar', '.quest-board', '.modal-content'], 'quests'),
    step('认真回复，也可以主动联系', '通讯里可以选择回复、主动话题、邀请与礼物。联系人红点表示未读；恋爱需要信任、心动、了解和不同周的真实相处，单次刷数值不够。', ['.im-contact-list', '.im-contacts'], 'messages'),
    step('补给与礼物', '背包物品可用于恢复状态；小卖部可以购买。使用和送礼不扣校园行动，同龄角色每周收一次礼物。生日周第一份礼物另有 50% 心意加成。', ['.inventory-grid'], 'bag'),
    step('结束这一周', '结束本周会恢复状态、补充生活费，并推进故事和长期任务。没用完的行动不会结转。高考前最后一周会进入考场；指引不会替你结束本周。', ['.next-week-control'], null),
    step('小手册一直在', '这里有全部专题指引和操作说明。完成后可以自由玩，也可以单独复习任何一项。进度只存本浏览器，跳过后仍能重新查看。', ['.tutorial-catalogue'], 'help'),
  ] },
  { id: 'map', title: '地图与地点', description: '区域、小地图、任务箭头和故事标记', steps: [
    step('所有区域的入口', '9 个区域包含 36 处地点。地标和区域目录都能切换小地图，切换免费；感叹号提示待办任务，小圆点提示可读故事。', ['.atlas-board', '.atlas-layout'], 'world-map'),
    step('本区定位与缩放', '单指拖动、双指缩放，或用鼠标和缩放按钮。地点下拉列表不会受地图视角影响。屏幕边缘的箭头能把任务地点移入视野。', ['.map-controls'], null),
    step('区分移动与互动', '移动到地点不花行动；阅读新地点故事、赴约和做事会消耗 1 次行动。行动耗尽后标记消失，下一周重新出现。', ['.action-counter'], null),
  ] },
  { id: 'study', title: '学习与状态', description: '学力、收益、行动条件与恢复', steps: [
    step('先看行动条件', '学习项目列出体力、压力与学科收益。按钮变灰时，说明行动数、体力或零花钱不足；先休息或补给再试。', ['.study-grid', '.study-topline', '.modal-content'], 'study'),
    step('学力不等于实际考分', '平时学力构成预测分，高考还结合心情、健康、压力和答题表现。熟练度越高，单次学科增长越慢，均衡学习与休息更有效。', ['.student-sheet', '.resources'], null),
    step('看见自己的变化', '成长手册显示六科学力、状态与姓名设置。目标可以调整，改名会同步剧情、消息和当前存档称呼。', ['.profile-academics', '.modal-content'], 'profile'),
  ] },
  { id: 'stories', title: '剧情与手帐', description: '选择、分支、去重和回看', steps: [
    step('每一个选择都会留痕', '故事通常先阅读，再选择一项，最后确认把这一页收好。结果会改变状态或关系，有些选择决定之后的地图分支。', ['.journal-tabs', '.modal-content'], 'journal'),
    step('连续支线会等待', '一条地图故事可能分几周出现。手帐中的支线进度会提示下一章地点和解锁时间，读过的故事不会重复领取收益。', ['.storyline-progress', '.modal-content'], 'journal'),
    step('回忆不会被后来的关系改写', '已选择的结局和生日版本会保留。自动存档记录剧情结果，重开游戏前可以导出，或另存到手动槽。', ['.save-intro'], 'saves'),
  ] },
  { id: 'quests', title: '主线与长任务', description: '接受、跨周投入、追踪和领奖', steps: [
    step('四类任务，各自推进', '主线贯穿高三，地图支线与角色任务对应地点和相处。切到“长期任务”可查看阶段、条件和不同周的投入记录。', ['.task-toolbar'], 'quests'),
    { ...step('长任务要经历时间', '先接受项目，再按阶段投入。通常至少需要 5 个不同游戏周和 5 次行动；同一项目每周投入一次，满足故事条件后在周末推进。恋爱专属项目至少跨 6 周。', ['.long-projects', '.task-board', '.modal-content'], 'quests'), tab: '.task-toolbar .paper-tabs button:last-child' },
    step('追踪地点，领取一次奖励', '任务目标可跳转到相关面板或地点，图钉可追踪至地图。完成后主动领取纪念，奖励只能领一次，周末不会清空未完成的任务。', ['.task-toolbar', '.modal-content'], 'quests'),
  ] },
  { id: 'messages', title: 'IM 与约见', description: '未读、回复、主动消息、见面和礼物', steps: [
    step('先选择一个联系人', '手机先显示联系人列表，点击后才进入聊天并标记已读。红点是未读消息数；聊天记录会随存档保留。', ['.im-contact-list'], 'messages'),
    { ...step('回复和主动话题都可选择', '收到消息后选择回复，也能切到主动话题。每位联系人每周有新日常，主动话题和回复均不消耗行动。已经聊过的分支不会重复加数值。', ['.im-composer', '.im-conversation'], 'messages'), tab: '[data-guide="contact-su"]' },
    step('收到邀请后，还要赴约', '接受或主动发出的约见会保留到以后。点击见面地点，再在地点页选择“赴约”，扣 1 次行动；只打开地点不会花行动。', ['.im-meet'], 'messages'),
    step('送礼与心事入口', '选择已有物品送出，每位同龄角色每周一次。五位同龄角色的心事入口可以主动表白；生日提醒还会显示日期与庆祝地点。', ['.im-gift-tools', '.im-composer'], 'messages'),
  ] },
  { id: 'romance', title: '恋爱与边界', description: '表白、相处、长期故事、分手与内容确认', steps: [
    step('先认识，再认真表白', '选择一位角色查看信任、心动、了解和解锁条件。需要在不同周见面，并完成约见或心事回复；表白还要对方明确答应。', ['.love-bond-values', '.love-overview'], 'romance'),
    { ...step('相处和专属故事', '散步、约会、邀请回家通常用 1 次行动。牵手、拥抱和轻吻每周一次，需要尊重边界。插画只在经历相应互动后点亮；专属故事每段至少隔一周。', ['.love-spend', '.love-tabs'], 'romance'), tab: '.love-tabs [role="tab"]:nth-child(2)' },
    { ...step('约定可以认真修改', '可以设置公开表达、来访和亲近的边界，也能冷静、分手或以后重新交往。分手结束跟随与来访，回忆保留，专属项目暂停。', ['.love-boundaries', '.love-tabs'], 'romance'), tab: '.love-tabs [role="tab"]:nth-child(3)' },
    step('特殊内容单独确认', '玩家年龄与角色年龄分别判断。未成年玩家隐藏成人向入口；成年玩家进入私人剧情前仍需确认观看或跳过，两者收益与消耗相同，刷新后重新确认。', ['.audience-settings', '.modal-content'], 'settings'),
  ] },
  { id: 'birthdays', title: '生日与心意', description: '日期、提醒、普通与情侣生日及礼物加成', steps: [
    step('别忘记一个具体的人', '7 位联系人与你都有普通生日故事。IM 提前提醒，日程显示下一批生日与地点。高考之后的生日会明确提前庆祝，真实日期不变。', ['.birthday-calendar'], 'schedule'),
    step('恋人有不同的生日故事', '正常交往时，五位同龄恋人的庆祝会切换到情侣生日版本。庆祝用 1 次行动，只完成一次；之后改变关系不会改写已保存的版本。', ['.birthday-hint', '.love-profile'], 'romance'),
    step('首份礼物，额外心意', '生日周第一份礼物的关系与心意加成 50%，每人每年一次。情侣庆祝后邀请回家，符合条件时可进入生日私人时光，并选择观看或跳过。', ['.birthday-hint', '.im-composer'], 'messages'),
  ] },
  { id: 'bag', title: '背包与零花钱', description: '使用、购买、赠送及成本', steps: [
    step('先看你拥有的物品', '数量写在物品图下，只有拥有时才能使用。补给不消耗行动；同样的物品也可以作为礼物送出。', ['.inventory-grid'], 'bag'),
    { ...step('花钱之前看效果', '小卖部显示每件物品价格，余额不足时无法购买。咖啡等物品有收益也有代价，读完说明再选择。', ['.money-label', '.inventory-grid'], 'bag'), tab: '.panel-toolbar .paper-tabs button:nth-child(2)' },
    step('恢复与收入', '休息和周末会恢复状态；结束本周补充生活费，一些地图行动还能挣零花钱。物品、金额和礼物记录会自动保存。', ['.money-resource', '.resources'], null),
  ] },
  { id: 'schedule', title: '日程与周末', description: '计划、行动结转和跨周解锁', steps: [
    step('计划安排剩余行动', '日程的三栏对应周初、周中、周末。已做过的行动不能改；按计划会完成剩余行动，体力或金钱不足时自动休息。', ['.weekly-plan'], 'schedule'),
    step('结束本周是明确的选择', '周末恢复状态、发生活费并推进长期任务。未用的行动不结转，任务进度和约见保留；新的剧情也会按周出现。', ['.next-week-control'], null),
  ] },
  { id: 'universities', title: '大学与志愿', description: '检索、目标、志愿顺序和模拟投档', steps: [
    step('先看真实的学校信息', '可检索院校或专业，按地区、层次和办学性质筛选。分数门槛是游戏参数，参考位次与官网有出处；现实填报需核对当年信息。', ['.search-field', '.school-filters-extra'], 'universities'),
    step('先练习，再确认', '选择学校和专业，可排 5 个有顺序的志愿。填报前能调整顺序；进入正式填报阶段后，再确认模拟投档。', ['.wish-list', '.wish-paper', '.modal-content'], 'universities'),
  ] },
  { id: 'saves', title: '存档与恢复', description: '自动保存、恢复点、手动槽及导入导出', steps: [
    step('自动存档在本浏览器', '行动、剧情、关系和任务会实时保存。最近 6 个恢复点可找回此前进度；清理浏览器数据会影响本地存档。', ['.save-intro', '.auto-backups'], 'saves'),
    step('给重要时刻另存一本', '三个手动槽可保存不同节点。覆盖、读取和删除都有确认；读取会替换当前进度，先把重要故事导出备份。', ['.save-slot-list'], 'saves'),
    step('导出与导入', '导出得到可携带的 JSON；导入前会校验内容并迁移旧档。玩家年龄与指引偏好单独保存在浏览器，导入不能带入本次内容同意。', ['.save-file-buttons'], 'saves'),
  ] },
  { id: 'graduation', title: '高考与毕业之后', description: '考场、模拟录取和毕业后缘分', steps: [
    step('最后一周之后', '校园第 40 周结束进入简化考场。每题选完可看解释，总成绩结合平时学力、答题和状态。教学不会替你答题或交卷。', ['.exam-progress', '.school-browser', '.ending-content', '.modal-content'], 'stage'),
    step('亲手填写未来', '提交志愿后生成模拟录取与毕业故事。你的学习、关系、选择和长期任务成果都会留在结局里，可以查看毕业纪念或重新开始。', ['.wish-panel', '.ending-panel', '.modal-content'], 'stage'),
    step('毕业后的重逢', '老陈的个人恋爱线在毕业后开放，故事从一年后的重逢开始，已无授课、评分或管理关系。用独立的月度日程相处、主动表白和推进六段专属故事。', ['.modal-content'], 'stage'),
  ] },
  { id: 'graduate', title: '毕业后缘分', description: '独立月度时间线、主动表白与六章手记', steps: [
    step('先结束师生关系', '完成高考、志愿与毕业后可以开启。故事从 2027 年 9 月开始，已无授课、评分或管理；在校时只可查看条件，不会提前开放。', ['.graduate-intro'], 'graduate-romance'),
    step('关系需要跨月相处', '每月 2 次相处行动，消息与礼物各一次。3 个不同月见面，信任 65、心动 35、了解 45 后可以主动表白。已有恋爱需先明确处理；本教学不会开启时间线或花费行动。', ['.graduate-overview', '.graduate-intro'], 'graduate-romance'),
    step('明确答应，再一起走下一页', '交往后有约会、牵手、拥抱、轻吻、同行、边界与分手。六章手记必须跨月推进。生日在 10 月，首份礼物额外加成；时间线、消息与回忆随存档保留。', ['.graduate-chapters', '.graduate-intro'], 'graduate-romance'),
  ] },
  { id: 'settings', title: '声音与内容设置', description: '音量、动态效果和年龄偏好', steps: [
    step('按舒服的节奏玩', '背景音乐、音效和音量可分别调整。减少动态效果会降低场景运动，支持切换全屏。', ['.setting-row', '.volume-settings'], 'settings'),
    step('内容选择由你决定', '年龄偏好独立保存在本浏览器；可重新选择，也可以自动跳过私人剧情。跳过不减少游戏进度和收益。', ['.audience-settings', '.modal-content'], 'settings'),
  ] },
];
export interface GuideState { active: string | null; step: number; completed: string[]; dismissed: string[]; autoPrompt: boolean; autoOffered: boolean }
export const freshGuide = (): GuideState => ({ active: null, step: 0, completed: [], dismissed: [], autoPrompt: true, autoOffered: false });
export function validateGuide(raw: unknown): GuideState {
  if (!raw || typeof raw !== 'object') return freshGuide();
  const value = raw as Partial<GuideState>, ids = GUIDE_MODULES.map(module => module.id);
  const active = ids.includes(value.active ?? '') ? value.active! : null;
  const max = GUIDE_MODULES.find(module => module.id === active)?.steps.length ?? 1;
  return { active, step: Number.isInteger(value.step) && value.step! >= 0 && value.step! < max ? value.step! : 0, completed: [...new Set(Array.isArray(value.completed) ? value.completed.filter(id => ids.includes(id)) : [])], dismissed: [...new Set(Array.isArray(value.dismissed) ? value.dismissed.filter(id => ids.includes(id)) : [])], autoPrompt: value.autoPrompt !== false, autoOffered: value.autoOffered === true };
}
export function loadGuide() { try { return validateGuide(JSON.parse(localStorage.getItem(GUIDE_KEY) ?? 'null')); } catch { return freshGuide(); } }
export function persistGuide(state: GuideState) { try { localStorage.setItem(GUIDE_KEY, JSON.stringify(state)); } catch { /* Teaching remains usable when local storage is unavailable. */ } }
export function beginGuide(state: GuideState, id: string): GuideState { return GUIDE_MODULES.some(module => module.id === id) ? { ...state, active: id, step: 0, autoOffered: true } : state; }
export function progressGuide(state: GuideState, direction = 1): GuideState {
  const module = GUIDE_MODULES.find(module => module.id === state.active); if (!module) return state;
  const index = state.step + direction;
  return index >= module.steps.length ? { ...state, active: null, step: 0, completed: [...new Set([...state.completed, module.id])] } : { ...state, step: Math.max(0, index) };
}
export function skipGuide(state: GuideState): GuideState { return { ...state, active: null, step: 0, autoOffered: true, dismissed: [...new Set([...state.dismissed, ...(state.active ? [state.active] : [])])] }; }
export const guideForPanel: Partial<Record<Exclude<Panel, null>, string>> = { 'world-map': 'map', study: 'study', journal: 'stories', quests: 'quests', messages: 'messages', romance: 'romance', bag: 'bag', schedule: 'schedule', universities: 'universities', saves: 'saves', exam: 'graduation', ending: 'graduation', settings: 'settings', 'graduate-romance': 'graduate', location: 'map', relations: 'messages' };
export function guideInteractionComplete(step: GuideStep, panel: Panel, game: GameState) {
  return step.click === 'world-map' ? panel === 'world-map' : step.click === 'campus' ? panel === null && game.world.scene === 'campus' : step.click === 'classroom' ? panel === 'location' && game.world.placeId === 'classroom' : false;
}
