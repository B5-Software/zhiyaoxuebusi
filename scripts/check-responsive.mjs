import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

function browser(args, input) {
  const result = spawnSync('npx', ['--yes', 'agent-browser', ...args], { shell: true, input, encoding: 'utf8', timeout: 90000 });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
}
const panels = { tasks: '.task-hud-heading', worldmap: '.world-map-entry', study: '.dock-item:nth-child(2)', bag: '.dock-item:nth-child(3)', messages: '.dock-item:nth-child(4)', journal: '.dock-item:nth-child(5)', universities: '.dock-item:nth-child(6)', schedule: '.right-hud button:nth-child(1)', achievements: '.right-hud button:nth-child(2)', saves: '.right-hud button:nth-child(3)', profile: '.student-sheet', settings: '.header-tool:nth-child(2)', menu: '.brand' };
const results = [];
for (const [width, height] of [[320,568],[360,480],[390,844],[480,650],[768,600],[1024,600],[1366,768],[844,390],[500,400],[1920,1080]]) {
  browser(['set','viewport',String(width),String(height)]);
  const code = `(async () => {
    const pause = () => new Promise(resolve => setTimeout(resolve, 450));
    const failures = [], panels = ${JSON.stringify(panels)};
    const rect = e => e.getBoundingClientRect();
    const visible = e => e && rect(e).width > 0 && rect(e).height > 0;
    const inside = e => { const r = rect(e); return r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; };
    await pause();
    for (const selector of ['.game-shell','.game-header','.game-footer','.game-dock']) {
      const e = document.querySelector(selector);
      if (e && e.scrollWidth > e.clientWidth + 2) failures.push(selector + ': horizontal overflow');
    }
    for (const e of document.querySelectorAll('.dock-item,.end-week-button,.dialogue-avatar')) if (visible(e) && !inside(e)) failures.push(e.className + ': clipped');
    for (const [name, selector] of Object.entries(panels)) {
      document.querySelector(selector)?.click(); await pause();
      const modal = document.querySelector('.game-modal'), content = document.querySelector('.modal-content'), close = document.querySelector('.close-button');
      if (!modal) { failures.push(name + ': did not open'); continue; }
      if (!inside(modal) || close && !inside(close)) failures.push(name + ': outside screen');
      if (content && content.scrollWidth > content.clientWidth + 2) failures.push(name + ': horizontal overflow ' + content.scrollWidth + '/' + content.clientWidth);
      if (content) content.scrollTop = content.scrollHeight;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await pause();
    }
    document.querySelector('.dialogue-avatar').click(); await pause();
    for (const selector of ['.campus-dialogue','.dialogue-collapse','.map-controls']) {
      const e = document.querySelector(selector);
      if (!visible(e) || !inside(e)) failures.push(selector + ': expanded avatar clipped');
    }
    document.querySelector('.dialogue-collapse').click(); await pause();
    return JSON.stringify({ width: innerWidth, height: innerHeight, panels: Object.keys(panels).length, arrows: document.querySelectorAll('.map-task-arrow').length, failures });
  })()`;
  const raw = browser(['eval','--stdin'], code);
  let result = JSON.parse(raw);
  if (typeof result === 'string') result = JSON.parse(result);
  results.push(result);
  console.log(JSON.stringify(result));
}
mkdirSync('docs', { recursive: true });
writeFileSync('docs/responsive-checks.json', JSON.stringify({ date: '2026-10-07', results }, null, 2));
process.exitCode = results.some(result => result.failures.length) ? 1 : 0;
