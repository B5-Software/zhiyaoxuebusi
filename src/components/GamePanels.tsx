import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronRight, Download, ExternalLink, Gift, Heart, LockKeyhole, Maximize, Play, RotateCcw, Save, Search, ShieldCheck, Sparkles, Trash2, Upload, Volume2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { ACTIONS, CHARACTERS, EXAM_QUESTIONS, ITEMS, SUBJECTS, UNIVERSITIES, imagePath, type Place } from '../game/data';
import { EVENTS } from '../game/events';
import { DEFAULT_SETTINGS, SLOTS_KEY, actionEffect, canAct, daysRemaining, effectSummary, finishExam, gameDate, getAchievements, loadSlots, predictedScore, submitWishes, validateGame } from '../game/engine';
import type { Audience, CharacterId, GameState, Panel, QuestTarget, RomanceId, SaveSlot, Scene, Settings, StoryEvent, University } from '../game/types';
import { asset } from '../utils/asset';
import GameIcon from './GameIcon';
import Modal from './Modal';
import NewGamePanel from './NewGamePanel';
import type { NewGameOptions } from '../game/newGame';
import { startLife } from '../game/life';
import GraduateRomancePanel from './GraduateRomancePanel';
import { TutorialCatalogue } from './Tutorial';
import { LocationStories, StorylineProgress } from './MapStories';
import Messenger from './Messenger';
import QuestBoard from './QuestBoard';
import AutoBackups from './AutoBackups';
import PlayerNameEditor from './PlayerNameEditor';
import LocationAppointments from './LocationAppointments';
import { playerDisplayName, playerPortrait, playerText } from '../game/player';
import { bondStage, isRomanceId } from '../game/social';
import BirthdayHint, { BirthdayCalendar } from './BirthdayHint';
import { birthdayEventFor } from '../game/birthdays';
import RomancePanel from './RomancePanel';
import LocationRomance from './LocationRomance';

interface Props {
  panel: Exclude<Panel, null>;
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  place: Place;
  open: (panel: Panel) => void;
  onClose: () => void;
  onAction: (id: string) => void;
  onMeet: (eventId: string) => void;
  onVisitPlace: (placeId: string) => void;
  onStory: (id: string) => void;
  reminderMinutes: number;
  saveHealthy: boolean;
  onDismissReminder: () => void;
  onStart: (options: NewGameOptions) => void;
  onNextWeek: () => void;
  onPlan: () => void;
  onChoice: (index: number) => void;
  onUse: (id: string) => void;
  onBuy: (id: string) => void;
  onGift: (id: CharacterId, item?: string) => void;
  onInitiate: (topicId: string) => void;
  onNavigateTask: (target: QuestTarget) => void;
  onReply: (script: string, index: number) => void;
  onConfess: (id: RomanceId) => void;
  onRomance: (id: RomanceId) => void;
  audience: Audience;
  setAudience: Dispatch<SetStateAction<Audience>>;
  onChat: (id: CharacterId) => void;
  chatContact?: CharacterId;
  onLoad: (game: GameState) => void;
  onScene: (scene: Scene) => void;
  notify: (message: string) => void;
}

const primary = 'primary-button';

function StoryPanel({ event, game, onChoice }: { event: StoryEvent; game: GameState; onChoice: (index: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const character = CHARACTERS[event.speaker];
  const choice = selected !== null ? event.choices[selected] : null;
  return <div className="story-panel">
    <div className="story-scene"><img src={imagePath(event.scene)} alt={`${event.title}的故事场景`}/><span className="scene-caption">{event.chapter}<span>第 {game.week + 1} 周</span></span></div>
    <div className="story-narrative"><div className="story-speaker"><img src={imagePath(character.image)} alt={character.name}/><div><strong>{character.name}</strong><small>{character.role}</small></div><span className="story-flower">✦</span></div>
      {!choice ? <><div className="story-paragraphs">{event.paragraphs.map((paragraph, index) => <motion.p key={paragraph} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.15 }}>{playerText(game, paragraph)}</motion.p>)}</div><p className="choice-label">这一刻，你想怎么做？</p><div className="story-choices">{event.choices.map((option, index) => <button key={option.text} className="story-choice" disabled={game.stats.money + (option.effect.money ?? 0) < 0} onClick={() => setSelected(index)}><span className="choice-letter">{String.fromCharCode(65 + index)}</span><span><strong>{playerText(game, option.text)}</strong><small>{effectSummary(option.effect).slice(0, 4).join(' / ')}</small></span><ChevronRight size={18}/></button>)}</div></> : <motion.div className="story-resolution" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><span className="little-label">你选择了 · {playerText(game, choice.text)}</span><p>{playerText(game, choice.result)}</p><div className="effect-line">{effectSummary(choice.effect).join('　/　')}</div><div className="button-row"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={15}/>再想一想</button><button className={primary} onClick={() => onChoice(selected!)}>把这一页收好 <ArrowRight size={17}/></button></div></motion.div>}
    </div>
  </div>;
}

function InventoryPanel({ game, onBuy, onUse, shop = false }: Pick<Props, 'game' | 'onBuy' | 'onUse'> & { shop?: boolean }) {
  const [tab, setTab] = useState(shop ? 'shop' : 'bag');
  return <><div className="panel-toolbar"><div className="paper-tabs"><button className={tab === 'bag' ? 'active' : ''} onClick={() => setTab('bag')}>我的背包</button><button className={tab === 'shop' ? 'active' : ''} onClick={() => setTab('shop')}>校园小卖部</button></div><span className="money-label"><GameIcon name="coin" size={25}/>{game.stats.money} 元</span></div><div className="inventory-grid">{ITEMS.map(item => <div className="inventory-item" key={item.id}><div className="item-art"><GameIcon name={item.icon} size={72}/><span>×{game.inventory[item.id] ?? 0}</span></div><h3>{item.name}</h3><p>{item.description}</p>{tab === 'bag' ? <button className="secondary-button" onClick={() => onUse(item.id)} disabled={!game.inventory[item.id] || game.phase !== 'school'}>{game.inventory[item.id] ? '使用物品' : '暂未拥有'}</button> : <button className="secondary-button" onClick={() => onBuy(item.id)} disabled={game.stats.money < item.price || game.phase !== 'school'}><GameIcon name="coin" size={20}/>{item.price} 元 · 购买</button>}</div>)}</div><p className="panel-tip"><Sparkles size={16}/>使用补给不消耗行动次数。学科成长会随熟练度提升逐渐减缓。</p></>;
}

const typeLabel = (school: University) => school.type === '985' || school.type === '211' ? `${school.type} / 双一流` : school.type === '双一流' ? '双一流' : school.level === '民办' ? '民办本科' : school.level === '中外合作' ? '中外合作' : '公办本科';

