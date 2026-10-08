import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAYTIME_KEY, acknowledgePlaytime, readPlaytime, reminderDue, tickPlaytime } from '../game/playtime';
export default function usePlayReminder(playing: boolean) {
  const [initial] = useState(() => { try { return readPlaytime(JSON.parse(sessionStorage.getItem(PLAYTIME_KEY) ?? 'null'), Date.now()); } catch { return readPlaytime(null, Date.now()); } });
  const clock = useRef(initial);
  const [display, setDisplay] = useState(() => ({ due: reminderDue(initial), minutes: Math.floor(initial.elapsed / 60000) }));
  const publish = useCallback(() => {
    const state = clock.current;
    try { sessionStorage.setItem(PLAYTIME_KEY, JSON.stringify(state)); } catch { /* Timing still works in memory. */ }
    const next = { due: reminderDue(state), minutes: Math.floor(state.elapsed / 60000) };
    setDisplay(current => current.due === next.due && current.minutes === next.minutes ? current : next);
  }, []);
  useEffect(() => {
    const tick = () => { clock.current = tickPlaytime(clock.current, Date.now(), document.visibilityState === 'visible', playing); publish(); };
    tick(); const timer = setInterval(tick, 1000); document.addEventListener('visibilitychange', tick); window.addEventListener('pagehide', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); window.removeEventListener('pagehide', tick); };
  }, [playing, publish]);
  const dismiss = useCallback(() => { clock.current = acknowledgePlaytime(clock.current); publish(); }, [publish]);
  return { ...display, dismiss };
}
