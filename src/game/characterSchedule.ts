import { CHARACTERS, PLACES, ROMANCE_IDS } from './data';
import { getAppointments } from './appointments';
import type { CharacterId, GameState, RomanceId, Scene } from './types';

const ROUTES: Record<RomanceId, string[]> = {
  su: ['classroom', 'reading-table', 'garden', 'library-window', 'river-path', 'books'],
  zhou: ['track', 'music-room', 'canteen', 'stone-bridge', 'street-stage', 'society-fair'],
  zhixia: ['art-studio', 'garden', 'river-path', 'little-stage', 'university-lake', 'art-studio'],
  xinghe: ['physics-lab', 'observatory', 'library-shelves', 'greenhouse', 'workshop-hall', 'classroom'],
  tangtang: ['radio-room', 'little-stage', 'canteen', 'street-stage', 'society-fair', 'picnic-lawn'],
};
export function characterPositions(game: GameState, scene: Scene, avatar = { x: game.world.x, y: game.world.y }) {
  const ids: CharacterId[] = [...ROMANCE_IDS, 'mom', 'teacher'];
  const occupied = new Map<string, number>();
  return ids.flatMap(id => {
    const escort = game.romance.escort === id;
    const visitor = game.romance.visitor === id && scene === 'home';
    if (escort) return [{ id, name: CHARACTERS[id].name, x: Math.max(4, avatar.x - 5), y: Math.min(96, avatar.y + 3), placeId: game.world.placeId, following: true }];
    const appointment = getAppointments(game).find(item => item.character === id && !item.completed);
    const locationId = visitor ? 'family' : appointment?.placeId ?? (id === 'mom' ? 'family' : id === 'teacher' ? game.actions === 1 ? 'physics-lab' : 'classroom' : ROUTES[id][(game.week + game.actions) % ROUTES[id].length]);
    const location = PLACES.find(place => place.id === locationId) ?? PLACES.find(place => place.id === 'classroom')!;
    if (location.scene !== scene) return [];
    const collision = occupied.get(location.id) ?? 0; occupied.set(location.id, collision + 1);
    return [{ id, name: CHARACTERS[id].name, x: Math.max(4, Math.min(96, location.x - 5 + collision * 6)), y: Math.min(96, location.y + 7 + collision * 2), placeId: location.id, following: false }];
  });
}
export function characterLocation(game: GameState, id: CharacterId) {
  return (['campus', 'home', 'city', 'library', 'laboratory', 'arts', 'park', 'market', 'university'] as Scene[]).flatMap(scene => characterPositions(game, scene).map(position => ({ ...position, scene }))).find(position => position.id === id && (position.following ? position.scene === game.world.scene : true));
}
