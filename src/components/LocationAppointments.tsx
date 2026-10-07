import { ArrowRight, Heart, MessageCircle } from 'lucide-react';
import { CHARACTERS, imagePath } from '../game/data';
import { getAppointments } from '../game/appointments';
import { appointmentLock } from '../game/engine';
import type { CharacterId, GameState } from '../game/types';

export default function LocationAppointments({ game, placeId, onMeet, onChat }: { game: GameState; placeId: string; onMeet: (eventId: string) => void; onChat: (id: CharacterId) => void }) {
  const appointments = getAppointments(game).filter(item => item.placeId === placeId && !item.completed);
  if (!appointments.length) return null;
  return <section className="location-appointments" aria-label="此地的约见"><h3><Heart size={18}/>有人在这里等你</h3>{appointments.map(appointment => {
    const character = CHARACTERS[appointment.character];
    const lock = appointmentLock(game, appointment.eventId);
    return <article className="appointment-card" key={appointment.eventId}>
      <img src={imagePath(character.image)} alt=""/>
      <div><strong>与{character.name}的约见</strong><p>第 {appointment.week + 1} 周约好 · 可以跨周赴约</p><small>{lock ?? '消耗 1 次行动 · 进入专属见面剧情'}</small></div>
      <div className="appointment-actions"><button className="primary-button" disabled={!!lock} title={lock ?? '进入约见剧情'} onClick={() => onMeet(appointment.eventId)}>赴约<ArrowRight size={15}/></button><button className="text-button" onClick={() => onChat(appointment.character)}><MessageCircle size={13}/>回到聊天</button></div>
    </article>;
  })}</section>;
}
