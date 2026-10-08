import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/zcool-kuaile';
import './index.css';
import './responsive.css';
import './romance.css';
import './tutorial.css';
import './updates.css';
import './life.css';
import App from './App';
function Ready() { useEffect(() => { window.dispatchEvent(new Event('shiguang:ready')); }, []); return null; }
createRoot(document.getElementById('root')!).render(<StrictMode><App/><Ready/></StrictMode>);
