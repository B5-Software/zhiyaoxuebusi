import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import GameIcon from './GameIcon';
import { UNIVERSITIES } from '../game/data';
import { STARTING_STAGES, type NewGameOptions } from '../game/newGame';
import { DEFAULT_PLAYER_NAME, playerPortrait } from '../game/player';
import type { GameState, StartingStage } from '../game/types';
import { asset } from '../utils/asset';

export default function NewGamePanel({ game, onStart }: { game: GameState; onStart: (options: NewGameOptions) => void }) {
  const [name, setName] = useState(game.started ? DEFAULT_PLAYER_NAME : game.name);
  const [gender, setGender] = useState<GameState['gender']>(game.gender);
  const [stage, setStage] = useState<StartingStage>('highschool');
  const [difficulty, setDifficulty] = useState(game.difficulty);
  const [schoolId, setSchoolId] = useState(game.targetSchool);
  const school = UNIVERSITIES.find(s => s.id === schoolId)!;
  const [major, setMajor] = useState(school.majors[0]);
  const [education, setEducation] = useState<NewGameOptions['education']>('bachelor');
  const preset = STARTING_STAGES.find(s => s.id === stage)!;
  const adultBackground = stage === 'society' || stage === 'retirement';
  const chooseSchool = !adultBackground || education === 'bachelor';
  return <form className="new-game-form" onSubmit={event => { event.preventDefault(); if (name.trim()) onStart({ name, gender, stage, difficulty, schoolId, major, education }); }}>
    <fieldset className="starting-stage-picker">
      <legend>从哪个人生阶段开始？</legend>
      <div className="starting-stage-grid">{STARTING_STAGES.map(item => <button type="button" key={item.id} aria-label={`从${item.name}开始`} aria-pressed={stage === item.id} className={stage === item.id ? 'selected' : ''} onClick={() => setStage(item.id)}>
        <GameIcon name={item.icon} size={48}/><span><strong>{item.name}</strong><small>{item.age}岁 · ¥{item.funds.toLocaleString('zh-CN')}储备</small></span>{stage === item.id && <Check size={17}/>}
      </button>)}</div>
    </fieldset>
    <div className="new-start-preview"><img src={asset(`images/${preset.image}`)} alt={`${preset.name}开局场景`}/><div><span className="little-label">从{preset.name}翻开这一页</span><h3>这一次，为自己生活。</h3><p>{preset.description}</p></div></div>
    <fieldset className="protagonist-picker"><legend>选择故事里的自己</legend>{(['male', 'female'] as const).map(value => <button key={value} type="button" aria-label={value === 'male' ? '男主' : '女主'} aria-pressed={gender === value} className={gender === value ? 'selected' : ''} onClick={() => setGender(value)}><img src={playerPortrait({ gender: value })} alt={value === 'male' ? '男主头像' : '女主头像'}/><span>{value === 'male' ? '男主' : '女主'}</span>{gender === value && <Check size={15}/>}</button>)}</fieldset>
    <label className="new-start-field">你的名字<input data-autofocus value={name} onChange={event => setName(event.target.value)} maxLength={16} required placeholder="给故事里的自己起个名字"/></label>
    {adultBackground && <fieldset className="start-education-options"><legend>起始学历背景</legend><div>{([['bachelor', '本科毕业', '带着所选院校与专业的本科背景求职。'], ['work', '职业实践', '未取得本科，依靠技能与实践寻找机会。']] as const).map(([id, label, detail]) => <button key={id} type="button" aria-pressed={education === id} className={education === id ? 'selected' : ''} onClick={() => setEducation(id)}><span><strong>{label}</strong><small>{detail}</small></span>{education === id && <Check size={16}/>}</button>)}</div></fieldset>}
    {chooseSchool && <div className="new-start-fields"><label className="new-start-field">{stage === 'highschool' ? '心中的大学' : stage === 'university' ? '入学院校' : '毕业院校'}<select aria-label={stage === 'highschool' ? '心中的大学' : stage === 'university' ? '入学院校' : '毕业院校'} value={schoolId} onChange={event => { const next = UNIVERSITIES.find(s => s.id === event.target.value)!; setSchoolId(next.id); setMajor(next.majors[0]); }}>{([['985 院校', '985'], ['211 院校', '211'], ['双一流院校', '双一流'], ['其他本科', '本科']] as const).map(([label, type]) => <optgroup key={type} label={label}>{UNIVERSITIES.filter(s => s.type === type).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>)}</select></label>{stage !== 'highschool' && <label className="new-start-field">{stage === 'university' ? '入学专业' : '所学专业'}<select aria-label={stage === 'university' ? '入学专业' : '所学专业'} value={major} onChange={event => setMajor(event.target.value)}>{school.majors.map(item => <option key={item}>{item}</option>)}</select></label>}</div>}
    {stage === 'highschool' && <div className="difficulty-options">{([['gentle', '慢慢长大', '消耗更少，成长更快，安心看故事', 'leaf'], ['standard', '真实高三', '平衡学习、压力和自己的生活', 'book']] as const).map(([id, title, description, icon]) => <button type="button" key={id} aria-pressed={difficulty === id} className={difficulty === id ? 'selected' : ''} onClick={() => setDifficulty(id)}><GameIcon name={icon} size={36}/><span><strong>{title}</strong><small>{description}</small></span>{difficulty === id && <Check size={17}/>}</button>)}</div>}
    <div className="start-preset-note"><GameIcon name="journal" size={32}/><p>{stage === 'highschool' ? '完整体验高三、高考和志愿，再继续大学与社会。' : stage === 'university' ? '从零学分与第一周开始。大学、社会和高中地图都可自由切换。' : stage === 'society' ? '开局尚未签约，先面试再找工作。年龄与健康、支出和剧情一起按周推进。' : '按30年缴费背景领取模拟退休收入。身体随生活继续变化，可开启退休专属故事。'}每周3次关键行动，探索与选择都会自动保存。</p></div>
    <button className="primary-button full-button new-start-submit" type="submit" disabled={!name.trim()}>{preset.button}<ArrowRight size={18}/></button>
    <p className="fine-print">角色、经历与开局背景均为虚构。游戏自动存档，无需注册，不会上传你的数据。</p>
  </form>;
}
