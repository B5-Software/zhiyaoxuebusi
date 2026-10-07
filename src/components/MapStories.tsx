import { ArrowRight, BookOpen, Check, LockKeyhole } from 'lucide-react';
import { REGION_BY_ID, imagePath, type Place } from '../game/data';
import { eventLock, getStorylines, placeStories } from '../game/engine';
import type { GameState, Scene } from '../game/types';

export function LocationStories({ game, place, onStory }: { game: GameState; place: Place; onStory: (id: string) => void }) {
  const stories = placeStories(game, place.id);
  if (!stories.length) return null;
  return <section className="location-stories" aria-label="地点故事"><div className="location-story-heading"><BookOpen size={18}/><h3>此地的故事</h3><small>每段故事消耗 1 次行动</small></div>{stories.map(event => {
    const lock = eventLock(game, event);
    const collected = game.seenEvents.includes(event.id);
    return <button className={`map-story-option ${collected ? 'collected' : lock ? 'upcoming' : 'ready'}`} key={event.id} disabled={!!lock} onClick={() => onStory(event.id)}>
      <span className="map-story-symbol">{collected ? <Check size={18}/> : lock ? <LockKeyhole size={16}/> : <BookOpen size={18}/>}</span>
      <span><small>{event.storyline ?? '路上的小事'}</small><strong>{event.title}</strong><em>{lock ?? '新故事 · 点击走进这一刻'}</em></span>
      {!lock && <ArrowRight size={17}/>}
    </button>;
  })}</section>;
}

export function StorylineProgress({ game, onScene }: { game: GameState; onScene: (scene: Scene) => void }) {
  const lines = getStorylines(game);
  return <><p className="storyline-intro">六条支线，走过秋天、冬天和春天。第 1、9、21 周起可继续新的篇章，之前的选择会改变最后一页。</p><div className="storyline-grid">{lines.map(line => {
    const region = REGION_BY_ID[line.scene];
    return <article className="storyline-card" key={line.name}>
      <img src={imagePath(line.scene)} alt={region.name} loading="lazy"/>
      <div><span className="little-label">{region.name} · {line.complete}/3 段</span><h3>{line.name}</h3><div className="storyline-steps" aria-label={`完成 ${line.complete} 段，共 3 段`}>{[0, 1, 2].map(index => <span key={index} className={index < line.complete ? 'done' : ''}>{index < line.complete ? <Check size={13}/> : index + 1}</span>)}</div><strong className="storyline-next">{line.next ? `下一页：${line.next.title}` : '故事已完成'}</strong><p>{line.hint}</p><button className="secondary-button" onClick={() => onScene(line.scene)}>去{region.name}<ArrowRight size={14}/></button></div>
    </article>;
  })}</div></>;
}
