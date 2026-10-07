import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceWeek, confirmRelationship, createGame, performAction, replyMessage, resolveEvent, startProject, validateGame, workOnProject, claimProject } from '../src/game/engine';
import { beginRomanceScene, changeRelationship, confessionLock, endHomeVisit, makeHandmadeGift, resolveRomanceScene, sceneLock, setCompanion, updateBoundary } from '../src/game/romance';
import { AUDIENCE_KEY, actorsAreAdults, loadAudience, matureAllowed, persistAudience } from '../src/game/audience';
import { characterPositions } from '../src/game/characterSchedule';
import { ROMANCE_SCENES } from '../src/game/romanceData';
import { getAppointments } from '../src/game/appointments';
import { ROMANCE_IDS } from '../src/game/data';
import { readyToConfess, datingFixture } from './romance-fixtures';
import type { Audience, GameState } from '../src/game/types';
const adult: Audience = { age: 'adult', skipPrivate: false }, minor: Audience = { age: 'minor', skipPrivate: false };
const finishWeek = (game: GameState) => { let next = advanceWeek(game); if (next.pendingEvent) next = resolveEvent(next, 0).game; if (next.romance.active) next = resolveRomanceScene(next, 0).game; return next; };

test('viewer age is stored outside game saves; imported preference fields cannot unlock content', () => {
  const memory = new Map<string, string>();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
  try {
    assert.equal(loadAudience().age, 'unknown');
    assert.ok(!matureAllowed(createGame(), loadAudience()));
    persistAudience(minor);
    const imported = validateGame({ ...datingFixture(), audience: adult, age: 'adult' });
    assert.ok(imported);
    assert.equal(loadAudience().age, 'minor');
    assert.ok(!matureAllowed(imported!, loadAudience()));
    assert.ok(!('audience' in imported!));
    assert.ok(actorsAreAdults(createGame()));
    memory.set(AUDIENCE_KEY, '{broken'); assert.equal(loadAudience().age, 'unknown');
  } finally { if (original) Object.defineProperty(globalThis, 'localStorage', original); else Reflect.deleteProperty(globalThis, 'localStorage'); }
});

for (const id of ROMANCE_IDS) test(`${id} supports active confession, explicit choice and serialized relationship progress`, () => {
  const early = { ...createGame(), started: true };
  assert.ok(confessionLock(early, id)?.includes('信任'));
  const ready = readyToConfess(id);
  assert.equal(confessionLock(ready, id), null);
  const begun = confirmRelationship(ready, id);
  assert.ok(!begun.error);
  assert.equal(begun.game.social.partner, null);
  assert.equal(begun.game.actions, ready.actions);
  assert.ok(validateGame(begun.game));
  assert.ok(performAction(begun.game, 'rest').error);
  assert.equal(advanceWeek(begun.game), begun.game);
  const agreed = resolveRomanceScene(begun.game, 0).game;
  assert.equal(agreed.social.partner, id);
  assert.equal(agreed.romance.bonds[id].episode, 1);
  assert.ok(confirmRelationship(agreed, id).error);
  assert.ok(validateGame(JSON.parse(JSON.stringify(agreed))));
  assert.ok(resolveRomanceScene(agreed, 0).error);
  const deferred = resolveRomanceScene(begun.game, 1).game;
  assert.equal(deferred.social.partner, null);
  assert.ok(confessionLock(deferred, id)?.includes('3'));
});

test('confession requires meetings in different weeks and incoming replies enforce the same rule', () => {
  const game = readyToConfess();
  const missing = { ...game, romance: { ...game.romance, bonds: { ...game.romance.bonds, su: { ...game.romance.bonds.su, meetWeeks: [game.week] } } } };
  assert.ok(confessionLock(missing, 'su')?.includes('不同周'));
  assert.ok(confirmRelationship(missing, 'su').error);
  assert.ok(replyMessage(missing, 'su-confession', 0).error);
});

test('dates and home visits spend one action, cannot repeat and block unrelated actions while pending', () => {
  let game = datingFixture();
  const before = game.actions;
  game = beginRomanceScene(game, 'su', 'date').game;
  assert.equal(game.actions, before + 1);
  assert.ok(performAction(game, 'rest').error);
  game = resolveRomanceScene(game, 0).game;
  assert.ok(beginRomanceScene(game, 'su', 'date').error);
  game = beginRomanceScene(game, 'su', 'home').game;
  assert.equal(game.actions, before + 2);
  assert.equal(game.world.scene, 'home');
  game = resolveRomanceScene(game, 1).game;
  assert.equal(game.romance.visitor, 'su');
  assert.ok(beginRomanceScene(game, 'su', 'home').error);
  assert.ok(beginRomanceScene(game, 'su', 'walk').error);
  assert.ok(validateGame(game));
  const next = finishWeek(game);
  assert.equal(next.romance.visitor, null);
  assert.equal(next.actions, 0);
});

