import { useState } from 'react';
import { History, RotateCcw, ShieldCheck } from 'lucide-react';
import { loadAutoBackups } from '../game/engine';
import type { GameState } from '../game/types';

export default function AutoBackups({ onLoad }: { onLoad: (game: GameState) => void }) {
  const [backups] = useState(loadAutoBackups);
  const [confirm, setConfirm] = useState<number | null>(null);
  return <section className="auto-backups"><div className="auto-save-heading"><ShieldCheck size={20}/><div><strong>自动存档 v2</strong><p>行动、剧情、聊天与关系变化实时保存，另保留最近 6 个恢复点。旧版存档会自动升级。</p></div></div><div className="auto-backup-list">{backups.length ? backups.map((slot, index) => <div key={`${slot.savedAt}-${index}`}><History size={16}/><span><strong>第 {slot.game.week + 1} 周 · {slot.game.actions}/3 行动 · {slot.game.social.replies.length} 次回复</strong><small>{new Date(slot.savedAt).toLocaleString('zh-CN')}</small></span><button className="text-button" onClick={() => { if (confirm !== index) { setConfirm(index); return; } onLoad(slot.game); }}><RotateCcw size={13}/>{confirm === index ? '确认恢复' : '恢复'}</button></div>) : <p>继续行动或回复消息后，会自动留下恢复点。</p>}</div></section>;
}
