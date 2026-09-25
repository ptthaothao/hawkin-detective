// Small drawn objects shared by the scene, inspect close-ups and Case File photos.

/** Analog clock face. Angles in degrees from 12; null = hand missing. */
export function ClockFace({
  minute,
  hour,
  brokenHour,
  seconds,
  tone = 'normal',
}: {
  minute: number | null;
  hour: number | null;
  brokenHour?: boolean;
  /** A ticking second hand (only on a clock that is running). */
  seconds?: boolean;
  tone?: 'normal' | 'other';
}) {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg viewBox="-50 -50 100 100" className={`clock-svg clock-${tone}`} aria-hidden>
      <circle r="49" className="clock-case" />
      <circle r="44.5" className="clock-rim" />
      {ticks.map((i) => {
        const major = i % 5 === 0;
        return (
          <line
            key={i}
            y1={-42.5}
            y2={major ? -38.5 : -40.6}
            transform={`rotate(${i * 6})`}
            className={major ? 'tick major' : 'tick'}
          />
        );
      })}
      {/* Minute ring: 5, 10 … 60 just inside the ticks. */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 * Math.PI) / 180;
        return (
          <text key={i} x={Math.sin(a) * 35} y={-Math.cos(a) * 35 + 1.4} className="clock-min">
            {(i + 1) * 5}
          </text>
        );
      })}
      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <text key={n} x={Math.sin(a) * 25.5} y={-Math.cos(a) * 25.5 + 3.2} className="clock-num">
            {n}
          </text>
        );
      })}
      {hour !== null && <line y1={4} y2={-18} transform={`rotate(${hour})`} className="hand hour" />}
      {minute !== null && <line y1={6} y2={-41} transform={`rotate(${minute})`} className="hand minute" />}
      {brokenHour && <line x1={-9} y1={38} x2={9} y2={36.5} className="hand hour fallen" />}
      {seconds && <line y1={8} y2={-38} className="hand second" />}
      <circle r="2" className="clock-pin" />
      <circle r="44.5" className="clock-glass" />
    </svg>
  );
}

/** This side: running, 11:47 (stopped at 3:17 after branch A). Other side: long hand two small
 *  marks past the 3; short hand broken off. */
export const NormalClock = ({ stopped, seconds }: { stopped?: boolean; seconds?: boolean }) =>
  stopped ? (
    <ClockFace minute={17 * 6} hour={(3 + 17 / 60) * 30} />
  ) : (
    <ClockFace minute={47 * 6} hour={(11 + 47 / 60) * 30} seconds={seconds} />
  );
export const OtherClock = () => <ClockFace minute={17 * 6} hour={null} brokenHour tone="other" />;

/** Tally marks as carved strokes, groups of five. Drawn into a 0..groups*30 × 40 box. */
export function TallyStrokes({ count, freshLast }: { count: number; freshLast?: boolean }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const g = Math.floor(i / 5);
        const k = i % 5;
        const x0 = g * 30 + 4;
        // Hand-carved: every stroke leans a little differently.
        const wob = ((i * 37) % 7) / 7 - 0.5;
        const cls = freshLast && i === count - 1 ? 'fresh' : undefined;
        return k < 4 ? (
          <line key={i} x1={x0 + k * 5 + wob} y1={6 + wob * 2} x2={x0 + k * 5 + 1 - wob} y2={34} pathLength={1} className={cls} />
        ) : (
          <line key={i} x1={x0 - 3} y1={28 + wob} x2={x0 + 21} y2={10 - wob} pathLength={1} className={cls} />
        );
      })}
    </>
  );
}

export function TallyMarks({ count, className }: { count: number; className?: string }) {
  const groups = Math.max(1, Math.ceil(count / 5));
  return (
    <svg viewBox={`0 0 ${groups * 30} 40`} className={className ?? 'tally'} aria-hidden>
      <TallyStrokes count={count} />
    </svg>
  );
}

// Seven-segment digits (watch LCD, radio readout). Segments a..g.
const SEGMENTS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  '-': 'g',
  ' ': '',
};

const SEG_PATH: Record<string, string> = {
  a: 'M2 1 L10 1 L8.6 2.6 L3.4 2.6 Z',
  b: 'M10.4 1.6 L10.4 9.2 L9 8.2 L9 3 Z',
  c: 'M10.4 10.8 L10.4 18.4 L9 17 L9 11.8 Z',
  d: 'M2 19 L10 19 L8.6 17.4 L3.4 17.4 Z',
  e: 'M1.6 10.8 L1.6 18.4 L3 17 L3 11.8 Z',
  f: 'M1.6 1.6 L1.6 9.2 L3 8.2 L3 3 Z',
  g: 'M2.2 10 L3.4 9.2 L8.6 9.2 L9.8 10 L8.6 10.8 L3.4 10.8 Z',
};

/** One digit in a 12×20 box. `dead` draws only the unlit ghost segments. */
export function SegDigit({ ch, x = 0, dead }: { ch: string; x?: number; dead?: boolean }) {
  const on = dead ? '' : (SEGMENTS[ch] ?? '');
  return (
    <g transform={`translate(${x} 0) skewX(-6)`}>
      {Object.entries(SEG_PATH).map(([k, d]) => (
        <path key={k} d={d} className={on.includes(k) ? 'seg on' : 'seg off'} />
      ))}
    </g>
  );
}
