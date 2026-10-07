import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Leaf, X } from 'lucide-react';
import { imagePath } from '../game/data';

interface Props { name: string; image: string; label: string; text: string; action: string; expanded: boolean; onToggle: () => void; onAction: () => void }
export default function CompanionBanner({ name, image, label, text, action, expanded, onToggle, onAction }: Props) {
  const reduced = useReducedMotion();
  return <motion.div layout className={`campus-dialogue ${expanded ? 'is-expanded' : 'is-collapsed'}`} transition={{ layout: { duration: reduced ? 0 : 0.28, ease: 'easeInOut' } }}>
    <motion.button layout="position" className="dialogue-avatar" onClick={onToggle} aria-expanded={expanded} aria-controls="companion-dialogue" aria-label={`${expanded ? '收起' : '展开'}${name}的对话`} title={expanded ? '收起为头像' : `点击和${name}聊聊`}><img src={imagePath(image)} alt={name}/><span className="dialogue-avatar-flower"><Leaf size={12}/></span></motion.button>
    <div id="companion-dialogue" className="dialogue-content-wrapper" inert={!expanded}>
      <AnimatePresence initial={false} mode="popLayout">{expanded && <motion.div className="dialogue-content" key="content" initial={{ opacity: 0, x: reduced ? 0 : -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
        <div className="dialogue-body"><div className="dialogue-name"><strong>{name}</strong><span>{label}</span></div><p>{text}</p></div>
        <div className="dialogue-controls"><button className="dialogue-collapse" onClick={onToggle} aria-label={`收起${name}的横幅`} title="收起为头像"><X size={16}/></button><button className="dialogue-action" onClick={onAction}>{action}<ArrowRight size={16}/></button></div>
      </motion.div>}</AnimatePresence>
    </div>
  </motion.div>;
}
