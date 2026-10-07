import { Cake, ChevronRight } from 'lucide-react';
import { CHARACTERS } from '../game/data';
import { birthdayStatus, CHARACTER_BIRTHDAYS } from '../game/birthdays';
import type { CharacterId, GameState } from '../game/types';

export default function BirthdayHint({ game, id, onVisit }: { game: GameState; id: CharacterId; onVisit: (place: string) => void }) {
  const birthday = birthdayStatus(game, id);
  return <div className={`birthday-hint ${birthday.thisWeek ? 'is-birthday' : ''}`}><Cake size={17}/><div><strong>{birthday.month} 月 {birthday.date} 日 · {birthday.thisWeek ? birthday.early ? '本周提前庆祝' : '生日周' : game.week <= birthday.week ? `还有 ${birthday.daysUntil} 天` : '这一年的生日已过去'}</strong>{birthday.thisWeek && <small>{birthday.bonusAvailable ? '本周第一份礼物：关系与心意加成 50%' : '生日礼物加成已收好'} · {birthday.celebrated ? '祝福已收进手帐' : '专属生日剧情 · 1 行动'}</small>}</div>{birthday.thisWeek && !birthday.celebrated && <button className="text-button" onClick={() => onVisit(birthday.placeId)} aria-label={`去庆祝${CHARACTERS[id].name}的生日`}><ChevronRight size={18}/></button>}</div>;
}
export function BirthdayCalendar({ game, onVisit }: { game: GameState; onVisit: (place: string) => void }) {
  const dates = [...Object.keys(CHARACTER_BIRTHDAYS), 'player'].map(id => birthdayStatus(game, id as CharacterId | 'player')).filter(info => info.week >= game.week).sort((a, b) => a.week - b.week).slice(0, 4);
  return <section className="birthday-calendar"><h4><Cake size={18}/>生日与祝福</h4>{dates.length ? dates.map(info => <button className="secondary-button" key={info.id} onClick={() => onVisit(info.placeId)}><span><strong>{info.id === 'player' ? '你的生日' : `${CHARACTERS[info.id].name}的生日`}</strong><small>{info.month} 月 {info.date} 日 · {info.celebrated ? '已庆祝' : info.thisWeek ? info.early ? '本周提前庆祝' : '本周生日剧情' : `还有 ${info.daysUntil} 天`}</small></span><ChevronRight size={15}/></button>) : <p>这一年的祝福都收在手帐里，可以随时回看。</p>}</section>;
}
