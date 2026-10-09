import { taskEdgePosition } from '../game/mapTasks';

export type MapRect = { left: number; top: number; right: number; bottom: number };
export type FloatingMapPin = { id: string; x: number; y: number; width: number; height: number; badge: number; ready?: boolean };
type Size = { width: number; height: number };
const intersects = (a: MapRect, b: MapRect, gap: number) => a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;

/** Keep whole labels and edge indicators clear of the actual overlay controls. */
export function floatingMapLayout(pins: FloatingMapPin[], size: Size, overlays: MapRect[]) {
  const occupied: MapRect[] = [], labels = new Map<string, { offset: number; visible: boolean }>();
  for (const pin of pins) {
    const half = pin.width / 2, lower = half + 16, upper = size.width - half - 16;
    const candidates = [Math.max(lower, Math.min(upper, pin.x)), ...overlays.flatMap(r => [r.right + half + 12, r.left - half - 12])];
    const center = candidates.sort((a, b) => Math.abs(a - pin.x) - Math.abs(b - pin.x)).find(x => {
      const rect = { left: x - half, right: x + half, top: pin.y - pin.height / 2 - pin.badge, bottom: pin.y + pin.height / 2 };
      return pin.x >= 0 && pin.x <= size.width && x >= lower && x <= upper && rect.top >= 16 && rect.bottom <= size.height - 16 && ![...overlays, ...occupied].some(r => intersects(rect, r, 12));
    });
    labels.set(pin.id, { offset: center === undefined ? 0 : center - pin.x, visible: center !== undefined });
    if (center !== undefined) occupied.push({ left: center - half, right: center + half, top: pin.y - pin.height / 2 - pin.badge, bottom: pin.y + pin.height / 2 });
  }
  const perimeter: { x: number; y: number; edge: string }[] = [];
  for (const inset of [24, 72]) {
    for (let y = 24; y <= size.height - 24; y += 12) perimeter.push({ x: inset, y, edge: 'left' }, { x: size.width - inset, y, edge: 'right' });
    for (let x = 24; x <= size.width - 24; x += 12) perimeter.push({ x, y: inset, edge: 'top' }, { x, y: size.height - inset, edge: 'bottom' });
  }
  const edges: { id: string; x: number; y: number; edge: string; angle: number }[] = [];
  for (const pin of pins.filter(p => p.ready && !labels.get(p.id)?.visible)) {
    const desired = taskEdgePosition(pin, size) ?? { x: size.width - 24, y: pin.y, edge: 'right' };
    const candidates = [...perimeter, desired].sort((a, b) => Math.hypot(a.x - desired.x, a.y - desired.y) - Math.hypot(b.x - desired.x, b.y - desired.y));
    const selected = candidates.find(p => {
      const rect = { left: p.x - 20, right: p.x + 20, top: p.y - 22, bottom: p.y + 18 };
      return rect.left >= 4 && rect.right <= size.width - 4 && rect.top >= 4 && rect.bottom <= size.height - 4 && ![...overlays, ...occupied].some(r => intersects(rect, r, 8));
    });
    if (selected) {
      const angle = Math.atan2(pin.y - size.height / 2, pin.x - size.width / 2) * 180 / Math.PI;
      edges.push({ ...selected, id: pin.id, angle });
      occupied.push({ left: selected.x - 20, right: selected.x + 20, top: selected.y - 22, bottom: selected.y + 18 });
    }
  }
  return { labels, edges };
}
