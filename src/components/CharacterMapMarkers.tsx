import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { CHARACTERS, PLACES, imagePath } from '../game/data';
import { characterPositions } from '../game/characterSchedule';
import type { CharacterId, GameState, Scene } from '../game/types';

export default function CharacterMapMarkers({ game, scene, avatar, onChat }: { game: GameState; scene: Scene; avatar: { x: number; y: number }; onChat: (id: CharacterId) => void }) {
  if (!game.started) return null;
  return <>{characterPositions(game, scene, avatar).map(person => <motion.button key={person.id} className={`npc-map-marker ${person.following ? 'following' : ''}`} animate={{ left: `${person.x}%`, top: `${person.y}%` }} transition={{ type: 'spring', duration: person.following ? 2.1 : 1, bounce: .08 }} onClick={() => onChat(person.id)} aria-label={`${person.name} · ${person.following ? '正在与你同行' : PLACES.find(place => place.id === person.placeId)?.name}，打开聊天`}><img src={imagePath(CHARACTERS[person.id].image)} alt=""/><span>{person.name}{person.following && <Heart size={9}/>}</span></motion.button>)}</>;
}
