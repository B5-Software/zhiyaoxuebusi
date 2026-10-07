const loader = document.getElementById('boot-screen');
const status = document.getElementById('boot-status');
const note = document.getElementById('boot-note');
let ready = false;
let registration: ServiceWorkerRegistration | undefined;
const warm = () => { if (ready) registration?.active?.postMessage({ type: 'WARM_CACHE' }); };
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('controllerchange', warm);
window.addEventListener('shiguang:ready', () => {
  if (ready) return;
  ready = true; warm(); loader?.classList.add('boot-exiting');
  setTimeout(() => loader?.remove(), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300);
}, { once: true });
document.getElementById('boot-retry')?.addEventListener('click', () => location.reload());
async function start() {
  const background = document.querySelector<HTMLImageElement>('.boot-backdrop');
  await Promise.race([background?.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 2000))]);
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(value => { registration = value; warm(); }).catch(() => {});
  }
  if (status) status.textContent = '正在整理故事与存档…';
  if (note) note.textContent = '先打开故事，其余地图与图片会在后台陆续准备。';
  try { await import('./mountGame'); }
  catch {
    if (status) status.textContent = navigator.onLine ? '故事暂时没能打开，请重试。' : '目前离线，首次打开需要先连接网络。';
    if (note) note.textContent = '已有存档会保留在本浏览器。';
    const retry = document.getElementById('boot-retry'); if (retry) retry.hidden = false;
  }
}
void start();
