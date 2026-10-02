import { StrictMode, Suspense, lazy } from 'react';
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
import { currentChapter } from './chapter';
import { useStore } from './store';
import './styles/base.css';
import './styles/scene.css';
import './styles/hud.css';
import './styles/radio.css';
import './styles/dialogue.css';
import './styles/paper.css';

// Dev-only handle for inspecting state from the browser console / automated playtests.
if (import.meta.env.DEV) (window as unknown as { __store: typeof useStore }).__store = useStore;

// Chapter 1.1 (PixiJS) loads on its own, so Chapter 0 does not pay for WebGL.
const Chapter11 = lazy(() => import('./ch1_1/Chapter11'));
const chapter = currentChapter();
if (chapter === '1.1') document.title = 'STATIC — Chương 1.1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {chapter === '1.1' ? (
      <Suspense fallback={null}>
        <Chapter11 />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
