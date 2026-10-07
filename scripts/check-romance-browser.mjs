import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

mkdirSync('.browser-checks', { recursive: true });
await build({ entryPoints: ['tests/romance-fixtures.ts'], outfile: '.browser-checks/romance-fixtures.mjs', bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { readyToConfess } = await import('../.browser-checks/romance-fixtures.mjs');
const fixture = readyToConfess();
writeFileSync('.browser-checks/romance-ready.json', JSON.stringify(fixture));
const args = ['--yes', 'agent-browser', '--session', 'romance-qa'];
function browser(command, input) {
  const result = spawnSync('npx', [...args, ...command], { shell: true, input, encoding: 'utf8', timeout: 55000 });
  if (result.status) throw new Error(result.stderr || result.stdout);
  try { const data = JSON.parse(result.stdout); return typeof data === 'string' ? JSON.parse(data) : data; } catch { return result.stdout.trim(); }
}
browser(['open', process.env.ROMANCE_QA_URL ?? 'http://127.0.0.1:5174/']);
const results = [];
for (const [width, height] of [[320, 568], [390, 844], [768, 600], [1280, 900], [844, 390]]) {
  browser(['set', 'viewport', String(width), String(height)]);
  browser(['eval', '--stdin'], `localStorage.setItem('shiguang-school-save-v2', JSON.stringify(${JSON.stringify(fixture)})); localStorage.removeItem('shiguang-audience-v1'); location.reload();`);
  const result = browser(['eval', '--stdin'], `(async () => {
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    const wait = async predicate => { for(let i=0;i<70;i++){ if(predicate()) { await pause(100); return; } await pause(70); } throw Error('UI condition timed out'); };
    const save = () => JSON.parse(localStorage.getItem('shiguang-school-save-v2'));
    const failures = [];
    const assert = (condition, text) => { if(!condition) failures.push(text); };
    const find = (selector, text) => [...document.querySelectorAll(selector)].find(element => element.textContent.trim()===text);
    const click = element => { if(!element) throw Error('Button missing'); element.scrollIntoView({block:'center'}); element.click(); };
    const inside = element => { const r=element.getBoundingClientRect(); return r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1; };
    const layout = label => { const modal=document.querySelector('.game-modal'); const content=document.querySelector('.modal-content'); assert(inside(modal),label+' modal leaves viewport'); assert(content.scrollWidth<=content.clientWidth+2,label+' content horizontal overflow'); };
    const openLove = async () => { click(document.querySelector('.dock-item:nth-child(4)')); await wait(()=>document.querySelector('.im-contact')); click([...document.querySelectorAll('.im-contact')].find(b=>b.querySelector('strong').textContent==='苏晓')); await wait(()=>find('.im-confess','心事 · 恋爱界面')); click(find('.im-confess','心事 · 恋爱界面')); await wait(()=>document.querySelector('.romance-panel')); };
    const tab = async text => { click(find('.love-tabs button',text)); await pause(150); };
    const story = async index => { await wait(()=>document.querySelector('.love-story-modal .story-choice')); click(document.querySelectorAll('.love-story-modal .story-choice')[index]); await wait(()=>document.querySelector('.love-story-modal .story-result .primary-button')); click(document.querySelector('.love-story-modal .story-result .primary-button')); await wait(()=>!document.querySelector('.love-story-modal')); };
    await wait(()=>document.querySelector('.age-modal'));
    layout('age'); assert(document.querySelector('.game-shell').inert,'game not blocked by first-entry age gate');
    click(find('.age-options button','我未满 18 周岁')); await wait(()=>!document.querySelector('.age-modal'));
    assert(JSON.parse(localStorage.getItem('shiguang-audience-v1')).age==='minor','minor age not saved');
    await openLove(); layout('romance');
    assert(!document.querySelector('.love-confession .primary-button').disabled,'active confession unavailable');
    click(document.querySelector('.love-confession .primary-button')); await story(0);
    assert(save().social.partner==='su','active confession did not establish partnership');
    await tab('相处'); layout('spend');
    const budget=save().actions;
    click([...document.querySelectorAll('.love-operations button')].find(button=>button.querySelector('strong').textContent==='邀请回家做客')); await story(0);
    assert(save().actions===budget+1,'home visit did not cost exactly one action');
    assert(save().romance.visitor==='su','home guest not saved');
    assert(!document.querySelector('.mature-entry'),'minor can see private entry');
    click(document.querySelector('.close-button')); await wait(()=>!document.querySelector('.game-modal'));
    click(document.querySelector('[aria-label="游戏设置"]')); await wait(()=>find('.audience-settings button','重新选择年龄范围'));
    click(find('.audience-settings button','重新选择年龄范围')); await wait(()=>document.querySelector('.age-modal'));
    click(find('.age-options button','我已满 18 周岁')); await wait(()=>!document.querySelector('.age-modal'));
    await openLove(); await tab('相处');
    assert(document.querySelector('.mature-entry')&&!document.querySelector('.mature-entry').disabled,'adult private entry missing');
    click(document.querySelector('.mature-entry')); await wait(()=>document.querySelector('.content-warning'));
    layout('warning'); assert(!document.querySelector('.story-paragraphs'),'private narrative shown before warning');
    click(find('.age-options button','我理解，进入转场剧情')); await wait(()=>document.querySelector('.love-story-modal'));
    assert(save().romance.active.id==='private','private scene not persisted');
    return {width:innerWidth,height:innerHeight,failures,actions:save().actions};
  })()`);
  if (typeof result !== 'object') throw new Error(String(result));
  // Reload must discard the transient consent, then skipping must finish safely.
  browser(['reload']);
  const after = browser(['eval', '--stdin'], `(async()=>{
    const pause=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<70&&!document.querySelector('.content-warning');i++)await pause(70);
    if(!document.querySelector('.content-warning'))throw Error('Warning missing after refresh');
    const saved=()=>JSON.parse(localStorage.getItem('shiguang-school-save-v2'));
    const before=saved().actions;
    [...document.querySelectorAll('.age-options button')].find(b=>b.textContent==='跳过私密剧情，继续游戏').click();
    for(let i=0;i<70&&saved().romance.active;i++)await pause(70);
    const next=saved();
    return {warningOnRefresh:true,skipped:next.romance.memories.at(-1)?.skipped===true,noExtraAction:before===next.actions};
  })()`);
  if (!after.skipped || !after.noExtraAction) result.failures.push('private skip failed');
  results.push({ ...result, ...after });
  console.log(JSON.stringify(results.at(-1)));
}
let previous = {}; try { previous = JSON.parse(readFileSync('docs/romance-browser-checks.json', 'utf8')); } catch { /* First check run. */ }
writeFileSync('docs/romance-browser-checks.json', JSON.stringify({ ...previous, date: new Date().toISOString(), results }, null, 2));
browser(['close']);
if (results.some(result => result.failures.length)) process.exitCode = 1;
