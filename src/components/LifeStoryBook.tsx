import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Clock3 } from 'lucide-react';
import GameIcon from './GameIcon';
import { asset } from '../utils/asset';
import { LIFE_ARCS, type LifeArc } from '../game/lifeStoryData';
import { pendingChapter, storyChoiceLock, storyEcho, storyProgress, storyRevisit, storyStartLock } from '../game/lifeStories';
import { chapterPresentation } from '../game/lifeStoryScenes';
import { playerDisplayName, playerPortrait, playerText } from '../game/player';
import type { GameState } from '../game/types';

export function LifeStoryBook({ game, onStart }: { game: GameState; onStart: (id: string) => void }) {
  const [filter, setFilter] = useState('全部'), [reading, setReading] = useState<{ arc: LifeArc; step: number } | null>(null);
  const finished = LIFE_ARCS.filter(a => storyProgress(game, a).finished).length;
  if (reading) {
    const record = game.life.stories.log.find(row => row.arc === reading.arc.id && row.step === reading.step), scene = chapterPresentation(game, reading.arc, reading.step);
    return <div className="story-replay"><button className="text-button" onClick={() => setReading(null)}>返回人生故事集</button><StoryIllustration arc={reading.arc}/><span className="little-label">第 {(record?.week ?? 0) + 1} 周 · 已收录的选择</span><h3>{reading.arc.chapters[reading.step].title}</h3>{scene.paragraphs.map(p => <p key={p}>{playerText(game,p)}</p>)}<StoryDialogue game={game} dialogue={scene.dialogue}/><div className="story-echo">当时的选择：{reading.arc.chapters[reading.step].choices[record?.choice ?? 0]}</div><p className="life-story-result">{playerText(game,record?.result ?? '')}</p><div className="life-button-row">{reading.arc.chapters.map((c, i) => <button className="secondary-button" disabled={!game.life.stories.log.some(row => row.arc === reading.arc.id && row.step === i)} key={c.title} onClick={() => setReading({ arc: reading.arc, step: i })}>第{i + 1}章</button>)}</div></div>;
  }
  return <div className="story-library"><div className="story-library-heading"><GameIcon name="letter" size={58}/><div><span className="little-label">人生故事集 · {finished}/{LIFE_ARCS.length} 段完整故事</span><h3>生活不会在一次选择后结束</h3><p>每章1次行动，后续跨周推进。记住你说过的话，也记住选择没有解决的事。</p></div></div><div className="paper-tabs life-tabs">{['全部', '主线', '支线', '回忆'].map(f => <button key={f} aria-pressed={filter === f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div><div className="story-book-grid">{LIFE_ARCS.filter(a => filter === '全部' || filter === '回忆' && !!game.life.stories.routes[a.id] || a.kind === filter).map(arc => {
    const p = storyProgress(game, arc), lock = storyStartLock(game, arc.id);
    return <article className={`story-book-card ${p.finished ? 'finished' : ''}`} key={arc.id}><StoryIllustration arc={arc}/><div className="story-book-body"><span className="story-book-kind"><GameIcon name={arc.icon} size={31}/>{arc.kind} · {p.step}/{arc.chapters.length}章{p.finished && <Check size={15}/>}</span><h3>{arc.title}</h3><p>{arc.subtitle}</p><ol className="story-chapter-track">{arc.chapters.map((c, i) => <li className={i < p.step ? 'done' : i === p.step ? 'current' : ''} key={c.title}><i/>{c.title.replace(/^第.章 · /, '')}</li>)}</ol><div className="story-book-state">{p.finished ? '故事已收录，回看不消耗行动' : !p.visible ? arc.condition : p.ready ? '这一章已准备好 · 1行动' : <><Clock3 size={13}/>第{p.due + 1}周继续 · 还需{p.due - game.life.weeks}周</>}</div><div className="life-button-row">{!p.finished && <button className="primary-button" disabled={!!lock} title={lock ?? ''} onClick={() => onStart(arc.id)}>{p.route ? '继续这一章' : '走进这段故事'}<ArrowRight size={15}/></button>}{p.step > 0 && <button className="text-button" onClick={() => setReading({ arc, step: p.step - 1 })}>翻看已走过的章节</button>}</div>{!p.finished && lock && p.ready && <small className="life-lock">{lock}</small>}</div></article>;
  })}</div></div>;
}
function StoryIllustration({ arc }: { arc: LifeArc }) { return <figure className="story-illustration"><img src={asset(`images/${arc.image}.webp`)} alt={arc.subtitle}/><figcaption>{arc.subtitle}</figcaption></figure>; }
function StoryDialogue({ game, dialogue }: { game: GameState; dialogue: { speaker: string; text: string }[] }) {
  return <div className="story-dialogue">{dialogue.map((d, i) => <div className={d.speaker === '你' ? 'player' : ''} key={i}><span className="life-dialogue-speaker">{d.speaker === '你' ? <img src={playerPortrait(game)} alt=""/> : <GameIcon name="friends" size={32}/>}<strong>{d.speaker === '你' ? playerDisplayName(game) : d.speaker}</strong></span><p>「{playerText(game,d.text)}」</p></div>)}</div>;
}
function ChoicePreview({ game, index, onChoose, onCancel }: { game: GameState; index: number; onChoose: (index: number) => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null), pending = pendingChapter(game);
  useEffect(() => { ref.current?.scrollIntoView({block:'nearest',behavior:'smooth'}); ref.current?.focus({preventScroll:true}); }, [index]);
  if (!pending) return null;
  const e = pending.chapter.effects[index], lock = storyChoiceLock(game,index);
  const labels = { energy:'体力',stress:'压力',mood:'心情',money:'现金',technical:'技术',communication:'沟通',practical:'实践',sleep:'睡眠习惯',strain:'身体负荷',affection:'家庭亲密' };
  const changes = Object.entries(labels).flatMap(([key,label]) => { const value = e[key as keyof typeof e]; if(key==='affection' && !(game.social.partner||game.graduate.partner||game.life.family.spouse)) return []; return typeof value === 'number' && value ? [label + (value>0?'+':'') + value] : []; });
  return <div className="life-choice-preview" ref={ref} tabIndex={-1} role="group" aria-label="确认这次回应"><span className="little-label">准备这样回应</span><h4>{pending.chapter.choices[index]}</h4><p>{changes.join(' · ') || '留下这次回应与后续记录'}</p>{e.application&&<p>办理进度按真实条件与等待期推进。</p>}<div className="life-button-row"><button className="primary-button" disabled={!!lock} onClick={()=>onChoose(index)}>就这样说 <ArrowRight size={16}/></button><button className="secondary-button" onClick={onCancel}>再想一想</button></div>{lock&&<small>{lock}</small>}</div>;
}
export function LifeStoryReader({ game, onChoose }: { game: GameState; onChoose: (index: number) => void }) {
  const [page, setPage] = useState(0), [selected, setSelected] = useState<number|null>(null), copy = useRef<HTMLDivElement>(null), pending = pendingChapter(game);
  useEffect(()=>{if(page>0) { copy.current?.scrollIntoView({block:'start'}); copy.current?.focus({preventScroll:true}); }},[page]);
  if (!pending) return null;
  const { arc, chapter, step } = pending, scene = chapterPresentation(game,arc,step), echo = step > 0 ? storyEcho(game, arc) : '', revisit = step > 0 ? storyRevisit(game, arc) : '';
  return <div className="life-story-reader"><StoryIllustration arc={arc}/><div className="story-reader-copy" ref={copy} tabIndex={-1}><span className="little-label">{arc.kind} · {arc.title} · 第{step + 1}/{arc.chapters.length}章</span><h3>{chapter.title}</h3><ol className="life-story-pages" aria-label="章节阅读进度">{['走进现场','听见彼此','作出回应'].map((label,i)=><li key={label} aria-current={page===i?'step':undefined}>{i+1} · {label}</li>)}</ol>
    {page===0&&<>{scene.carry&&<aside className="life-story-carry"><span className="little-label">上次留下的事 · {scene.carry.choice}</span><p>{playerText(game,scene.carry.text)}</p></aside>}{scene.paragraphs.map(p=><p key={p}>{playerText(game,p)}</p>)}{echo&&<aside className="story-echo"><GameIcon name="letter" size={28}/><span>你留下的回声<br/>{playerText(game,echo)}</span></aside>}</>}
    {page===1&&<>{revisit&&<p className="story-revisit">{playerText(game,revisit)}</p>}<StoryDialogue game={game} dialogue={scene.dialogue}/></>}
    {page===2&&<><p className="story-choice-intro">听完这些，你想怎样回应？这一章已经使用1次行动，确认不会重复扣除。</p><div className="story-choices">{chapter.choices.map((choice,index)=>{const lock=storyChoiceLock(game,index);return <button key={choice} disabled={!!lock} aria-pressed={selected===index} className="story-choice life-choice" onClick={()=>setSelected(index)}><span className="story-choice-number">{index+1}</span><span><strong>{choice}</strong><small>{lock??'先选定回应，再确认；选择会自动保存'}</small></span><ArrowRight size={17}/></button>;})}</div>{selected!==null&&<ChoicePreview game={game} index={selected} onChoose={onChoose} onCancel={()=>setSelected(null)}/>}</>}
    <div className="life-button-row story-reading-controls">{page>0&&<button className="secondary-button" onClick={()=>{setPage(page-1);setSelected(null);}}>返回上一页</button>}{page<2&&<button className="primary-button" onClick={()=>setPage(page+1)}>{page===0?'继续听这段对话':'想想怎样回应'} <ArrowRight size={16}/></button>}</div></div></div>;
}
export function LifeStoryReceipt({ game, onDone }: { game: GameState; onDone: () => void }) {
  const record = game.life.stories.log.find(row => row.id === game.life.stories.receipt), arc = LIFE_ARCS.find(a => a.id === record?.arc);
  if (!record || !arc) return null;
  const p = storyProgress(game, arc);
  return <div className="story-receipt"><StoryIllustration arc={arc}/><div className="story-reader-copy"><span className="little-label">第{record.week + 1}周 · 这一章已经保存</span><h3>{arc.chapters[record.step].title}</h3><div className="story-echo">你选择了：{arc.chapters[record.step].choices[record.choice]}</div><p className="life-story-result">{playerText(game,record.result)}</p><div className="story-next-chapter"><GameIcon name={p.finished ? 'journal' : 'calendar'} size={45}/><div><strong>{p.finished ? '整段故事已收录' : arc.chapters[p.step].title}</strong><small>{p.finished ? '可从人生故事集免费回看所有章节与选择。' : `第${p.due + 1}周继续，至少还需${p.due - game.life.weeks}周。到时会出现回访，也可从故事集继续。`}</small></div></div><button className="primary-button" onClick={onDone}>收好这一页 <ArrowRight size={16}/></button></div></div>;
}
