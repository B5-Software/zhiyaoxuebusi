import { createContext } from 'react';

export const GameNoticeContext = createContext<{ text: string; dismiss: () => void } | null>(null);
