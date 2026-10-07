export const DEFAULT_MAP_ZOOM = 1.5;
export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 3;
export function mapDragBounds(view: { width: number; height: number }, layer: { width: number; height: number }, zoom: number) {
  const x = Math.max(0, (layer.width * zoom - view.width) / 2);
  const y = Math.max(0, (layer.height * zoom - view.height) / 2);
  return { left: -x, right: x, top: -y, bottom: y };
}
