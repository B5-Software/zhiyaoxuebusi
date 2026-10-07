import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { ACTIONS, FAVORITE_GIFTS, PLACES, REGIONS, ROMANCE_IDS, imagePath } from '../src/game/data';
import { EVENTS } from '../src/game/events';
import { AUTO_BACKUP_KEY, LEGACY_SAVE_KEY, SAVE_KEY, advanceWeek, beginMapStory, confirmRelationship, createGame, eventLock, getStorylines, giveCharacterGift, loadAutoBackups, loadGame, performAction, persistGame, placeStories, regionStories, replyMessage, resolveEvent, validateGame } from '../src/game/engine';
import { deliverMessages, markConversationRead, pendingChat, unreadCount } from '../src/game/social';
import { MESSAGE_SCRIPTS } from '../src/game/socialData';
import type { RomanceId } from '../src/game/types';
import { appointmentLock, attendAppointment, claimProject, claimQuest, initiateMessage, projectWorkLock, startProject, workOnProject } from '../src/game/engine';
import { getAppointments, MEETING_EVENTS } from '../src/game/appointments';
import { PROACTIVE_TOPICS } from '../src/game/proactiveData';
import { LONG_PROJECTS, projectStatus, resolveObjectiveTarget } from '../src/game/projects';
import { QUESTS, getQuestViews, recordPlaceVisit, toggleQuestTracking } from '../src/game/quests';
import { DEFAULT_MAP_ZOOM, mapDragBounds } from '../src/game/mapView';
import { getMapTaskTargets, taskEdgePosition } from '../src/game/mapTasks';
import { DEFAULT_PLAYER_NAME, playerText, renamePlayer } from '../src/game/player';
import { confessionLock, resolveRomanceScene } from '../src/game/romance';

const started = () => ({ ...createGame(), started: true });

test('custom names update dynamic story and IM text, preserve progress and survive saving', () => {
  assert.equal(createGame().name, DEFAULT_PLAYER_NAME);
  let game = startProject(deliverMessages(started()), 'project-zine').game;
  const renamed = renamePlayer(game, '  陈晨  ');
  assert.equal(renamed.game.name, '陈晨');
  assert.equal(renamed.game.nameIsCustom, true);
  assert.deepEqual(renamed.game.quests, game.quests);
  assert.deepEqual(renamed.game.social, game.social);
  assert.equal(renamed.game.actions, game.actions);
  assert.equal(playerText(renamed.game, '你好，{{player}}。{{player}}同学，请坐。'), '你好，陈晨。陈晨同学，请坐。');
  assert.equal(validateGame(JSON.parse(JSON.stringify(renamed.game)))?.name, '陈晨');
  assert.equal(renamePlayer(game, ' ').game, game);
  assert.ok(renamePlayer(game, 'a'.repeat(17)).error);
  assert.ok(renamePlayer(game, '名字\n换行').error);
  game = renamePlayer(renamed.game, '许安').game;
  assert.equal(playerText(game, '你好，{{player}}。'), '你好，许安。');
});

test('old default names migrate without changing user-entered names or story progress', () => {
  const old = JSON.parse(JSON.stringify(startProject(started(), 'project-zine').game));
  delete old.nameIsCustom;
  old.name = '林小满';
  const migrated = validateGame(old)!;
  assert.equal(migrated.name, DEFAULT_PLAYER_NAME);
  assert.deepEqual(migrated.quests, old.quests);
  old.name = '陈晨';
  assert.equal(validateGame(old)?.name, '陈晨');
  assert.equal(validateGame(old)?.nameIsCustom, true);
  old.nameIsCustom = true;
  old.name = '自选名字';
  assert.equal(validateGame(old)?.name, '自选名字');
});

