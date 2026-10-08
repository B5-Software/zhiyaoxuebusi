import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowLeft, ArrowRight, CheckCheck, Gift, Heart, MapPin, MessageCircle, Send, Users } from 'lucide-react';
import { CHARACTERS, FAVORITE_GIFTS, ITEMS, PLACES, imagePath } from '../game/data';
import { bondStage, isRomanceId, markConversationRead, pendingChat, proactiveLock, replyLock, unreadCount } from '../game/social';
import { PROACTIVE_TOPICS } from '../game/proactiveData';
import { playerPortrait, playerText } from '../game/player';
import { getAppointments } from '../game/appointments';
import { confessionLock } from '../game/romance';
import BirthdayHint from './BirthdayHint';
import type { CharacterId, GameState, Panel, RomanceId } from '../game/types';

function messagePeriod(message: { text: string; week: number }) { const match = message.text.match(/^【毕业后第 (\d+) 月】/); return match ? `重逢第 ${match[1]} 月` : `第 ${message.week + 1} 周`; }

interface Props {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
  open: (panel: Panel) => void;
  onReply: (script: string, index: number) => void;
  onInitiate: (topicId: string) => void;
  onGift: (id: CharacterId, item?: string) => void;
  onAction: (id: string) => void;
  onVisitPlace: (placeId: string) => void;
  onConfess: (id: RomanceId) => void;
  onRomance: (id: RomanceId) => void;
  initialContact?: CharacterId;
}

