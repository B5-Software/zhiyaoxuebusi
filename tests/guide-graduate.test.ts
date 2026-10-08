import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, validateGame, resolveEvent } from '../src/game/engine';
import { GUIDE_MODULES, beginGuide, freshGuide, guideInteractionComplete, progressGuide, skipGuide, validateGuide } from '../src/game/tutorial';
import { advanceGraduateMonth, beginGraduateScene, contactGraduate, giftGraduate, graduateSceneLock, resolveGraduateScene, setGraduateBoundary, setGraduateFollowing, unlockGraduate } from '../src/game/graduate';
import { changeRelationship } from '../src/game/romance';
import { characterPositions } from '../src/game/characterSchedule';
import { PLAYTIME_KEY, REMINDER_INTERVAL, acknowledgePlaytime, readPlaytime, reminderDue, tickPlaytime } from '../src/game/playtime';
import { playerText } from '../src/game/player';
import { EVENTS } from '../src/game/events';
import { ROMANCE_IDS } from '../src/game/data';
import { datingFixture } from './romance-fixtures';
import type { GameState, GraduateOperation } from '../src/game/types';

const ending = (): GameState => ({ ...createGame(), started: true, phase: 'ending', week: 40, examAnswers: [0,0,0], examScore: 500 });
function scene(game: GameState, operation: GraduateOperation, choice = 0) { const begun = beginGraduateScene(game, operation); assert.equal(begun.error, undefined); assert.ok(validateGame(begun.game)); const resolved = resolveGraduateScene(begun.game, choice); assert.equal(resolved.error, undefined); assert.ok(validateGame(resolved.game)); return resolved.game; }
function readyPartner() { let game = unlockGraduate(ending()).game; for (let i=0;i<3;i++) { game=scene(game,i===0?'reunion':'meet'); game=scene(game,'talk'); game=contactGraduate(game).game; game=giftGraduate(game,'milk').game; if (i<2)game=advanceGraduateMonth(game).game; } return advanceGraduateMonth(game).game; }

