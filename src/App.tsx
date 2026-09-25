import { useEffect } from 'react';
import { audio } from './audio/audio';
import { THEO_CONTACT, THEO_PRECALL } from './game/content';
import { radioSignal } from './game/selectors';
import { useStore } from './store';
import { DebugPanel } from './ui/DebugPanel';
import { Hud } from './ui/Hud';
import { CaseFile, FloorMenu, HintPanel, InspectView, RadioPanel } from './ui/Panels';
import { Scene } from './ui/Scene';
import { EndingBeat, EndingScreen, IntroScreen, TitleScreen } from './ui/Screens';

export function App() {
  const game = useStore((s) => s.game);
  const panel = useStore((s) => s.ui.panel);
  const setUi = useStore((s) => s.setUi);
  const signal = radioSignal(game);

  // Presentation reacts to reducer output; it never decides story.
  useEffect(() => audio.setRadio(signal), [signal]);

  const fxId = game.fx?.id;
  const fxKind = game.fx?.kind;
  useEffect(() => {
    if (!fxKind) return;
    audio.fx(fxKind);
    if (fxKind === 'contact') setUi({ panel: 'radio', subtitle: { lines: THEO_CONTACT, start: Date.now() } });
    if (fxKind === 'precall') setUi({ panel: 'radio', subtitle: { lines: THEO_PRECALL, start: Date.now() } });
  }, [fxId, fxKind, setUi]);

  if (game.phase === 'title') return <TitleScreen />;
  if (game.phase === 'intro') return <IntroScreen />;
  if (game.phase === 'ending') return <EndingScreen />;

  return (
    <div className="game">
      <div className="stage">
        <Scene />
        <Hud />
        <EndingBeat />
      </div>
      {panel === 'radio' && <RadioPanel />}
      {panel === 'casefile' && <CaseFile />}
      {panel === 'inspect' && <InspectView />}
      {panel === 'floor' && <FloorMenu />}
      {panel === 'hint' && <HintPanel />}
      {game.debug && <DebugPanel />}
    </div>
  );
}
