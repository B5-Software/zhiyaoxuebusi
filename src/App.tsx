import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, MotionConfig, motion, useMotionValue } from 'motion/react';
import { ArrowRight, CalendarDays, ChevronRight, Clock3, Compass, Heart, Leaf, MapPin, Minus, MousePointer2, Plus, RotateCcw, Settings2, Sun, Volume2, VolumeX, X } from 'lucide-react';
import GameIcon from './components/GameIcon';
import GamePanels from './components/GamePanels';
import WorldMap from './components/WorldMap';
import { TaskHud } from './components/QuestBoard';
import MapTaskIndicators from './components/MapTaskIndicators';
import { getMapTaskTargets } from './game/mapTasks';
import { playerDisplayName, playerNameError, playerText } from './game/player';
import { recordPlaceVisit } from './game/quests';
import { DEFAULT_MAP_ZOOM, MAX_MAP_ZOOM, MIN_MAP_ZOOM, mapDragBounds } from './game/mapView';
import { ACTIONS, ITEMS, LITTLE_NOTES, PLACES, REGION_BY_ID, UNIVERSITIES, imagePath, type Place } from './game/data';
import { asset } from './utils/asset';
import { audio } from './game/audio';
import { SETTINGS_KEY, actionEffect, advanceWeek, applyEffect, beginMapStory, canAct, confirmRelationship, createGame, dateFor, daysRemaining, effectSummary, eventLock, getAchievements, giveCharacterGift, loadGame, loadSettings, performAction, persistGame, placeStories, predictedScore, initiateMessage, replyMessage, resolveEvent } from './game/engine';
import { deliverMessages, unreadCount } from './game/social';
import type { CharacterId, GameState, IconName, Panel, QuestTarget, RomanceId, Scene } from './game/types';

function ResourceMeter({ icon, label, value, color, onClick }: { icon: IconName; label: string; value: number; color: string; onClick: () => void }) {
  return <button className="resource-meter" onClick={onClick} aria-label={`${label} ${value}，查看成长状态`}><GameIcon name={icon} size={35}/><span className="resource-content"><span><b>{label}</b><strong>{value}<small>/100</small></strong></span><span className="resource-track"><motion.i animate={{ width: `${value}%` }} style={{ background: color }} transition={{ type: 'spring', damping: 25, stiffness: 140 }}/></span></span></button>;
}

const NAV_ITEMS: { id: string; name: string; icon: IconName; panel?: Panel; scene?: Scene }[] = [
  { id: 'world-map', name: '大地图', icon: 'leaf', panel: 'world-map' },
  { id: 'study', name: '学习', icon: 'book', panel: 'study' },
  { id: 'bag', name: '背包', icon: 'bag', panel: 'bag' },
  { id: 'messages', name: '消息', icon: 'friends', panel: 'messages' },
  { id: 'journal', name: '青春手帐', icon: 'journal', panel: 'journal' },
  { id: 'universities', name: '大学图鉴', icon: 'university', panel: 'universities' },
  { id: 'home', name: '我的小家', icon: 'home', scene: 'home' },
];