test('task markers follow the active project stage, deduplicate places and hide outside school', () => {
  assert.deepEqual(getMapTaskTargets(createGame()), []);
  let game = startProject(started(), 'project-zine').game;
  let targets = getMapTaskTargets(game);
  assert.equal(new Set(targets.map(target => target.placeId)).size, targets.length);
  assert.equal(targets.find(target => target.placeId === 'reading-table')?.priority, 0);
  game = { ...game, quests: { ...game.quests, projects: { ...game.quests.projects, 'project-zine': { ...game.quests.projects['project-zine'], stage: 1, stageStartedWeeks: [0, 1] } } } };
  const target = resolveObjectiveTarget(game, LONG_PROJECTS.find(project => project.id === 'project-zine')!.stages[1].objective).placeId;
  targets = getMapTaskTargets(game);
  assert.equal(targets.find(item => item.placeId === target)?.priority, 0);
  assert.deepEqual(getMapTaskTargets({ ...game, phase: 'ending' }), []);
});

test('offscreen task indicators point toward all four edges and leave visible targets unmarked', () => {
  for (const view of [{ width: 320, height: 280 }, { width: 1440, height: 680 }]) {
    assert.equal(taskEdgePosition({ x: view.width / 2, y: view.height / 2 }, view), null);
    for (const [x, y, edge] of [[-500, view.height / 2, 'left'], [view.width + 500, view.height / 2, 'right'], [view.width / 2, -500, 'top'], [view.width / 2, view.height + 500, 'bottom']] as const) {
      const marker = taskEdgePosition({ x, y }, view)!;
      assert.equal(marker.edge, edge);
      assert.ok(marker.x >= 22 && marker.x <= view.width - 22);
      assert.ok(marker.y >= 0 && marker.y <= view.height - 24);
      assert.ok(Number.isFinite(marker.angle));
    }
  }
});

test('all nine maps, places, actions and story prerequisites resolve to real content', () => {
  assert.equal(REGIONS.length, 9);
  assert.equal(PLACES.length, 36);
  assert.equal(EVENTS.filter(event => event.placeId).length, 40);
  for (const collection of [REGIONS, PLACES, ACTIONS, EVENTS]) assert.equal(new Set(collection.map(item => item.id)).size, collection.length);
  for (const region of REGIONS) {
    assert.ok(fs.existsSync(`public${imagePath(region.id)}`));
    assert.ok(PLACES.filter(place => place.scene === region.id).length >= 3);
  }
  for (const place of PLACES) {
    assert.ok(REGIONS.some(region => region.id === place.scene));
    assert.ok(fs.existsSync(`public${imagePath(place.image)}`));
    for (const id of place.actions) assert.ok(ACTIONS.some(action => action.id === id), `${place.id}: ${id}`);
  }
  for (const event of EVENTS) {
    assert.ok(fs.existsSync(`public${imagePath(event.scene)}`));
    if (event.placeId) assert.equal(PLACES.find(place => place.id === event.placeId)?.scene, event.scene);
    if (event.requires) {
      const previous = EVENTS.find(item => item.id === event.requires!.eventId);
      assert.ok(previous);
      if (event.requires.choiceIndex !== undefined) assert.ok(previous.choices[event.requires.choiceIndex]);
    }
  }
});

test('map stories spend exactly one action, survive saving and cannot overwrite an unfinished event', () => {
  const game = started();
  assert.ok(beginMapStory(createGame(), 'zine-start').error);
  const reading = beginMapStory(game, 'zine-start');
  assert.equal(reading.game.pendingEvent, 'zine-start');
  assert.equal(reading.game.actions, 1);
  assert.equal(reading.game.counts.explore, 1);
  assert.deepEqual(reading.game.weeklyActions, ['story:zine-start']);
  assert.equal(reading.game.actionLog.length, 1);
  assert.ok(validateGame(JSON.parse(JSON.stringify(reading.game))));
  assert.ok(beginMapStory(reading.game, 'plant-ranking').error);
  assert.equal(beginMapStory(reading.game, 'plant-ranking').game.pendingEvent, 'zine-start');
  const complete = resolveEvent(reading.game, 0).game;
  assert.equal(complete.actions, 1);
  assert.ok(beginMapStory(complete, 'zine-start').error);
  assert.ok(validateGame(JSON.parse(JSON.stringify(complete))));
});

