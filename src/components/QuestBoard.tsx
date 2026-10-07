import { useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowRight, BookOpen, Check, Clock3, Compass, Flag, Heart, LockKeyhole, Pin, Sparkles } from 'lucide-react';
import { CHARACTERS, PLACES, imagePath } from '../game/data';
import { claimProject, claimQuest, effectSummary, projectWorkLock, startProject, workOnProject } from '../game/engine';
import { LONG_PROJECTS, projectStartLock, projectStatus, resolveObjectiveTarget } from '../game/projects';
import { getQuestViews, toggleQuestTracking } from '../game/quests';
import type { GameState, Panel, QuestTarget } from '../game/types';

interface Props {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
  onNavigate: (target: QuestTarget) => void;
  notify: (text: string) => void;
}
const TABS = [ ['main', '主线'], ['projects', '长期任务'], ['side', '地图支线'], ['character', '角色任务'] ] as const;
const statusText = { locked: '尚未解锁', active: '进行中', ready: '可领取', claimed: '已完成' };

export function TaskHud({ game, open }: { game: GameState; open: (panel: Panel) => void }) {
  const tasks = getQuestViews(game);
  const mains = tasks.filter(task => task.kind === 'main');
  const main = mains.find(task => !task.complete) ?? mains.at(-1)!;
  const running = LONG_PROJECTS.filter(project => game.quests.projects[project.id] && !game.quests.projects[project.id].claimed).slice(0, 2);
  const tracked = tasks.filter(task => game.quests.tracked.includes(task.id) && task.status !== 'claimed').slice(0, 2 - running.length);
  const rewards = tasks.filter(task => task.status === 'ready').length + LONG_PROJECTS.filter(project => projectStatus(game, project).status === 'ready').length;
  return <section className="task-hud" aria-label="主线与支线任务"><button className="task-hud-heading" onClick={() => open('quests')}><BookOpen size={17}/><strong>任务手帐</strong><ArrowRight size={14}/></button>
    <button className="task-hud-main" onClick={() => open('quests')}><span>主线 · {mains.filter(task => task.complete).length}/{mains.length}</span><strong>{main.title}</strong><small>{main.lock ?? main.objectives.find(objective => objective.current < objective.goal)?.text ?? '这一年的故事已收好'}</small></button>
    {running.map(project => { const state = projectStatus(game, project); return <button className="task-hud-side" key={project.id} onClick={() => open('quests')}><Clock3 size={12}/><span><strong>{project.title}</strong><small>{state.status === 'ready' ? '长期任务完成 · 领取纪念' : `${state.stage.title} · 投入 ${state.work}/${state.stage.work}`}</small></span></button>; })}
    {tracked.map(task => <button className="task-hud-side" key={task.id} onClick={() => open('quests')}><Pin size={12}/><span><strong>{task.title}</strong><small>{task.lock ?? statusText[task.status]}</small></span></button>)}
    <button className="task-hud-footer" onClick={() => open('quests')}>{rewards ? `${rewards} 份任务纪念可领取` : '主线 / 长期任务 / 多条支线'}<ArrowRight size={12}/></button>
  </section>;
}

