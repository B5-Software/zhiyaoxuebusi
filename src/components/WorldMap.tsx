import { useState } from 'react';
import { ArrowRight, BookOpen, Check, Compass, MapPin } from 'lucide-react';
import { PLACES, REGIONS, REGION_BY_ID, imagePath, type Region } from '../game/data';
import { eventLock, getStorylines, regionStories } from '../game/engine';
import type { GameState, Scene } from '../game/types';
import GameIcon from './GameIcon';
import { getMapTaskTargets } from '../game/mapTasks';
import Modal from './Modal';

interface Props {
  game: GameState;
  scene: Scene;
  onScene: (scene: Scene) => void;
  onClose: () => void;
}

const FILTERS = ['全部地点', '校园内', '城市里', '日常与未来'] as const;

export default function WorldMap({ game, scene, onScene, onClose }: Props) {
  const [preview, setPreview] = useState<Scene>(scene);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('全部地点');
  const region = REGION_BY_ID[preview];
  const places = PLACES.filter(place => place.scene === preview);
  const stories = regionStories(game, preview);
  const available = stories.filter(event => !eventLock(game, event));
  const complete = stories.filter(event => game.seenEvents.includes(event.id)).length;
  const storyline = getStorylines(game).find(line => line.scene === preview);
  const shown = REGIONS.filter(item => filter === '全部地点' || item.group === filter);
  const taskScenes = new Set(getMapTaskTargets(game).map(target => PLACES.find(place => place.id === target.placeId)?.scene));

  function details(item: Region) {
    const events = regionStories(game, item.id);
    return {
      places: PLACES.filter(place => place.scene === item.id).length,
      ready: events.filter(event => !eventLock(game, event)).length,
    };
  }

  return <Modal title="拾光大地图" subtitle="从一张课桌出发，去看看更大的世界。" className="world-map-modal" onClose={onClose}>
    <div className="atlas-topbar"><span><Compass size={17}/>9 个区域 · 36 处互动地点</span><span>自由切换地点 · 不消耗行动</span></div>
    <div className="atlas-layout">
      <div className="atlas-board">
        <img src={imagePath('world-map')} alt="手绘西安生活大地图：住宅、校园、图书馆、实验楼、社团、古城、夜市、公园与大学之间由小路相连"/>
        <span className="atlas-stamp">西安 · 我们的一年<small>SHIGUANG EXPLORER</small></span>
        {REGIONS.map(item => {
          const status = details(item);
          return <button key={item.id} data-guide={item.id === "campus" ? "atlas-campus" : undefined} className={`atlas-pin ${preview === item.id ? 'is-preview' : ''} ${scene === item.id ? 'is-current' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} onMouseEnter={() => setPreview(item.id)} onFocus={() => setPreview(item.id)} onClick={() => onScene(item.id)} aria-label={`进入${item.name}小地图${status.ready ? `，有 ${status.ready} 段新故事` : ''}`}>
            <span className="atlas-pin-icon"><GameIcon name={item.icon} size={28}/></span>
            <strong>{item.name}</strong>
            {taskScenes.has(item.id) && <b className="atlas-task-mark" aria-label="有任务地点">!</b>}
            {status.ready > 0 && <span className="atlas-new-dot" aria-hidden="true"/>}
            {scene === item.id && <small>你在这里</small>}
          </button>;
        })}
        <span className="atlas-map-hint"><MapPin size={13}/>点击地标，进入区域小地图</span>
      </div>
      <aside className="atlas-preview" aria-label="地点预览">
        <img src={imagePath(region.id)} alt={`${region.name}场景预览`}/>
        <div className="atlas-preview-content"><span className="little-label">{region.group} / 区域小地图</span><h3>{region.name}</h3><p className="atlas-subtitle">{region.subtitle}</p><p>{region.description}</p>
          <div className="atlas-preview-stats"><span><MapPin size={14}/>{places.length} 处地点</span><span><BookOpen size={14}/>{complete} 段已收藏</span></div>
          {storyline && <div className="atlas-storyline"><small>连续支线 · {storyline.complete}/3</small><strong>{storyline.name}</strong><span>{storyline.hint}</span></div>}
          <button className="primary-button full-button" onClick={() => onScene(preview)}>进入小地图 <ArrowRight size={17}/></button>
          <span className="atlas-ready">{available.length ? `${available.length} 段故事正等你发现` : game.started ? '每个地点都有可以做的小事' : '开启高三后解锁地点故事'}</span>
        </div>
      </aside>
    </div>
    <div className="atlas-directory-heading"><h3>想去哪里，自己选</h3><div className="paper-tabs">{FILTERS.map(item => <button key={item} aria-pressed={filter === item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
    <div className="atlas-directory">{shown.map(item => {
      const status = details(item);
      return <button key={item.id} className={`atlas-card ${scene === item.id ? 'current' : ''}`} onClick={() => onScene(item.id)} aria-label={`前往${item.name}小地图`}>
        <img src={imagePath(item.id)} alt="" loading="lazy"/>
        <span><strong>{item.name}{scene === item.id && <Check size={13}/>}</strong><small>{item.subtitle}</small><em>{status.places} 处地点{status.ready > 0 ? ` · ${status.ready} 段新故事` : ''}</em></span><ArrowRight size={15}/>
      </button>;
    })}</div>
    <p className="atlas-footer-note">这是为故事绘制的虚构街区地图。新支线会随周次继续，进度和选择都保存在青春手帐中。</p>
  </Modal>;
}