test('week and prerequisite locks prevent skipping a chapter', () => {
  const game = started();
  assert.ok(beginMapStory({ ...game, week: 20 }, 'zine-edit').error);
  const first = resolveEvent(beginMapStory(game, 'zine-start').game, 0).game;
  assert.ok(beginMapStory(first, 'zine-edit').error);
  assert.equal(beginMapStory({ ...first, week: 8 }, 'zine-edit').game.pendingEvent, 'zine-edit');
  assert.ok(beginMapStory({ ...first, week: 40, phase: 'exam' }, 'plant-ranking').error);
});

for (const branch of [0, 1]) {
  test(`all six storylines reach their chosen ending across 40 weeks, branch ${branch}`, () => {
    let game = resolveEvent({ ...started(), pendingEvent: 'first-day' }, 0).game;
    for (let week = 0; week < 40; week++) {
      let ready = EVENTS.find(event => event.storyline && !eventLock(game, event));
      while (ready) {
        game = resolveEvent(beginMapStory(game, ready.id).game, branch).game;
        ready = EVENTS.find(event => event.storyline && !eventLock(game, event));
      }
      for (const id of ['balanced', 'reading-circle', 'rest']) {
        if (game.actions >= 3) break;
        const action = performAction(game, id);
        assert.ok(!action.error, `${week}: ${id}: ${action.error}`);
        game = action.game;
      }
      game = advanceWeek(game);
      if (game.pendingEvent) game = resolveEvent(game, 0).game;
      assert.ok(validateGame(JSON.parse(JSON.stringify(game))), `invalid save after week ${week}`);
    }
    assert.equal(game.phase, 'exam');
    assert.ok(getStorylines(game).every(line => line.complete === 3 && !line.next));
    for (const event of EVENTS.filter(event => event.requires?.choiceIndex !== undefined)) {
      assert.equal(game.seenEvents.includes(event.id), event.requires!.choiceIndex === branch);
      if (event.requires!.choiceIndex !== branch) {
        assert.ok(!placeStories(game, event.placeId!).some(item => item.id === event.id));
        assert.ok(!regionStories(game, event.scene as typeof REGIONS[number]['id']).some(item => item.id === event.id));
      }
    }
  });
}

test('every new action works with the existing stat and save model', () => {
  for (const action of ACTIONS) {
    const result = performAction(started(), action.id);
    assert.ok(!result.error, action.id);
    assert.equal(result.game.actions, 1);
    assert.ok(validateGame(result.game), action.id);
  }
  const oldGame = resolveEvent({ ...started(), pendingEvent: 'first-day' }, 1).game;
  assert.deepEqual(validateGame(JSON.parse(JSON.stringify(oldGame))), oldGame);
});

test('incoming IM scripts and replies cannot be delivered or applied twice', () => {
  const game = deliverMessages(started());
  assert.equal(unreadCount(game), 7);
  assert.deepEqual(deliverMessages(game), game);
  const read = markConversationRead(game, 'su');
  assert.equal(unreadCount(read, 'su'), 0);
  assert.equal(unreadCount(read), 6);
  assert.equal(markConversationRead(read, 'su'), read);
  const reply = replyMessage(read, 'su-daily-0', 0);
  assert.ok(!reply.error);
  assert.equal(reply.game.actions, 0);
  assert.equal(reply.game.social.messages.filter(message => message.character === 'su').length, 3);
  assert.ok(replyMessage(reply.game, 'su-daily-0', 0).error);
  assert.equal(reply.game.social.replies.length, 1);
  assert.ok(validateGame(reply.game));
});

function playRelationship(target: RomanceId, confessionChoice = 0) {
  let game = resolveEvent({ ...started(), pendingEvent: 'first-day' }, 0).game;
  for (let week = 0; week < 39; week++) {
    game = deliverMessages(game);
    for (const character of ['su', 'zhou', 'zhixia', 'xinghe', 'tangtang', 'mom', 'teacher'] as const) {
      const script = pendingChat(game, character);
      if (!script) continue;
      const index = character === target ? script.id.endsWith('-confession') ? confessionChoice : 0 : script.romantic ? 2 : script.choices.length - 1;
      const response = replyMessage(game, script.id, index);
      assert.ok(!response.error, `${target}: ${script.id}: ${response.error}`);
      game = response.game;
    }
    if (confessionChoice === 1 && game.social.replies.some(reply => reply.scriptId === `${target}-confession`) && !game.social.partner && !confessionLock(game, target)) {
      const answer = confirmRelationship(game, target);
      assert.ok(!answer.error);
      game = resolveRomanceScene(answer.game, 0).game;
    }
    for (const id of [target, 'balanced', 'rest']) {
      const action = performAction(game, id);
      assert.ok(!action.error);
      game = action.game;
    }
    game = advanceWeek(game);
    if (game.pendingEvent) game = resolveEvent(game, 0).game;
    assert.ok(validateGame(JSON.parse(JSON.stringify(game))), `invalid ${target} save at week ${week}`);
  }
  return game;
}