function UniversityPanel({ game, setGame, open, notify }: Pick<Props, 'game' | 'setGame' | 'open' | 'notify'>) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('全部');
  const [region, setRegion] = useState('全部地区');
  const [level, setLevel] = useState('全部性质');
  const [majors, setMajors] = useState<Record<string, string>>({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [visible, setVisible] = useState(40);
  const score = game.examScore ?? predictedScore(game);
  const regions = ['全部地区', ...Array.from(new Set(UNIVERSITIES.map(school => school.city.split(' · ')[0])))];
  const schools = UNIVERSITIES.filter(school => (filter === '全部' || school.type === filter) && (region === '全部地区' || school.city.startsWith(region)) && (level === '全部性质' || school.level === level) && `${school.name}${school.city}${school.majors.join('')}`.includes(query.trim()));
  const shownSchools = schools.slice(0, visible);
  const editable = game.phase !== 'ending';
  function toggleWish(id: string) {
    if (!editable) { notify('这封录取通知已经定稿。开始新故事后，可以尝试新的志愿。'); return; }
    if (game.wishes.some(wish => wish.schoolId === id)) { setGame(current => ({ ...current, wishes: current.wishes.filter(wish => wish.schoolId !== id) })); return; }
    if (game.wishes.length >= 5) { notify('最多填写 5 个模拟志愿，请先移除一个。'); return; }
    const school = UNIVERSITIES.find(item => item.id === id)!;
    setGame(current => current.wishes.length >= 5 || current.wishes.some(wish => wish.schoolId === id) ? current : ({ ...current, wishes: [...current.wishes, { schoolId: id, major: majors[id] ?? school.majors[0] }] }));
    setConfirmSubmit(false);
    notify(`已把${school.name}放进你的志愿草稿。`);
  }
  function moveWish(index: number, direction: number) {
    setGame(current => { const wishes = [...current.wishes]; [wishes[index], wishes[index + direction]] = [wishes[index + direction], wishes[index]]; return { ...current, wishes }; });
    setConfirmSubmit(false);
  }
  return <><div className="university-notice"><ShieldCheck size={21}/><p><strong>认识真正的大学，探索自己的可能。</strong>院校门槛与参考位次整理自公开录取数据（以 2026 年陕西物理类为主）；所有成绩与录取结果均为游戏模拟，不是现实招生数据。</p></div><div className="university-layout"><section className="school-browser"><div className="search-field"><Search size={18}/><input aria-label="搜索院校或专业" placeholder="找一所大学，或一个喜欢的专业…" value={query} onChange={event => setQuery(event.target.value)}/>{query && <button onClick={() => setQuery('')} aria-label="清空搜索"><X size={16}/></button>}</div><div className="paper-tabs school-filters">{['全部', '985', '211', '双一流', '本科'].map(tab => <button key={tab} className={filter === tab ? 'active' : ''} onClick={() => { setFilter(tab); setVisible(40); }}>{tab === '本科' ? '其他本科' : tab}</button>)}</div><div className="school-filters-extra"><select aria-label="按地区筛选" value={region} onChange={event => { setRegion(event.target.value); setVisible(40); }}>{regions.map(item => <option key={item}>{item}</option>)}</select><select aria-label="按办学性质筛选" value={level} onChange={event => { setLevel(event.target.value); setVisible(40); }}>{['全部性质', '公办', '民办', '中外合作'].map(item => <option key={item}>{item}</option>)}</select><span>{schools.length} 所院校</span></div><div className="school-list">{schools.length === 0 && <div className="empty-state"><GameIcon name="book" size={64}/><h3>这页暂时没有结果</h3><p>试试“西安”“计算机”或清空筛选。</p><button className="text-button" onClick={() => { setQuery(''); setFilter('全部'); }}>查看全部院校</button></div>}{shownSchools.map(school => { const selected = game.wishes.some(wish => wish.schoolId === school.id); return <article className={`school-entry ${selected ? 'is-selected' : ''}`} key={school.id}><div className="school-entry-top"><div className="school-seal" style={{ color: school.color, borderColor: school.color }}><span>学</span><strong>{school.short}</strong><span>求知 · 求真</span></div><div className="school-name"><h3>{school.name}</h3><span>{school.city} <i>{typeLabel(school)}</i></span></div><div className="school-threshold"><strong>{school.threshold}<small> 分</small></strong><span>游戏门槛</span></div></div><p>{school.description}</p><div className="school-meta"><a href={school.source} target="_blank" rel="noopener noreferrer">学校官网 <ExternalLink size={12}/></a>{school.rank && <span className="school-rank">{school.rankYear ?? 2026} 陕·物理 参考 {school.rank} 位</span>}<span className={score >= school.threshold ? 'safe-tag' : 'reach-tag'}>{score >= school.threshold + 25 ? '稳一稳' : score >= school.threshold ? '够一够' : score >= school.threshold - 35 ? '冲一冲' : '远方的目标'}</span></div><div className="school-entry-bottom"><select aria-label={`${school.name}意向专业`} value={selected ? game.wishes.find(wish => wish.schoolId === school.id)!.major : majors[school.id] ?? school.majors[0]} disabled={!editable} onChange={event => { const value = event.target.value; setMajors(current => ({ ...current, [school.id]: value })); if (selected) setGame(current => ({ ...current, wishes: current.wishes.map(wish => wish.schoolId === school.id ? { ...wish, major: value } : wish) })); }}>{school.majors.map(major => <option key={major}>{major}</option>)}</select><button className={selected ? 'added-button' : 'secondary-button'} onClick={() => toggleWish(school.id)} disabled={!editable}>{selected ? <><Check size={15}/>已加入</> : <>加入志愿 <span>+</span></>}</button></div></article>; })}{shownSchools.length < schools.length && <div className="school-load-more"><button className="secondary-button" onClick={() => setVisible(value => value + 40)}>显示更多院校（还有 {schools.length - shownSchools.length} 所）</button></div>}</div></section><aside className="wish-paper"><div className="wish-paper-heading"><GameIcon name="letter" size={42}/><div><h3>我的志愿单</h3><span>{game.phase === 'application' ? '高考之后，自己选择' : '先把喜欢的未来收好'}</span></div></div><div className="wish-score"><span>{game.examScore === null ? '当前预估成绩' : '本次模拟高考成绩'}</span><strong>{score}<small> / 750</small></strong></div><p className="wish-hint">按顺序尝试录取，最多 5 所。记得给自己留一个稳妥的选择。</p>{game.wishes.length === 0 ? <div className="wish-empty"><GameIcon name="notes" size={55}/><p>你的未来，还等你落笔。<br/>从左侧加入喜欢的大学吧。</p></div> : <ol className="wish-list">{game.wishes.map((wish, index) => { const school = UNIVERSITIES.find(item => item.id === wish.schoolId)!; return <li key={wish.schoolId}><span className="wish-order">0{index + 1}</span><div><strong>{school.name}</strong><small>{wish.major}</small></div>{editable && <div className="wish-controls"><button onClick={() => moveWish(index, -1)} disabled={index === 0} aria-label={`上移${school.name}`}><ArrowUp size={13}/></button><button onClick={() => moveWish(index, 1)} disabled={index === game.wishes.length - 1} aria-label={`下移${school.name}`}><ArrowDown size={13}/></button><button onClick={() => toggleWish(school.id)} aria-label={`移除${school.name}`}><X size={13}/></button></div>}</li>; })}</ol>}{game.phase === 'application' ? <><button className={`${primary} full-button`} disabled={!game.wishes.length} onClick={() => { if (!confirmSubmit) { setConfirmSubmit(true); return; } setGame(current => submitWishes(current)); open('ending'); }}>{confirmSubmit ? '确认提交，等待录取' : '提交我的志愿'}<ArrowRight size={16}/></button>{confirmSubmit && <p className="confirm-caption">志愿将按当前顺序进行模拟投档。再次点击确认。</p>}</> : <p className="saved-draft"><Check size={14}/>{game.phase === 'ending' ? '志愿已投档' : '草稿自动保存，高考后可正式提交'}</p>}<div className="real-world-note">现实填报还需核验当年招生章程、选科要求、位次、批次与计划。游戏仅展示部分专业，不代表实际招生专业组。</div></aside></div></>;
}

function ProfilePanel({ game, setGame, notify }: Pick<Props, 'game' | 'setGame' | 'notify'>) {
  const center = 150;
  const radius = 93;
  const point = (index: number, ratio: number) => `${center + Math.cos(-Math.PI / 2 + index * Math.PI / 3) * radius * ratio},${center + Math.sin(-Math.PI / 2 + index * Math.PI / 3) * radius * ratio}`;
  return <><div className="profile-intro"><img src={playerPortrait(game)} alt={playerDisplayName(game)}/><div><span className="little-label">高三（3）班 / {game.difficulty === 'gentle' ? '慢慢长大' : '真实高三'}</span><h3>{playerDisplayName(game)}的成长手册</h3><p>分数会记录你的努力，但不能定义全部的你。</p></div><div className="total-score"><strong>{predictedScore(game)}</strong><span>预估总分 / 750</span></div></div><PlayerNameEditor game={game} setGame={setGame} notify={notify}/><div className="profile-academics"><div className="radar-wrap"><svg viewBox="0 0 300 290" role="img" aria-label="六科学习能力雷达图">{[0.25, 0.5, 0.75, 1].map(ratio => <polygon key={ratio} points={SUBJECTS.map((_, index) => point(index, ratio)).join(' ')} fill={ratio === 1 ? '#edf0df' : 'none'} stroke="#d1d4ba"/>).reverse()}{SUBJECTS.map((_, index) => <line key={index} x1={center} y1={center} x2={point(index, 1).split(',')[0]} y2={point(index, 1).split(',')[1]} stroke="#d1d4ba"/>)}<polygon points={SUBJECTS.map((subject, index) => point(index, game.subjects[subject.id] / subject.max)).join(' ')} fill="#89a68366" stroke="#718d6c" strokeWidth="2.5"/>{SUBJECTS.map((subject, index) => <text key={subject.id} x={point(index, 1.25).split(',')[0]} y={Number(point(index, 1.25).split(',')[1]) + 5} textAnchor="middle" fill="#6e7158" fontSize="13">{subject.name}</text>)}</svg></div><div className="subject-progress-list">{SUBJECTS.map(subject => <div key={subject.id}><div><strong>{subject.name}</strong><span>{Math.round(game.subjects[subject.id])}<small> / {subject.max}</small></span></div><div className="progress-track"><i style={{ width: `${game.subjects[subject.id] / subject.max * 100}%`, background: subject.color }}/></div></div>)}</div></div><div className="wellbeing-grid">{([{ key: 'health', title: '身体健康', icon: 'heart', text: '健康不是成绩的消耗品。' }, { key: 'autonomy', title: '自我意识', icon: 'leaf', text: '一点点，找回自己的声音。' }] as const).map(item => <div key={item.key}><GameIcon name={item.icon} size={42}/><span><strong>{item.title} <b>{game.stats[item.key]}</b></strong><small>{item.text}</small></span></div>)}</div><p className="panel-tip">学科越熟练，成长越慢。压力超过 75 或体力低于 25 时，学习效率会下降。</p></>;
}

function JournalPanel({ game, onScene }: Pick<Props, 'game' | 'onScene'>) {
  const [tab, setTab] = useState('story');
  const [expanded, setExpanded] = useState<string | null>(null);
  return <><div className="panel-toolbar"><div className="paper-tabs"><button className={tab === 'story' ? 'active' : ''} onClick={() => setTab('story')}>故事收藏</button><button className={tab === 'actions' ? 'active' : ''} onClick={() => setTab('actions')}>行动足迹</button><button className={tab === 'storylines' ? 'active' : ''} onClick={() => setTab('storylines')}>支线进度</button></div><span className="subtle-text">已收集 {game.history.length} / {EVENTS.length} 段故事</span></div>{tab === 'storylines' ? <StorylineProgress game={game} onScene={onScene}/> : tab === 'story' ? game.history.length ? <div className="journal-timeline">{[...game.history].reverse().map(entry => { const event = birthdayEventFor(game, EVENTS.find(item => item.id === entry.eventId)!); return <article key={entry.eventId} className="journal-entry"><button onClick={() => setExpanded(expanded === entry.eventId ? null : entry.eventId)} aria-expanded={expanded === entry.eventId}><span className="journal-week">第 {entry.week + 1} 周</span><div><span>{event.chapter}</span><h3>{event.title}</h3></div><ChevronRight className={expanded === entry.eventId ? 'rotate-90' : ''} size={18}/></button>{expanded === entry.eventId && <div className="journal-detail">{event.paragraphs.map(paragraph => <p key={paragraph}>{playerText(game, paragraph)}</p>)}<strong>当时的选择：{playerText(game, event.choices[entry.choiceIndex].text)}</strong><p>{playerText(game, entry.result)}</p></div>}</article>; })}</div> : <div className="empty-state"><GameIcon name="journal" size={82}/><h3>青春的第一页，还是空白</h3><p>开始游戏、走进校园，每一次选择都会留下痕迹。</p></div> : game.actionLog.length ? <div className="action-timeline">{game.actionLog.map((entry, index) => <div key={`${entry.week}-${index}`}><span>第 {entry.week + 1} 周</span><i/><p>{entry.text}</p></div>)}</div> : <div className="empty-state"><GameIcon name="leaf" size={64}/><p>去校园走一走，让今天留下一点故事。</p></div>}</>;
}

function SavePanel({ game, onLoad, notify }: Pick<Props, 'game' | 'onLoad' | 'notify'>) {
  const [slots, setSlots] = useState(loadSlots);
  const [confirm, setConfirm] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  function saveSlots(next: (SaveSlot | null)[]) {
    try { localStorage.setItem(SLOTS_KEY, JSON.stringify(next)); setSlots(next); setConfirm(null); return true; }
    catch { notify('浏览器存储空间不足，请先导出存档备份。'); return false; }
  }
  function exportSave() {
    const blob = new Blob([JSON.stringify({ format: 'shiguang-v3', game }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `拾光存档-${playerDisplayName(game)}-第${game.week + 1}周.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('存档已导出。把这个文件好好收藏，下次还可以导入。');
  }
  return <><div className="save-intro"><ShieldCheck size={28}/><p><strong>你的故事，只留在你的浏览器里。</strong>自动保存当前进度，损坏时尝试恢复最近备份。聊天、关系、故事选择和长期任务进度都会保存。</p></div><AutoBackups onLoad={onLoad}/><h3 className="manual-save-title">手动纪念存档</h3><div className="save-slot-list">{slots.map((slot, index) => <div key={index} className="save-slot"><div className="save-slot-icon"><GameIcon name={slot ? 'journal' : 'notes'} size={43}/><span>0{index + 1}</span></div><div className="save-slot-info"><h3>{slot ? `${playerDisplayName(slot.game)} · 第 ${Math.min(40, slot.game.week + 1)} 周` : '空白的故事书'}</h3><p>{slot ? `${new Date(slot.savedAt).toLocaleString('zh-CN')} / ${predictedScore(slot.game)} 分` : '把这一刻的青春，单独保存下来。'}</p></div><div className="save-slot-actions"><button className="secondary-button" onClick={() => { if (slot && confirm !== `save${index}`) { setConfirm(`save${index}`); return; } const next = [...slots]; next[index] = { game, savedAt: new Date().toISOString() }; if (saveSlots(next)) notify(`已保存到故事书 0${index + 1}。`); }}><Save size={14}/>{confirm === `save${index}` ? '确认覆盖' : '保存'}</button>{slot && <><button className="text-button" onClick={() => { if (confirm !== `load${index}`) { setConfirm(`load${index}`); return; } onLoad(slot.game); }}>{confirm === `load${index}` ? '确认读取' : '读取'}</button><button className="icon-button" aria-label={`删除存档${index + 1}`} onClick={() => { if (confirm !== `delete${index}`) { setConfirm(`delete${index}`); return; } const next = [...slots]; next[index] = null; if (saveSlots(next)) notify('这本故事书已清空，不影响当前进度。'); }}>{confirm === `delete${index}` ? <Check size={16}/> : <Trash2 size={16}/>}</button></>}</div></div>)}</div><div className="button-row save-file-buttons"><button className="secondary-button" onClick={exportSave}><Download size={17}/>导出当前存档</button><button className="secondary-button" onClick={() => fileInput.current?.click()}><Upload size={17}/>导入存档文件</button></div><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={async event => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; if (file.size > 512000) { notify('存档文件太大，请选择本游戏导出的 JSON 文件。'); return; } try { const loaded = validateGame(JSON.parse(await file.text())); if (!loaded) throw new Error('invalid'); onLoad(loaded); } catch { notify('这个文件不是有效的拾光存档，当前进度未被修改。'); } }}/><p className="fine-print">读取或导入会替换当前自动存档。重要进度请先手动保存或导出。</p></>;
}

function ExamPanel({ game, setGame, open }: Pick<Props, 'game' | 'setGame' | 'open'>) {
  const [index, setIndex] = useState(Math.min(game.examAnswers.length, EXAM_QUESTIONS.length - 1));
  const question = EXAM_QUESTIONS[index];
  const chosen = game.examAnswers[index];
  const answered = chosen !== undefined;
  return <div className="exam-panel"><div className="exam-stationery"><span>2026 · 普通高等学校招生全国统一考试</span><h3>属于你的最后一张试卷</h3><p>简化模拟卷 / 考生：{playerDisplayName(game)}</p></div><div className="exam-progress">{EXAM_QUESTIONS.map((item, itemIndex) => <span key={item.subject} className={itemIndex <= index ? 'active' : ''}>{game.examAnswers[itemIndex] !== undefined ? <Check size={14}/> : itemIndex + 1} {item.subject}</span>)}</div><motion.div key={index} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}><span className="little-label">第 {index + 1} 题 / 共 3 题</span><h4 className="exam-question">{question.question}</h4><div className="exam-options">{question.options.map((option, optionIndex) => <button className={`${chosen === optionIndex ? 'selected' : ''} ${answered && optionIndex === question.answer ? 'correct' : ''}`} key={option} disabled={answered} onClick={() => setGame(current => current.examAnswers[index] === undefined ? { ...current, examAnswers: [...current.examAnswers, optionIndex] } : current)}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}{answered && optionIndex === question.answer && <Check size={18}/>}</button>)}</div>{answered && <div className="exam-explanation"><strong>{chosen === question.answer ? '答对了，临场发挥 +4 分。' : '这道题留下了一点遗憾，没关系。'}</strong><p>{question.explanation}</p></div>}</motion.div><div className="exam-footer"><p>总成绩以平时学力为基础，结合状态与答题表现计算。<br/>这不是现实高考试题或成绩预测。</p><button className={primary} disabled={!answered} onClick={() => { if (index < 2) setIndex(index + 1); else { setGame(current => finishExam(current)); open('result'); } }}>{index < 2 ? '继续下一题' : '交卷，迎接夏天'}<ArrowRight size={17}/></button></div></div>;
}

function SettingsPanel({ settings, setSettings, notify, open }: Pick<Props, 'settings' | 'setSettings' | 'notify' | 'open'>) {
  const toggle = (key: 'sound' | 'music' | 'reducedMotion') => setSettings(current => ({ ...current, [key]: !current[key] }));
  return <><div className="settings-intro"><GameIcon name="tea" size={64}/><p>把声音调到舒服的大小，<br/>按自己的节奏，好好过这一年。</p></div>{([{ key: 'music', title: '校园背景音乐', subtitle: '原创合成钢琴旋律，点击后开始播放' }, { key: 'sound', title: '游戏交互音效', subtitle: '翻页、脚步、完成行动与校园铃声' }, { key: 'reducedMotion', title: '减少动态效果', subtitle: '关闭飘叶、漂浮和大幅度场景运动' }] as const).map(item => <div className="setting-row" key={item.key}><div><h3>{item.title}</h3><p>{item.subtitle}</p></div><button role="switch" aria-label={item.title} aria-checked={settings[item.key]} className={`toggle-switch ${settings[item.key] ? 'on' : ''}`} onClick={() => toggle(item.key)}><i/></button></div>)}<div className="volume-settings">{([{ key: 'musicVolume', name: '音乐音量' }, { key: 'effectsVolume', name: '音效音量' }] as const).map(item => <label key={item.key}><span><Volume2 size={15}/>{item.name}<b>{settings[item.key]}%</b></span><input type="range" min="0" max="100" step="1" value={settings[item.key]} onChange={event => setSettings(current => ({ ...current, [item.key]: Number(event.target.value) }))}/></label>)}</div><div className="button-row"><button className="secondary-button" onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else notify('当前浏览器不支持全屏，横屏也可以获得更好的体验。'); } catch { notify('浏览器没有允许全屏，请尝试使用浏览器的全屏按钮。'); } }}><Maximize size={16}/>切换全屏</button><button className="text-button" onClick={() => { setSettings(DEFAULT_SETTINGS); notify('已恢复默认设置。'); }}><RotateCcw size={15}/>恢复默认</button></div><button className="menu-return" onClick={() => open('menu')}>返回开始菜单 <ChevronRight size={15}/></button></>;
}

function EndingPanel({ game, setGame, open, onClose }: Pick<Props, 'game' | 'setGame' | 'open' | 'onClose'>) {
  const school = UNIVERSITIES.find(item => item.id === game.admittedId);
  const partner = game.social.partner ? CHARACTERS[game.social.partner] : null;
  const romanceEndings: Record<RomanceId, string> = {
    su: '苏晓把专门写给你的那一页夹进书里。你们约好了下一次共读，也约好遇到变化时认真沟通。',
    zhou: '周野弹完了那首曾经只弹一半的歌。毕业后的日历上，多了一个两个人都期待的见面日期。',
    zhixia: '知夏送来一张没有评分的人像。你们把河边写生写进暑假计划，留一些时间只用来相处。',
    xinghe: '星河把没画完的星图折进信封。各自向未来出发，也约好下一次一起看星星。',
    tangtang: '唐棠关掉广播，把最后那封信读给你一个人听。下一段日子里，依然想认真听见彼此。',
  };
  const title = !school ? '人生，不止一张通知书' : game.stats.autonomy >= 70 ? '终于，写下自己的答案' : game.stats.mood >= 60 ? '穿过题海，没有弄丢自己' : '走过这一年，已经很了不起';
  return <div className="ending-panel"><img className="ending-image" src={asset('images/graduation.jpg')} alt="三个朋友迎着阳光走出校门"/><div className="ending-content"><span className="little-label">终章 · 盛夏如约而至</span><h3>{title}</h3>{school ? <div className="admission-letter"><GameIcon name="university" size={58}/><span>录取通知书 <small>游戏纪念 · 非真实通知</small></span><h4>{school.name}</h4><p>{playerDisplayName(game)}同学：<br/>你已在本次模拟录取中被 <strong>{game.admittedMajor}</strong> 专业录取。</p><div className="admission-stamp">拾光<br/>留念</div></div> : <div className="alternative-ending"><p>这次模拟投档没有匹配上所填院校。失落是真的，但“一生就此结束”不是真的。</p><p>你仍然可以调整志愿，了解其他院校、职业教育或复读的实际条件。每条路都有成本，也都有继续生活的可能。</p></div>}<p className="system-epilogue">毕业没有让这一年的委屈自动消失。公开排名、被取消的休息和没有回复的意见都是真实的经历；校园不会因为这次离别就立刻改变。你可以带着遗憾走出去，也不必把承受过的压力称为幸福。</p><p className="ending-epilogue">{game.relations.su >= 60 ? '苏晓把那首诗重新誊了一遍，夹进你的行李。' : '苏晓在毕业留言里写：记得偶尔抬头看看天。'}{game.relations.zhou >= 60 ? '周野约好了暑假的第一场球。' : '周野发来一张笑得很傻的合影。'}{game.relations.mom >= 65 ? '妈妈问你想去哪儿庆祝，而不是下一个目标是多少分。' : '妈妈把切好的西瓜放在桌上。这一次，你们有很多时间慢慢聊。'}<br/><strong>你的人生，才刚刚开始。</strong></p>{partner && game.social.partner && <div className="romance-epilogue"><img src={imagePath(partner.image)} alt={partner.name}/><div><strong>和{partner.name}，慢慢同行</strong><p>{romanceEndings[game.social.partner]}</p></div></div>}<div className="ending-summary"><span>模拟高考 <b>{game.examScore}</b></span><span>一起走过 <b>{game.history.length}</b> 段故事</span><span>自主 <b>{game.stats.autonomy}</b></span></div><div className="button-row"><button className="primary-button" onClick={() => { const result = startLife(game); if (!result.error) { setGame(result.game); onClose(); } }}>{game.life.active ? "继续大学与社会人生" : "开启大学与社会人生"}<ArrowRight size={16}/></button>{!school && !game.graduate.unlocked && !game.life.active && <button className="secondary-button" onClick={() => { setGame(current => ({ ...current, phase: 'application' })); open('universities'); }}>调整志愿，模拟补录</button>}<button className={primary} onClick={onClose}>回校园再看一眼 <ArrowRight size={16}/></button><button className="secondary-button" onClick={() => open('graduate-romance')}>毕业后，重新认识老陈</button><button className="text-button" onClick={() => open('saves')}>保存这段青春</button></div></div></div>;
}

export default function GamePanels(props: Props) {
  const { panel, game, setGame, settings, setSettings, place, open, onClose, onAction, onStory, onStart, onNextWeek, onPlan, onChoice, onUse, onBuy, onGift, onLoad, notify } = props;
  const originalEvent = EVENTS.find(item => item.id === game.pendingEvent);
  const event = originalEvent && birthdayEventFor(game, originalEvent);
  let title = '';
  let subtitle = '';
  let className = '';
  let content;
  let closeable = true;
  switch (panel) {
    case 'play-reminder':
      title = '休息一会儿，也没关系'; className = 'play-reminder-modal'; content = <div className="play-reminder"><GameIcon name="tea" size={72}/><h3>已连续游玩约 {props.reminderMinutes} 分钟</h3><p>{props.saveHealthy ? '存档是自动的，可以放心。' : '当前自动存档未成功，请先导出进度。'}<br/>请合理安排学习与生活的时间。</p><p className="creator-note">—— 小喵喵</p><div className="button-row"><button className="primary-button" onClick={() => { props.onDismissReminder(); onClose(); }}>知道啦，照顾好自己</button><button className="text-button" onClick={() => { props.onDismissReminder(); open('saves'); }}>查看或导出存档</button></div></div>; break;
    case 'graduate-romance':
      title = '毕业以后，重新认识'; subtitle = '相处 / 主动表白 / 约定 / 跨月手记'; className = 'graduate-modal'; closeable = !game.graduate.pending; content = <GraduateRomancePanel game={game} setGame={setGame} notify={notify} onChat={() => props.onChat('teacher')}/>; break;
    case 'about':
      title = '关于这段人生'; content = <div className="about-panel"><h3>只要学不死，就往死里学</h3><p>一款讽刺高中排名崇拜、统一管理、形式主义与控制式养育的虚构校园模拟游戏。漂亮的校园不是对高压制度的赞美；友情和温柔，是人物在压力中保留下来的东西。</p><p>主线包含家校施压、隐私侵犯、休息被挤占和没有立刻得到回应的申诉。人物与学校均为虚构，游戏分数不代表现实录取结果。</p><p>毕业后开放大学与社会地图，继续面对学历筛选、漫长工时、医疗账单和家庭照护。年龄与身体习惯持续推进；一段人生之后，也能继续孩子的生活。</p><p>每 30 分钟会提醒休息，进度自动保存于本浏览器。清理浏览器数据前请导出存档。</p><p>版本 v{import.meta.env.APP_VERSION}</p><a href="https://github.com/B5-Software/zhiyaoxuebusi" target="_blank" rel="noreferrer">项目与更新记录</a><p className="creator-credit">Created by 小喵喵</p></div>; break;
    case 'romance':
      title = '把心事，认真说给你听'; subtitle = '我们的故事 / 相处 / 约定 / 回忆'; className = 'romance-modal'; content = <RomancePanel game={game} setGame={setGame} audience={props.audience} initialContact={props.chatContact && isRomanceId(props.chatContact) ? props.chatContact : undefined} onGift={onGift} onChat={props.onChat} onVisit={props.onVisitPlace} onQuests={() => open('quests')} notify={notify}/>; break;
    case 'quests':
      title = '把想做的事，写进这一年'; subtitle = '主线 / 长期任务 / 地图支线 / 角色任务'; className = 'quests-modal'; content = <QuestBoard game={game} setGame={setGame} onNavigate={props.onNavigateTask} notify={notify}/>; break;
    case 'start':
      title = '人生的哪一页，由你选择'; className = 'start-modal new-game-modal'; content = <NewGamePanel game={game} onStart={onStart}/>; break;
    case 'menu':
      title = '稍微停一停，也没关系'; className = 'menu-modal'; content = <><div className="main-menu-art"><img src={asset('images/campus.jpg')} alt="拾光校园"/><div className="main-menu-logo"><span>只要学不死</span><strong>就往死里学</strong><small>西安 · 高三生存物语</small></div></div><div className="menu-actions"><button className={primary} onClick={() => game.started ? onClose() : open('start')}><Play size={18}/>{game.started ? game.life.active ? '继续我的人生' : '继续这段青春' : '开启人生故事'}</button>{game.started && <button className="secondary-button" onClick={() => open('new-confirm')}>开始一个新故事</button>}<div><button onClick={() => open('saves')}><Save size={16}/>存档故事</button><button onClick={() => open('settings')}><Volume2 size={16}/>声音与设置</button><button onClick={() => open('help')}><GameIcon name="book" size={21}/>游玩说明</button></div><button className="text-button" onClick={() => open('about')}>关于游戏 · Created by 小喵喵</button><p>努力很重要。但你，也很重要。</p></div></>; break;
    case 'new-confirm':
      title = '翻开一本新的故事书？'; className = 'small-modal'; content = <div className="confirm-new"><GameIcon name="journal" size={83}/><p>新故事会替换当前自动存档。<br/>如果想留住这段青春，请先手动保存或导出。</p><div className="button-row"><button className="secondary-button" onClick={() => open('saves')}>先去存档</button><button className={primary} onClick={() => open('start')}>开始新故事 <ArrowRight size={15}/></button></div></div>; break;
    case 'settings':
      title = '把节奏交还给自己'; subtitle = '声音与游戏设置'; className = 'small-modal'; content = <><SettingsPanel settings={settings} setSettings={setSettings} notify={notify} open={open}/><div className="audience-settings"><h3>内容设置</h3><p>当前：{props.audience.age === 'adult' ? '已成年' : '未成年 · 成人向入口已隐藏'}</p><button className="secondary-button" onClick={() => open('age')}>重新选择年龄范围</button>{props.audience.age === 'adult' && <label><input type="checkbox" checked={props.audience.skipPrivate} onChange={event => props.setAudience(current => ({ ...current, skipPrivate: event.target.checked }))}/>自动跳过成人向私人剧情</label>}</div></>; break;
    case 'saves':
      title = '把青春好好存起来'; subtitle = '本地存档 / 三本独立的故事书'; content = <SavePanel game={game} onLoad={onLoad} notify={notify}/>; break;
    case 'event':
      if (!event) return null;
      title = event.title; className = 'story-modal'; closeable = false; content = <StoryPanel key={event.id} event={event} game={game} onChoice={onChoice}/>; break;
    case 'location':
      title = place.name; subtitle = place.subtitle; className = 'location-modal'; content = <><div className="location-banner"><img src={imagePath(place.image)} alt={place.name}/><span><GameIcon name={place.icon} size={32}/>{place.name} · {gameDate(game)}</span></div><div className="location-map-navigation"><button className="text-button" onClick={onClose}>返回区域小地图</button><button className="text-button" onClick={() => open('world-map')}>打开大地图 <ArrowRight size={14}/></button></div><LocationAppointments game={game} placeId={place.id} onMeet={props.onMeet} onChat={props.onChat}/><LocationRomance game={game} placeId={place.id} audience={props.audience} onOpen={props.onRomance}/><LocationStories game={game} place={place} onStory={onStory}/>{place.id === 'shop' ? <div className="location-shopping"><InventoryPanel game={game} onBuy={onBuy} onUse={onUse} shop/></div> : <div className="location-actions"><p className="little-label">想在这里做点什么？<span>本周剩余 {3 - game.actions} 次行动</span></p>{place.actions.map(id => { const action = ACTIONS.find(item => item.id === id)!; return <button className="activity-option" key={id} disabled={game.started && !!canAct(game, action)} title={game.started ? canAct(game, action) ?? action.description : action.description} onClick={() => onAction(id)}><GameIcon name={action.icon} size={45}/><span><strong>{action.name}</strong><small>{action.description}</small><em>{effectSummary(actionEffect(game, action)).slice(0, 3).join(' / ')}</em></span><ChevronRight size={19}/></button>; })}{place.id === 'classroom' && <button className="full-button text-button" onClick={() => open('study')}>选择其他学科专项学习 <ArrowRight size={15}/></button>}</div>}</>; break;
    case 'study':
      title = '今天，学点什么？'; subtitle = '进步不必轰轰烈烈，一点一点就很好。'; content = <><div className="study-topline"><span>本周还可以安排 <b>{3 - game.actions}</b> 次行动</span><span><GameIcon name="energy" size={22}/>体力 {game.stats.energy} / 100</span></div><div className="study-grid">{SUBJECTS.map(subject => { const action = ACTIONS.find(item => item.id === subject.id)!; return <button className="subject-study" style={{ '--subject-color': subject.color } as React.CSSProperties} key={subject.id} onClick={() => onAction(subject.id)}><span className="subject-mark">{subject.name.slice(0, 1)}</span><div><h3>{subject.name}</h3><p>{subject.note}</p><div className="progress-track"><i style={{ width: `${game.subjects[subject.id] / subject.max * 100}%`, background: subject.color }}/></div><small>{Math.round(game.subjects[subject.id])} / {subject.max} <span>体力 {actionEffect(game, action).energy}</span></small></div><ChevronRight size={16}/></button>; })}</div><div className="study-alternatives">{['balanced', 'review', 'read'].map(id => { const action = ACTIONS.find(item => item.id === id)!; return <button className="secondary-button" key={id} onClick={() => onAction(id)}><GameIcon name={action.icon} size={27}/>{action.name}</button>; })}</div><p className="panel-tip"><Heart size={15}/>学习不只消耗体力。压力高时，先休息一下，反而学得更好。</p></>; break;
    case 'bag':
      title = '书包里的小小宇宙'; subtitle = '一点补给，一点关心，装着继续向前的力气。'; content = <InventoryPanel game={game} onBuy={onBuy} onUse={onUse}/>; break;
    case 'relations':
      title = '幸好，这一年有你们'; subtitle = '有些关系，比排名更值得经营。'; content = <div className="relationships-grid">{(Object.entries(CHARACTERS) as [CharacterId, typeof CHARACTERS[CharacterId]][]).map(([id, character]) => <article className="relationship" key={id}><div className="relationship-top"><img src={imagePath(character.image)} alt={character.name}/><div><h3>{character.name}</h3><span>{character.role}</span><small><Heart size={12}/>{game.relations[id] >= 70 ? '彼此信任' : game.relations[id] >= 45 ? '渐渐熟悉' : '故事刚开始'} · {game.relations[id]}</small></div></div><BirthdayHint game={game} id={id} onVisit={props.onVisitPlace}/><p>{character.description}</p><blockquote>“{character.quote}”</blockquote>{id === 'teacher' && <button className="relationship-message" onClick={() => open('graduate-romance')}><Heart size={14}/>毕业后缘分 · 相处 / 主动表白</button>}{isRomanceId(id) && <div className="relationship-bonds"><button className="relationship-message" onClick={() => props.onRomance(id)}><Heart size={14}/>心事 · 主动表白 / 恋爱界面</button><strong>{bondStage(game, id)}</strong><span>信任 {game.social.bonds[id].trust} · 心动 {game.social.bonds[id].affection} · 了解 {game.social.bonds[id].understanding}</span></div>}<div className="progress-track"><i style={{ width: `${game.relations[id]}%` }}/></div><button className="relationship-message" onClick={() => props.onChat(id)}>发消息 · 选择回复 <ArrowRight size={14}/></button><div className="relationship-actions"><button className="secondary-button" onClick={() => onAction(id)}>聊聊天 <span>1 行动</span></button><button className="gift-button" title="送一盒牛奶，不消耗行动，同龄角色每周收一次礼物" onClick={() => onGift(id)}><Gift size={16}/>送牛奶</button></div></article>)}</div>; break;
    case 'messages':
      title = '消息里的拾光'; subtitle = '有些靠近，从一句认真回复开始。'; className = 'messenger-modal';
      content = <Messenger game={game} setGame={setGame} open={open} onReply={props.onReply} onInitiate={props.onInitiate} onGift={onGift} onAction={onAction} onVisitPlace={props.onVisitPlace} onConfess={props.onConfess} initialContact={props.chatContact} onRomance={props.onRomance}/>; break;
    case 'journal':
      title = '那些不在考纲里的事'; subtitle = '收好每一个普通，却只属于我们的瞬间。'; content = <JournalPanel game={game} onScene={props.onScene}/>; break;
    case 'universities':
      title = game.phase === 'application' ? '下一站，由你来决定' : '世界这么大，去看看吧'; subtitle = '大学图鉴 / 全国篇'; className = 'university-modal'; content = <UniversityPanel game={game} setGame={setGame} open={open} notify={notify}/>; break;
    case 'profile':
      title = '比昨天的自己，更近一步'; content = <ProfilePanel game={game} setGame={setGame} notify={notify}/>; break;
    case 'schedule':
      title = '这一周，慢慢安排'; subtitle = `第 ${Math.min(40, game.week + 1)} 周 / 距离高考还有 ${daysRemaining(game)} 天`; content = <><div className="schedule-intro"><GameIcon name="calendar" size={66}/><p>每一周浓缩成三个关键时刻。<br/>学习之外，别忘了把休息也写进计划。</p></div><div className="weekly-plan">{['周初 · 种下一点希望', '周中 · 按自己的节奏', '周末 · 照顾好自己'].map((label, index) => <label key={label} className={index < game.actions ? 'plan-done' : ''}><span className="plan-number">{index < game.actions ? <Check size={16}/> : `0${index + 1}`}</span><div><strong>{label}</strong><select aria-label={label} value={index < game.actions ? game.weeklyActions[index] : game.plan[index]} disabled={index < game.actions || game.phase !== 'school'} onChange={event => setGame(current => ({ ...current, plan: current.plan.map((id, i) => i === index ? event.target.value : id) }))}>{ACTIONS.map(action => <option key={action.id} value={action.id}>{action.name}</option>)}</select></div><GameIcon name={index < game.actions ? 'leaf' : 'notes'} size={35}/></label>)}</div><p className="panel-tip">计划会完成本周剩余行动。体力或零花钱不足时，自动改为休息，不会透支你。</p><button className={`${primary} full-button`} disabled={game.actions >= 3 || game.phase !== 'school'} onClick={onPlan}><Play size={16}/>按计划度过这一周</button><BirthdayCalendar game={game} onVisit={props.onVisitPlace}/></>; break;
    case 'achievements':
      title = '了不起的，不只有高分'; subtitle = `已点亮 ${getAchievements(game).filter(item => item.unlocked).length} / ${getAchievements(game).length} 枚青春纪念章`; content = <div className="achievements-list">{getAchievements(game).map(achievement => <div key={achievement.id} className={achievement.unlocked ? 'unlocked' : 'locked'}><div className="medal-art"><GameIcon name={achievement.icon} size={57}/>{!achievement.unlocked && <LockKeyhole size={15}/>}</div><div><h3>{achievement.name}</h3><p>{achievement.description}</p></div>{achievement.unlocked && <Check size={17}/>}</div>)}</div>; break;
    case 'week':
      title = '给这一周，画个小小的句号'; subtitle = `第 ${game.week + 1} 周的拾光手记`; className = 'small-modal'; content = <div className="week-summary"><GameIcon name="moon" size={83}/><h3>{game.actions === 3 ? '今天也认真生活了呢。' : '有些空白，也可以留给生活。'}</h3><ul>{game.weeklyActions.map((id, index) => <li key={`${id}-${index}`}><Check size={15}/>{ACTIONS.find(action => action.id === id)?.name}</li>)}</ul>{game.actions < 3 && <p className="week-warning">本周还剩 {3 - game.actions} 次行动。进入下一周后，未用的行动不会保留。</p>}<div className="week-recovery"><span>体力 +28</span><span>压力 -5</span><span>生活费 +40 元</span></div><p>周末会自然恢复状态，也会迎来新的故事。<br/>{game.week === 39 ? '下一站，就是高考了。你已经走了很远。' : '没完成的事，不需要全部带到梦里。'}</p><button className={`${primary} full-button`} onClick={onNextWeek}>{game.week === 39 ? '准备好了，走进考场' : '收好这一周，继续向前'}<ArrowRight size={17}/></button><button className="text-button" onClick={onClose}>再逛一会儿</button></div>; break;
    case 'exam':
      title = '笔落下，是答案；笔放下，是夏天'; className = 'exam-modal'; closeable = false; content = <ExamPanel game={game} setGame={setGame} open={open}/>; break;
    case 'result':
      title = '交卷了，夏天开始了'; content = <div className="exam-result"><img src={asset('images/graduation.jpg')} alt="阳光下的毕业时刻"/><div><GameIcon name="letter" size={58}/><span className="little-label">{playerDisplayName(game)}的模拟高考成绩</span><strong className="exam-score">{game.examScore}<small> / 750</small></strong><h3>你已经走过了，那些曾经以为走不过的日子。</h3><p>平时学力 {predictedScore(game)} 分，答对 {game.examAnswers.filter((answer, index) => answer === EXAM_QUESTIONS[index].answer).length} 道题。<br/>临场成绩还会受到压力、心情与健康的影响。结果仅供游戏体验。</p><button className={primary} onClick={() => open('universities')}>去填写属于我的志愿 <ArrowRight size={17}/></button></div></div>; break;
    case 'ending':
      title = '这一页，写着我们的青春'; className = 'ending-modal'; content = <EndingPanel game={game} setGame={setGame} open={open} onClose={onClose}/>; break;
    case 'help':
      title = '入学小手册'; subtitle = '欢迎来到长安拾光中学'; content = <div className="help-content"><TutorialCatalogue/><GameIcon name="school" size={78}/><h3>这是一场高三生存模拟，也是一份对高压制度的讽刺。</h3><p>你是在西安读高三的学生。故事从 2025 年 9 月开始，经历 40 个浓缩周，走到 2026 年 6 月的模拟高考。游戏中的长安拾光中学与所有人物均为虚构。主线里，排名公示、强制打卡、家校施压和被搁置的申诉会带来真实的状态代价；选择不能保证立刻改变规则。</p><h4>在校园里生活</h4><p>点击左上角或底部的“大地图”，选择 9 个区域，再点击小地图上的地点探索。地图切换不消耗行动；进入每段地点故事消耗 1 次行动，行动用完后地图标记会隐藏；青春手帐的“支线进度”会提示后续地点与周次。每周可以安排 3 次关键行动，学习提升学力，运动、休息与交谈缓解压力。使用背包物品、送礼和浏览大学不消耗行动。点击右下角结束本周，恢复体力并领取生活费。</p><h4>主线与长期任务</h4><p>地图左侧“任务手帐”或右侧“任务”进入任务系统。长期任务分筹备、执行、收尾，至少需要 5 个游戏周及 5 次投入；每周同一任务投入一次行动，满足时间与剧情条件后，在结束本周时推进。任务、追踪和投入记录会自动保存，不会在周末重置。</p><h4>消息与关系</h4><p>底部“消息”进入拾光通讯，收到消息后可以选择回复，也可以切到“主动发消息”选择专属话题。全部 5 位攻略对象均可主动联系，每位联系人每周可开启一段新话题；已经聊过的话题不会重复。5 位同龄角色各有信任、心动、了解与见面记录；友情和恋爱都能继续故事。主角与五位攻略对象在开场均已满 18 岁；首次进入会单独确认玩家年龄。心事界面可以主动表白，需要信任 60、心动 55、了解 30、两个不同周的见面及一次专属心事经历。恋爱后有六段跨周专属剧情、六周长任务、约会、跟随、回家做客、亲手制作礼物、冷静与分手。成人向私人时间仅对成年玩家显示，每次先确认 NSFW 提示，也可以无损跳过，叙事只用转场留白。在聊天里点击“约见”发送邀请，约好后通过待赴约卡片到达具体地点，再点击“赴约”进入专属剧情。约见会跨周保留；赴约消耗 1 次行动，回复消息不消耗行动；同龄角色每周收一次礼物，喜欢的礼物会有不同的回应。</p><h4>记得，你不是一台做题机器</h4><p>体力低于 25、压力超过 75 时，学习效率降低。学科熟练度越高，进步越慢。健康过低会触发休养支持，而不是惩罚。自主意识和人际关系会改变毕业叙事。</p><h4>从高考走到自己的选择</h4><p>第 40 周结束后参加 3 题简化考试，成绩由学力、状态与答题表现计算。大学图鉴可随时收藏最多 5 个院校与专业志愿；出分后按志愿顺序与游戏门槛模拟录取。</p><h4>把故事留住</h4><p>每次行动、剧情、聊天与任务推进后自动保存到本机浏览器，并滚动保留最近 6 个恢复点。v1 / v2 旧档会自动升级为 v3，恋爱、人物位置与跟随进度一同保存。年龄与成人内容偏好独立保存，导入存档不会改变。设置中可管理音乐、音效和动画。菜单里可使用 3 个独立存档槽，也可导入、导出 JSON 存档。清理浏览器数据前请先导出。</p><button className="secondary-button" onClick={() => open('about')}>关于游戏与创作者</button><h4>关于真实与虚构</h4><p>本作以虚构人物讽刺排名崇拜、控制式养育、形式主义与压抑表达的权力结构，不指向具体高中。{UNIVERSITIES.length} 所大学的公开简介在图鉴中链接至学校官网；游戏门槛并非真实录取线，专业展示不等于当年招生计划。现实填报请使用官方招生资料。</p><div className="help-footer"><GameIcon name="heart" size={28}/><span>努力很重要。你的健康、尊严和选择，同样重要。</span></div><p className="fine-print">本地单人游戏 · 原创生成美术素材 · {EVENTS.length} 段可选择剧情<br/>所有核心资源随应用提供；首次加载后可在本浏览器离线使用。大学官网外链需联网。</p></div>; break;
  }
  return <Modal title={title} subtitle={subtitle || undefined} className={className} onClose={onClose} closeable={closeable}>{content}</Modal>;
}