test('adult private entry requires explicit transient consent and skip gives the same progress without an extra action', () => {
  let game = datingFixture();
  game = resolveRomanceScene(beginRomanceScene(game, 'su', 'home').game, 0).game;
  assert.ok(beginRomanceScene(game, 'su', 'private', minor).error);
  assert.ok(beginRomanceScene(game, 'su', 'private').error);
  const begun = beginRomanceScene(game, 'su', 'private', adult).game;
  assert.equal(begun.actions, game.actions);
  assert.ok(resolveRomanceScene(begun, 0, adult).error);
  assert.ok(resolveRomanceScene(begun, 0, minor, true).error);
  const restored = validateGame(JSON.parse(JSON.stringify(begun)))!;
  assert.ok(restored);
  assert.ok(resolveRomanceScene(restored, 0, adult).error);
  const entered = resolveRomanceScene(restored, 0, adult, true).game;
  const skipped = resolveRomanceScene(restored, 1, minor).game;
  assert.deepEqual(entered.social.bonds, skipped.social.bonds);
  assert.deepEqual(entered.stats, skipped.stats);
  assert.equal(entered.actions, skipped.actions);
  assert.equal(skipped.romance.memories.at(-1)?.skipped, true);
  assert.ok(beginRomanceScene(entered, 'su', 'private', adult).error);
  assert.ok(validateGame(entered));
});

test('touch boundaries, once-a-week rewards and cooling stop physical interaction and following', () => {
  let game = datingFixture();
  game = updateBoundary(game, 'su', 'touch', false).game;
  assert.ok(sceneLock(game, 'su', 'hug'));
  game = updateBoundary(game, 'su', 'touch', true).game;
  game = resolveRomanceScene(beginRomanceScene(game, 'su', 'hug').game, 1).game;
  assert.ok(sceneLock(game, 'su', 'kiss')?.includes('本周'));
  game = setCompanion(game, 'su', true).game;
  game = changeRelationship(game, 'su', 'cooling').game;
  assert.equal(game.social.partner, 'su');
  assert.equal(game.romance.escort, null);
  assert.ok(setCompanion(game, 'su', true).error);
  assert.ok(beginRomanceScene(game, 'su', 'date').error);
  game = resolveRomanceScene(beginRomanceScene(game, 'su', 'talk').game, 0).game;
  assert.equal(game.romance.bonds.su.status, 'normal');
  assert.ok(validateGame(game));
});

test('talking can keep a cooling period without leaving an invalid follower or visitor', () => {
  let game = datingFixture(); game = resolveRomanceScene(beginRomanceScene(game, 'su', 'home').game, 0).game;
  game = setCompanion(game, 'su', true).game;
  game = resolveRomanceScene(beginRomanceScene(game, 'su', 'talk').game, 1).game;
  assert.equal(game.romance.escort, null); assert.equal(game.romance.visitor, null);
  assert.ok(validateGame(game));
});

test('breakup cancels old appointments, pauses exclusive projects, preserves memories and permits a new consensual episode', () => {
  let game = datingFixture(); game = startProject(game, 'project-love-su').game;
  game = setCompanion(game, 'su', true).game;
  const count = game.romance.memories.length;
  game = changeRelationship(game, 'su', 'breakup').game;
  assert.equal(game.social.partner, null);
  assert.equal(game.social.bonds.su.route, 'friendship');
  assert.equal(game.romance.escort, null);
  assert.equal(game.romance.memories.length, count + 1);
  assert.equal(getAppointments(game, 'su').length, 0);
  assert.ok(workOnProject(game, 'project-love-su').error);
  assert.ok(confessionLock(game, 'su'));
  game = finishWeek(game);
  game = resolveRomanceScene(beginRomanceScene(game, 'su', 'talk').game, 0).game;
  game = finishWeek(finishWeek(game));
  assert.equal(confessionLock(game, 'su'), null);
  game = resolveRomanceScene(confirmRelationship(game, 'su').game, 0).game;
  assert.equal(game.romance.bonds.su.episode, 2);
  assert.equal(game.social.partner, 'su');
  assert.ok(game.quests.projects['project-love-su']);
  assert.ok(validateGame(game));
});

test('all NPCs follow a valid schedule; a lover has exactly one marker and moves across maps', () => {
  let game = datingFixture(); game = setCompanion(game, 'su', true).game;
  for (const scene of ['campus', 'home', 'city', 'library', 'laboratory', 'arts', 'park', 'market', 'university'] as const) {
    const markers = characterPositions(game, scene, { x: 80, y: 70 });
    assert.equal(markers.filter(marker => marker.id === 'su').length, 1);
    assert.ok(markers.find(marker => marker.id === 'su')!.following);
    assert.equal(new Set(markers.map(marker => marker.id)).size, markers.length);
    assert.ok(markers.every(marker => marker.x >= 0 && marker.x <= 100 && marker.y >= 0 && marker.y <= 100));
  }
  game = finishWeek(game); assert.equal(game.romance.escort, null);
});

