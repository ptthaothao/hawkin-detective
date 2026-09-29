import type { CSSProperties } from 'react';
import { usePresentation } from './presentation/usePresentation';
import { useStore } from './store';
import { CaseFile } from './ui/CaseFile';
import { FloorView, HintNote, InspectView, RubView } from './ui/Closeups';
import { DebugPanel } from './ui/DebugPanel';
import { Hud } from './ui/Hud';
import { RadioView } from './ui/RadioView';
import { FilmGrain } from './ui/scene/Atmosphere';
import { Scene } from './ui/scene/Scene';
import { EndingBeat, EndingScreen, IntroScreen, TitleScreen } from './ui/Screens';

/** Chromatic split used by the brief glitch when something from the other side reaches through. */
function GlitchFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <filter id="chroma" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx="-6" dy="0" result="r2" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
        <feOffset in="gb" dx="4" dy="0" result="gb2" />
        <feBlend in="r2" in2="gb2" mode="screen" />
      </filter>
    </svg>
  );
}

export function App() {
  const phase = useStore((s) => s.game.phase);
  const debug = useStore((s) => s.game.debug);
  const panel = useStore((s) => s.ui.panel);
  const glitch = useStore((s) => s.ui.glitch);
  const v = usePresentation();

  if (phase !== 'play') {
    return (
      <div className="game">
        {phase === 'title' && <TitleScreen />}
        {phase === 'intro' && <IntroScreen />}
        {phase === 'ending' && <EndingScreen />}
        <FilmGrain />
      </div>
    );
  }

  const classes = ['game', `world-${v.world}`, glitch ? 'glitch' : '', v.dread >= 0.5 ? 'unstable' : ''];
  return (
    <div className={classes.join(' ')} style={{ '--dread': v.dread } as CSSProperties}>
      <GlitchFilter />
      <Scene v={v} />
      <Hud v={v} />
      <EndingBeat />
      {panel === 'radio' && <RadioView v={v} />}
      {panel === 'casefile' && <CaseFile v={v} />}
      {panel === 'inspect' && <InspectView />}
      {panel === 'floor' && <FloorView />}
      {panel === 'rub' && <RubView />}
      {panel === 'hint' && <HintNote />}
      <FilmGrain />
      {debug && <DebugPanel />}
    </div>
  );
}
