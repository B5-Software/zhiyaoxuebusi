import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

mkdirSync('.browser-checks', { recursive: true });
await build({ entryPoints: ['tests/romance-fixtures.ts'], outfile: '.browser-checks/romance-fixtures.mjs', bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { datingFixture } = await import('../.browser-checks/romance-fixtures.mjs');

const fixture = datingFixture('zhixia');
const args = ['--yes', 'agent-browser', '--session', 'love-follow-qa'];
function browser(command, input) {
  const result = spawnSync('npx', [...args, ...command], { shell: true, input, encoding: 'utf8', timeout: 55000 });
  if (result.status) throw new Error(result.stderr || result.stdout);
  try { const data=JSON.parse(result.stdout); return typeof data === 'string' ? JSON.parse(data) : data; } catch { return result.stdout.trim(); }
}
browser(['open', 'http://127.0.0.1:5174/']);
const results=[];
for(const [width,height] of [[390,844],[1280,900]]) {
  browser(['set','viewport',String(width),String(height)]);
  browser(['eval','--stdin'],`localStorage.setItem('shiguang-school-save-v2',JSON.stringify(${JSON.stringify(fixture)}));localStorage.setItem('shiguang-audience-v1',JSON.stringify({age:'adult',skipPrivate:false}));location.reload();`);
  const result=browser(['eval','--stdin'],`(async()=>{
    const pause=ms=>new Promise(r=>setTimeout(r,ms));
    const wait=async condition=>{for(let i=0;i<70;i++){if(condition()){await pause(100);return;}await pause(70);}throw Error('UI condition timed out');};
    const save=()=>JSON.parse(localStorage.getItem('shiguang-school-save-v2'));
    const failures=[];const assert=(v,s)=>{if(!v)failures.push(s);};
    const click=e=>{if(!e)throw Error('Button missing');e.scrollIntoView({block:'center'});e.click();};
    const find=(selector,text)=>[...document.querySelectorAll(selector)].find(e=>e.textContent.trim()===text);
    const openLove=async()=>{click(document.querySelector('.dock-item:nth-child(4)'));await wait(()=>document.querySelector('.im-contact'));click([...document.querySelectorAll('.im-contact')].find(e=>e.querySelector('strong').textContent==='许知夏'));await wait(()=>find('.im-confess','心事 · 恋爱界面'));click(find('.im-confess','心事 · 恋爱界面'));await wait(()=>document.querySelector('.romance-panel'));};
    const tab=async text=>{click(find('.love-tabs button',text));await pause(100);};
    await wait(()=>document.querySelector('.dock-item'));await openLove();await tab('相处');
    click([...document.querySelectorAll('.love-operations button')].find(e=>e.querySelector('strong').textContent==='邀请同行 · 跟随'));await wait(()=>save().romance.escort==='zhixia');
    click(document.querySelector('.close-button'));await wait(()=>!document.querySelector('.game-modal'));
    assert(document.querySelectorAll('.npc-map-marker.following').length===1,'follower must have one marker');
    click(document.querySelector('.dock-item:first-child'));await wait(()=>document.querySelector('.atlas-card'));
    click(document.querySelector('[aria-label="前往河畔公园小地图"]'));await wait(()=>save().world.scene==='park'&&!document.querySelector('.game-modal'));
    assert(document.querySelectorAll('.npc-map-marker.following').length===1,'follower lost while switching scenes');
    assert(document.querySelector('[aria-label^="许知夏 · 正在与你同行"]'),'follower is not the lover');
    click(document.querySelector('.dialogue-avatar'));await pause(200);click(find('.dialogue-action','我们的故事'));await wait(()=>document.querySelector('.romance-panel'));
    click(document.querySelector('.love-story-list > button:not([disabled])'));await wait(()=>document.querySelector('.love-story-modal .story-choice'));
    assert(save().actions===2,'exclusive story did not cost exactly one action');
    click(document.querySelector('.love-story-modal .story-choice'));await wait(()=>document.querySelector('.love-story-modal .story-result .primary-button'));click(document.querySelector('.love-story-modal .story-result .primary-button'));await wait(()=>document.querySelector('.romance-panel'));
    await tab('约定');click(find('.love-boundaries .text-button','认真提出分手'));await wait(()=>document.querySelector('.love-confirm'));click(document.querySelector('.love-confirm .primary-button'));await wait(()=>save().social.partner===null);
    assert(save().romance.escort===null,'breakup left a follower');assert(save().romance.memories.length===3,'breakup deleted or duplicated memories');
    assert(!document.querySelector('.love-story-list'),'dating stories still visible after breakup');
    return {width:innerWidth,height:innerHeight,failures,followedAcrossMap:true,exclusiveStoryCost:1,breakupRetainedMemories:save().romance.memories.length};
  })()`);
  results.push(result);console.log(JSON.stringify(result));
}
let current; try { current=JSON.parse(readFileSync('docs/romance-browser-checks.json','utf8')); } catch { current={date:new Date().toISOString(),results:[]}; }
current.relationshipResults=results;writeFileSync('docs/romance-browser-checks.json',JSON.stringify(current,null,2));
browser(['close']);if(results.some(result=>result.failures.length))process.exitCode=1;
