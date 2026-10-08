import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, validateGame, advanceWeek, performAction } from '../src/game/engine';
import { startLife, chooseLife, advanceLife, advanceLifePlan, lifeAction, teleportLife, trade, closePosition, removeLiquidity, applyJob, familyOperation, medicalOperation, inheritLife, die, lifeAge } from '../src/game/life';
import { ASSETS, DISEASES } from '../src/game/lifeData';
import { positionEquity, stepMarket } from '../src/game/lifeFinance';
import { answerMiniGame, startMiniGame, memoryBoard } from '../src/game/lifeGames';
import { UNIVERSITIES } from '../src/game/data';
import { establishRelationship } from '../src/game/romance';
function graduate() { const g = createGame(); g.started = true; g.week = 40; g.phase = 'ending'; g.examAnswers = [0, 0, 0]; g.examScore = 600; g.admittedId = UNIVERSITIES[0].id; g.admittedMajor = UNIVERSITIES[0].majors[0]; g.seed = 58310; return g; }
function playing() { return chooseLife(startLife(graduate()).game, 0).game; }
function valid(g: ReturnType<typeof createGame>) { assert.ok(validateGame(JSON.parse(JSON.stringify(g))), 'state must survive a save'); }
test('old saves migrate and school actions preserve long-term habits without replacing school state', () => {
  const old = graduate() as any; delete old.life; const migrated = validateGame(old)!; assert.ok(migrated.life); assert.equal(migrated.life.body.schoolWeeks, 40);
  let g = createGame(); g.started = true; g.pendingEvent = null; const sleep = g.life.body.habits.sleep; g = performAction(g, 'rest').game; assert.ok(g.life.body.habits.sleep > sleep); g = advanceWeek(g); assert.equal(g.life.body.schoolWeeks, 1); valid(g);
});
test('life unlocks after graduation and teleporting cannot refresh budget or markets', () => {
  assert.ok(startLife(createGame()).error); let g = playing(); const prices = { ...g.life.finance.prices }; g = lifeAction(g, 'course').game;
  for (const atlas of ['university', 'society', 'school'] as const) g = teleportLife(g, atlas).game;
  assert.equal(g.life.actions, 1); assert.deepEqual(g.life.finance.prices, prices); assert.equal(g.week, 40); valid(g);
});
test('degree takes four years, actions are weekly and age advances across old school visits', () => {
  let g = playing(); assert.ok(lifeAction(lifeAction(g, 'course').game, 'course').error);
  for (let week = 0; week < 208; week++) { if (g.life.pending) g = chooseLife(g, 0).game; g = lifeAction(g, 'course').game; g = lifeAction(g, 'rest').game; g = advanceLife(g).game; if (g.life.body.emergency) g = medicalOperation(g, 'rescue').game; }
  assert.equal(g.life.education.degree, true); assert.ok(lifeAge(g) >= 22); assert.equal(g.life.stage, 'society'); assert.equal(g.life.economy.rent, 'shared'); valid(g);
});
test('interactive interview, qualifications, real shifts and payroll cannot mint wages on teleport', () => {
  let g = playing(); assert.ok(applyJob(g, 'shop').error); g = startMiniGame(g, 'interview').game; for (const a of [0, 1, 2, 1, 0]) g = answerMiniGame(g, a).game;
  assert.equal(g.life.scores.interview, 100); valid(g); assert.ok(applyJob(g, 'developer').error); g = applyJob(g, 'shop').game; const cash = g.stats.money;
  g = lifeAction(g, 'work').game; assert.equal(g.stats.money, cash); assert.equal(g.life.work.hours, 20); g = advanceLife(g).game; assert.ok(g.life.economy.ledger.some(t => t.label.includes('周工资') && t.amount === 300)); valid(g);
});
test('spot trades reject unowned sales and conserve value after fees', () => {
  let g = playing(); g.stats.money = 10000; const cash = g.stats.money; assert.ok(trade(g, 'sell', 'ETH', 10).error); g = trade(g, 'buy', 'ETH', 1000).game; assert.equal(g.stats.money, cash - 1001); g = trade(g, 'sell', 'ETH', 1000).game; assert.ok(Math.abs(g.stats.money - (cash - 2)) < .01); assert.equal(g.life.finance.holdings.ETH, 0); valid(g);
});
test('perpetual equity, delivery settlement and liquidation separate cash from collateral', () => {
  let g = playing(); g.stats.money = 10000; g = trade(g, 'perpetual', 'ETH', 500, 5, 'long').game; assert.equal(g.stats.money, 9497.5); assert.equal(positionEquity(g.life.finance.positions[0], g.life.finance.prices.ETH), 500);
  g = closePosition(g, g.life.finance.positions[0].id).game; assert.equal(g.stats.money, 9995); assert.equal(g.life.finance.positions.length, 0);
  g = trade(g, 'delivery', 'ETH', 100, 2).game; const f = stepMarket(g.life.finance, 11, 4); assert.equal(f.finance.positions.length, 0); assert.ok(f.cash >= 0);
  g = trade(g, 'perpetual', 'ETH', 100, 10).game; g.life.finance.prices.ETH *= .4; const lost = stepMarket(g.life.finance, 11, 1); assert.equal(lost.finance.positions.filter(p => p.kind === 'perpetual').length, 0); assert.ok(lost.messages.some(t => t.includes('强平'))); valid(g);
});
test('AMM swaps preserve a fee-increased invariant and LP withdrawals return each asset only once', () => {
  let g = playing(); g.stats.money = 20000; const k = g.life.finance.pool.eth * g.life.finance.pool.cash; g = trade(g, 'swap-buy', 'ETH', 5000).game; assert.ok(g.life.finance.pool.eth * g.life.finance.pool.cash > k);
  g = trade(g, 'lp-add', 'ETH', 1000).game; assert.ok(g.life.finance.pool.shares > 0); g = advanceLife(g).game; g = removeLiquidity(g).game; assert.equal(g.life.finance.pool.shares, 0); assert.ok(removeLiquidity(g).error); valid(g);
});
test('diagnostic pathways distinguish clues from confirmation and include all requested conditions', () => {
  assert.equal(Object.keys(DISEASES).length, 12); let g = playing(); g.life.body.conditions.push({ id: 'aml', stage: 'latent', severity: 20, since: 0, treated: -1, discovered: false }); assert.ok(medicalOperation(g, 'marrow').error);
  g = medicalOperation(g, 'blood').game; assert.equal(g.life.body.conditions[0].discovered, false); assert.ok(g.life.body.tests[0].text.includes('造血异常')); g = medicalOperation(g, 'marrow').game; assert.equal(g.life.body.conditions[0].discovered, true); valid(g);
  g = medicalOperation(g, 'treat:aml').game; assert.equal(g.life.body.conditions[0].stage, 'stable'); assert.ok(g.life.economy.debt > 0); valid(g);
});
test('an acute emergency blocks week-skipping but never blocks rescue for exhausted actions or no cash', () => {
  let g = playing(); g.stats.money = 0; g.life.actions = 3; g.life.used = ['rest', 'rest', 'rest']; g.life.body.emergency = 'infarction'; g.life.body.emergencyWeek = 0; g.life.body.conditions.push({ id: 'infarction', stage: 'diagnosed', severity: 85, since: 0, treated: -1, discovered: true });
  assert.ok(advanceLife(g).error); const r = medicalOperation(g, 'rescue'); assert.equal(r.error, undefined); g = r.game; assert.equal(g.life.body.emergency, null); assert.ok(g.life.economy.debt > 0); valid(g);
});
test('marriage requires age and two explicit confirmations; birth takes forty weeks', () => {
  let g = playing(); g = establishRelationship(g, 'su'); g.life.family.affection = 80; assert.ok(familyOperation(g, 'propose').error); g.life.baseAge = 22;
  g = familyOperation(g, 'propose').game; assert.equal(g.life.family.spouse, null); g = chooseLife(g, 1).game; assert.ok(familyOperation(g, 'marry').error);
  g = chooseLife(familyOperation(g, 'propose').game, 0).game; g = familyOperation(g, 'marry').game; assert.equal(g.life.family.spouse, 'su'); valid(g);
  g = chooseLife(familyOperation(g, 'baby').game, 0).game; assert.equal(g.life.family.children.length, 0); assert.equal(g.life.family.pregnancy?.due, 40);
  for(let week=0;week<40;week++){if(g.life.pending)g=chooseLife(g,0).game;g=advanceLife(g).game;} assert.equal(g.life.family.children.length, 1); assert.equal(g.life.family.pregnancy,null); valid(g);
});
test('reincarnation keeps an adult child current age, advances young children to fifteen-year-old school and clears partners', () => {
  let g = playing(); g = establishRelationship(g, 'su'); g.life.weeks = 1400; g.life.family.children = [{ id:'young', name:'予禾', gender:'female', bornWeek:1300, care:70, education:30 }, { id:'adult', name:'予川', gender:'male', bornWeek:200, care:80, education:60 }]; die(g,'病死');
  const young = inheritLife(g,'young',createGame()).game; assert.equal(young.life.stage,'school'); assert.equal(lifeAge(young),15); assert.equal(young.life.active,true); assert.equal(young.gender,'female'); assert.equal(young.social.partner,null); valid(young);
  const adult = inheritLife(g,'adult',createGame()).game; assert.ok(Math.abs(lifeAge(adult) - 1200/52)<.001); assert.equal(adult.life.active,true); assert.equal(adult.social.partner,null); assert.equal(adult.graduate.partner,null); valid(adult);
});
test('games persist mid-session, evaluate real inputs and cannot be repeated for farming in one week', () => {
  let g = startMiniGame(playing(),'memory').game; const board=memoryBoard(g.life.game!.seed); g=answerMiniGame(g,0).game; valid(g);
  for(let value=0;value<6;value++){const pair=board.flatMap((v,i)=>v===value?[i]:[]);if(pair.includes(0)){g=answerMiniGame(g,pair.find(i=>i!==0)!).game;break;}}
  const matched = new Set<number>(); for(let i=0;i<g.life.game!.answers.length;i++)matched.add(g.life.game!.answers[i]); for(let value=0;value<6;value++){const pair=board.flatMap((v,i)=>v===value?[i]:[]);if(matched.has(pair[0]))continue;g=answerMiniGame(g,pair[0]).game;g=answerMiniGame(g,pair[1]).game;}
  assert.equal(g.life.game,null);assert.equal(g.life.scores.memory,100);assert.ok(startMiniGame(g,'memory').error);valid(g);
});
test('malformed life saves reject invented assets, relatives as spouses, invalid conditions and impossible budgets', () => {
  const g=playing(); for(const mutate of [(x:any)=>x.life.family.spouse='mom',(x:any)=>x.life.actions=4,(x:any)=>x.life.body.conditions=[{id:'invented'}],(x:any)=>x.life.finance.prices.ETH=-1,(x:any)=>x.life.finance.holdings.BTC=Infinity]){const bad=structuredClone(g);mutate(bad);assert.equal(validateGame(bad),null);} assert.deepEqual(Object.keys(g.life.finance.prices),ASSETS.map(a=>a.id));
});

