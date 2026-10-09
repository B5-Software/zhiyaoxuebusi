import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, validateGame } from '../src/game/engine';
import { advanceLife, chooseLife, startLife, trade, familyOperation, lifeAction } from '../src/game/life';
import { LIFE_ARCS } from '../src/game/lifeStoryData';
import { acknowledgeLifeStory, pendingChapter, startLifeStory, storyProgress, storyRevisit } from '../src/game/lifeStories';
import { UNIVERSITIES } from '../src/game/data';
import { establishRelationship } from '../src/game/romance';
const arc = (id: string) => LIFE_ARCS.find(a => a.id === id)!;
function playing() {
  const g = createGame(); Object.assign(g, { started: true, week: 40, phase: 'ending', examAnswers: [0,0,0], examScore: 600, admittedId: UNIVERSITIES[0].id, admittedMajor: UNIVERSITIES[0].majors[0], seed: 58310 });
  const n = chooseLife(startLife(g).game, 0).game; n.stats.money = 1000000; return n;
}
const valid = (g: ReturnType<typeof playing>) => { const n = validateGame(JSON.parse(JSON.stringify(g))); assert.ok(n, 'serialized story state remains valid'); return n; };
function clear(g: ReturnType<typeof playing>) { if (g.life.pending) g = chooseLife(g, 0).game; if (g.life.stories.receipt) g = acknowledgeLifeStory(g).game; return g; }
function wait(g: ReturnType<typeof playing>, weeks: number) { for (let i = 0; i < weeks; i++) { g = clear(g); g = lifeAction(g, 'rest').game; const n = advanceLife(g); assert.equal(n.error, undefined); g = n.game; } return g; }

