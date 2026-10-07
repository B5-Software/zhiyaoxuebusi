import test from 'node:test';
import assert from 'node:assert/strict';
import { beginMapStory, createGame, giveCharacterGift, resolveEvent, validateGame } from '../src/game/engine';
import { BIRTHDAY_EVENTS, birthdayEventFor, birthdayInfo, birthdayStatus, deliverBirthdayReminders } from '../src/game/birthdays';
import { FAVORITE_GIFTS } from '../src/game/data';
import { beginRomanceScene, resolveRomanceScene, unlockedRomanceMoments } from '../src/game/romance';
import { pendingChat } from '../src/game/social';
import { pinchMapTransform } from '../src/game/mapView';
import { datingFixture } from './romance-fixtures';

for (const id of ['su', 'zhou', 'zhixia', 'xinghe', 'tangtang'] as const) test(`${id} couple birthday keeps its variant and gates private birthday content`, () => {
  const event = BIRTHDAY_EVENTS.find(event => event.id === `birthday-${id}`)!;
  const ordinary = { ...createGame(), started: true, week: event.minWeek };
  const dating = { ...datingFixture(id), week: event.minWeek, actions: 0, weeklyActions: [] };
  assert.equal(birthdayEventFor(ordinary, event).chapter.startsWith('情侣生日'), false);
  const celebrated = resolveEvent(beginMapStory(dating, event.id).game, 0).game;
  assert.ok(celebrated.history.at(-1)?.result.startsWith('这份情侣生日回忆'));
  assert.ok(birthdayEventFor({ ...celebrated, social: { ...celebrated.social, partner: null } }, event).chapter.startsWith('情侣生日'));
  const adult = { age: 'adult', skipPrivate: false } as const;
  const visit = resolveRomanceScene(beginRomanceScene(celebrated, id, 'home', adult).game, 0, adult).game;
  assert.ok(beginRomanceScene(visit, id, 'birthday-private', { age: 'minor', skipPrivate: false }).error);
  const begun = beginRomanceScene(visit, id, 'birthday-private', adult);
  assert.equal(begun.error, undefined); assert.equal(begun.game.actions, 2);
  assert.equal(begun.game.world.scene, 'home'); assert.equal(begun.game.world.placeId, 'family');
  assert.ok(validateGame(begun.game));
  assert.ok(resolveRomanceScene(begun.game, 0, adult).error);
  const entered = resolveRomanceScene(begun.game, 0, adult, true).game;
  const skipped = resolveRomanceScene(begun.game, 1, adult).game;
  assert.deepEqual(entered.social.bonds[id], skipped.social.bonds[id]);
  assert.equal(skipped.actions, 2); assert.equal(skipped.romance.memories.at(-1)?.skipped, true);
  assert.ok(beginRomanceScene(skipped, id, 'private', adult).error);
});

for (const event of BIRTHDAY_EVENTS) test(`${event.id} has a one-action birthday story with a retained record`, () => {
  const game = { ...createGame(), started: true, pendingEvent: null, week: event.minWeek };
  const begun = beginMapStory(game, event.id);
  assert.equal(begun.error, undefined); assert.equal(begun.game.actions, 1);
  const resolved = resolveEvent(begun.game, 0).game;
  assert.equal(resolved.actions, 1); assert.equal(resolved.history.at(-1)?.eventId, event.id);
  assert.ok(beginMapStory(resolved, event.id).error);
});
test('birthday gift bonus is 50%, once per year, and survives save validation', () => {
  const game = { ...createGame(), started: true, pendingEvent: null, week: birthdayInfo('su').week };
  game.relations.su = 0; game.inventory[FAVORITE_GIFTS.su] = 2;
  const given = giveCharacterGift(game, 'su', FAVORITE_GIFTS.su);
  assert.equal(given.game.relations.su, 14);
  assert.equal(given.game.social.bonds.su.trust - game.social.bonds.su.trust, 9);
  assert.equal(given.game.actions, game.actions);
  assert.equal(birthdayStatus(given.game, 'su').bonusAvailable, false);
  assert.deepEqual(validateGame(given.game)?.birthdayGifts, ['su:2026']);
  assert.ok(giveCharacterGift(given.game, 'su', FAVORITE_GIFTS.su).error);
});
test('family birthday gifts give warmth and only the first gift gets a bonus', () => {
  const game = { ...createGame(), started: true, pendingEvent: null, week: birthdayInfo('mom').week };
  game.relations.mom = 0; game.inventory.milk = 2;
  const first = giveCharacterGift(game, 'mom').game;
  const second = giveCharacterGift(first, 'mom').game;
  assert.equal(first.relations.mom, 9); assert.equal(second.relations.mom, 15);
  assert.deepEqual(second.birthdayGifts, ['mom:2025']); assert.equal(second.social.partner, null);
});
test('birthday reminders are unread, delivered once, and do not block replies', () => {
  const game = { ...createGame(), started: true, pendingEvent: null, week: birthdayInfo('teacher').week - 1 };
  const delivered = deliverBirthdayReminders(game), again = deliverBirthdayReminders(delivered);
  assert.equal(delivered.social.messages.filter(m => m.id === 'birthday-reminder:teacher').length, 1);
  assert.equal(delivered.social.messages.find(m => m.id === 'birthday-reminder:teacher')?.read, false);
  assert.equal(again.social.messages.length, delivered.social.messages.length);
  assert.equal(pendingChat(delivered, 'teacher'), undefined);
});
test('late June birthday has an explicit pre-exam celebration without changing the actual date', () => {
  const info = birthdayInfo('zhixia'); assert.equal(info.week, 39); assert.equal(info.early, true); assert.equal(info.date, 16);
  const old = createGame(); const { birthdayGifts: _removed, ...legacy } = old;
  assert.deepEqual(validateGame(legacy)?.birthdayGifts, []);
  assert.equal(validateGame({ ...old, birthdayGifts: ['mom:2025', 'mom:2025'] }), null);
});
test('affection illustrations require a relationship and the accepted matching scene', () => {
  assert.deepEqual(unlockedRomanceMoments(createGame(), 'su'), [false, false, false]);
  const game = datingFixture('su');
  assert.deepEqual(unlockedRomanceMoments(game, 'su'), [false, false, false]);
  const begun = beginRomanceScene(game, 'su', 'kiss'); assert.equal(begun.error, undefined);
  assert.deepEqual(unlockedRomanceMoments(resolveRomanceScene(begun.game, 1).game, 'su'), [false, false, false]);
  assert.deepEqual(unlockedRomanceMoments(resolveRomanceScene(begun.game, 0).game, 'su'), [false, false, true]);
});
test('pinch keeps its focal point, tracks midpoint movement, and clamps zoom and edges', () => {
  const view = { width: 400, height: 600 }, layer = { width: 800, height: 800 };
  const start = { zoom: 1.5, distance: 100, midpoint: { x: 100, y: 50 }, pan: { x: 20, y: 10 } };
  assert.deepEqual(pinchMapTransform(start, 200, { x: 100, y: 50 }, view, layer), { zoom: 3, x: -60, y: -30 });
  assert.deepEqual(pinchMapTransform(start, 100, { x: 120, y: 70 }, view, layer), { zoom: 1.5, x: 40, y: 30 });
  const clamped = pinchMapTransform(start, 20, { x: 10000, y: -10000 }, view, layer);
  assert.deepEqual(clamped, { zoom: 1, x: 200, y: -100 });
});