export default function App() {
  const [game, setGame] = useState<GameState>(loadGame);
  const [settings, setSettings] = useState(loadSettings);
  const [panel, setPanel] = useState<Panel>(game.phase === 'exam' ? 'exam' : null);
  const [scene, setScene] = useState<Scene>('campus');
  const [place, setPlace] = useState<Place>(PLACES[0]);
  const [chatContact, setChatContact] = useState<CharacterId | undefined>();
  const [zoom, setZoom] = useState(DEFAULT_MAP_ZOOM);
  const viewportRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ width: 1200, height: 680, layerWidth: 1200, layerHeight: 802, layerLeft: 0, layerTop: -61 });
  const [footerHeight, setFooterHeight] = useState(129);
  const [avatar, setAvatar] = useState({ x: 54, y: 74 });
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [saved, setSaved] = useState(true);
  const [speech, setSpeech] = useState('新同学，你来啦！新学期的第一天，先去教室看看吧。这一年，也要记得好好照顾自己哦。');
  const [dialogueExpanded, setDialogueExpanded] = useState(false);
  const toastId = useRef(0);
  const actionLock = useRef(false);
  const dragging = useRef(false);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const effectivePanel: Panel = game.pendingEvent ? 'event' : panel;
  const dragBounds = mapDragBounds(mapSize, { width: mapSize.layerWidth, height: mapSize.layerHeight }, zoom);
  const target = UNIVERSITIES.find(school => school.id === game.targetSchool)!;
  const score = predictedScore(game);
  const date = dateFor(game);
  const achievementCount = getAchievements(game).filter(achievement => achievement.unlocked).length;
  const region = REGION_BY_ID[scene];
  const unread = unreadCount(game);
  const taskPlaceIds = new Set(getMapTaskTargets(game).map(target => target.placeId));

  const notify = useCallback((text: string) => { setToast({ id: ++toastId.current, text }); }, []);
  const open = useCallback((next: Panel) => { setPanel(next); if (next) audio.play('open'); }, []);
  const close = useCallback(() => setPanel(null), []);

  useEffect(() => { setSaved(persistGame(game)); }, [game]);
  useEffect(() => {
    const view = viewportRef.current;
    const layer = layerRef.current;
    if (!view || !layer) return;
    const measure = () => {
      setMapSize({ width: view.clientWidth, height: view.clientHeight, layerWidth: layer.offsetWidth, layerHeight: layer.offsetHeight, layerLeft: layer.offsetLeft, layerTop: layer.offsetTop });
      setFooterHeight(Math.max(0, window.innerHeight - view.getBoundingClientRect().bottom));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(view); observer.observe(layer); measure();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    dragX.set(Math.max(dragBounds.left, Math.min(dragBounds.right, dragX.get())));
    dragY.set(Math.max(dragBounds.top, Math.min(dragBounds.bottom, dragY.get())));
  }, [dragBounds.left, dragBounds.right, dragBounds.top, dragBounds.bottom, dragX, dragY]);
  useEffect(() => {
    audio.configure(settings);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Game progress can still be exported if browser storage is unavailable. */ }
  }, [settings]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.text.length > 65 ? 7500 : 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const visibility = () => audio.visibility(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);

  function ensurePlaying() {
    if (!game.started) { open('start'); return false; }
    if (game.phase !== 'school') { open(game.phase === 'exam' ? 'exam' : game.phase === 'application' ? 'universities' : 'ending'); return false; }
    return true;
  }

  function doAction(id: string) {
    if (!ensurePlaying() || actionLock.current) return;
    const result = performAction(game, id);
    if (result.error) { notify(result.error); return; }
    actionLock.current = true;
    setTimeout(() => { actionLock.current = false; }, 350);
    setGame(result.game);
    setPanel(null);
    setSpeech(id === 'rest' || id === 'nap' ? '你看，休息之后，世界是不是也明亮了一点？好好生活也是一种了不起的努力。' : id === 'su' ? '谢谢你愿意听我说。等高考结束，我们一起去看看书里写的那些地方吧。' : result.message);
    const selected = ACTIONS.find(action => action.id === id)!;
    notify(`${result.message} ${effectSummary(actionEffect(game, selected)).slice(0, 2).join(' / ')}`);
    audio.play('success');
  }

  function start(name: string, difficulty: GameState['difficulty'], targetSchool: string) {
    const error = playerNameError(name);
    if (error) { notify(error); return; }
    setGame(deliverMessages({ ...createGame(), started: true, name: name.trim(), nameIsCustom: true, difficulty, targetSchool, pendingEvent: 'first-day' }));
    setPanel(null); setScene('campus');
    setZoom(DEFAULT_MAP_ZOOM); dragX.set(0); dragY.set(0); setAvatar({ x: 54, y: 74 });
    setSpeech('{{player}}，欢迎加入高三（3）班！去做一点喜欢的事吧，我会一直在这里。');
    audio.play('bell');
  }

  function nextWeek() {
    if (!ensurePlaying()) return;
    const next = advanceWeek(game);
    setGame(next); setPanel(next.phase === 'exam' ? 'exam' : null); setScene('campus');
    setZoom(DEFAULT_MAP_ZOOM); dragX.set(0); dragY.set(0); setAvatar({ x: 54, y: 74 });
    setSpeech(LITTLE_NOTES[next.week % LITTLE_NOTES.length]);
    notify(next.phase === 'exam' ? '准考证带好了吗？放轻松，你已经为这一刻准备了很久。' : '新的一周，慢慢来。生活费 +40 元，体力 +28，压力 -5。');
    audio.play('bell');
  }

  function runPlan() {
    if (!ensurePlaying()) return;
    let next = game;
    let substitutions = 0;
    for (let index = game.actions; index < 3; index++) {
      let action = ACTIONS.find(item => item.id === next.plan[index])!;
      if (canAct(next, action)) { action = ACTIONS.find(item => item.id === 'rest')!; substitutions++; }
      next = performAction(next, action.id).game;
    }
    setGame(next); setPanel(null);
    setSpeech('计划完成啦。没必要把每一分钟都塞满，现在可以安心收好这一周了。');
    notify(`本周计划已完成${substitutions ? `，其中 ${substitutions} 次行动改为休息，优先照顾身体` : ''}。点击“结束本周”迎接新的故事。`);
    audio.play('success');
  }

  function choose(index: number) {
    const result = resolveEvent(game, index);
    if (result.game.pendingEvent) { notify(result.message); return; }
    setGame(result.game); setPanel(null); setSpeech(result.message);
    audio.play('page');
    notify('这一段故事已经收进青春手帐。每一个选择，都在慢慢成为你。');
  }

  function useItem(id: string) {
    if (!ensurePlaying()) return;
    const item = ITEMS.find(entry => entry.id === id);
    if (!item || !game.inventory[id]) { notify('这个物品已经用完啦，去小卖部补充一点吧。'); return; }
    setGame(current => current.inventory[id] > 0 ? { ...applyEffect(current, item.effect), inventory: { ...current.inventory, [id]: current.inventory[id] - 1 } } : current);
    notify(`使用了${item.name}。${effectSummary(item.effect).join(' / ')}`); audio.play('success');
  }

  function buyItem(id: string) {
    if (!ensurePlaying()) return;
    const item = ITEMS.find(entry => entry.id === id);
    if (!item || game.stats.money < item.price) { notify('零花钱不够了，下周再来看看吧。'); return; }
    setGame(current => current.stats.money >= item.price ? { ...applyEffect(current, { money: -item.price }), inventory: { ...current.inventory, [id]: current.inventory[id] + 1 } } : current);
    notify(`${item.name}已经放进书包，零花钱 -${item.price} 元。`); audio.play('success');
  }

  function gift(id: CharacterId, itemId = 'milk') {
    if (!ensurePlaying()) return;
    if (actionLock.current) return;
    const result = giveCharacterGift(game, id, itemId);
    if (result.error) { notify(result.error); return; }
    actionLock.current = true; setTimeout(() => { actionLock.current = false; }, 350);
    setGame(result.game); notify(result.message!); audio.play('success');
  }

  function reply(script: string, index: number) {
    if (!ensurePlaying() || actionLock.current) return;
    const result = replyMessage(game, script, index);
    if (result.error) { notify(result.error); return; }
    actionLock.current = true; setTimeout(() => { actionLock.current = false; }, 350);
    setGame(result.game); notify(result.message!); audio.play('page');
  }

  function confess(id: RomanceId) {
    const result = confirmRelationship(game, id);
    if (result.error) { notify(result.error); return; }
    setGame(result.game); notify('你们认真回应了彼此，开始了恋爱路线。'); audio.play('success');
  }

  function chat(id: CharacterId) { setChatContact(id); open('messages'); }

  function changeScene(nextScene: Scene) {
    setScene(nextScene); setPanel(null); setZoom(DEFAULT_MAP_ZOOM); dragX.set(0); dragY.set(0);
    setPlace(PLACES.find(location => location.scene === nextScene)!);
    setAvatar(nextScene === 'home' ? { x: 52, y: 76 } : { x: 54, y: 74 });
    setSpeech(REGION_BY_ID[nextScene].greeting);
    audio.play('step');
  }

  function visit(location: Place, viewZoom = zoom) {
    if (dragging.current) return;
    setPlace(location); setAvatar({ x: location.x, y: location.y + 8 });
    setGame(current => recordPlaceVisit(current, location.id));
    const limits = mapDragBounds(mapSize, { width: mapSize.layerWidth, height: mapSize.layerHeight }, viewZoom);
    dragX.set(Math.max(limits.left, Math.min(limits.right, (0.5 - location.x / 100) * mapSize.layerWidth * viewZoom)));
    dragY.set(Math.max(limits.top, Math.min(limits.bottom, (0.5 - location.y / 100) * mapSize.layerHeight * viewZoom)));
    open('location');
  }

  function readMapStory(id: string) {
    if (!ensurePlaying()) return;
    const result = beginMapStory(game, id);
    if (result.error) { notify(result.error); return; }
    setGame(result.game); setPanel(null); audio.play('page');
  }

  function initiate(topicId: string) {
    if (!ensurePlaying() || actionLock.current) return;
    const result = initiateMessage(game, topicId);
    if (result.error) { notify(result.error); return; }
    actionLock.current = true; setTimeout(() => { actionLock.current = false; }, 350);
    setGame(result.game); notify(result.message!); audio.play('page');
  }

  function navigateTask(target: QuestTarget) {
    if (target.character) { chat(target.character); return; }
    if (target.placeId) {
      const location = PLACES.find(place => place.id === target.placeId);
      if (location) { changeScene(location.scene); visit(location, DEFAULT_MAP_ZOOM); }
      return;
    }
    let next = target.panel ?? 'quests';
    if (!game.started && next !== 'world-map') next = 'start';
    if (next === 'week' && game.phase !== 'school') next = game.phase === 'exam' ? 'exam' : game.phase === 'application' ? 'universities' : 'ending';
    if (next === 'exam' && game.examScore !== null) next = 'result';
    open(next);
  }

  function load(loaded: GameState) {
    setGame(deliverMessages(loaded)); setPanel(loaded.phase === 'exam' ? 'exam' : null); setScene('campus');
    setZoom(DEFAULT_MAP_ZOOM); dragX.set(0); dragY.set(0); setAvatar({ x: 54, y: 74 });
    notify(`欢迎回来，${loaded.name}。你的故事已经接着上一页继续了。`); audio.play('page');
  }

  function advanceButton() {
    if (!game.started) { open('start'); return; }
    open(game.phase === 'school' ? 'week' : game.phase === 'exam' ? 'exam' : game.phase === 'application' ? 'universities' : 'ending');
  }

  return <MotionConfig reducedMotion={settings.reducedMotion ? 'always' : 'user'}><div className={`game-app ${settings.reducedMotion ? 'reduced-motion' : ''}`} style={{ '--footer-height': `${footerHeight}px` } as CSSProperties} onPointerDown={() => audio.wake()} onClickCapture={event => { if ((event.target as HTMLElement).closest('button')) audio.play('click'); }}>
    <div className="game-shell" inert={!!effectivePanel}>
      <header className="game-header">
        <button className="brand" onClick={() => open('menu')} aria-label="只要学不死，就往死里学，打开开始菜单"><div className="brand-illustration"><GameIcon name="school" size={58}/><span className="brand-spark one"/><span className="brand-spark two"/></div><span className="brand-lettering"><span>只要学不死<span className="brand-comma">，</span></span><strong>就往死里学<span className="brand-leaf"><Leaf size={17}/></span></strong></span></button>
        <div className="brand-subtitle"><span>西安 · 高三生存物语</span><small>A LITTLE SCHOOL LIFE</small></div>
        <div className="resources"><ResourceMeter icon="heart" label="体力" value={game.stats.energy} color="#d09180" onClick={() => open('profile')}/><ResourceMeter icon="smile" label="心情" value={game.stats.mood} color="#c5ac66" onClick={() => open('profile')}/><ResourceMeter icon="energy" label="压力" value={game.stats.stress} color={game.stats.stress > 75 ? '#ca8d77' : '#99a789'} onClick={() => open('profile')}/><button className="money-resource" onClick={() => open('bag')} aria-label={`零花钱 ${game.stats.money} 元，打开背包`}><GameIcon name="coin" size={38}/><span><small>零花钱</small><strong><span>¥</span> {game.stats.money}</strong></span><span className="money-plus" aria-hidden="true"><Plus size={12} strokeWidth={1.7}/></span></button></div>
        <div className="header-tools"><button className="header-tool" onClick={() => setSettings(current => ({ ...current, sound: !current.sound, music: !current.sound }))} aria-label={settings.sound ? '关闭音乐和音效' : '打开音乐和音效'} title={settings.sound ? '关闭声音' : '开启声音'}>{settings.sound ? <Volume2 size={21}/> : <VolumeX size={21}/>}</button><button className="header-tool" onClick={() => open('settings')} aria-label="游戏设置" title="游戏设置"><Settings2 size={21}/></button></div>
      </header>

      <main className={`world world-${scene} ${dialogueExpanded ? 'dialogue-expanded' : 'dialogue-collapsed'}`} aria-label={`${region.name}互动小地图`}>
        <div className="map-viewport" ref={viewportRef}><div className="cloud-sky" aria-hidden="true"/><motion.div ref={layerRef} className="map-layer" drag dragMomentum={false} dragElastic={0.08} dragConstraints={dragBounds} style={{ x: dragX, y: dragY, ...({ "--map-zoom": zoom } as CSSProperties) }} animate={{ scale: zoom }} transition={{ type: 'spring', damping: 28, stiffness: 180 }} onDragStart={() => { dragging.current = true; }} onDragEnd={() => { setTimeout(() => { dragging.current = false; }, 120); }}>
          <AnimatePresence mode="sync"><motion.img key={scene} className="world-image" src={imagePath(scene)} alt={`${region.name}手绘小地图：${region.description}`} draggable={false} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }}/></AnimatePresence>
          <div className={`time-shade time-${game.actions}`} aria-hidden="true"/>
          {scene !== 'home' && <div className="world-atmosphere" aria-hidden="true"><div className="cloud cloud-one"/><div className="cloud cloud-two"/>{Array.from({ length: 9 }, (_, index) => <i className="falling-leaf" key={index} style={{ '--leaf-x': `${13 + index * 9}%`, '--leaf-delay': `${-index * 2.3}s`, '--leaf-time': `${17 + index * 1.8}s` } as CSSProperties}><svg width="13" height="18" viewBox="0 0 13 18"><path d="M2 17C-5 4 8 1 12 0c2 9-2 15-10 17" fill={index % 3 === 0 ? '#dfb4a0' : '#b4bd83'} fillOpacity=".75"/><path d="M2 16 9 4" stroke="#8e9c71" strokeWidth=".7"/></svg></i>)}</div>}
          {PLACES.filter(location => location.scene === scene).map((location, index) => <motion.button key={location.id} className={`map-hotspot hotspot-${location.id}`} style={{ left: `${location.x}%`, top: `${location.y}%` }} whileHover={{ y: -5, scale: 1.04 }} whileTap={{ scale: 0.96 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ opacity: { delay: index * 0.07 }, y: { type: 'spring', stiffness: 300, damping: 20 } }} onClick={() => visit(location)} aria-label={`探索${location.name}：${location.subtitle}`}><span className="hotspot-pin"/><span className="hotspot-sign"><GameIcon name={location.icon} size={28}/><strong>{location.name}</strong><ChevronRight size={13}/></span>{location.id === 'classroom' && !game.counts.study && <span className="quest-flag">去上课</span>}<span className="hotspot-tooltip">{location.subtitle}</span>{taskPlaceIds.has(location.id) && <b className="hotspot-task-mark" aria-label="任务地点">!</b>}{placeStories(game, location.id).some(event => !eventLock(game, event)) && <span className="map-story-flag">新故事</span>}</motion.button>)}
          <motion.div className="player-map-marker" animate={{ left: `${avatar.x}%`, top: `${avatar.y}%` }} transition={{ type: 'spring', duration: 1.8, bounce: 0.13 }} aria-hidden="true"><span>你在这里</span><img src={asset('images/student.jpg')} alt=""/><i/></motion.div>
        </motion.div></div>
        <MapTaskIndicators game={game} scene={scene} zoom={zoom} geometry={mapSize} dragX={dragX} dragY={dragY} dialogueExpanded={dialogueExpanded} onLocate={placeId => navigateTask({ placeId })}/><div className="world-edge-shade" aria-hidden="true"/><div className="cloud-frame" aria-hidden="true"><img src={asset('images/cloud-frame.webp')} alt=""/></div>

        <div className="world-topline"><div className="world-navigation"><button className="world-map-entry" onClick={() => open('world-map')} aria-label="打开大地图"><Compass size={24}/><span><strong>大地图</strong><small>{region.name} · 9 个区域</small></span><ChevronRight size={16}/></button><button className="world-address" onClick={() => open('world-map')} title="在大地图选择其他区域"><MapPin size={15}/><span>陕西 · 西安</span><ChevronRight size={13}/><strong>{region.name}</strong><span className="address-switch"><Compass size={14}/></span></button></div><div className="date-area"><button className="date-ribbon" onClick={() => open('schedule')} aria-label="查看本周日程"><CalendarDays size={22}/><span><strong>{date.getMonth() + 1} 月 {date.getDate()} 日</strong><small>{['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]} <span>{game.actions < 1 ? '08:00' : game.actions < 2 ? '14:00' : game.actions < 3 ? '17:30' : '周末'}</span></small></span><i/><Sun className="weather-sun" size={28}/><span className="weather-text">晴 <small>{game.week < 10 ? '26' : game.week < 25 ? '8' : '23'}°C</small></span></button><span className="exam-countdown"><Clock3 size={12}/>{game.phase === 'school' ? <>距离高考还有 <b>{daysRemaining(game)}</b> 天</> : game.phase === 'exam' ? '今天，认真写下自己的答案' : '高考结束啦，人生才刚刚开始'}</span></div><div className="semester-label"><Leaf size={15}/><span>{game.week < 20 ? '高三 · 上学期' : '高三 · 下学期'}</span><small>第 {Math.min(40, game.week + 1)} 周</small></div></div>

        <aside className="left-hud" aria-label="角色与主线支线任务">
          <button className="student-sheet" onClick={() => open('profile')}><div className="student-overview"><div className="student-portrait"><img src={asset('images/student.jpg')} alt={`${playerDisplayName(game)}的手绘头像`}/><span>高三</span></div><div className="student-name"><span>高三（3）班</span><h2>{playerDisplayName(game)}<ChevronRight size={15}/></h2><span className="student-mood"><i/>{game.stats.stress > 75 ? '有点累了，歇一歇' : game.stats.mood > 60 ? '今天也要元气满满' : '慢慢来，你已经很棒'}</span></div></div><div className="student-dream"><span><GameIcon name="university" size={17}/>心愿大学</span><strong>{target.name}</strong></div><div className="dream-progress"><i style={{ width: `${Math.min(100, score / target.threshold * 100)}%` }}/><span/></div><div className="student-score"><span>一点点，靠近梦想</span><strong>{score}<small> 分</small></strong></div></button>
          <TaskHud game={game} open={open}/>
          <div className="field-note"><span className="field-note-title"><Leaf size={13}/>今日 · 碎碎念</span><p>{LITTLE_NOTES[game.week % LITTLE_NOTES.length]}</p><svg className="note-doodle" width="66" height="24" viewBox="0 0 66 24" aria-hidden="true"><path d="M1 21c13 0 3-18 13-18s-1 21 11 18c10-3 0-19 10-18s-2 18 9 18 5-16 18-16" stroke="#9baf85" strokeWidth="1.2" strokeDasharray="2 3" fill="none"/></svg></div>
        </aside>

        <aside className="right-hud" aria-label="校园功能"><button onClick={() => open('schedule')}><span><GameIcon name="calendar" size={38}/></span><strong>日程</strong></button><button onClick={() => open('achievements')}><span><GameIcon name="trophy" size={38}/>{achievementCount > 0 && <i className="notification-dot"/>}</span><strong>成就</strong></button><button onClick={() => open('saves')}><span><GameIcon name="journal" size={37}/></span><strong>存档</strong></button><button onClick={() => open('quests')}><span><GameIcon name="notes" size={34}/></span><strong>任务</strong></button></aside>

        <div className="map-controls"><div className="map-zoom"><button onClick={() => setZoom(value => Math.min(MAX_MAP_ZOOM, Math.round((value + 0.2) * 10) / 10))} aria-label="放大地图" disabled={zoom >= MAX_MAP_ZOOM}><Plus size={19}/></button><button onClick={() => { setZoom(DEFAULT_MAP_ZOOM); dragX.set(0); dragY.set(0); }} aria-label="恢复地图视角" title="恢复视角"><RotateCcw size={15}/></button><button onClick={() => setZoom(value => Math.max(MIN_MAP_ZOOM, Math.round((value - 0.2) * 10) / 10))} aria-label="缩小地图" disabled={zoom <= MIN_MAP_ZOOM}><Minus size={19}/></button></div><select aria-label="选择本区地点" value="" onChange={event => { const location = PLACES.find(item => item.id === event.target.value); if (location) visit(location); }}><option value="" disabled>本区地点 · {PLACES.filter(location => location.scene === scene).length}</option>{PLACES.filter(location => location.scene === scene).map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select><span><MousePointer2 size={12}/>拖动探索 · {Math.round(zoom * 100)}%</span></div>

        <div className={`campus-dialogue ${dialogueExpanded ? "is-expanded" : "is-collapsed"}`}><button className="dialogue-avatar" onClick={() => setDialogueExpanded(value => !value)} aria-expanded={dialogueExpanded} aria-controls="companion-dialogue" aria-label={dialogueExpanded ? "收起苏晓的对话" : "展开苏晓的对话"} title={dialogueExpanded ? "收起为头像" : "点击和苏晓聊聊"}><img src={asset('images/companion.jpg')} alt="同桌苏晓"/><span className="dialogue-avatar-flower"><Leaf size={12}/></span></button><div className="dialogue-body" id="companion-dialogue"><div className="dialogue-name"><strong>苏晓</strong><span>你的同桌</span><i><Heart size={10} fill="currentColor"/><Heart size={10} fill="currentColor"/><Heart size={10} fill="currentColor"/></i></div><AnimatePresence mode="wait"><motion.p key={speech} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>{game.phase === 'ending' ? '我们真的走到夏天啦。以后的日子，愿你有自己的答案，也有随时可以回来的地方。' : playerText(game, speech)}</motion.p></AnimatePresence></div><button className="dialogue-action" onClick={() => { if (!game.started) open('start'); else if (game.phase !== 'school') advanceButton(); else { setPlace(PLACES[0]); open('location'); } }}>{!game.started ? '去教室看看' : game.phase === 'school' ? '去上课' : '看看下一站'}<ArrowRight size={16}/></button><button className="dialogue-collapse" onClick={() => setDialogueExpanded(false)} aria-label="收起苏晓的横幅" title="收起为头像"><X size={16}/></button><span className="dialogue-corner"/></div>
      </main>

      <footer className="game-footer"><div className="footer-main"><nav className="game-dock" aria-label="游戏导航">{NAV_ITEMS.map(item => { const active = item.scene ? scene === item.scene && !effectivePanel : effectivePanel === item.panel; return <motion.button className={`dock-item ${active ? 'active' : ''}`} key={item.id} onClick={() => item.scene ? changeScene(item.scene) : open(item.panel ?? null)} whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} aria-current={active ? 'page' : undefined}><span className="dock-icon">{item.id === 'world-map' ? <Compass className="dock-map-compass" size={48} strokeWidth={1.3}/> : <GameIcon name={item.icon} size={51}/>}{item.id === 'messages' && unread > 0 && <b className="dock-unread">{unread > 9 ? '9+' : unread}</b>}{item.id === 'bag' && Object.values(game.inventory).some(value => value > 0) && <i className="dock-dot"/>}</span><strong>{item.name}</strong>{active && <motion.i layoutId="dock-active" className="dock-active-dot"/>}</motion.button>; })}</nav><div className="footer-divider"/><div className="next-week-control"><div className="action-counter"><span>本周行动</span><div>{[0, 1, 2].map(index => <span className={index < game.actions ? 'used' : ''} key={index}><Leaf size={12}/></span>)}</div><b>{game.actions}<small>/3</small></b></div><motion.button className="next-week-button" whileHover={{ y: -2 }} whileTap={{ y: 2 }} onClick={advanceButton}><GameIcon name={game.phase === 'school' ? 'moon' : 'letter'} size={39}/><span><strong>{game.phase === 'school' ? '结束本周' : game.phase === 'exam' ? '走进考场' : game.phase === 'application' ? '填报我的志愿' : '我的毕业纪念'}</strong><small>{game.phase === 'school' ? '好好休息，再向前一步' : '未来这一页，由自己来写'}</small></span><ChevronRight size={20}/></motion.button></div></div><div className="footer-bottom"><button className={`autosave-status ${saved ? '' : 'save-failed'}`} onClick={() => open('saves')}><span/>{saved ? '本地存档 · 已自动保存' : '自动保存失败 · 请导出备份'}</button><span className="footer-motto"><Leaf size={11}/>好好生活，也是一种了不起的努力。</span><span className="version-label">拾光校园 · v2.2</span></div></footer>
    </div>

    <AnimatePresence mode="wait">{effectivePanel === 'world-map' ? <WorldMap key="world-map" game={game} scene={scene} onScene={changeScene} onClose={close}/> : effectivePanel && <GamePanels key={effectivePanel === 'event' ? game.pendingEvent : effectivePanel} panel={effectivePanel} game={game} setGame={setGame} settings={settings} setSettings={setSettings} place={place} open={open} onClose={close} onAction={doAction} onStory={readMapStory} onStart={start} onNextWeek={nextWeek} onPlan={runPlan} onChoice={choose} onUse={useItem} onBuy={buyItem} onGift={gift} onReply={reply} onInitiate={initiate} onNavigateTask={navigateTask} onConfess={confess} onChat={chat} chatContact={chatContact} onLoad={load} onScene={changeScene} notify={notify}/>}</AnimatePresence>
    <AnimatePresence>{toast && <motion.div key={toast.id} className="game-toast" role="status" aria-live="polite" initial={{ opacity: 0, y: -15, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}><span className="toast-leaf"><Leaf size={20}/></span><p>{toast.text}</p><button onClick={() => setToast(null)} aria-label="关闭提示"><X size={16}/></button></motion.div>}</AnimatePresence>
  </div></MotionConfig>;
}