test('v3.1 records gain an empty story collection without losing existing assets or choices', () => {
  const old = playing() as any; delete old.life.stories; old.life.finance.holdings.ETH = 2; old.life.finance.basis.ETH = 36000;
  const n = valid(old); assert.equal(n.stats.money, old.stats.money); assert.equal(n.life.finance.holdings.ETH, 2); assert.deepEqual(n.life.stories.routes, {});
});
test('a chapter reserves exactly one action, persists during reading and cannot repeat on reload', () => {
  let g = startLifeStory(playing(), 'dorm-light').game; assert.equal(g.life.actions, 1); assert.equal(pendingChapter(g)?.step, 0); g = valid(g);
  assert.ok(startLifeStory(g, 'dorm-light').error); g = chooseLife(g, 0).game; assert.equal(g.life.actions, 1); assert.equal(g.life.stories.routes['dorm-light'].choices.length, 1); g = valid(g);
  assert.ok(advanceLife(g).error); assert.ok(g.life.stories.receipt); g = acknowledgeLifeStory(g).game; assert.ok(startLifeStory(g, 'dorm-light').error); valid(g);
});
test('continuation becomes a single cross-week visit and paid reading never becomes a free instant chain', () => {
  let g = clear(chooseLife(startLifeStory(playing(), 'dorm-light').game, 0).game); g = wait(g, 1); assert.equal(pendingChapter(g), null); g = wait(g, 1);
  assert.equal(pendingChapter(g)?.step, 1); assert.equal(g.life.actions, 1); assert.deepEqual(g.life.used, ['story:dorm-light']); valid(g);
  g = chooseLife(g, 1).game; const due = storyProgress(g, arc('dorm-light')).due; assert.equal(due, 6); assert.equal(g.life.stories.routes['dorm-light'].choices.length, 2); valid(g);
});
test('spent actions suppress new chapter entries without changing their readiness or chronology', () => {
  const g = playing(); g.life.actions = 3; g.life.used = ['rest', 'rest', 'rest']; const n = startLifeStory(g, 'outside'); assert.ok(n.error); assert.equal(n.game, g); assert.equal(g.life.stories.routes.outside, undefined);
});
test('story costs are atomic and an unaffordable choice leaves the pending chapter intact', () => {
  let g = startLifeStory(playing(), 'dorm-light').game; g.stats.money = 0; const n = chooseLife(g, 1); assert.ok(n.error); assert.equal(n.game, g); assert.equal(g.life.stories.routes['dorm-light'].choices.length, 0);
  g = chooseLife(g, 0).game; assert.equal(g.stats.money, 0); assert.equal(g.life.stories.routes['dorm-light'].choices.length, 1); valid(g);
});
test('first choices produce different later narration and different completed-arc capabilities', () => {
  const complete = (first: number) => {
    let g = playing(); g = clear(chooseLife(startLifeStory(g, 'dorm-light').game, first).game);
    for (const gap of [2,4,6]) { g = wait(g, gap); assert.equal(pendingChapter(g)?.arc.id, 'dorm-light'); if(gap===6)g.life.body.habits.sleep=60; g = clear(chooseLife(g, 1).game); }
    valid(g); return g;
  };
  const a = complete(0), b = complete(1); assert.equal(storyProgress(a, arc('dorm-light')).finished, true); assert.ok(startLifeStory(a, 'dorm-light').error);
  assert.notEqual(storyRevisit(a, arc('dorm-light')), storyRevisit(b, arc('dorm-light'))); assert.notEqual(a.life.stories.log[0].result, b.life.stories.log[0].result); assert.ok(a.life.skills.communication > b.life.skills.communication); assert.ok(b.life.body.habits.sleep > a.life.body.habits.sleep);
});
test('the main story actually crosses four years and remains compatible with normal weekly university study', () => {
  let g = clear(chooseLife(startLifeStory(playing(), 'outside').game, 0).game);
  for (let i = 0; i < 208; i++) { g = clear(g); g = lifeAction(g, 'course').game; g = lifeAction(g, 'rest').game; const r = advanceLife(g); assert.equal(r.error, undefined); g = r.game; }
  assert.equal(g.life.weeks, 208); assert.equal(pendingChapter(g)?.step, 3); assert.equal(g.life.education.degree, true);
  g = clear(chooseLife(g, 1).game); assert.equal(storyProgress(g, arc('outside')).finished, true); assert.deepEqual(g.life.stories.log.filter(r => r.arc === 'outside').map(r => r.week), [208,52,16,0]); valid(g);
});
test('market and family stories require actual life circumstances and never create trades or partners', () => {
  let g = playing(); assert.ok(startLifeStory(g, 'ticker').error); assert.ok(startLifeStory(g, 'table').error);
  g = trade(g, 'buy', 'ETH', 100).game; g = chooseLife(startLifeStory(g, 'ticker').game, 0).game; assert.equal(g.life.finance.trades.length, 1); assert.equal(g.social.partner, null); valid(g);
});
test('real wage arrears are chased across three weeks; story cannot create a wage claim from nothing', () => {
  let g = playing(); g.life.work.experience = 1; g = clear(chooseLife(startLifeStory(g, 'hours').game, 0).game); g = wait(g, 3); g.life.work.arrears = 700; g.life.work.arrearsWeeks = 1;
  g = chooseLife(g, 0).game; assert.equal(g.life.work.claimDue, 6); assert.equal(g.life.work.arrears, 700); valid(g);
  const n = playing(); n.life.work.experience = 1; let empty = clear(chooseLife(startLifeStory(n, 'hours').game, 0).game); empty = wait(empty, 3); empty = chooseLife(empty, 0).game; assert.equal(empty.life.work.claimDue, -1); assert.equal(empty.life.work.arrears, 0);
});
test('a family story can be archived after separation without restoring an ended relationship', () => {
  let g = establishRelationship(playing(), 'su'); g = clear(chooseLife(startLifeStory(g, 'table').game, 0).game); g = chooseLife(familyOperation(g, 'breakup').game, 0).game; g = wait(g, 4);
  assert.ok(storyRevisit(g, arc('table'))); const affection = g.life.family.affection; g = chooseLife(g, 0).game; assert.equal(g.social.partner, null); assert.equal(g.life.family.spouse, null); assert.equal(g.life.family.affection, affection); valid(g);
});
test('tampered routes, receipts, choices and unpaid pending chapters are rejected', () => {
  const started = startLifeStory(playing(), 'dorm-light').game;
  for (const mutate of [(g: any) => g.life.stories.routes.invented = { started:0,lastWeek:0,choices:[] }, (g: any) => g.life.stories.routes['dorm-light'].choices = [9], (g: any) => g.life.stories.receipt = 'missing', (g: any) => {g.life.actions=0;g.life.used=[];}, (g: any) => g.life.pending = 'story:dorm-light:3']) { const g = structuredClone(started); mutate(g); assert.equal(validateGame(g), null); }
  const finished = chooseLife(started, 0).game; const tampered = structuredClone(finished); tampered.life.stories.log[0].choice = 1; assert.equal(validateGame(tampered), null);
});
