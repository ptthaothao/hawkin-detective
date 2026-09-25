import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/crimson-pro/400.css';
import '@fontsource/crimson-pro/400-italic.css';
import '@fontsource/crimson-pro/600.css';
import '@fontsource/old-standard-tt/400.css';
import '@fontsource/old-standard-tt/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/patrick-hand/400.css';
import '@fontsource/sriracha/400.css';
import '@fontsource/vt323/400.css';
import { App } from './App';
import { useStore } from './store';
import './styles/base.css';
import './styles/scene.css';
import './styles/hud.css';
import './styles/radio.css';
import './styles/paper.css';

// Dev-only handle for inspecting state from the browser console / automated playtests.
if (import.meta.env.DEV) (window as unknown as { __store: typeof useStore }).__store = useStore;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
