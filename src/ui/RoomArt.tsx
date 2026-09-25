// Gray-box art: simple shapes positioned in % of the 16:9 scene. Replace with real art later;
// positions must stay in sync with layout.ts.

import type { CSSProperties } from 'react';
import { lureProgress, tally } from '../game/selectors';
import type { GameState } from '../game/types';
import { CREATURE_POS } from './layout';

const box = (x: number, y: number, w: number, h: number): CSSProperties => ({
  left: `${x}%`,
  top: `${y}%`,
  width: `${w}%`,
  height: `${h}%`,
});

/** Analog clock face. minuteAngle/hourAngle in degrees from 12; null = hand missing. */
export function ClockFace({
  minute,
  hour,
  brokenHour,
}: {
  minute: number | null;
  hour: number | null;
  brokenHour?: boolean;
}) {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg viewBox="-50 -50 100 100" className="clock-svg" aria-hidden>
      <circle r="47" className="clock-rim" />
      {ticks.map((i) => {
        const major = i % 5 === 0;
        return (
          <line
            key={i}
            y1={-44}
            y2={major ? -37 : -41}
            transform={`rotate(${i * 6})`}
            className={major ? 'tick major' : 'tick'}
          />
        );
      })}
      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <text key={n} x={Math.sin(a) * 30} y={-Math.cos(a) * 30 + 3.5} className="clock-num">
            {n}
          </text>
        );
      })}
      {hour !== null && <line y1={4} y2={-22} transform={`rotate(${hour})`} className="hand hour" />}
      {minute !== null && <line y1={6} y2={-36} transform={`rotate(${minute})`} className="hand minute" />}
      {brokenHour && <line x1={-8} y1={40} x2={10} y2={38} className="hand hour fallen" />}
      <circle r="2" className="clock-pin" />
    </svg>
  );
}

/** Normal: running, 11:47 (stopped at 3:17 after branch A). Other side: long hand two small
 *  marks past the 3; short hand broken. */
export const NormalClock = ({ stopped }: { stopped?: boolean }) =>
  stopped ? (
    <ClockFace minute={17 * 6} hour={(3 + 17 / 60) * 30} />
  ) : (
    <ClockFace minute={47 * 6} hour={(11 + 47 / 60) * 30} />
  );
export const OtherClock = () => <ClockFace minute={17 * 6} hour={null} brokenHour />;

export function WatchFace() {
  return (
    <div className="watch">
      <div className="watch-lcd">
        03:<span className="dead">▯▯</span>
      </div>
    </div>
  );
}

export function TallyMarks({ count }: { count: number }) {
  const groups = Math.ceil(count / 5);
  return (
    <svg viewBox={`0 0 ${groups * 30} 40`} className="tally" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const g = Math.floor(i / 5);
        const k = i % 5;
        const x0 = g * 30 + 4;
        return k < 4 ? (
          <line key={i} x1={x0 + k * 5} y1={6} x2={x0 + k * 5 + 1} y2={34} />
        ) : (
          <line key={i} x1={x0 - 3} y1={28} x2={x0 + 21} y2={10} />
        );
      })}
    </svg>
  );
}

export function NormalRoom({ s }: { s: GameState }) {
  return (
    <div className="room normal">
      <div className="art wallpaper" />
      <div className="art floor" />
      <div className="art clock" style={box(12, 8, 9, 16)}>
        <NormalClock stopped={s.rescued} />
      </div>
      <div className="art poster" style={box(8, 30, 16, 24)} />
      <div className="art bed" style={box(4, 58, 30, 22)} />
      <div className={`art rug ${s.diaryFound ? 'lifted' : ''}`} style={box(36, 74, 24, 16)} />
      <div className="art desk" style={box(54, 53, 30, 4)} />
      <div className="art desk-leg" style={box(55, 57, 2, 20)} />
      <div className="art desk-leg" style={box(81, 57, 2, 20)} />
      <div className="art radio" style={box(62, 42, 12, 11)}>
        <span className="radio-dial">
          {s.radio.broken ? '—' : `${s.radio.wheels[0]}.${s.radio.wheels[1]}${s.radio.wheels[2]}`}
        </span>
      </div>
      <div className="art mic" style={box(57.5, 39, 2.5, 9)} />
      <div className="art flyers" style={box(55.5, 49, 6, 4)} />
      <div className="art watch-small" style={box(76, 50.5, 3, 2.2)} />
      <div className="art lamp" style={box(79, 36, 4, 17)} />
      {s.contactMade && <div className="art scratch" style={box(56, 54, 6, 1.2)} />}
      <div className="art switch" style={box(84, 34, 3, 7)} />
      <div className={`art door ${s.rescued ? 'clawed' : ''}`} style={box(89, 18, 9, 62)} />
    </div>
  );
}

function creaturePos(s: GameState, now: number): { x: number; y: number } | null {
  if (!s.contactMade || s.rescued) return null;
  if (!s.deductionSolved) return CREATURE_POS.desk;
  if (s.choice === 'A') {
    const p = lureProgress(s, now);
    const { middle: m, desk: d } = CREATURE_POS;
    return { x: m.x + (d.x - m.x) * p, y: m.y + (d.y - m.y) * p };
  }
  if (s.choice === 'B') return CREATURE_POS.door;
  return CREATURE_POS.middle;
}

export function OtherRoom({ s, now }: { s: GameState; now: number }) {
  const pos = creaturePos(s, now);
  return (
    <div className="room other">
      <div className="art wallpaper rotten" />
      <div className="art floor rotten" />
      <div className="art vines" />
      <div className="art clock stopped" style={box(12, 8, 9, 16)}>
        <OtherClock />
      </div>
      <div className="art wall-marks" style={box(5, 30, 22, 24)}>
        <TallyMarks count={tally(s)} />
        {s.choice === 'A' && !s.rescued && <div className="theo-hand" />}
        {s.theoLightSeen && <div className="wall-message">EM ỔN. ĐÊM MAI. CÙNG GIỜ.</div>}
      </div>
      <div className="art bed rotten" style={box(4, 58, 30, 22)} />
      <div className="art rug rotten" style={box(36, 74, 24, 16)} />
      <div className="art hole" style={box(45, 78, 6, 5)} />
      <div className="art board" style={box(52, 76, 8, 3)} />
      <div className="art desk rotten" style={box(54, 53, 30, 4)} />
      <div className="art desk-leg" style={box(55, 57, 2, 20)} />
      <div className="art desk-leg" style={box(81, 57, 2, 20)} />
      <div className="art radio overgrown" style={box(62, 42, 12, 11)} />
      <div className={`art claws ${s.contactMade ? 'fresh' : ''}`} style={box(60, 39, 16, 16)} />
      <div className="art lamp" style={box(79, 36, 4, 17)} />
      <div className="art mic fallen" style={box(46, 70, 3, 2)} />
      <div className="art mic-cord" style={box(24, 62, 24, 0.6)} />
      <div className="art switch" style={box(84, 34, 3, 7)} />
      <div className="art door" style={box(89, 18, 9, 62)} />
      {pos && (
        <div
          className={`creature ${s.choice === 'B' ? 'leaving' : ''}`}
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        />
      )}
    </div>
  );
}
