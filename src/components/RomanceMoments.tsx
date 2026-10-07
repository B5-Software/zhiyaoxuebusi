import { LockKeyhole } from 'lucide-react';
import { unlockedRomanceMoments } from '../game/romance';
import { asset } from '../utils/asset';
import type { GameState, RomanceId } from '../game/types';

export default function RomanceMoments({ game, id }: { game: GameState; id: RomanceId }) {
  if (game.social.partner !== id) return null;
  const unlocked = unlockedRomanceMoments(game, id);
  const art = asset(id === 'zhou' || id === 'xinghe' ? 'images/romance-men-moments.webp' : 'images/romance-moments.webp');
  return <div className="love-moments" aria-label="相处回忆插画">{(['牵手', '拥抱', '轻吻'] as const).map((label, index) => <div key={label} className={`love-moment ${unlocked[index] ? 'unlocked' : 'locked'}`}>
    {unlocked[index] ? <div className="love-moment-art" role="img" aria-label={`已收好的${label}回忆`} style={{ backgroundImage: `url(${art})`, backgroundPosition: `${index * 50}% center` }}/> : <div className="love-moment-lock"><LockKeyhole size={22}/><strong>{label}回忆</strong><small>一起经历后点亮</small></div>}
  </div>)}</div>;
}
