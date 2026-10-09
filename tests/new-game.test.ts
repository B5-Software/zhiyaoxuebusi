import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, validateGame } from '../src/game/engine';
import { createNewGame, type NewGameOptions } from '../src/game/newGame';
import { advanceLife, chooseLife, die, inheritLife, lifeAction, lifeAge } from '../src/game/life';
import { UNIVERSITIES } from '../src/game/data';
import { startLifeStory, acknowledgeLifeStory } from '../src/game/lifeStories';

const school = UNIVERSITIES.find(s => s.id === 'xjtu')!;
const options: NewGameOptions = { name: '许予安', gender: 'female', difficulty: 'standard', stage: 'highschool', schoolId: school.id, major: school.majors[0], education: 'bachelor' };
const fresh = (stage: NewGameOptions['stage'], patch: Partial<NewGameOptions> = {}) => createNewGame({ ...options, stage, ...patch });
const saved = (g: ReturnType<typeof fresh>) => { const n = validateGame(JSON.parse(JSON.stringify(g))); assert.ok(n); return n; };
const clear = (g: ReturnType<typeof fresh>) => g.life.pending ? chooseLife(g, 0).game : g.life.stories.receipt ? acknowledgeLifeStory(g).game : g;

test('high-school opening retains the real first chapter, identity and unopened lifetime state', () => {
  const g = saved(fresh('highschool'));
  assert.equal(g.gender, 'female'); assert.equal(g.name, options.name); assert.equal(g.pendingEvent, 'first-day');
  assert.equal(g.phase, 'school'); assert.equal(g.week, 0); assert.equal(g.stats.money, 120); assert.equal(g.life.active, false);
  assert.ok(g.social.messages.length > 0); assert.equal(g.examScore, null);
});
test('university opening uses the chosen school and major, books real coursework and reloads', () => {
  const other = UNIVERSITIES.find(s => s.type === '本科')!;
  let g = fresh('university', { schoolId: other.id, major: other.majors[0], gender: 'male' });
  assert.equal(lifeAge(g), 18); assert.equal(g.life.education.school, other.name); assert.equal(g.life.education.major, other.majors[0]);
  assert.equal(g.life.education.credits, 0); assert.equal(g.life.education.degree, false); assert.equal(g.life.economy.rent, 'dorm');
  g = saved(lifeAction(saved(g), 'course').game); assert.equal(g.life.actions, 1); assert.equal(g.life.education.credits, 1);
  g = saved(advanceLife(g).game); assert.equal(g.life.weeks, 1); assert.equal(g.week, 0); assert.equal(g.examScore, null); assert.deepEqual(g.examAnswers, []);
});
test('direct university still needs four years and enough earned credits before graduating', () => {
  let g = fresh('university'); g.seed = 58310; g.stats.money = 1000000;
  for (let w = 0; w < 208; w++) {
    g = clear(g); g = lifeAction(g, w < 160 ? 'course' : 'exercise').game;
    g = lifeAction(g, 'rest').game; g = advanceLife(g).game;
    if (w < 207) assert.equal(g.life.education.degree, false);
  }
  g = saved(clear(g)); assert.equal(g.life.education.degree, true); assert.equal(g.life.stage, 'society'); assert.equal(lifeAge(g), 22);
});
test('society entry separates bachelor and work backgrounds and creates no free job or partner', () => {
  const degree = saved(fresh('society')), work = saved(fresh('society', { education: 'work' }));
  assert.equal(degree.life.education.degree, true); assert.equal(degree.life.education.prestige, 90);
  assert.equal(work.life.education.degree, false); assert.equal(work.life.education.prestige, 0); assert.equal(work.life.education.credits, 0);
  for (const g of [degree, work]) {
    assert.equal(lifeAge(g), 22); assert.equal(g.life.region, 'recruitment'); assert.equal(g.life.economy.rent, 'shared');
    assert.equal(g.stats.money, 5000); assert.equal(g.life.work.job, null); assert.equal(g.social.partner, null); assert.deepEqual(g.life.family.children, []);
    assert.deepEqual(g.history, []); assert.deepEqual(g.life.stories.log, []); assert.deepEqual(g.examAnswers, []); assert.equal(g.admittedId, null);
  }
});
test('retirement entry gets income from the stated contribution record and continues health and age', () => {
  let g = saved(fresh('retirement'));
  assert.equal(lifeAge(g), 60); assert.equal(g.life.work.retired, true); assert.equal(g.life.work.pensionWeeks, 1560);
  assert.equal(g.life.work.job, null); assert.equal(g.life.economy.insurance, 'basic'); assert.equal(g.stats.money, 20000);
  assert.equal(g.life.body.emergency, null); assert.deepEqual(g.life.body.conditions, []);
  g = saved(advanceLife(g).game);
  assert.ok(lifeAge(g) > 60); assert.ok(g.life.economy.ledger.some(row => row.label === '按缴费记录模拟退休收入' && row.amount === 387.2));
  assert.equal(startLifeStory(g, 'slow-time').error, undefined);
});
test('every direct entry can start a real long story, persist its outcome and proceed next week', () => {
  for (const stage of ['university', 'society', 'retirement'] as const) {
    let g = saved(startLifeStory(fresh(stage), stage === 'retirement' ? 'slow-time' : 'outside').game);
    assert.equal(g.life.actions, 1); g = saved(chooseLife(g, 0).game); assert.ok(g.life.stories.receipt);
    g = saved(acknowledgeLifeStory(g).game); g = saved(advanceLife(g).game);
    assert.equal(g.life.weeks, 1); assert.equal(g.life.actions, 0); assert.equal(g.examScore, null);
  }
});
test('missing stage migrates old saves while direct entry cannot bypass unrelated exam validation', () => {
  const old: any = createGame(); delete old.startStage;
  assert.equal(saved(old).startStage, 'highschool');
  const broken = fresh('university'); broken.life.active = false; assert.equal(validateGame(broken), null);
  const fabricated = fresh('society'); fabricated.examScore = 600; fabricated.examAnswers = [0,0,0]; assert.equal(validateGame(fabricated), null);
  const ending = createGame(); Object.assign(ending, { started: true, phase: 'ending', week: 40, examAnswers: [0,0,0] }); assert.equal(validateGame(ending), null);
  assert.equal(validateGame({ ...fresh('retirement'), startStage: 'unknown' }), null);
  assert.equal(validateGame({ ...fresh('retirement'), startStage: ['retirement'] }), null);
  assert.equal(validateGame({ ...fresh('retirement'), startStage: null }), null);
});
test('children of a direct-start life receive their own origin and valid school continuation', () => {
  const g = fresh('retirement'); g.life.family.children = [{ id: 'next', name: '予禾', gender: 'male', bornWeek: 0, education: 0, care: 70 }];
  die(g, '寿终'); const next = saved(inheritLife(g, 'next', createGame()).game);
  assert.equal(next.name, '予禾'); assert.equal(next.gender, 'male'); assert.equal(next.startStage, 'highschool'); assert.equal(next.life.generation, 2);
  assert.equal(next.life.stage, 'school'); assert.equal(lifeAge(next), 15); assert.equal(next.social.partner, null);
});
test('invalid name and incompatible preset selections are rejected before creating a save', () => {
  assert.throws(() => createNewGame({ ...options, name: '\n' }));
  assert.throws(() => createNewGame({ ...options, major: '不存在的专业' }));
  assert.throws(() => createNewGame({ ...options, stage: 'unknown' as NewGameOptions['stage'] }));
  const original = structuredClone(options); createNewGame(options); assert.deepEqual(options, original);
});
