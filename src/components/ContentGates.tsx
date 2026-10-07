import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { matureAllowed } from '../game/audience';
import { resolveRomanceScene, romanceStory } from '../game/romance';
import { playerText } from '../game/player';
import { CHARACTERS, imagePath } from '../game/data';
import type { Audience, GameState } from '../game/types';

export function AgeGate({ audience, onChoose }: { audience: Audience; onChoose: (age: 'adult' | 'minor') => void }) {
  return <Modal title="开始之前，确认一下年龄" subtitle="仅在本浏览器保存，不收集证件或出生信息" className="small-modal age-modal" closeable={false} onClose={() => {}}><div className="age-gate"><ShieldCheck size={50}/><p>你是否已满 18 周岁？</p><p>未满 18 岁的玩家会隐藏所有成人向特殊剧情入口。普通校园、友情和非露骨恋爱剧情可以正常游玩。</p><div className="age-options"><button className="primary-button" onClick={() => onChoose('adult')}>我已满 18 周岁 <ArrowRight size={16}/></button><button className="secondary-button" onClick={() => onChoose('minor')}>我未满 18 周岁</button></div><p className="fine-print">本作主角与五位可攻略角色在故事开场时均已满 18 岁。角色成年与玩家年龄分别判断。{audience.age !== 'unknown' && '本次选择会更新当前浏览器的内容设置。'}</p></div></Modal>;
}
export function RomanceStoryModal({ game, setGame, audience, setAudience, notify }: { game: GameState; setGame: Dispatch<SetStateAction<GameState>>; audience: Audience; setAudience: Dispatch<SetStateAction<Audience>>; notify: (text: string) => void }) {
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const story = romanceStory(game), active = game.romance.active;
  const privateScene = active?.id === 'private';
  const canEnter = matureAllowed(game, audience);
  useEffect(() => {
    if (privateScene && (!canEnter || audience.skipPrivate)) setGame(current => current.romance.active?.id === 'private' ? resolveRomanceScene(current, 1, audience).game : current);
  }, [privateScene, canEnter, audience, setGame]);
  if (!story || !active || privateScene && (!canEnter || audience.skipPrivate)) return null;
  function finish(index: number) { const result = resolveRomanceScene(game, index, audience, consent); if (result.error) notify(result.error); else { setGame(result.game); notify('这一页已收进我们的回忆。'); } }
  if (privateScene && !consent) return <Modal title="NSFW · 成人向私人剧情提示" subtitle="18+ · 非露骨转场叙事" className="small-modal" closeable={false} onClose={() => {}}><div className="content-warning"><ShieldCheck size={46}/><p>接下来涉及成年恋人的私密相处。叙事以双方明确同意为前提，镜头会淡出，不展示性行为细节。</p><p>你可以进入转场剧情，也可以直接跳过。两种选择的关系成长、任务进度与消耗完全相同。</p><label><input type="checkbox" checked={audience.skipPrivate} onChange={event => setAudience(current => ({ ...current, skipPrivate: event.target.checked }))}/>以后自动跳过此类剧情</label><div className="age-options"><button className="primary-button" onClick={() => setConsent(true)}>我理解，进入转场剧情</button><button className="secondary-button" onClick={() => finish(1)}>跳过私密剧情，继续游戏</button></div></div></Modal>;
  const character = CHARACTERS[active.character];
  return <Modal title={story.title} subtitle={`与${character.name}的相处 · 第 ${game.week + 1} 周`} className="story-modal love-story-modal" closeable={false} onClose={() => {}}><div className="story-panel"><div className="story-scene"><img src={imagePath(game.world.scene)} alt="相处的地方"/><span className="scene-caption">我们的故事 · 相处与约定</span></div><div className="story-narrative"><div className="story-speaker"><img src={imagePath(character.image)} alt=""/><strong>{character.name}</strong></div>{selected === null ? <><div className="story-paragraphs">{story.paragraphs.map(text => <p key={text}>{playerText(game, text)}</p>)}</div><div className="story-choices">{story.choices.map((choice, index) => <button className="story-choice" key={choice.text} onClick={() => setSelected(index)}><span className="choice-letter">{String.fromCharCode(65 + index)}</span><strong>{choice.text}</strong></button>)}</div></> : <div className="story-result"><p>{playerText(game, story.choices[selected].result)}</p><button className="primary-button" onClick={() => finish(selected)}>把这一页收好 <ArrowRight size={16}/></button></div>}</div></div></Modal>;
}