test('all tutorial modules finish, replay, validate and skip without falsely completing', () => {
  for(const module of GUIDE_MODULES) { let state=beginGuide(freshGuide(),module.id); state=validateGuide(JSON.parse(JSON.stringify(state))); state=progressGuide(state,-1); assert.equal(state.step,0); for(let i=0;i<module.steps.length;i++)state=progressGuide(state); assert.equal(state.active,null); assert.deepEqual(state.completed,[module.id]); state=beginGuide(state,module.id); state=skipGuide(state); assert.deepEqual(state.completed,[module.id]); }
  assert.deepEqual(skipGuide(beginGuide(freshGuide(),'basics')).completed,[]);
  assert.equal(validateGuide({active:'basics',step:999,completed:['fake','map','map']}).step,0);
  assert.deepEqual(validateGuide({completed:['fake','map','map']}).completed,['map']);
});
test('tutorial required interactions correspond to actual map and place state', () => {
  const game=createGame(), steps=GUIDE_MODULES[0].steps;
  assert.equal(guideInteractionComplete(steps[3],null,game),false);
  assert.equal(guideInteractionComplete(steps[3],'world-map',game),true);
  assert.equal(guideInteractionComplete(steps[4],null,game),true);
  assert.equal(guideInteractionComplete(steps[6],'location',{...game,world:{...game.world,placeId:'garden'}}),false);
  assert.equal(guideInteractionComplete(steps[6],'location',game),true);
});
test('30 minute reminder continues through refresh, repeats at 60 and pauses in background', () => {
  let state=readPlaytime(null,0); for(let now=1000;now<=REMINDER_INTERVAL;now+=1000)state=tickPlaytime(state,now,true,true);
  assert.equal(reminderDue(state),true); state=readPlaytime(JSON.parse(JSON.stringify(state)),REMINDER_INTERVAL+1000); assert.equal(reminderDue(state),true);
  state=acknowledgePlaytime(state); assert.equal(reminderDue(state),false);
  for(let i=0;i<1800;i++)state=tickPlaytime(state,state.lastAt+1000,true,true); assert.equal(reminderDue(state),true);
  state=tickPlaytime(state,state.lastAt+1000,false,true); const previous=state.elapsed;
  for(let i=0;i<100;i++)state=tickPlaytime(state,state.lastAt+1000,false,true); assert.equal(state.elapsed,previous);
  for(let i=0;i<201;i++)state=tickPlaytime(state,state.lastAt+1000,false,true); assert.equal(state.elapsed,0); assert.equal(reminderDue(state),false);
  assert.ok(PLAYTIME_KEY);
});
test('invalid timer state and long breaks start a new continuous session', () => { assert.equal(readPlaytime({elapsed:Infinity},100).elapsed,0); const state=readPlaytime(null,0); assert.equal(readPlaytime({...state,elapsed:REMINDER_INTERVAL},300000).elapsed,0); assert.equal(tickPlaytime(state,1000,true,false).elapsed,0); });
test('gender survives saves and old saves migrate; pronouns follow the protagonist', () => { const female={...createGame(),gender:'female' as const}; assert.equal(validateGame(female)?.gender,'female'); assert.equal(playerText(female,'{{player}}，{{pronoun}}是我的{{child}}。'),'江予安，她是我的女儿。'); const legacy=JSON.parse(JSON.stringify(female)); delete legacy.gender; delete legacy.graduate; assert.equal(validateGame(legacy)?.gender,'male'); assert.equal(validateGame({...female,gender:'fake'}),null); });
test('mother retains family route and graduate romance is locked through all school phases', () => {
  assert.equal((ROMANCE_IDS as string[]).includes('mom'),false);
  for(const phase of ['school','exam','application'] as const) assert.ok(unlockGraduate({...ending(),phase}).error);
  assert.equal(validateGame({...ending(),graduate:{...createGame().graduate,partner:'mom',status:'dating'}}),null);
});
test('graduation reunion uses separate budget and pending story survives a save', () => { let game=unlockGraduate(ending()).game; assert.ok(contactGraduate(game).error); assert.ok(giftGraduate(game,'milk').error); game=scene(game,'reunion'); assert.equal(game.week,40); assert.equal(game.actions,0); assert.equal(game.graduate.actions,1); assert.ok(beginGraduateScene(game,'reunion').error); game=scene(game,'talk'); assert.ok(beginGraduateScene(game,'meet').error); assert.equal(game.graduate.actions,2); assert.ok(validateGame(advanceGraduateMonth(game).game)); });
test('active confession requires three different months and explicit mutual choice', () => { let game=unlockGraduate(ending()).game; game=scene(game,'reunion'); assert.ok(graduateSceneLock(game,'confess')); game=readyPartner(); assert.equal(graduateSceneLock(game,'confess'),null); const declined=scene(game,'confess',1); assert.equal(declined.graduate.partner,null); assert.ok(graduateSceneLock(declined,'confess')); game=scene(game,'confess'); assert.equal(game.graduate.partner,'teacher'); assert.equal(game.social.partner,null); assert.ok(validateGame(game)); });
test('messages and gifts have monthly cooldowns and October bonus uses real items or money', () => { let game=scene(unlockGraduate(ending()).game,'reunion'); game=contactGraduate(game).game; assert.ok(contactGraduate(game).error); const normal=giftGraduate(game,'milk').game; assert.equal(normal.inventory.milk,game.inventory.milk-1); assert.equal(normal.graduate.trust-game.graduate.trust,6); assert.ok(giftGraduate(normal,'milk').error); game=advanceGraduateMonth(normal).game; const birthday=giftGraduate(game,'milk').game; assert.equal(birthday.graduate.trust-game.graduate.trust,9); assert.ok(validateGame(birthday)); game={...advanceGraduateMonth(birthday).game,inventory:{...birthday.inventory,milk:0},stats:{...birthday.stats,money:0}}; assert.ok(giftGraduate(game,'milk').error); });
test('existing relationship must explicitly end before a graduate confession', () => { const peer={...datingFixture('su'),phase:'ending' as const,week:40,actions:0,weeklyActions:[],examAnswers:[0,0,0],examScore:500}; let game={...readyPartner(),social:peer.social,romance:peer.romance}; assert.ok(graduateSceneLock(game,'confess')); const ended=changeRelationship(game,'su','breakup'); assert.equal(ended.error,undefined); assert.equal(ended.game.social.partner,null); assert.ok(validateGame(ended.game)); game=scene(ended.game,'confess'); assert.equal(game.graduate.partner,'teacher'); });
test('graduate chapters require six months, save once, and touch respects consent and boundary', () => { let game=scene(readyPartner(),'confess'); game=scene(game,'chapter-0'); assert.ok(beginGraduateScene(game,'chapter-1').error); for(let i=1;i<6;i++){game=advanceGraduateMonth(game).game;game=scene(game,`chapter-${i}` as GraduateOperation);} assert.equal(game.graduate.memories.filter(m=>m.operation.startsWith('chapter-')).length,6); assert.ok(beginGraduateScene(game,'chapter-5').error); game=setGraduateBoundary(game,false).game; assert.ok(beginGraduateScene(game,'hug').error); game=setGraduateBoundary(game,true).game; game=scene(game,'hug',1); assert.ok(beginGraduateScene(game,'hand').error); assert.equal(game.graduate.touchMonths.length,1); });
test('graduate following has one marker and breakup clears following but preserves memories', () => { let game=scene(readyPartner(),'confess'); game=setGraduateFollowing(game,true).game; assert.equal(characterPositions(game,'city').filter(p=>p.id==='teacher'&&p.following).length,1); const before=game.graduate.memories.length; game=scene(game,'breakup'); assert.equal(game.graduate.following,false); assert.equal(game.graduate.partner,null); assert.equal(game.graduate.memories.length,before+1); assert.ok(graduateSceneLock(game,'confess')); assert.ok(validateGame(game)); });
test('malformed graduate saves cannot unlock before graduation or invent dating interactions', () => { const graduate=unlockGraduate(ending()).game.graduate; assert.equal(validateGame({...createGame(),graduate}),null); assert.equal(validateGame({...ending(),graduate:{...graduate,pending:'kiss'}}),null); assert.equal(validateGame({...ending(),graduate:{...graduate,pending:'birthday'}}),null); assert.equal(validateGame({...ending(),graduate:{...graduate,meetMonths:[0,0]}}),null); });
test('rewritten main chapters and twelve negative events are unique and carry real costs', () => { const ids=['first-day','midterm','winter-holiday','hundred-days','mock-two','wish-form','graduation-photo','last-lesson','last-night']; for(const id of ids){const event=EVENTS.find(e=>e.id===id)!;assert.ok(event);if(id!=='last-night')assert.ok(event.choices.some(c=>(c.effect.stress??0)>0||(c.effect.mood??0)<0));else assert.ok(event.paragraphs.join('').includes('解释为什么睡觉不是放弃')); } const events=EVENTS.filter(e=>e.id.startsWith('reality-'));assert.equal(events.length,12);assert.equal(new Set(EVENTS.map(e=>e.id)).size,EVENTS.length);let game={...createGame(),started:true,pendingEvent:'first-day'}; const initial=game.stats.stress;game=resolveEvent(game,0).game;assert.ok(game.stats.stress>initial);assert.ok(validateGame(game)); });
