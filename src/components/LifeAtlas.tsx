import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import GameIcon from './GameIcon';
import { REGIONS, imagePath } from '../game/data';
import { LIFE_ATLASES, LIFE_REGIONS } from '../game/lifeData';
import { LIFE_ARCS } from '../game/lifeStoryData';
import { storyStartLock } from '../game/lifeStories';
import { actionLock, lifeAge, lifeBusy } from '../game/life';
import { lifePlaceIcon } from '../game/lifePresentation';
import { asset } from '../utils/asset';
import { fitAtlasPins } from '../utils/atlasLayout';
import type { AtlasId } from '../game/lifeTypes';
import type { GameState } from '../game/types';

const SHORT: Record<string, string> = { 'college-study':'教学','college-dorm':'宿舍','college-research':'科研','college-life':'湖畔',recruitment:'人才',workplace:'工作',exchange:'交易',hospital:'医院',insurance:'保险',nightlife:'夜街',residence:'住宅' };
export default function LifeAtlas({ game, onAtlas, onEnter }: { game: GameState; onAtlas: (id: AtlasId) => void; onEnter: (id: string) => void }) {
  const frame = useRef<HTMLDivElement>(null), [space, setSpace] = useState({ width: 0, height: 0 }), [ratio, setRatio] = useState(1672 / 941);
  const [hovered, setHovered] = useState('');
  const atlas = LIFE_ATLASES.find(a => a.id === game.life.atlas)!;
  const regions = atlas.id === 'school' ? REGIONS.map(r => ({ ...r, description: r.subtitle, image: imagePath(r.id), short: r.name.slice(0,2), ready: false })) : LIFE_REGIONS.filter(r => r.atlas === atlas.id).map(r => ({ ...r, image: asset(`images/${r.image}.webp`), short: SHORT[r.id], icon: lifePlaceIcon(r.places[0]), ready: game.life.actions < 3 && !lifeBusy(game) && (r.places.some(p => p.action && !actionLock(game,p.action) || p.game && !game.life.used.includes(`game:${p.game}`)) || LIFE_ARCS.some(a => a.region === r.id && !storyStartLock(game,a.id))) }));
  const selected = regions.find(r => r.id === hovered) ?? regions.find(r => r.id === (atlas.id === 'school' ? game.world.scene : game.life.region)) ?? regions[0];
  const width = Math.min(space.width, space.height * ratio), height = width / ratio, compact = width < 650;
  const positions = fitAtlasPins(regions, width, height, compact);
  useEffect(() => { const el = frame.current; if (!el) return; const measure = () => setSpace({ width: el.clientWidth, height: el.clientHeight }); const observer = new ResizeObserver(measure); observer.observe(el); measure(); return () => observer.disconnect(); }, []);
  return <div className="life-atlas-panel">
    <div className="life-atlas-tabs" aria-label="选择人生世界">{LIFE_ATLASES.map(a => <button key={a.id} className={atlas.id === a.id ? 'active' : ''} aria-pressed={atlas.id === a.id} disabled={lifeAge(game)<18 && a.id!=='school'} onClick={() => onAtlas(a.id)}>{a.name}大地图</button>)}</div>
    <p className="life-atlas-note">点击地标进入小地图 · 传送不消耗行动</p>
    <div className="life-atlas-frame" ref={frame}>
      <div className={`life-atlas-board ${compact?'compact':''}`} style={{ width, height }}>
        <img src={atlas.id === 'school' ? imagePath('world-map') : asset(`images/${atlas.image}.webp`)} alt={`${atlas.name}完整大地图`} draggable={false} onLoad={e => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}/>
        {positions.map(point => { const r = regions.find(r => r.id === point.id)!; return <button key={r.id} className={`life-atlas-pin ${selected.id===r.id?'current':''}`} style={{ left: point.x, top: point.y, visibility:point.visible?'visible':'hidden' }} aria-label={`进入${r.name}小地图`} title={r.name} onMouseEnter={()=>setHovered(r.id)} onFocus={()=>setHovered(r.id)} onClick={()=>onEnter(r.id)}><GameIcon name={r.icon} size={compact?21:28}/><strong>{compact?r.short:r.name}</strong>{r.ready&&<b aria-label="有可进行的行动或故事">!</b>}</button>; })}
      </div>
    </div>
    <div className="life-atlas-directory" aria-label={`${atlas.name}区域目录`}>{regions.map(r=><button className="life-atlas-region" key={r.id} onClick={()=>onEnter(r.id)}><GameIcon name={r.icon} size={24}/><span>{r.name}</span><ArrowRight size={14}/></button>)}</div>
    <div className="life-atlas-selection"><span><strong>{selected.name}</strong><small>{selected.description}</small></span><button className="secondary-button" onClick={()=>onEnter(selected.id)}>前往 <ArrowRight size={15}/></button></div>
  </div>;
}
