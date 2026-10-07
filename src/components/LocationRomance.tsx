import { ArrowRight, Heart } from 'lucide-react';
import { CHARACTERS } from '../game/data';
import { ROMANCE_SCENES } from '../game/romanceData';
import { sceneLock } from '../game/romance';
import type { Audience, GameState, RomanceId } from '../game/types';

export default function LocationRomance({ game, placeId, audience, onOpen }: { game: GameState; placeId: string; audience: Audience; onOpen: (id: RomanceId) => void }) {
  const partner = game.social.partner; if (!partner) return null;
  const stories = ROMANCE_SCENES.filter(story => story.character === partner && story.placeId === placeId && !game.romance.memories.some(memory => memory.id.startsWith(`${story.id}:`)));
  const visitor = placeId === 'family' && game.romance.visitor === partner;
  if (!stories.length && !visitor) return null;
  return <section className="location-romance"><h3><Heart size={19}/>与{CHARACTERS[partner].name}的故事</h3>{visitor && <button className="appointment-card" onClick={() => onOpen(partner)}><span><strong>正在家里做客</strong><small>读书、音乐、来访约定与结束来访</small></span><ArrowRight size={16}/></button>}{stories.map(story => <button className="appointment-card" key={story.id} onClick={() => onOpen(partner)}><span><strong>{story.title}</strong><small>{sceneLock(game, partner, story.id, audience) ?? '进入心事，继续这段专属剧情 · 1 行动'}</small></span><ArrowRight size={16}/></button>)}</section>;
}
