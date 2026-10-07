import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { MotionValue } from 'motion/react';
import { mapDragBounds, pinchMapTransform, type MapPoint } from '../game/mapView';

interface Options { viewport: RefObject<HTMLDivElement | null>; dragging: RefObject<boolean>; zoom: number; setZoom: Dispatch<SetStateAction<number>>; x: MotionValue<number>; y: MotionValue<number>; size: { width: number; height: number; layerWidth: number; layerHeight: number } }
export default function useMapTouch(options: Options) {
  const latest = useRef(options); latest.current = options;
  useEffect(() => {
    const view = options.viewport.current; if (!view) return;
    const touches = new Map<number, MapPoint>();
    let pan: { origin: MapPoint; x: number; y: number } | null = null;
    let pinch: { zoom: number; distance: number; midpoint: MapPoint; pan: MapPoint } | null = null;
    let release: ReturnType<typeof setTimeout> | undefined;
    const geometry = () => {
      const [a, b] = [...touches.values()], rect = view.getBoundingClientRect();
      return { distance: Math.hypot(b.x - a.x, b.y - a.y), midpoint: { x: (a.x + b.x) / 2 - rect.left - rect.width / 2, y: (a.y + b.y) / 2 - rect.top - rect.height / 2 } };
    };
    const capture = () => { for (const id of touches.keys()) { try { view.setPointerCapture(id); } catch { /* A cancelled pointer needs no capture. */ } } };
    const start = () => {
      const current = latest.current;
      if (touches.size >= 2) { pinch = { ...geometry(), zoom: current.zoom, pan: { x: current.x.get(), y: current.y.get() } }; pan = null; current.dragging.current = true; capture(); }
      else if (touches.size === 1) { pan = { origin: [...touches.values()][0], x: current.x.get(), y: current.y.get() }; pinch = null; }
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || touches.size >= 2) return;
      if (!touches.size) { clearTimeout(release); latest.current.dragging.current = false; }
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY }); start();
    };
    const move = (event: PointerEvent) => {
      if (!touches.has(event.pointerId)) return;
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const current = latest.current, size = current.size, layer = { width: size.layerWidth, height: size.layerHeight };
      if (pinch && touches.size === 2) {
        event.preventDefault();
        const { distance, midpoint } = geometry(), next = pinchMapTransform(pinch, distance, midpoint, size, layer);
        current.x.set(next.x); current.y.set(next.y); current.setZoom(next.zoom);
      } else if (pan) {
        const dx = event.clientX - pan.origin.x, dy = event.clientY - pan.origin.y;
        if (!current.dragging.current && Math.hypot(dx, dy) < 5) return;
        event.preventDefault(); current.dragging.current = true; capture();
        const bounds = mapDragBounds(size, layer, current.zoom);
        current.x.set(Math.max(bounds.left, Math.min(bounds.right, pan.x + dx)));
        current.y.set(Math.max(bounds.top, Math.min(bounds.bottom, pan.y + dy)));
      }
    };
    const end = (event: PointerEvent) => {
      if (!touches.delete(event.pointerId)) return;
      if (touches.size) start();
      else { pan = null; pinch = null; release = setTimeout(() => { latest.current.dragging.current = false; }, 180); }
    };
    const suppressClick = (event: MouseEvent) => { if (latest.current.dragging.current) { event.preventDefault(); event.stopPropagation(); } };
    view.addEventListener('pointerdown', down);
    view.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    view.addEventListener('click', suppressClick, true);
    return () => { clearTimeout(release); view.removeEventListener('pointerdown', down); view.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); view.removeEventListener('click', suppressClick, true); latest.current.dragging.current = false; };
  }, [options.viewport]);
}