export default function Messenger({ game, setGame, open, onReply, onInitiate, onGift, onAction, onVisitPlace, onConfess, onRomance, initialContact }: Props) {
  const [active, setActive] = useState<CharacterId>(() => initialContact ?? game.social.messages.find(message => !message.read)?.character ?? 'su');
  const [mobileChat, setMobileChat] = useState(!!initialContact);
  const [gift, setGift] = useState('milk');
  const [composeMode, setComposeMode] = useState<'reply' | 'initiate' | 'invite'>('reply');
  const log = useRef<HTMLDivElement>(null);
  const character = CHARACTERS[active];
  const messages = game.social.messages.filter(message => message.character === active);
  const latestId = messages.at(-1)?.id;
  const script = pendingChat(game, active);
  const bond = isRomanceId(active) ? game.social.bonds[active] : null;
  const confession = isRomanceId(active) ? confessionLock(game, active) : null;
  const topics = PROACTIVE_TOPICS.filter(topic => topic.character === active && (!topic.datingOnly || game.social.partner === active) && (!topic.weekly || topic.minWeek === game.week));
  const appointments = isRomanceId(active) ? getAppointments(game, active).filter(item => !item.completed) : [];
  const meetingPlace = PLACES.find(place => place.id === appointments[0]?.placeId) ?? PLACES.find(place => place.actions.includes(active));
  const visibleMessages = messages;

  useEffect(() => {
    // On phones the contact list is a separate view; merely opening the app
    // does not mark an unseen chat as read.
    if (window.matchMedia('(max-width: 760px)').matches && !mobileChat) return;
    setGame(current => markConversationRead(current, active));
  }, [active, latestId, mobileChat, setGame]);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [active, latestId]);

  function selectContact(id: CharacterId) { setActive(id); setMobileChat(true); setGift(isRomanceId(id) ? FAVORITE_GIFTS[id] : 'milk'); setComposeMode(pendingChat(game, id) ? 'reply' : 'initiate'); }

  return <div className={`messenger ${mobileChat ? 'show-chat' : ''}`}>
    <aside className="im-contacts"><div className="im-brand"><MessageCircle size={22}/><span><strong>拾光通讯</strong><small>7 位联系人 · {unreadCount(game)} 条未读</small></span></div>
      <div className="im-contact-list">{(Object.entries(CHARACTERS) as [CharacterId, typeof character][]).map(([id, item]) => {
        const conversation = game.social.messages.filter(message => message.character === id);
        const latest = conversation.at(-1);
        const unread = unreadCount(game, id);
        return <button key={id} data-guide={`contact-${id}`} className={`im-contact ${active === id ? 'selected' : ''}`} onClick={() => selectContact(id)} aria-label={`与${item.name}聊天${unread ? `，${unread} 条未读` : ''}`}>
          <div className="im-contact-avatar"><img src={imagePath(item.image)} alt=""/>{unread > 0 && <b>{unread}</b>}</div><span><strong>{item.name}{(game.social.partner === id || id === 'teacher' && game.graduate.partner) && <Heart size={11} fill="currentColor"/>}</strong><small>{playerText(game, latest?.text ?? item.quote)}</small></span><em>{latest ? messagePeriod(latest) : '新朋友'}</em>
        </button>;
      })}</div>
      <button className="im-relations-link" onClick={() => open('relations')}><Users size={15}/>查看所有关系<ArrowRight size={14}/></button>
    </aside>
    <section className="im-conversation" aria-label={`与${character.name}的聊天`}>
      <header className="im-chat-header"><button className="im-back" onClick={() => setMobileChat(false)} aria-label="返回联系人"><ArrowLeft size={19}/></button><img src={imagePath(character.image)} alt={character.name}/><div><strong>{character.name}</strong><small>{active === 'teacher' && game.graduate.unlocked ? game.graduate.partner ? '毕业后 · 彼此答应的恋人' : '毕业后 · 重新认识的朋友' : bond && isRomanceId(active) ? bondStage(game, active) : character.role}</small></div><button className="im-meet" onClick={() => meetingPlace ? onVisitPlace(meetingPlace.id) : onAction(active)} title="打开见面地点，赴约消耗 1 次行动"><MapPin size={14}/>{appointments.length ? "去赴约" : "见面地点"}</button></header>
      <BirthdayHint game={game} id={active} onVisit={onVisitPlace}/>
      {bond && <div className="im-bond-bar"><span>信任 <b>{bond.trust}</b></span><span className="affection">心动 <b>{bond.affection}</b></span><span>了解 <b>{bond.understanding}</b></span><small>见面 {bond.meetings} 次</small></div>}
      {!!appointments.length && <div className="im-appointments" aria-label="待赴约记录">{appointments.map(appointment => <button key={appointment.eventId} onClick={() => onVisitPlace(appointment.placeId)}><Heart size={15}/><span><strong>与{character.name}的约见 · {PLACES.find(place => place.id === appointment.placeId)?.name}</strong><small>{game.actions >= 3 ? "本周行动已用完，下周再赴约" : "已经约好 · 前往地点赴约 · 1 次行动"}</small></span><ArrowRight size={16}/></button>)}</div>}
      <div className="im-chat-log" ref={log} role="log" aria-label="聊天记录" aria-live="polite">
        {!game.started ? <div className="im-empty"><MessageCircle size={42}/><h3>第一条消息，等你开启故事</h3><p>同学、朋友与家人都会在这里找你。</p><button className="primary-button" onClick={() => open('start')}>开启我的高三<ArrowRight size={16}/></button></div> : !visibleMessages.length ? <div className="im-empty"><img src={imagePath(character.image)} alt=""/><h3>{character.name}</h3><p>{character.description}</p><small>新的消息会在这一年的生活里慢慢到来。</small></div> : <><p className="im-log-start">和{character.name}的故事，从一声你好开始</p>{visibleMessages.map((message, index) => <div key={message.id}>{(index === 0 || messagePeriod(message) !== messagePeriod(visibleMessages[index - 1])) && <span className="im-week-divider">{messagePeriod(message)}</span>}<div className={`im-message ${message.side}`}><img src={message.side === 'incoming' ? imagePath(character.image) : playerPortrait(game)} alt=""/><div><p>{playerText(game, message.text)}</p>{message.side === 'outgoing' && <small><CheckCheck size={11}/>已送达</small>}</div></div></div>)}</>}
      </div>
      <div className="im-composer">{active === 'teacher' && game.started && <button className="secondary-button" onClick={() => open('graduate-romance')}><Heart size={14}/>{game.phase === 'ending' ? '毕业后重逢 · 相处与主动表白' : '毕业后缘分 · 查看开放条件'}</button>}
        {game.started && game.phase === 'school' && <div className="im-compose-tabs"><button className={composeMode === 'reply' ? 'active' : ''} aria-pressed={composeMode === 'reply'} onClick={() => setComposeMode('reply')}><MessageCircle size={13}/>回复消息{script && <i/>}</button><button className={composeMode === 'initiate' ? 'active' : ''} aria-pressed={composeMode === 'initiate'} onClick={() => setComposeMode('initiate')}><Send size={13}/>主动发消息</button>{bond && <button className={composeMode === "invite" ? "active" : ""} aria-pressed={composeMode === "invite"} onClick={() => setComposeMode("invite")}><Heart size={13}/>约见</button>}</div>}
        {composeMode !== 'reply' && game.started && game.phase === 'school' ? <><div className="im-reply-label"><Send size={13}/>{composeMode === "invite" ? "约对方在哪里见面？" : "想主动聊些什么？"}<small>发消息不消耗行动 · 赴约消耗 1 次</small></div><div className="im-topics">{topics.filter(topic => composeMode !== "invite" || topic.invitePlace).map(topic => { const lock = proactiveLock(game, topic); const sent = game.social.initiatives.some(item => item.topicId === topic.id); return <button key={topic.id} disabled={!!lock} title={lock ?? playerText(game, topic.text)} onClick={() => onInitiate(topic.id)}><span><strong>{topic.label}{sent && ' · 已聊过'}</strong><small>{lock ?? playerText(game, topic.text)}</small></span><Send size={14}/></button>; })}</div></> : script ? <><div className="im-reply-label"><Send size={13}/>选择你想发的话<small>回复不消耗行动</small></div><div className="im-replies">{script.choices.map((choice, index) => <button key={choice.text} onClick={() => onReply(script.id, index)} disabled={!!replyLock(game, script, index)} title={replyLock(game, script, index) ?? '发送这条回复'}><span>{playerText(game, choice.text)}</span><Send size={14}/></button>)}</div></> : <p className="im-waiting">{game.phase !== 'school' ? '这一年的消息已经收好，可以随时回来阅读。' : game.started ? '这一段已经聊完。新的生活，会带来新的消息。' : '先开启高三故事，收到第一条消息。'}</p>}
        {game.started && game.phase === 'school' && <div className="im-gift-tools"><Gift size={14}/><select aria-label="选择要送的礼物" value={gift} onChange={event => setGift(event.target.value)}>{ITEMS.map(item => <option key={item.id} value={item.id}>{item.name} ×{game.inventory[item.id]}</option>)}</select><button onClick={() => onGift(active, gift)} disabled={!game.inventory[gift] || !!game.pendingEvent || bond?.lastGiftWeek === game.week}>送给{character.name}</button>{isRomanceId(active) && <><button className="im-confess" onClick={() => onRomance(active)}><Heart size={13}/>心事 · 恋爱界面</button>{game.social.partner !== active && <button className="im-confess" disabled={!!confession} title={confession ?? "认真说出心意"} onClick={() => onConfess(active)}><Heart size={13}/>主动表白</button>}</>}</div>}
        {isRomanceId(active) && game.social.partner !== active && <p className="im-confession-hint">{confession ?? "彼此的心意与相处已准备好，可以主动表白。"}</p>}
      </div>
    </section>
  </div>;
}
