import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, X } from 'lucide-react';
import { GUIDE_MODULES, guideForPanel, guideInteractionComplete, progressGuide, skipGuide, type GuideState, type GuideStep } from '../game/tutorial';
import type { GameState, Panel } from '../game/types';

export const TutorialContext = createContext<{ state: GuideState; setState: Dispatch<SetStateAction<GuideState>>; panel: Panel; game: GameState; request: (id: string) => void } | null>(null);
export function TutorialCatalogue() {
  const context = useContext(TutorialContext); if (!context) return null;
  const { state, setState, game, request } = context;
  return <section className="tutorial-catalogue"><div className="tutorial-catalogue-title"><BookOpen size={21}/><div><h3>一步一步，熟悉这里</h3><p>{state.completed.length} / {GUIDE_MODULES.length} 项指引已完成 · 可随时重看</p></div></div><p>指引会高亮目标，暂时锁住其他操作。只演示界面，不替你消耗行动、使用物品、回复消息或推进时间；可以随时跳过。</p><label className="tutorial-preference"><input type="checkbox" checked={state.autoPrompt} onChange={event => setState(current => ({ ...current, autoPrompt: event.target.checked }))}/>初次进入功能时提示操作指引</label><div className="tutorial-module-grid">{GUIDE_MODULES.map(module => <button className="secondary-button" key={module.id} disabled={!game.started || module.id === 'basics' && game.phase !== 'school'} onClick={() => request(module.id)}><span>{state.completed.includes(module.id) ? <Check size={17}/> : <Compass size={17}/>}<strong>{module.title}</strong></span><small>{!game.started ? '开启故事后可以体验' : module.id === 'basics' && game.phase !== 'school' ? '入门漫步适用于校园阶段' : module.description}</small></button>)}</div></section>;
}
export function ModalGuidePrompt() {
  const context = useContext(TutorialContext); if (!context || context.state.active || !context.game.started || !context.panel) return null;
  const id = guideForPanel[context.panel], module = GUIDE_MODULES.find(module => module.id === id); if (!module) return null;
  const fresh = context.state.autoPrompt && !context.state.completed.includes(module.id) && !context.state.dismissed.includes(module.id);
  return <div className={`modal-guide-prompt ${fresh ? 'is-new' : ''}`}><button className="text-button" onClick={() => context.request(module.id)}><BookOpen size={15}/>{fresh ? `第一次使用？看看「${module.title}」` : '本页操作指引'}<ArrowRight size={13}/></button>{fresh && <button className="icon-button" aria-label="暂时隐藏本页指引提示" onClick={() => context.setState(current => ({ ...current, dismissed: [...new Set([...current.dismissed, module.id])] }))}><X size={14}/></button>}</div>;
}
interface Rect { left: number; top: number; right: number; bottom: number; width: number; height: number }
interface OverlayProps { state: GuideState; setState: Dispatch<SetStateAction<GuideState>>; game: GameState; panel: Panel; visible: boolean; onPrepare: (step: GuideStep) => void; onInteract: (click: NonNullable<GuideStep['click']>) => void; onFinish: () => void }
export function TutorialOverlay({ state, setState, game, panel, visible, onPrepare, onInteract, onFinish }: OverlayProps) {
  const module = GUIDE_MODULES.find(module => module.id === state.active), step = module?.steps[state.step];
  const [rect, setRect] = useState<Rect | null>(null), [size, setSize] = useState({ width: innerWidth, height: innerHeight }), [cardHeight, setCardHeight] = useState(280);
  const card = useRef<HTMLDivElement>(null), target = useRef<HTMLElement | null>(null), interacted = useRef(false), callbacks = useRef({ onPrepare, onFinish }); callbacks.current = { onPrepare, onFinish };
  const stepKey = `${state.active}:${state.step}`;
  useEffect(() => {
    if (!visible || !step) return;
    interacted.current = false; callbacks.current.onPrepare(step);
    document.documentElement.dataset.guideActive = 'true';
    return () => { delete document.documentElement.dataset.guideActive; };
  }, [stepKey, visible]);
  useLayoutEffect(() => {
    if (!visible || !step) return;
    let scrolled: HTMLElement | null = null;
    const measure = () => {
      setSize(current => current.width === innerWidth && current.height === innerHeight ? current : { width: innerWidth, height: innerHeight });
      const element = step.targets.map(selector => document.querySelector<HTMLElement>(selector)).find(element => element && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0 && getComputedStyle(element).visibility !== 'hidden') ?? null;
      target.current = element;
      if (element && scrolled !== element) { element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' }); scrolled = element; }
      if (!element) { setRect(null); return; }
      const box = element.getBoundingClientRect(), left = Math.max(2, box.left - 5), top = Math.max(2, box.top - 5), right = Math.min(innerWidth - 2, box.right + 5), bottom = Math.min(innerHeight - 2, box.bottom + 5);
      const next = { left, top, right, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
      setRect(current => current && Object.keys(next).every(key => Math.abs(current[key as keyof Rect] - next[key as keyof Rect]) < .5) ? current : next);
    };
    const markInteraction = (event: Event) => { if (step.click && target.current?.contains(event.target as Node)) interacted.current = true; };
    const timer = setInterval(measure, 120); measure(); window.addEventListener('resize', measure); document.addEventListener('scroll', measure, true); document.addEventListener('click', markInteraction, true); document.addEventListener('change', markInteraction, true);
    return () => { clearInterval(timer); window.removeEventListener('resize', measure); document.removeEventListener('scroll', measure, true); document.removeEventListener('click', markInteraction, true); document.removeEventListener('change', markInteraction, true); };
  }, [stepKey, visible]);
  useEffect(() => {
    if (!visible || !step?.click || !interacted.current || !guideInteractionComplete(step, panel, game)) return;
    setState(current => current.active === state.active && current.step === state.step ? progressGuide(current) : current);
  }, [game, panel, visible, state.active, state.step, setState]);
  useLayoutEffect(() => {
    if (!visible || !card.current) return;
    const observer = new ResizeObserver(() => { if (card.current) setCardHeight(card.current.getBoundingClientRect().height); }); observer.observe(card.current);
    const timer = setTimeout(() => card.current?.querySelector<HTMLButtonElement>('.guide-primary')?.focus(), 180);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [stepKey, visible]);
  useEffect(() => {
    if (!visible || !step) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); setState(skipGuide); callbacks.current.onFinish(); return; }
      const allowed = [...(step.click && target.current ? [target.current] : []), ...Array.from(card.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,a[href]') ?? [])].filter(element => element.getBoundingClientRect().width > 0);
      if (event.key === 'Tab') { event.preventDefault(); event.stopImmediatePropagation(); const index = allowed.indexOf(document.activeElement as HTMLElement); allowed[(index + (event.shiftKey ? -1 : 1) + allowed.length) % allowed.length]?.focus(); }
      else if (!card.current?.contains(document.activeElement) && !(step.click && target.current?.contains(document.activeElement))) { event.preventDefault(); event.stopImmediatePropagation(); card.current?.querySelector<HTMLButtonElement>('.guide-primary')?.focus(); }
    };
    document.addEventListener('keydown', handler, true); return () => document.removeEventListener('keydown', handler, true);
  }, [stepKey, visible, setState]);
  useEffect(() => {
    if (!visible || !step?.tab) return;
    let attempts = 0;
    const timer = setInterval(() => { const element = document.querySelector<HTMLElement>(step.tab!); if (element) { element.click(); clearInterval(timer); } else if (++attempts > 30) clearInterval(timer); }, 100);
    return () => clearInterval(timer);
  }, [stepKey, visible]);
  if (!visible || !module || !step) return null;
  const width = Math.min(360, size.width - 16), height = Math.min(cardHeight, size.height - 16), gap = 14;
  let left = (size.width - width) / 2, top = (size.height - height) / 2;
  if (rect) {
    if (rect.bottom + gap + height <= size.height - 8) { top = rect.bottom + gap; left = rect.left; }
    else if (rect.top - gap - height >= 8) { top = rect.top - gap - height; left = rect.left; }
    else if (rect.right + gap + width <= size.width - 8) { left = rect.right + gap; top = rect.top; }
    else if (rect.left - gap - width >= 8) { left = rect.left - gap - width; top = rect.top; }
  }
  left = Math.max(8, Math.min(size.width - width - 8, left)); top = Math.max(8, Math.min(size.height - height - 8, top));
  const next = () => { const last = state.step === module.steps.length - 1; setState(progressGuide); if (last) onFinish(); };
  const skip = () => { setState(skipGuide); onFinish(); };
  return <div className="tutorial-layer" data-guide-step={stepKey}>
    {rect ? <><div className="guide-shade" style={{ left: 0, top: 0, width: '100%', height: rect.top }}/><div className="guide-shade" style={{ left: 0, top: rect.bottom, width: '100%', bottom: 0 }}/><div className="guide-shade" style={{ left: 0, top: rect.top, width: rect.left, height: rect.height }}/><div className="guide-shade" style={{ left: rect.right, right: 0, top: rect.top, height: rect.height }}/><div className={`guide-spotlight ${step.click ? 'is-interactive' : ''}`} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}/></> : <div className="guide-shade" style={{ inset: 0 }}/>}<div ref={card} className="guide-card" role="dialog" aria-modal="true" aria-labelledby="guide-title" style={{ left, top, width }}><span className="guide-kicker"><BookOpen size={14}/>{module.title}<b>{state.step + 1} / {module.steps.length}</b></span><div className="guide-progress"><i style={{ width: `${(state.step + 1) / module.steps.length * 100}%` }}/></div><h3 id="guide-title">{step.title}</h3><p>{step.text}</p>{!rect && <small>入口在当前视图中暂不可见。你仍可使用下方按钮继续。</small>}<div className="guide-buttons"><button className="text-button" disabled={state.step === 0} onClick={() => setState(current => progressGuide(current, -1))}><ArrowLeft size={14}/>上一步</button>{step.click ? <button className="primary-button guide-primary" onClick={() => { interacted.current = true; onInteract(step.click!); }}>{step.click === 'world-map' ? '打开大地图' : step.click === 'campus' ? '进入校园' : '打开高三教室'}<ArrowRight size={15}/></button> : <button className="primary-button guide-primary" onClick={next}>{state.step === module.steps.length - 1 ? '完成指引' : '下一步'}<ArrowRight size={15}/></button>}</div><button className="guide-skip text-button" onClick={skip}>跳过本轮指引 · 以后可重看</button></div>
  </div>;
}
