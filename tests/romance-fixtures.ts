import { advanceWeek, attendAppointment, confirmRelationship, createGame, initiateMessage, performAction, resolveEvent } from '../src/game/engine';
import { resolveRomanceScene } from '../src/game/romance';
import type { RomanceId } from '../src/game/types';

export function readyToConfess(id: RomanceId = 'su') {
  let game = resolveEvent({ ...createGame(), started: true, week: 6, pendingEvent: 'first-day' }, 0).game;
  game = { ...game, social: { ...game.social, bonds: { ...game.social.bonds, [id]: { ...game.social.bonds[id], trust: 80, affection: 80, understanding: 65 } } } };
  game = performAction(game, id).game;
  game = advanceWeek(game);
  if (game.pendingEvent) game = resolveEvent(game, 0).game;
  game = initiateMessage(game, `${id}-invite-out`).game;
  game = attendAppointment(game, `meeting-${id}-invite-out`).game;
  return resolveEvent(game, 0).game;
}
export function datingFixture(id: RomanceId = 'su') { return resolveRomanceScene(confirmRelationship(readyToConfess(id), id).game, 0).game; }
