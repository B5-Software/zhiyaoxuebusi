import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LifeNavigation({ children }: { children: ReactNode }) {
  const nav = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ before: false, after: false });
  const [layout, setLayout] = useState({ count: 1, width: 104, gap: 16 });
  useEffect(() => {
    const el = nav.current; if (!el) return;
    const measureEdges = () => setEdges(previous => { const before = el.scrollLeft > 2, after = el.scrollLeft + el.clientWidth < el.scrollWidth - 2; return previous.before === before && previous.after === after ? previous : { before, after }; });
    const measure = () => {
      const css = getComputedStyle(el), gap = parseFloat(css.columnGap), min = parseFloat(css.getPropertyValue('--nav-min'));
      const available = el.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
      const count = Math.max(1, Math.floor((available + gap) / (min + gap)));
      const width = (available - (count - 1) * gap) / count;
      setLayout(previous => previous.count === count && previous.width === width && previous.gap === gap ? previous : { count, width, gap });
      measureEdges();
    };
    const observer = new ResizeObserver(measure); observer.observe(el);
    el.addEventListener('scroll', measureEdges, { passive: true }); measure();
    return () => { observer.disconnect(); el.removeEventListener('scroll', measureEdges); };
  }, []);
  useEffect(() => { const el = nav.current; if (el) setEdges({ before: el.scrollLeft > 2, after: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 }); }, [layout.width]);
  const scroll = (direction: number) => {
    const el = nav.current; if (el) el.scrollBy({ left: direction * (layout.width + layout.gap) * layout.count, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return <div className="life-navigation">
    <button className="life-nav-scroll" aria-label="查看前面的导航入口" disabled={!edges.before} onClick={() => scroll(-1)}><ChevronLeft size={19}/></button>
    <nav ref={nav} aria-label="人生导航" style={{ '--nav-item-width': `${layout.width}px` } as CSSProperties} tabIndex={0} onFocusCapture={event => { const target = event.target as HTMLElement; if (target !== nav.current) target.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }} onKeyDown={event => { if (event.target === event.currentTarget && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); scroll(event.key === 'ArrowRight' ? 1 : -1); } }}>{children}</nav>
    <button className="life-nav-scroll" aria-label="查看后面的导航入口" disabled={!edges.after} onClick={() => scroll(1)}><ChevronRight size={19}/></button>
  </div>;
}