test('future confession survives reload and separation clears companionship without deleting children', () => {
  let g = playing(); g.social.bonds.su.trust = 80; g.social.bonds.su.affection = 60;
  g = familyOperation(g, 'confess', 'su').game; assert.equal(g.social.partner, null); valid(g);
  g = chooseLife(g, 0).game; g = familyOperation(g, 'follow').game; assert.equal(g.life.family.following, true); valid(g);
  g.life.family.children.push({ id: 'child', name: '予禾', gender: 'female', bornWeek: 0, care: 70, education: 10 });
  g = chooseLife(familyOperation(g, 'breakup').game, 0).game; assert.equal(g.social.partner, null); assert.equal(g.life.family.following, false); assert.equal(g.life.family.children.length, 1); valid(g);
});

test('long plans stop for unresolved stories and non-emergency treatment costs an action', () => {
  let g = playing(); g = advanceLifePlan(g, 52).game; assert.equal(g.life.weeks, 4); assert.ok(g.life.pending); valid(g);
  assert.equal(advanceLifePlan(g, 13).game.life.weeks, 4);
  g = chooseLife(g, 0).game; g.life.body.conditions.push({ id: 'diabetes', stage: 'diagnosed', severity: 45, since: 0, treated: -1, discovered: true });
  g = medicalOperation(g, 'treat:diabetes').game; assert.equal(g.life.actions, 1); assert.equal(g.life.body.conditions[0].stage, 'stable'); valid(g);
});
