import { UNIVERSITIES } from './data';
import { createGame } from './engine';
import { playerNameError } from './player';
import { deliverMessages } from './social';
import type { GameState, IconName, StartingStage } from './types';

export interface NewGameOptions {
  name: string;
  gender: GameState['gender'];
  difficulty: GameState['difficulty'];
  stage: StartingStage;
  schoolId: string;
  major: string;
  education: 'bachelor' | 'work';
}
export const STARTING_STAGES: { id: StartingStage; name: string; age: number; funds: number; icon: IconName; image: string; description: string; button: string }[] = [
  { id: 'highschool', name: '高中', age: 18, funds: 120, icon: 'school', image: 'classroom.jpg', description: '40周高三，从校园、学习和高考开始。', button: '开启我的高三' },
  { id: 'university', name: '大学', age: 18, funds: 3000, icon: 'university', image: 'story-dorm-v3.2.webp', description: '从大一入学开始，积累学分，探索大学与社会。', button: '开启我的大学生活' },
  { id: 'society', name: '社会', age: 22, funds: 5000, icon: 'briefcase', image: 'story-work-v3.2.webp', description: '从求职与合租开始，工作、经济和家庭由你安排。', button: '开启我的社会生活' },
  { id: 'retirement', name: '退休', age: 60, funds: 20000, icon: 'clock', image: 'story-station-v3.2.webp', description: '带着30年工作与缴费积累，安排退休后的日子。', button: '开启我的退休生活' },
];

export function createNewGame(options: NewGameOptions): GameState {
  const preset = STARTING_STAGES.find(s => s.id === options.stage);
  const school = UNIVERSITIES.find(s => s.id === options.schoolId);
  const error = playerNameError(options.name);
  if (error) throw new Error(error);
  if (!preset || !school || !school.majors.includes(options.major)) throw new Error('请选择有效的人生阶段、院校和专业。');
  if (!['male', 'female'].includes(options.gender) || !['gentle', 'standard'].includes(options.difficulty) || !['bachelor', 'work'].includes(options.education)) throw new Error('开局选项无效。');
  const g = createGame();
  Object.assign(g, { started: true, startStage: preset.id, name: options.name.trim(), nameIsCustom: true, gender: options.gender, difficulty: options.difficulty, targetSchool: school.id });
  if (preset.id === 'highschool') return deliverMessages({ ...g, pendingEvent: 'first-day' });

  // These are explicit starting backgrounds, not fabricated exam answers or played history.
  g.phase = 'ending';
  const l = g.life, university = preset.id === 'university';
  const degree = !university && options.education === 'bachelor';
  l.active = true; l.baseAge = preset.age; l.originWeek = (preset.age - 18) * 52;
  l.stage = university ? 'university' : 'society'; l.atlas = l.stage;
  l.region = university ? 'college-study' : preset.id === 'retirement' ? 'residence' : 'recruitment';
  l.education = { enrolled: university, school: university || degree ? school.name : '自主职业路径', major: university || degree ? options.major : '职业实践', prestige: university || degree ? school.type === '985' ? 90 : school.type === '211' ? 75 : 50 : 0, credits: degree ? 160 : 0, gpa: university ? 2.5 : degree ? 3 : 0, degree, entered: degree ? -208 : 0 };
  l.skills = university ? { technical: 18, communication: 18, practical: 12 } : degree ? { technical: 45, communication: 30, practical: 25 } : { technical: 25, communication: 25, practical: 35 };
  l.economy.rent = university ? 'dorm' : 'shared';
  g.stats.money = preset.funds;
  l.economy.income = preset.funds;
  l.economy.ledger = [{ week: 0, label: `${preset.name}开局 · 初始生活储备`, amount: preset.funds }];
  if (preset.id === 'retirement') {
    l.work.retired = true; l.work.experience = 1560; l.work.hours = 1560 * 40;
    l.work.pensionWeeks = 1560; l.work.paidWeeks = 1560;
    l.skills = { technical: 50, communication: 60, practical: 60 };
    l.economy.insurance = 'basic'; l.economy.insuredSince = 0;
    g.stats.energy = 70; g.stats.stress = 20;
    l.body.constitution = 65;
    l.body.internal = { metabolic: 78, vascular: 76, cardiac: 79, renal: 82, respiratory: 84, marrow: 85, skeletal: 76 };
  }
  l.memories = [{ week: 0, title: `从${preset.name}翻开人生`, text: `${preset.age}岁，生活储备¥${preset.funds}。${university ? `在${school.name}学习${options.major}，从零学分开始。` : degree ? `本科背景：${school.name}，${options.major}。` : '沿着职业实践的路线继续生活。'}${preset.id === 'retirement' ? '预设30年工作与缴费记录；没有替你安排伴侣、孩子或疾病。' : '没有预设工作、恋爱关系或已完成的剧情。'}` }];
  return g;
}
