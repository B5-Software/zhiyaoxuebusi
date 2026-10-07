import { useLayoutEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useMotionValueEvent, type MotionValue } from 'motion/react';
import { PLACES } from '../game/data';
import { getMapTaskTargets, taskEdgePosition } from '../game/mapTasks';
import type { GameState, Scene } from '../game/types';

export interface MapGeometry { width: number; height: number; layerWidth: number; layerHeight: number; layerLeft: number; layerTop: number }
interface Props { game: GameState; scene: Scene; zoom: number; geometry: MapGeometry; dragX: MotionValue<number>; dragY: MotionValue<number>; dialogueExpanded: boolean; onLocate: (placeId: string) => void }

export default function MapTaskIndicators({ game, scene, zoom, geometry, dragX, dragY, dialogueExpanded, onLocate }: Props) {
  const [offset, setOffset] = useState(() => ({ x: dragX.get(), y: dragY.get() }));
  const [obstacles, setObstacles] = useState<DOMRect[]>([]);
  const targets = useMemo(() => getMapTaskTargets(game).filter(target => PLACES.find(place => place.id === target.placeId)?.scene === scene), [game, scene]);
  useMotionValueEvent(dragX, 'change', x => setOffset(current => ({ ...current, x })));
  useMotionValueEvent(dragY, 'change', y => setOffset(current => ({ ...current, y })));
  useLayoutEffect(() => {
    const world = document.querySelector('.world')?.getBoundingClientRect();
    if (!world) return;
    setObstacles([...document.querySelectorAll('.left-hud, .right-hud, .map-controls, .campus-dialogue')].map(element => {
      const rect = element.getBoundingClientRect();
      return new DOMRect(rect.x - world.x, rect.y - world.y, rect.width, rect.height);
    }));
  }, [geometry, game, scene, dialogueExpanded]);
  const occupied: { x: number; y: number }[] = [];
  const markers = targets.flatMap(target => {
    const place = PLACES.find(place => place.id === target.placeId)!;
    const point = { x: geometry.layerLeft + geometry.layerWidth / 2 + offset.x + (place.x / 100 - .5) * geometry.layerWidth * zoom, y: geometry.layerTop + geometry.layerHeight / 2 + offset.y + (place.y / 100 - .5) * geometry.layerHeight * zoom };
    const marker = taskEdgePosition(point, geometry);
    if (!marker) return [];
    // Search both directions along the edge so a crowded corner does not hide a target.
    const vertical = marker.edge === 'left' || marker.edge === 'right';
    const initial = vertical ? marker.y : marker.x;
    const extent = vertical ? geometry.height : geometry.width;
    const candidates = [initial, ...Array.from({ length: Math.max(0, Math.ceil((extent - 44) / 38)) }, (_, index) => 22 + index * 38)].sort((a, b) => Math.abs(a - initial) - Math.abs(b - initial));
    const position = candidates.find(value => {
      const x = vertical ? marker.x : value, y = vertical ? value : marker.y;
      return !obstacles.some(rect => x > rect.left - 20 && x < rect.right + 20 && y > rect.top - 20 && y < rect.bottom + 20) && !occupied.some(item => Math.hypot(item.x - x, item.y - y) < 38);
    });
    if (position === undefined) return [];
    if (vertical) marker.y = position; else marker.x = position;
    occupied.push(marker);
    return [{ ...target, ...marker, place }];
  });
  return <div className="map-task-indicators" aria-label="屏幕外的任务地点">{markers.map(marker => <button key={marker.placeId} className={`map-task-arrow edge-${marker.edge}`} style={{ left: marker.x, top: marker.y }} onClick={() => onLocate(marker.placeId)} aria-label={`任务：${marker.title}，定位${marker.place.name}`} title={`${marker.title} · 点击定位${marker.place.name}`}><ArrowRight size={18} style={{ transform: `rotate(${marker.angle}deg)` }}/><b>!</b><span>{marker.place.name}</span></button>)}</div>;
}
