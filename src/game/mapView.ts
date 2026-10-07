export const DEFAULT_MAP_ZOOM = 1.5;
export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 3;
export interface MapPoint { x: number; y: number }
export function pinchMapTransform(start: { zoom: number; distance: number; midpoint: MapPoint; pan: MapPoint }, distance: number, midpoint: MapPoint, view: { width: number; height: number }, layer: { width: number; height: number }) {
  const zoom = Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, start.zoom * distance / Math.max(1, start.distance)));
  const bounds = mapDragBounds(view, layer, zoom);
  const x = midpoint.x - (start.midpoint.x - start.pan.x) * zoom / start.zoom;
  const y = midpoint.y - (start.midpoint.y - start.pan.y) * zoom / start.zoom;
  return { zoom, x: Math.max(bounds.left, Math.min(bounds.right, x)), y: Math.max(bounds.top, Math.min(bounds.bottom, y)) };
}
export function mapDragBounds(view: { width: number; height: number }, layer: { width: number; height: number }, zoom: number) {
  const x = Math.max(0, (layer.width * zoom - view.width) / 2);
  const y = Math.max(0, (layer.height * zoom - view.height) / 2);
  return { left: -x, right: x, top: -y, bottom: y };
}
