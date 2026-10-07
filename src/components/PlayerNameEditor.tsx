import { useState, type Dispatch, type SetStateAction } from 'react';
import { Check, Pencil } from 'lucide-react';
import { playerNameError, renamePlayer } from '../game/player';
import type { GameState } from '../game/types';

interface Props { game: GameState; setGame: Dispatch<SetStateAction<GameState>>; notify: (message: string) => void }

export default function PlayerNameEditor({ game, setGame, notify }: Props) {
  const [name, setName] = useState(game.name);
  const [error, setError] = useState<string | null>(null);
  return <form className="player-name-editor" onSubmit={event => {
    event.preventDefault();
    const invalid = playerNameError(name);
    setError(invalid);
    if (invalid) return;
    setGame(current => renamePlayer(current, name).game);
    notify('名字已更新，主角称呼和自动存档已同步。');
  }}><label htmlFor="player-name"><Pencil size={16}/>我的名字<input id="player-name" value={name} onChange={event => { setName(event.target.value); setError(null); }} maxLength={16} required aria-describedby="player-name-hint"/></label><button className="secondary-button" type="submit" disabled={name.trim() === game.name || !!playerNameError(name)}><Check size={15}/>保存名字</button><p id="player-name-hint">可以随时修改。改名会保留任务、关系和所有游戏进度。</p>{error && <p role="alert">{error}</p>}</form>;
}
