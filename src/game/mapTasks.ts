import { PLACES } from './data';
import { EVENTS } from './events';
import { eventLock } from './engine';
import { LONG_PROJECTS, resolveObjectiveTarget } from './projects';
import { getQuestViews } from './quests';
import { getAppointments } from './appointments';
import type { GameState } from './types';

export function getMapTaskTargets(game: GameState) {
  const targets = new Map<string, { placeId: string; title: string; priority: number }>();
  function add(placeId: string | undefined, title: string, priority: number) {
    if (!placeId || !PLACES.some(place => place.id === placeId)) return;
    if (!targets.has(placeId) || targets.get(placeId)!.priority > priority) targets.set(placeId, { placeId, title, priority });
  }
  if (!game.started || game.phase !== 'school' || game.actions >= 3) return [];
  for (const appointment of getAppointments(game)) if (!appointment.completed) add(appointment.placeId, '待赴约 · 点击前往约见地点', 0);
  for (const project of LONG_PROJECTS) {
    const progress = game.quests.projects[project.id];
    if (!progress || progress.completedWeek !== null) continue;
    const objective = project.stages[progress.stage].objective;
    add(resolveObjectiveTarget(game, objective).placeId ?? project.placeId, project.title, 0);
  }
  for (const task of getQuestViews(game)) {
    if (task.status !== 'active' || task.kind !== 'main' && !game.quests.tracked.includes(task.id)) continue;
    for (const objective of task.objectives) if (objective.current < objective.goal) add(resolveObjectiveTarget(game, objective).placeId, task.title, 1);
  }
  for (const event of EVENTS) if (event.placeId && !eventLock(game, event)) add(event.placeId, event.title, 2);
  return [...targets.values()].sort((a, b) => a.priority - b.priority);
}

export function taskEdgePosition(point: { x: number; y: number }, view: { width: number; height: number }) {
  const left = 22, right = Math.max(left, view.width - 22);
  const top = Math.min(66, view.height / 3), bottom = Math.max(top, view.height - 24);
  if (point.x >= 16 && point.x <= view.width - 16 && point.y >= 16 && point.y <= view.height - 16) return null;
  const cx = view.width / 2, cy = view.height / 2;
  const dx = point.x - cx, dy = point.y - cy;
  const tx = dx === 0 ? Infinity : ((dx > 0 ? right : left) - cx) / dx;
  const ty = dy === 0 ? Infinity : ((dy > 0 ? bottom : top) - cy) / dy;
  const t = Math.max(0, Math.min(tx, ty));
  const edge = tx < ty ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'bottom' : 'top';
  return { x: cx + dx * t, y: cy + dy * t, angle: Math.atan2(dy, dx) * 180 / Math.PI, edge };
}