for (const id of ROMANCE_IDS) test(`${id} exclusive story and long quest require six distinct weeks, preserve choices and pay out once`, () => {
  let game = datingFixture(id); game = startProject(game, `project-love-${id}`).game;
  for (let stage = 0; stage < 6; stage++) {
    const begun = beginRomanceScene(game, id, `love-${id}-${stage}`);
    assert.ok(!begun.error, begun.error);
    game = resolveRomanceScene(begun.game, stage % 2).game;
    assert.ok(beginRomanceScene(game, id, `love-${id}-${stage}`).error);
    if (stage < 5) assert.ok(beginRomanceScene(game, id, `love-${id}-${stage + 1}`).error);
    const worked = workOnProject(game, `project-love-${id}`); assert.ok(!worked.error, worked.error); game = worked.game;
    assert.ok(validateGame(game), `stage ${stage}`);
    game = finishWeek(game);
  }
  const project = game.quests.projects[`project-love-${id}`];
  assert.equal(project.completedWeek, game.week);
  assert.equal(project.contributions.length, 6);
  assert.equal(game.romance.memories.filter(memory => memory.id.startsWith(`love-${id}-`)).length, 6);
  game = claimProject(game, `project-love-${id}`).game;
  assert.ok(claimProject(game, `project-love-${id}`).error);
  assert.ok(validateGame(game));
});

test('handmade gifts use real materials and three weekly actions, and cannot be duplicated', () => {
  let game = datingFixture(); const before = game.inventory.notes;
  game = makeHandmadeGift(game, 'su').game;
  assert.equal(game.inventory.notes, before - 1);
  for (let week = 0; week < 3; week++) {
    const old = game.actions; const result = makeHandmadeGift(game, 'su'); assert.ok(!result.error); game = result.game;
    assert.equal(game.actions, old + 1);
    assert.ok(makeHandmadeGift(game, 'su').error);
    game = finishWeek(game);
  }
  const old = game.actions; game = makeHandmadeGift(game, 'su').game;
  assert.equal(game.actions, old); assert.equal(game.romance.bonds.su.handmade?.gifted, true);
  assert.ok(makeHandmadeGift(game, 'su').error);
  assert.ok(validateGame(game));
});

test('school, family and rumor concerns wait behind weekly stories and never overwrite them', () => {
  let game = datingFixture();
  game = { ...game, romance: { ...game.romance, attention: { ...game.romance.attention, school: 90, family: 90, rumor: 90 } } };
  const next = advanceWeek(game);
  assert.ok(next.pendingEvent);
  assert.equal(next.romance.active, null);
  assert.equal(next.romance.attention.queued, 'school');
  game = resolveEvent(next, 0).game;
  assert.equal(game.romance.active?.id, 'school');
  assert.equal(game.actions, 0);
  game = resolveRomanceScene(game, 0).game;
  assert.equal(game.romance.attention.queued, null);
  assert.equal(advanceWeek(game).romance.attention.queued, null);
  assert.ok(validateGame(game));
});

test('public affection stays at the current place and creates contextual attention without penalizing ordinary conversation', () => {
  let game = datingFixture();
  game = updateBoundary(game, 'su', 'publicAffection', true).game;
  game = { ...game, world: { scene: 'campus', placeId: 'garden', x: 80, y: 70 } };
  const begun = beginRomanceScene(game, 'su', 'hug').game;
  assert.equal(begun.world.scene, 'campus'); assert.equal(begun.world.placeId, 'garden');
  game = resolveRomanceScene(begun, 0).game;
  assert.equal(game.romance.attention.school, 18); assert.equal(game.romance.attention.rumor, 14);
  const before = game.romance.attention;
  game = performAction(game, 'zhou').game;
  assert.deepEqual(game.romance.attention, before);
  assert.ok(validateGame(game));
});

test('v2 upgrade preserves legacy dating, name and history; malformed romance records are rejected', () => {
  const game = datingFixture();
  const raw: Record<string, unknown> = { ...game, version: 2 }; delete raw.romance; delete raw.world;
  const migrated = validateGame(raw)!;
  assert.ok(migrated); assert.equal(migrated.version, 3); assert.equal(migrated.social.partner, 'su');
  assert.equal(migrated.name, game.name); assert.deepEqual(migrated.history, game.history);
  const invalid = JSON.parse(JSON.stringify(game)); invalid.romance.escort = 'mom'; assert.equal(validateGame(invalid), null);
  assert.equal(validateGame({ ...game, version: '3', world: { scene: 'missing' } }), null);
  const pending = JSON.parse(JSON.stringify(game)); pending.romance.active = { id: 'love-zhixia-0', character: 'su', week: game.week }; assert.equal(validateGame(pending), null);
  assert.equal(ROMANCE_SCENES.length, 30);
  assert.equal(endHomeVisit(game).romance.visitor, null);
});