export default function QuestBoard({ game, setGame, onNavigate, notify }: Props) {
  const [tab, setTab] = useState<typeof TABS[number][0]>('projects');
  const [showFinished, setShowFinished] = useState(false);
  const tasks = getQuestViews(game);
  const complete = tasks.filter(task => task.complete).length;
  const projectsDone = LONG_PROJECTS.filter(project => game.quests.projects[project.id]?.completedWeek !== null && !!game.quests.projects[project.id]).length;
  const current = tasks.filter(task => task.kind === tab && (showFinished || task.status !== 'claimed'));
  const chains = [...new Set(current.map(task => task.chain))];
  function handleProject(id: string, action: 'start' | 'work' | 'claim') {
    const result = action === 'start' ? startProject(game, id) : action === 'work' ? workOnProject(game, id) : claimProject(game, id);
    if (result.error) { notify(result.error); return; }
    setGame(result.game);
    notify(action === 'start' ? '长期任务已接受。每周投入，进度会自动保存。' : action === 'work' ? '已投入 1 次行动。本周的工作已记下，阶段会在结束本周时检查推进。' : '长期任务已完成，这段相处和成果被好好留下了。');
  }
  function claim(id: string) { const result = claimQuest(game, id); if (result.error) notify(result.error); else { setGame(result.game); notify('任务纪念已领取，进度已自动保存。'); } }
  return <div className="quest-board"><div className="task-intro"><Flag size={27}/><div><h3>这一年，慢慢把想做的事做完</h3><p>普通长期任务至少跨越 5 个游戏周，恋爱专属任务有四个阶段、至少 6 周。每周可为同一任务投入一次行动；剧情条件、投入和时间都满足后，结束本周会推进。</p></div></div>
    <div className="task-summary"><span>主线与支线 <b>{complete}/{tasks.length}</b></span><span>长期任务 <b>{projectsDone}/{LONG_PROJECTS.length}</b></span><span>已探索地点 <b>{game.quests.visitedPlaces.length}/{PLACES.length}</b></span></div>
    <div className="task-toolbar"><div className="paper-tabs" role="tablist" aria-label="任务类别">{TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}<small>{id === 'projects' ? LONG_PROJECTS.length : tasks.filter(task => task.kind === id).length}</small></button>)}</div><label><input type="checkbox" checked={showFinished} onChange={event => setShowFinished(event.target.checked)}/>显示已领取</label></div>
    {tab === 'projects' ? <div className="long-projects">{LONG_PROJECTS.filter(project => showFinished || !game.quests.projects[project.id]?.claimed).map(project => {
      const state = projectStatus(game, project);
      const startLock = projectStartLock(game, project);
      const workLock = projectWorkLock(game, project.id);
      const objective = state.stage.objective;
      const objectiveDone = objective.progress(game) >= objective.goal;
      const place = PLACES.find(place => place.id === project.placeId)!;
      return <article className={`long-project ${state.status}`} key={project.id}><div className="project-title"><img src={imagePath(CHARACTERS[project.character].image)} alt=""/><div><span><Clock3 size={12}/>{project.datingOnly ? '恋爱专属 · 至少 6 周 / 6 次投入' : '长期任务 · 至少 5 周 / 5 次投入'}</span><h3>{project.title}</h3></div><b>{state.status === 'available' ? '待接受' : state.status === 'active' ? '持续进行' : statusText[state.status]}</b></div><p className="project-description">{project.description}</p>
        <ol className="project-stages">{project.stages.map((stage, index) => <li className={state.progress && index < state.progress.stage ? 'done' : state.progress?.stage === index ? 'current' : ''} key={stage.title}><i>{state.progress && index < state.progress.stage ? <Check size={13}/> : index + 1}</i><span><strong>{stage.title}</strong><small>{stage.weeks} 周 · {stage.work} 次投入</small></span></li>)}</ol>
        {state.status === 'active' && <div className="project-current"><h4>{state.stage.title}</h4><p>{state.stage.description}</p><div className="project-progress"><span>阶段投入 <b>{state.work}/{state.stage.work}</b></span><span>经过时间 <b>{Math.min(state.weeks, state.stage.weeks)}/{state.stage.weeks} 周</b></span></div><button className={`project-objective ${objectiveDone ? 'done' : ''}`} onClick={() => onNavigate(resolveObjectiveTarget(game, objective))}>{objectiveDone ? <Check size={14}/> : <Compass size={14}/>}<span>{objective.text}<small>{Math.min(objective.goal, objective.progress(game))}/{objective.goal}</small></span><ArrowRight size={13}/></button><div className="project-work-row"><button className="primary-button" disabled={!!workLock} title={workLock ?? '消耗 1 次行动，记录本周投入'} onClick={() => handleProject(project.id, 'work')}>投入本周行动 <small>1 行动</small></button><span>{workLock ?? '本周还没有为此任务投入'}</span></div></div>}
        {state.status === 'ready' && <p className="project-complete-note">从第 {state.progress!.startedWeek + 1} 周到第 {Math.min(40, state.progress!.completedWeek! + 1)} 周，{state.progress!.contributions.length} 次投入终于成为一份成果。</p>}
        <div className="project-footer"><span><Sparkles size={13}/>{effectSummary(project.reward).join(' / ')}</span><button className="text-button" onClick={() => onNavigate({ placeId: project.placeId })}>去{place.name}<ArrowRight size={13}/></button>{state.status === 'available' && <button className="primary-button" disabled={!!startLock} title={startLock ?? '接受任务，不消耗行动'} onClick={() => handleProject(project.id, 'start')}>接受长期任务</button>}{state.status === 'ready' && <button className="primary-button" onClick={() => handleProject(project.id, 'claim')}>领取任务纪念</button>}</div>{state.status === 'available' && startLock && <p className="task-lock-note">{startLock}</p>}
      </article>;
    })}</div> : <div className="task-chains">{chains.map(chain => <section className="task-chain" key={chain}><h3>{tab === 'main' ? <Flag size={17}/> : tab === 'character' ? <Heart size={17}/> : <Compass size={17}/>} {chain}</h3><div>{current.filter(task => task.chain === chain).map(task => <article className={`task-card ${task.status}`} key={task.id}><div className="task-card-title"><span>{statusText[task.status]}</span><h4>{task.title}</h4>{task.kind !== 'main' && <button className={game.quests.tracked.includes(task.id) ? 'tracking' : ''} title="在地图左侧追踪，最多 2 项" aria-label={`${game.quests.tracked.includes(task.id) ? '取消追踪' : '追踪'}${task.title}`} onClick={() => setGame(current => toggleQuestTracking(current, task.id))}><Pin size={14}/></button>}</div><p>{task.description}</p><ul className="task-objectives">{task.objectives.map(objective => <li key={objective.text}><button onClick={() => onNavigate(resolveObjectiveTarget(game, objective))}>{objective.current >= objective.goal ? <Check size={13}/> : <ArrowRight size={13}/>}<span>{objective.text}</span><b>{objective.current}/{objective.goal}</b></button></li>)}</ul>{task.lock && <p className="task-lock-note"><LockKeyhole size={11}/>{task.lock}</p>}<div className="task-card-footer"><small><Sparkles size={12}/>{effectSummary(task.reward).join(' / ')}</small>{task.status === 'ready' && <button className="primary-button" onClick={() => claim(task.id)}>领取纪念</button>}</div></article>)}</div></section>)}</div>}
    <p className="task-board-note">任务不会在每周重置。友情与恋爱都能留下成果；已读支线和既有行动也会计入进度，接受长期项目后的投入另行记录。</p>
  </div>;
}