for (const id of ROMANCE_IDS) test(`${id} can progress from acquaintance to a chosen romance and summer epilogue`, () => {
  const game = playRelationship(id);
  assert.equal(game.social.partner, id);
  assert.equal(game.social.bonds[id].route, 'dating');
  assert.ok(game.social.delivered.includes(`${id}-summer`));
  assert.ok(game.social.replies.some(reply => reply.scriptId === `${id}-summer`));
  assert.equal(new Set(game.social.delivered).size, game.social.delivered.length);
});

test('a deferred confession can be answered later without replaying the script', () => {
  const game = playRelationship('su', 1);
  assert.equal(game.social.partner, 'su');
  assert.equal(game.social.delivered.filter(id => id === 'su-confession').length, 1);
  assert.equal(game.romance.memories.filter(memory => memory.id.startsWith('confess:')).length, 1);
});

test('choosing friendship stops romantic invitations while preserving daily chats', () => {
  const game = playRelationship('zhixia', 2);
  assert.equal(game.social.partner, null);
  assert.equal(game.social.bonds.zhixia.route, 'friendship');
  assert.ok(!game.social.delivered.includes('zhixia-summer'));
  assert.ok(game.social.replies.some(reply => reply.scriptId === 'zhixia-daily-5'));
});

test('gift preferences and weekly cooldown protect resources and relation gains', () => {
  const game = started();
  const favorite = FAVORITE_GIFTS.su;
  const first = giveCharacterGift(game, 'su', favorite);
  assert.ok(!first.error);
  assert.equal(first.game.inventory[favorite], game.inventory[favorite] - 1);
  assert.equal(first.game.social.bonds.su.affection, 5);
  assert.ok(giveCharacterGift({ ...first.game, inventory: { ...first.game.inventory, [favorite]: 1 } }, 'su', favorite).error);
  const anotherWeek = { ...first.game, week: 1, inventory: { ...first.game.inventory, [favorite]: 1 } };
  assert.ok(!giveCharacterGift(anotherWeek, 'su', favorite).error);
});

