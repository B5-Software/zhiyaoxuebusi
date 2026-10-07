import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { GameNoticeContext } from './GameNotice';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  closeable?: boolean;
  className?: string;
}

export default function Modal({ title, subtitle, children, onClose, closeable = true, className = '' }: Props) {
  const notice = useContext(GameNoticeContext);
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>('[data-autofocus], button:not([disabled]), input, select, [tabindex="0"]');
      (first ?? ref.current)?.focus();
    }, 80);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeable) { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab' || !ref.current) return;
      const elements = Array.from(ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea, [tabindex="0"]')).filter(element => element.offsetParent !== null);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); ref.current.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(timer); document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [closeable]);

  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPointerDown={event => { if (event.target === event.currentTarget && closeable) onClose(); }}>
    <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} className={`game-modal ${className}`} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ type: 'spring', damping: 27, stiffness: 320 }}>
      <div className="modal-heading"><div><span className="tiny-eyebrow">拾光手记 / SHIGUANG</span><h2 id="modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{closeable && <button className="close-button" onClick={onClose} aria-label="关闭窗口"><X size={21}/></button>}</div>
      {notice && <div className="modal-status" role="status" aria-live="polite"><p>{notice.text}</p><button aria-label="关闭提示" onClick={notice.dismiss}><X size={14}/></button></div>}
      <div className="modal-content">{children}</div>
    </motion.div>
  </motion.div>;
}