test('v1 migration preserves progress; autosave backs up and recovers a corrupted primary', () => {
  const memory = new Map<string, string>();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) } });
  try {
    const modern = resolveEvent({ ...started(), pendingEvent: 'first-day' }, 0).game;
    const legacy: Record<string, unknown> = { ...modern, version: 1, relations: { su: modern.relations.su, zhou: modern.relations.zhou, mom: modern.relations.mom, teacher: modern.relations.teacher } };
    delete legacy.social;
    const legacyText = JSON.stringify(legacy);
    memory.set(LEGACY_SAVE_KEY, legacyText);
    let game = loadGame();
    assert.equal(game.version, 3);
    assert.deepEqual(game.history, modern.history);
    assert.deepEqual(game.subjects, modern.subjects);
    assert.equal(game.relations.su, modern.relations.su);
    assert.ok(persistGame(game));
    for (let step = 0; step < 9; step++) {
      game = performAction(game, 'rest').game;
      if (game.actions === 3) { game = advanceWeek(game); if (game.pendingEvent) game = resolveEvent(game, 0).game; }
      assert.ok(persistGame(game));
    }
    assert.equal(memory.get(LEGACY_SAVE_KEY), legacyText);
    assert.equal(loadAutoBackups().length, 6);
    const before = memory.get(AUTO_BACKUP_KEY);
    assert.ok(persistGame(game));
    assert.equal(memory.get(AUTO_BACKUP_KEY), before);
    const expected = loadAutoBackups()[0].game;
    memory.set(SAVE_KEY, '{broken');
    const recovered = loadGame();
    assert.equal(recovered.week, expected.week);
    assert.deepEqual(recovered.history, expected.history);
    assert.deepEqual(recovered.social.bonds, expected.social.bonds);
    const damaged = { ...game, social: { ...game.social, bonds: { ...game.social.bonds, su: { ...game.social.bonds.su, affection: NaN } } } };
    assert.equal(validateGame(damaged), null);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('weekly selection never replays an event for different deterministic seeds', () => {
  for (const seed of [1, 17, 998866]) {
    let game = resolveEvent({ ...started(), seed, pendingEvent: 'first-day' }, 0).game;
    for (let week = 0; week < 40; week++) {
      game = advanceWeek(game);
      if (game.pendingEvent) {
        assert.ok(!game.seenEvents.includes(game.pendingEvent));
        assert.ok(!EVENTS.find(event => event.id === game.pendingEvent)?.placeId);
        game = resolveEvent(game, 0).game;
      }
    }
    assert.equal(new Set(game.seenEvents).size, game.seenEvents.length);
  }
  assert.equal(new Set(MESSAGE_SCRIPTS.map(script => script.id)).size, MESSAGE_SCRIPTS.length);
});

test('quest and long-project catalog references real stories, locations, contacts and actions', () => {
  assert.equal(QUESTS.length, 60);
  assert.equal(LONG_PROJECTS.length, 16);
  for (const collection of [QUESTS, LONG_PROJECTS, PROACTIVE_TOPICS]) assert.equal(new Set(collection.map(item => item.id)).size, collection.length);
  for (const quest of QUESTS) {
    if (quest.requires) assert.ok(QUESTS.some(item => item.id === quest.requires));
    for (const objective of quest.objectives) if (objective.target.placeId) assert.ok(PLACES.some(place => place.id === objective.target.placeId));
  }
  for (const project of LONG_PROJECTS) {
    assert.equal(project.stages.length, project.datingOnly ? 4 : 3);
    assert.ok(ACTIONS.some(action => action.id === project.actionId));
    assert.ok(PLACES.some(place => place.id === project.placeId));
    assert.ok(project.stages.reduce((total, stage) => total + stage.weeks, 0) >= 5);
    assert.equal(project.stages.reduce((total, stage) => total + stage.work, 0), project.datingOnly ? 6 : 5);
    for (const stage of project.stages) if (stage.objective.target.placeId) assert.ok(PLACES.some(place => place.id === stage.objective.target.placeId));
  }
  assert.equal(PROACTIVE_TOPICS.filter(topic => !topic.weekly).length, 33);
  assert.equal(PROACTIVE_TOPICS.filter(topic => topic.weekly).length, 280);
  for (const topic of PROACTIVE_TOPICS) if (topic.invitePlace) assert.ok(PLACES.some(place => place.id === topic.invitePlace));
});

test('all contacts, including all five romance options, can be contacted proactively with an unanswered incoming chat', () => {
  let game = deliverMessages(started());
  for (const character of ['su', 'zhou', 'zhixia', 'xinghe', 'tangtang', 'mom', 'teacher'] as const) {
    const hello = PROACTIVE_TOPICS.find(topic => topic.character === character)!;
    const before = pendingChat(game, character);
    const result = initiateMessage(game, hello.id);
    assert.ok(!result.error, character);
    game = result.game;
    assert.equal(game.actions, 0);
    assert.equal(pendingChat(game, character)?.id, before?.id);
    assert.equal(game.social.messages.filter(message => message.topicId === hello.id).length, 2);
    assert.ok(initiateMessage(game, hello.id).error);
    const another = PROACTIVE_TOPICS.find(topic => topic.character === character && topic.id !== hello.id)!;
    assert.ok(initiateMessage(game, another.id).error);
    assert.ok(validateGame(JSON.parse(JSON.stringify(game))));
  }
  assert.equal(game.social.initiatives.length, 7);
  assert.ok(initiateMessage({ ...game, week: 1 }, 'su-interest').game.social.initiatives.some(item => item.topicId === 'su-interest'));
  assert.ok(initiateMessage(game, 'su-couple').error);
  assert.ok(initiateMessage({ ...game, pendingEvent: 'first-day' }, 'su-interest').error);
});

test('persistent task rewards and tracking do not reset every week or pay out twice', () => {
  let game = resolveEvent({ ...started(), pendingEvent: 'first-day' }, 0).game;
  assert.equal(getQuestViews(game).find(task => task.id === 'main-1')?.status, 'ready');
  const money = game.stats.money;
  game = claimQuest(game, 'main-1').game;
  assert.equal(game.stats.money, money + 20);
  assert.ok(claimQuest(game, 'main-1').error);
  game = recordPlaceVisit(recordPlaceVisit(recordPlaceVisit(game, 'classroom'), 'desk'), 'wall');
  assert.equal(getQuestViews(game).find(task => task.id === 'explore-1')?.status, 'ready');
  game = recordPlaceVisit(game, 'classroom');
  assert.equal(game.quests.visitedPlaces.length, 3);
  game = toggleQuestTracking(toggleQuestTracking(toggleQuestTracking(game, 'side-science'), 'side-voice'), 'side-help');
  assert.equal(game.quests.tracked.length, 2);
  assert.deepEqual(game.quests.tracked, ['side-voice', 'side-help']);
  game = advanceWeek(game);
  assert.ok(game.quests.claimed.includes('main-1'));
  assert.equal(game.quests.visitedPlaces.length, 3);
  assert.ok(validateGame(game));
});

test('every contact has a fresh proactive topic throughout all forty weeks and the full history survives saving', () => {
  let game = deliverMessages(resolveEvent({ ...started(), pendingEvent: 'first-day' }, 0).game);
  for (let week = 0; week < 40; week++) {
    if (game.pendingEvent) game = resolveEvent(game, 0).game;
    for (const character of ['su', 'zhou', 'zhixia', 'xinghe', 'tangtang', 'mom', 'teacher'] as const) {
      const id = `${character}-weekly-${week}`;
      const result = initiateMessage(game, id);
      assert.ok(!result.error, `${id}: ${result.error}`);
      game = result.game;
      assert.ok(initiateMessage(game, id).error);
      if (week < 39) assert.ok(initiateMessage(game, `${character}-weekly-${week + 1}`).error);
    }
    assert.ok(validateGame(JSON.parse(JSON.stringify(game))));
    if (week < 39) game = advanceWeek(game);
  }
  assert.equal(game.social.initiatives.length, 280);
  assert.equal(game.social.messages.filter(message => message.topicId).length, 560);
  assert.ok(initiateMessage(game, 'su-weekly-0').error);
  const invalid = JSON.parse(JSON.stringify(game));
  invalid.social.initiatives[0].week = 1;
  invalid.social.messages.filter((message: { topicId?: string }) => message.topicId === 'su-weekly-0').forEach((message: { week: number }) => { message.week = 1; });
  assert.equal(validateGame(invalid), null);
});

for (const character of ROMANCE_IDS) {
  test(`${character} long project requires five distinct game weeks, real actions and proactive contact`, () => {
    let game = deliverMessages(resolveEvent({ ...started(), pendingEvent: 'first-day' }, 0).game);
    game = replyMessage(game, `${character}-daily-0`, 0).game;
    game = initiateMessage(game, `${character}-hello`).game;
    const id = `project-${character}`;
    const accepted = startProject(game, id);
    assert.ok(!accepted.error);
    game = accepted.game;
    assert.ok(startProject(game, id).error);
    assert.ok(claimProject(game, id).error);
    for (let week = 0; week < 5; week++) {
      if (game.pendingEvent) game = resolveEvent(game, 0).game;
      if (week === 1) game = initiateMessage(game, `${character}-interest`).game;
      const budget = game.actions;
      const worked = workOnProject(game, id);
      assert.ok(!worked.error, `${week}: ${worked.error}`);
      game = worked.game;
      assert.equal(game.actions, budget + 1);
      assert.ok(workOnProject(game, id).error);
      assert.equal(game.quests.projects[id].completedWeek, null);
      assert.ok(validateGame(JSON.parse(JSON.stringify(game))));
      game = advanceWeek(game);
    }
    assert.equal(game.quests.projects[id].completedWeek, 5);
    assert.deepEqual(game.quests.projects[id].contributions.map(item => item.week), [0, 1, 2, 3, 4]);
    if (game.pendingEvent) game = resolveEvent(game, 0).game;
    game = claimProject(game, id).game;
    assert.ok(game.quests.projects[id].claimed);
    assert.ok(claimProject(game, id).error);
    assert.ok(validateGame(game));
  });
}

for (const branch of [0, 1]) {
  test(`six map projects wait for authored chapters and preserve both endings, branch ${branch}`, () => {
    for (const project of LONG_PROJECTS.filter(project => !project.datingOnly && !ROMANCE_IDS.some(id => project.id === `project-${id}`))) {
      let game = resolveEvent({ ...started(), pendingEvent: 'first-day' }, 0).game;
      game = startProject(game, project.id).game;
      for (let week = 0; week < 39 && game.quests.projects[project.id].completedWeek === null; week++) {
        if (game.pendingEvent) game = resolveEvent(game, branch).game;
        const stage = projectStatus(game, project).stage;
        const placeId = resolveObjectiveTarget(game, stage.objective).placeId;
        const event = placeStories(game, placeId!).find(event => !eventLock(game, event));
        if (event) game = resolveEvent(beginMapStory(game, event.id).game, branch).game;
        if (!projectWorkLock(game, project.id)) game = workOnProject(game, project.id).game;
        assert.ok(validateGame(game), `${project.id}: week ${week}`);
        game = advanceWeek(game);
      }
      const progress = game.quests.projects[project.id];
      assert.ok(progress.completedWeek !== null, project.id);
      assert.ok(progress.completedWeek >= 21, `${project.id} must wait for the spring conclusion`);
      assert.equal(progress.contributions.length, 5);
      assert.ok(validateGame(game));
    }
  });
}

test('v2 saves lacking new fields migrate and malformed task or initiative records are rejected', () => {
  const game = deliverMessages(started());
  const old = JSON.parse(JSON.stringify(game));
  delete old.quests;
  delete old.social.initiatives;
  const migrated = validateGame(old)!;
  assert.ok(migrated);
  assert.deepEqual(migrated.quests.projects, {});
  assert.deepEqual(migrated.social.messages, game.social.messages);
  const active = startProject(game, 'project-zine').game;
  const duplicateWeek = JSON.parse(JSON.stringify(active));
  duplicateWeek.quests.projects['project-zine'].contributions = [{ week: 0, stage: 0 }, { week: 0, stage: 0 }];
  assert.equal(validateGame(duplicateWeek), null);
  const bad = JSON.parse(JSON.stringify(game));
  bad.quests.claimed = ['unknown-task'];
  assert.equal(validateGame(bad), null);
  const badInitiative = JSON.parse(JSON.stringify(game));
  badInitiative.social.initiatives = [{ topicId: 'su-hello', week: 0 }];
  assert.equal(validateGame(badInitiative), null);
  assert.ok(startProject({ ...game, week: 36 }, 'project-zine').error);
  assert.ok(startProject(createGame(), 'project-zine').error);
});

test('default map zoom is 150 percent and drag bounds reach the full map', () => {
  assert.equal(DEFAULT_MAP_ZOOM, 1.5);
  for (const [width, height, layerWidth, layerHeight] of [[1440, 680, 1440, 802], [390, 600, 820, 606]]) {
    const bounds = mapDragBounds({ width, height }, { width: layerWidth, height: layerHeight }, DEFAULT_MAP_ZOOM);
    assert.equal(bounds.right - bounds.left, layerWidth * DEFAULT_MAP_ZOOM - width);
    assert.equal(bounds.bottom - bounds.top, layerHeight * DEFAULT_MAP_ZOOM - height);
  }
});


test('location stories exhaust the weekly budget, hide map targets and return next week', () => {
  let game = started();
  for (const id of ['zine-start', 'plant-ranking', 'stage-start']) {
    const before = game.actions;
    const result = beginMapStory(game, id);
    assert.equal(result.error, undefined, id);
    assert.equal(result.game.actions, before + 1);
    game = resolveEvent(result.game, 0).game;
    assert.equal(game.actions, before + 1);
  }
  assert.equal(game.actions, 3);
  assert.deepEqual(getMapTaskTargets(game), []);
  const unread = EVENTS.find(event => event.placeId && !game.seenEvents.includes(event.id) && event.minWeek === 0 && !event.requires)!;
  assert.match(eventLock(game, unread)!, /行动已用完/);
  assert.equal(beginMapStory(game, unread.id).game, game);
  assert.ok(validateGame(JSON.parse(JSON.stringify(game))));
  const forged = structuredClone(game);
  forged.weeklyActions[0] = 'story:not-a-real-story';
  assert.equal(validateGame(forged), null);
  game = advanceWeek(game);
  assert.equal(game.actions, 0);
  if (game.pendingEvent) game = resolveEvent(game, 0).game;
  assert.ok(getMapTaskTargets(game).length > 0);
});

for (const character of ROMANCE_IDS) {
  test(character + ' invitation survives later chats and refresh, spends one action and becomes a story', () => {
    let game = { ...started(), week: 6 };
    game.social.bonds[character].trust = 30;
    game = initiateMessage(game, character + '-invite-out').game;
    const accepted = getAppointments(game, character)[0];
    assert.ok(accepted);
    assert.equal(accepted.completed, false);
    assert.ok(getMapTaskTargets(game).some(item => item.placeId === accepted.placeId));
    game = initiateMessage({ ...game, week: 7 }, character + '-weekly-7').game;
    game = validateGame(JSON.parse(JSON.stringify(game)))!;
    assert.equal(getAppointments(game, character)[0].eventId, accepted.eventId);
    assert.ok(attendAppointment({ ...game, actions: 3, weeklyActions: ['rest', 'rest', 'rest'] }, accepted.eventId).error);
    assert.ok(attendAppointment({ ...game, pendingEvent: 'first-day' }, accepted.eventId).error);
    assert.ok(attendAppointment(started(), accepted.eventId).error);
    const result = attendAppointment(game, accepted.eventId);
    assert.equal(result.error, undefined);
    assert.equal(result.game.pendingEvent, accepted.eventId);
    assert.equal(result.game.actions, 1);
    assert.equal(result.game.social.bonds[character].meetings, 1);
    assert.ok(validateGame(JSON.parse(JSON.stringify(result.game))));
    assert.ok(attendAppointment(result.game, accepted.eventId).error);
    game = resolveEvent(result.game, 0).game;
    assert.equal(game.actions, 1);
    assert.equal(getAppointments(game, character)[0].completed, true);
    assert.ok(game.history.some(item => item.eventId === accepted.eventId));
    assert.ok(appointmentLock(game, accepted.eventId));
    assert.ok(validateGame(JSON.parse(JSON.stringify(game))));
  });
}

test('incoming invitations require consent, allow postponing, and meetings never appear in weekly random events', () => {
  const script = MESSAGE_SCRIPTS.find(item => item.id === 'zhixia-invite')!;
  let game = { ...started(), week: 16 };
  game.social.bonds.zhixia = { ...game.social.bonds.zhixia, trust: 80, affection: 80 };
  game.social.delivered = [script.id];
  game.social.messages = [{ id: script.id + '-in', character: 'zhixia', side: 'incoming', text: script.text, week: 16, read: false, scriptId: script.id }];
  assert.equal(getAppointments(game).length, 0);
  assert.equal(getAppointments(replyMessage(game, script.id, 2).game).length, 0);
  for (const choice of [0, 1]) {
    const accepted = replyMessage(game, script.id, choice).game;
    assert.equal(getAppointments(accepted).length, 1);
    assert.equal(getAppointments(validateGame(JSON.parse(JSON.stringify(accepted)))!).length, 1);
  }
  assert.equal(MEETING_EVENTS.length, 10);
  game = started();
  for (let week = 1; week < 40; week++) {
    game = advanceWeek(game);
    assert.ok(!MEETING_EVENTS.some(event => event.id === game.pendingEvent));
    if (game.pendingEvent) game = resolveEvent(game, 0).game;
  }
});
