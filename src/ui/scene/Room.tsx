// Theo's bedroom, drawn once. Both worlds share every coordinate: the other side is the same
// geometry with a cold palette and a decay layer on top. Canvas is 1600×900 (= the 16:9 scene;
// hotspot % in layout.ts × 16 / × 9). Walls and floor bleed past the canvas so the room fills
// any viewport shape.

import { useId, type ReactNode } from 'react';
import { tally } from '../../game/selectors';
import type { GameState, World } from '../../game/types';
import type { VisualState } from '../../presentation/visual';
import { NormalClock, OtherClock, TallyStrokes } from '../art/Props';

interface Palette {
  ceiling: string;
  wall: string;
  wallStripe: string;
  wallMotif: string;
  panel: string;
  groove: string;
  rail: string;
  floor: string;
  floorLine: string;
  trim: string;
  door: string;
  doorPanel: string;
  wood: string;
  woodDark: string;
  woodTop: string;
  blanket: string;
  blanketLine: string;
  sheet: string;
  rug: [string, string, string];
  metal: string;
  metalDark: string;
  paper: string;
  night: string;
  street: string;
  shade: string;
  brass: string;
  shadow: string;
}

const NORMAL: Palette = {
  ceiling: '#241b13',
  wall: '#6d5634',
  wallStripe: '#5f4a2c',
  wallMotif: '#86693f',
  panel: '#4d3220',
  groove: '#352114',
  rail: '#5e3c24',
  floor: '#553820',
  floorLine: '#3a2414',
  trim: '#c9b58e',
  door: '#86633f',
  doorPanel: '#77562f',
  wood: '#6a4629',
  woodDark: '#4a2f1a',
  woodTop: '#7d5634',
  blanket: '#7d2f23',
  blanketLine: '#3e4b33',
  sheet: '#d9ceb2',
  rug: ['#7b4a2c', '#5b331d', '#94703f'],
  metal: '#a39b89',
  metalDark: '#2a2622',
  paper: '#e7dfc9',
  night: '#0d1729',
  street: '#e1a656',
  shade: '#2f5a3a',
  brass: '#b58f4a',
  shadow: '#140d07',
};

const OTHER: Palette = {
  ceiling: '#070a09',
  wall: '#1c2522',
  wallStripe: '#171f1c',
  wallMotif: '#222c28',
  panel: '#141b18',
  groove: '#0b100e',
  rail: '#18201c',
  floor: '#181e1a',
  floorLine: '#0b0f0c',
  trim: '#46514b',
  door: '#262d29',
  doorPanel: '#202723',
  wood: '#252822',
  woodDark: '#151814',
  woodTop: '#2e3029',
  blanket: '#2a2926',
  blanketLine: '#1e231f',
  sheet: '#474c45',
  rug: ['#26241f', '#1d1c18', '#2e2b24'],
  metal: '#4c5650',
  metalDark: '#121614',
  paper: '#565b53',
  night: '#040605',
  street: '#5a1512',
  shade: '#1a2620',
  brass: '#4a4838',
  shadow: '#000000',
};

const FLOOR_Y = 675;

/** Floorboard seams converging on a vanishing point high above the room. */
function floorBoards(): string {
  const vp = { x: 800, y: -500 };
  const k = (2600 - vp.y) / (FLOOR_Y - vp.y);
  let d = '';
  for (let x = -1400; x <= 3000; x += 74) {
    d += `M${x} ${FLOOR_Y} L${vp.x + (x - vp.x) * k} 2600 `;
  }
  return d;
}
const FLOOR_BOARDS = floorBoards();

function Defs({ id, p, other }: { id: string; p: Palette; other: boolean }) {
  return (
    <defs>
      <pattern id={`${id}wp`} width="48" height="64" patternUnits="userSpaceOnUse">
        <rect width="48" height="64" fill={p.wall} />
        <rect x="0" width="7" height="64" fill={p.wallStripe} />
        <rect x="9" width="2" height="64" fill={p.wallStripe} />
        <path d="M30 14 l6 10 l-6 10 l-6 -10 Z M30 46 l3 5 l-3 5 l-3 -5 Z" fill={p.wallMotif} />
      </pattern>
      <pattern id={`${id}panel`} width="60" height="200" patternUnits="userSpaceOnUse">
        <rect width="60" height="200" fill={p.panel} />
        <rect x="0" width="3" height="200" fill={p.groove} />
        <rect x="22" width="1" height="200" fill={p.groove} opacity="0.5" />
        <rect x="41" width="1.5" height="200" fill={p.groove} opacity="0.4" />
      </pattern>
      <pattern id={`${id}plaid`} width="44" height="44" patternUnits="userSpaceOnUse">
        <rect width="44" height="44" fill={p.blanket} />
        <rect y="16" width="44" height="7" fill={p.blanketLine} opacity="0.75" />
        <rect x="16" width="7" height="44" fill={p.blanketLine} opacity="0.75" />
        <rect y="36" width="44" height="2" fill={p.sheet} opacity="0.25" />
        <rect x="36" width="2" height="44" fill={p.sheet} opacity="0.25" />
      </pattern>
      <pattern id={`${id}grille`} width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill={p.metalDark} />
        <rect width="4" height="1.4" fill={p.metal} opacity="0.35" />
      </pattern>
      <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.night} />
        <stop offset="1" stopColor={other ? '#1a0706' : '#1c2940'} />
      </linearGradient>
      <radialGradient id={`${id}street`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={p.street} stopOpacity="0.9" />
        <stop offset="1" stopColor={p.street} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}curtain`} x1="0" y1="0" x2="1" y2="0">
        {[0, 0.18, 0.36, 0.54, 0.72, 0.9].map((o, i) => (
          <stop key={o} offset={o} stopColor={i % 2 ? p.woodDark : p.blanket} stopOpacity={other ? 0.8 : 0.95} />
        ))}
      </linearGradient>
      <radialGradient id={`${id}floorShade`} cx="0.5" cy="0" r="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.55" />
      </radialGradient>
      <filter id={`${id}grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <radialGradient id={`${id}dim`} gradientUnits="userSpaceOnUse" cx="800" cy="240" r="1120">
        <stop offset="0" stopColor="#fff1d6" />
        <stop offset="0.3" stopColor="#dcc098" />
        <stop offset="0.62" stopColor="#6e5034" />
        <stop offset="1" stopColor="#140c06" />
      </radialGradient>
      <radialGradient id={`${id}pool`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffd796" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffd796" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}cone`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe0a6" stopOpacity="0.32" />
        <stop offset="1" stopColor="#ffe0a6" stopOpacity="0" />
      </linearGradient>
      <clipPath id={`${id}win`}>
        <rect x="470" y="110" width="300" height="290" />
      </clipPath>
      <filter id={`${id}blur12`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="12" />
      </filter>
      {/* Applied inside the tally's ×5.6 scale: ~8 scene units, marks smear together but stay visible. */}
      <filter id={`${id}smear`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
    </defs>
  );
}

function Architecture({ id, p, other }: { id: string; p: Palette; other: boolean }) {
  return (
    <g>
      <rect x="-1400" y="-1600" width="4400" height="1640" fill={p.ceiling} />
      <rect x="-1400" y="30" width="4400" height="645" fill={`url(#${id}wp)`} />
      {/* crown molding */}
      <rect x="-1400" y="30" width="4400" height="14" fill={p.trim} opacity={other ? 0.5 : 0.8} />
      <rect x="-1400" y="44" width="4400" height="6" fill={p.shadow} opacity="0.35" />
      {/* wainscot paneling + chair rail */}
      <rect x="-1400" y="480" width="4400" height="180" fill={`url(#${id}panel)`} />
      <rect x="-1400" y="470" width="4400" height="12" fill={p.rail} />
      <rect x="-1400" y="482" width="4400" height="4" fill={p.shadow} opacity="0.4" />
      <rect x="-1400" y="648" width="4400" height="27" fill={p.woodDark} />
      <rect x="-1400" y="648" width="4400" height="3" fill={p.trim} opacity="0.25" />
      {/* floor */}
      <rect x="-1400" y={FLOOR_Y} width="4400" height="1900" fill={p.floor} />
      <path d={FLOOR_BOARDS} stroke={p.floorLine} strokeWidth="2.5" />
      {[712, 768, 850, 960].map((y, i) => (
        <path
          key={y}
          d={Array.from({ length: 30 }, (_, k) => `M${-1300 + k * 148 + (i % 2) * 74 + i * 23} ${y} l74 0`).join(' ')}
          stroke={p.floorLine}
          strokeWidth="1.5"
          opacity="0.7"
        />
      ))}
      <rect x="-1400" y={FLOOR_Y} width="4400" height="1900" fill={`url(#${id}floorShade)`} />
    </g>
  );
}

function CeilingLight({ p, lit }: { p: Palette; lit: boolean }) {
  return (
    <g>
      <rect x="796" y="30" width="8" height="10" fill={p.metal} />
      <path d="M735 40 Q800 80 865 40 Z" fill={lit ? '#f6e3b8' : p.metalDark} stroke={p.metal} strokeWidth="2" />
      {!lit && <path d="M760 44 l18 14 l10 -8" stroke={p.metal} strokeWidth="1.5" fill="none" />}
    </g>
  );
}

/** Rain streaks behind the glass. Fixed pseudo-random spread so re-renders never reshuffle them. */
const RAIN = Array.from({ length: 34 }, (_, i) => ({
  x: 474 + ((i * 89) % 292),
  len: 16 + ((i * 7) % 14),
  dur: 0.55 + ((i * 13) % 9) / 20,
  delay: -((i * 17) % 23) / 10,
}));

function Rain() {
  return (
    <g className="rain" stroke="#b7c6d8" strokeWidth="1.1" strokeLinecap="round">
      {RAIN.map((r, i) => (
        <line
          key={i}
          x1={r.x}
          y1={80}
          x2={r.x - 3}
          y2={80 + r.len}
          style={{ animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s` }}
        />
      ))}
    </g>
  );
}

function Window({ id, p, other, rain }: { id: string; p: Palette; other: boolean; rain: boolean }) {
  const slats = Array.from({ length: 17 }, (_, i) => 118 + i * 16.5);
  return (
    <g>
      <rect x="470" y="110" width="300" height="290" fill={`url(#${id}sky)`} />
      {/* outside: streetlight and a tree */}
      <circle cx="712" cy="318" r="90" fill={`url(#${id}street)`} className={other ? 'os-sky' : undefined} />
      {rain && (
        <g clipPath={`url(#${id}win)`} opacity="0.5">
          <Rain />
        </g>
      )}
      <path
        d="M470 180 C520 200 540 170 580 190 C600 150 640 160 650 130 M560 400 C560 320 580 260 600 210 C610 180 640 170 690 150 M600 260 C640 250 660 230 700 240"
        stroke={other ? '#020303' : '#060b12'}
        strokeWidth="7"
        fill="none"
        className={rain ? 'tree' : undefined}
      />
      {/* half-open venetian blinds */}
      {slats.map((y) => (
        <rect key={y} x="474" y={y} width="292" height={y < 260 ? 13 : 5} fill={p.trim} opacity={other ? 0.35 : 0.85} />
      ))}
      <rect x="474" y="108" width="292" height="12" fill={p.trim} />
      <line x1="520" y1="120" x2="520" y2="400" stroke={p.trim} strokeWidth="1.5" opacity="0.6" />
      <line x1="720" y1="120" x2="720" y2="400" stroke={p.trim} strokeWidth="1.5" opacity="0.6" />
      {/* frame + sill */}
      <rect x="462" y="102" width="316" height="306" fill="none" stroke={p.trim} strokeWidth="12" />
      <line x1="620" y1="108" x2="620" y2="402" stroke={p.trim} strokeWidth="6" />
      <rect x="448" y="406" width="344" height="14" fill={p.trim} />
      <rect x="448" y="420" width="344" height="5" fill={p.shadow} opacity="0.4" />
      {/* model rocket on the sill */}
      <path d="M735 404 l0 -44 l6 -14 l6 14 l0 44 Z" fill={other ? p.metal : '#c9c1ad'} />
      <path d="M729 404 l6 -14 M753 404 l-6 -14" stroke={other ? p.metal : '#b0452f'} strokeWidth="5" />
      {/* curtains */}
      <rect x="430" y="88" width="380" height="6" rx="3" fill={p.brass} />
      <path d="M428 94 L500 94 C492 200 506 330 488 452 L428 452 Z" fill={`url(#${id}curtain)`} className="curtain left" />
      <path d="M740 94 L812 94 L812 452 L752 452 C734 330 748 200 740 94 Z" fill={`url(#${id}curtain)`} className="curtain right" />
    </g>
  );
}

function Poster({ p }: { p: Palette }) {
  return (
    <g transform="rotate(-1.6 256 378)">
      <rect x="138" y="276" width="236" height="204" fill="#141a33" />
      <rect x="138" y="386" width="236" height="94" fill="#6e2a3f" />
      <rect x="138" y="420" width="236" height="60" fill="#c1583a" opacity="0.8" />
      <circle cx="300" cy="332" r="30" fill="#e9b35b" />
      <ellipse cx="300" cy="334" rx="52" ry="9" fill="none" stroke="#f1d9a0" strokeWidth="3" transform="rotate(-14 300 334)" />
      <path d="M190 470 L214 360 L238 470 Z" fill="#0a0c16" />
      <path d="M205 470 L214 442 L223 470" fill="#e98a3b" />
      <text x="256" y="304" textAnchor="middle" className="poster-title">
        STARFALL
      </text>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle key={i} cx={160 + i * 31} cy={352 + ((i * 17) % 23)} r="1.4" fill="#f5eedc" />
      ))}
      <rect x="138" y="276" width="236" height="204" fill="none" stroke={p.shadow} strokeWidth="2" opacity="0.5" />
      <rect x="130" y="270" width="26" height="10" fill="#e8dfc4" opacity="0.7" transform="rotate(-18 143 275)" />
      <rect x="356" y="270" width="26" height="10" fill="#e8dfc4" opacity="0.7" transform="rotate(20 369 275)" />
    </g>
  );
}

function Bed({ id, p }: { id: string; p: Palette }) {
  return (
    <g>
      <ellipse cx="300" cy="722" rx="270" ry="18" fill={p.shadow} opacity="0.5" />
      <rect x="64" y="462" width="34" height="258" rx="6" fill={p.wood} />
      <rect x="60" y="456" width="42" height="14" rx="4" fill={p.woodTop} />
      <rect x="516" y="560" width="28" height="160" rx="4" fill={p.wood} />
      <rect x="512" y="554" width="36" height="12" rx="4" fill={p.woodTop} />
      <rect x="98" y="598" width="420" height="68" fill={p.woodDark} />
      <rect x="98" y="585" width="420" height="30" rx="8" fill={p.sheet} />
      <path d="M104 566 Q150 548 204 566 Q212 590 200 606 Q150 616 108 604 Q98 586 104 566 Z" fill={p.sheet} />
      <path
        d="M178 588 Q240 572 340 580 Q430 572 516 584 L516 690 Q420 702 330 694 Q250 702 184 690 Q170 640 178 588 Z"
        fill={`url(#${id}plaid)`}
      />
      <path d="M184 690 Q250 702 330 694 Q420 702 516 690" stroke={p.shadow} strokeWidth="3" fill="none" opacity="0.4" />
      <rect x="98" y="690" width="420" height="30" fill={p.shadow} opacity="0.85" />
      {/* sneakers under the bed */}
      <path d="M420 716 q4 -18 30 -16 l30 8 q8 4 6 10 Z" fill={p.paper} opacity="0.7" />
    </g>
  );
}

function Rug({ p, lifted }: { p: Palette; lifted: boolean }) {
  const [a, b, c] = p.rug;
  return (
    <g transform={lifted ? 'translate(1030 736) rotate(-4) skewX(-12) translate(-768 -740)' : undefined}>
      <ellipse cx="768" cy="740" rx="196" ry="62" fill={a} />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse
          key={i}
          cx="768"
          cy="740"
          rx={180 - i * 34}
          ry={56 - i * 10.5}
          fill="none"
          stroke={i % 2 ? c : b}
          strokeWidth="9"
          strokeDasharray="6 4"
        />
      ))}
    </g>
  );
}

function FloorHole({ p }: { p: Palette }) {
  return (
    <g>
      <path d="M718 702 L818 702 L824 748 L712 748 Z" fill="#050403" />
      <path d="M718 702 L818 702 L814 710 L722 710 Z" fill={p.woodDark} />
      <rect x="836" y="686" width="128" height="22" fill={p.woodTop} transform="rotate(-10 900 697)" />
      <rect x="836" y="704" width="128" height="4" fill={p.shadow} opacity="0.5" transform="rotate(-10 900 697)" />
    </g>
  );
}

function Desk({ p }: { p: Palette }) {
  return (
    <g>
      <ellipse cx="1104" cy="694" rx="260" ry="14" fill={p.shadow} opacity="0.45" />
      <rect x="912" y="513" width="384" height="118" fill={p.woodDark} opacity="0.9" />
      <rect x="880" y="505" width="32" height="188" fill={p.wood} />
      <rect x="1296" y="505" width="32" height="188" fill={p.wood} />
      <rect x="1170" y="513" width="126" height="92" fill={p.wood} />
      <rect x="1176" y="520" width="114" height="38" fill={p.woodTop} />
      <rect x="1176" y="562" width="114" height="38" fill={p.woodTop} />
      <rect x="1220" y="536" width="26" height="5" rx="2" fill={p.brass} />
      <rect x="1220" y="578" width="26" height="5" rx="2" fill={p.brass} />
      <path d="M884 456 L1326 456 L1344 477 L864 477 Z" fill={p.woodTop} />
      <rect x="864" y="477" width="480" height="30" fill={p.wood} />
      <rect x="864" y="505" width="480" height="4" fill={p.shadow} opacity="0.5" />
    </g>
  );
}

/** The landing light under the door (the red gap on the other side). Something walking past blocks it. */
function UnderDoor({ id, other, presence }: { id: string; other: boolean; presence: boolean }) {
  return (
    <g>
      {!other && (
        <>
          <ellipse cx="1496" cy="690" rx="120" ry="16" fill={`url(#${id}pool)`} opacity="0.5" className="door-spill" />
          <rect x="1430" y="672" width="132" height="4" fill="#ffc77a" opacity="0.8" className="door-gap-warm" />
        </>
      )}
      {presence && <rect x="1430" y="671" width="40" height="6" fill="#000" className="door-shadow" />}
    </g>
  );
}

function Radio({
  id,
  p,
  s,
  broken,
  overgrown,
  surge,
}: {
  id: string;
  p: Palette;
  s: GameState;
  broken: boolean;
  overgrown: boolean;
  surge: boolean;
}) {
  const on = s.radio.on && !broken && !overgrown;
  const [a, b, c] = s.radio.wheels;
  return (
    <g>
      {/* Still broadcasting: the dial throws a small amber glow on the wall. */}
      {on && (
        <ellipse cx="1088" cy="424" rx="140" ry="74" fill={`url(#${id}pool)`} className={`radio-halo ${surge ? 'surging' : ''}`} />
      )}
      {on && surge && <ellipse cx="1088" cy="430" rx="300" ry="170" fill={`url(#${id}pool)`} className="radio-flare" />}
      <line x1="1172" y1="388" x2="1236" y2="236" stroke={p.metal} strokeWidth="3" />
      <circle cx="1236" cy="236" r="3.5" fill={p.metal} />
      <rect x="990" y="384" width="196" height="88" rx="5" fill={p.metalDark} />
      <rect x="990" y="384" width="14" height="88" rx="3" fill={p.wood} />
      <rect x="1172" y="384" width="14" height="88" rx="3" fill={p.wood} />
      <rect x="1008" y="392" width="160" height="72" fill={p.metalDark} stroke={p.metal} strokeWidth="1" opacity="0.95" />
      {/* signal meter */}
      <rect x="1014" y="398" width="48" height="30" rx="2" fill={on ? '#e4b262' : p.metalDark} stroke={p.metal} strokeWidth="1" />
      <line x1="1038" y1="426" x2={on ? 1046 : 1022} y2="403" stroke="#1a1208" strokeWidth="1.5" />
      {/* frequency readout */}
      <rect x="1070" y="398" width="86" height="28" rx="2" fill="#0a0806" />
      {!broken && !overgrown && (
        <text x="1113" y="420" textAnchor="middle" className={`radio-digits ${on ? 'on' : ''}`}>
          {`${a}.${b}${c}`}
        </text>
      )}
      {broken && <path d="M1074 402 l30 22 l12 -14 l34 16" stroke={p.metal} strokeWidth="1.2" fill="none" />}
      <rect
        x="1070"
        y="432"
        width="86"
        height="28"
        fill={`url(#${id}grille)`}
        className={on ? `speaker-live ${surge ? 'surging' : ''}` : undefined}
      />
      <circle cx="1024" cy="446" r="8" fill={p.metal} />
      <circle cx="1050" cy="446" r="8" fill={p.metal} />
      <line x1="1024" y1="446" x2="1024" y2="439" stroke={p.metalDark} strokeWidth="2" />
      <line x1="1050" y1="446" x2="1055" y2="440" stroke={p.metalDark} strokeWidth="2" />
      <circle cx="1162" cy="404" r="2.4" fill={on ? '#ff5a3c' : '#3a1a14'} className={on ? 'rx-blink' : undefined} />
      <rect x="1000" y="470" width="176" height="6" fill={p.shadow} opacity="0.5" />
    </g>
  );
}

/** Handheld CB mic: hanging on its hook (this side) or dropped with the cord pulled taut (other side). */
function Mic({ p, fallen }: { p: Palette; fallen: boolean }) {
  if (fallen) {
    return (
      <g>
        <path d="M740 640 C640 612 520 580 384 556" stroke="#0a0a09" strokeWidth="3" fill="none" />
        <g transform="rotate(-80 760 640)">
          <rect x="746" y="612" width="28" height="56" rx="11" fill={p.metalDark} stroke={p.metal} strokeWidth="1.5" />
          <rect x="772" y="626" width="8" height="18" rx="2" fill={p.metal} />
          <rect x="768" y="622" width="16" height="26" fill="#9a9072" opacity="0.8" />
        </g>
      </g>
    );
  }
  return (
    <g>
      <rect x="966" y="350" width="10" height="16" fill={p.metal} />
      <rect x="924" y="354" width="30" height="64" rx="12" fill={p.metalDark} stroke={p.metal} strokeWidth="1.5" />
      {[364, 370, 376, 382].map((y) => (
        <line key={y} x1="930" y1={y} x2="948" y2={y} stroke={p.metal} strokeWidth="1" opacity="0.6" />
      ))}
      <rect x="952" y="384" width="6" height="18" rx="2" fill={p.metal} />
      <path
        d="M939 418 c-10 8 10 10 0 18 c-10 8 10 10 0 18 c-10 8 12 4 22 6 C975 462 985 458 992 452"
        stroke="#0d0c0b"
        strokeWidth="3"
        fill="none"
        className="mic-cord"
      />
    </g>
  );
}

function DeskThings({ p }: { p: Palette }) {
  return (
    <g>
      {/* missing-person flyers */}
      <path d="M892 462 L978 460 L986 476 L884 477 Z" fill="#cfc6ae" />
      <path d="M896 458 L980 456 L984 472 L890 474 Z" fill={p.paper} transform="rotate(-2 936 466)" />
      <rect x="902" y="460" width="16" height="9" fill="#3a3a36" transform="rotate(-2 936 466)" />
      <path d="M924 461 l46 -1 M924 465 l40 -1 M902 471 l60 -1" stroke="#5a554a" strokeWidth="1.2" transform="rotate(-2 936 466)" />
      {/* digital watch */}
      <path d="M1212 470 q8 -10 24 -9 q18 0 26 8 q-10 6 -26 6 q-16 0 -24 -5 Z" fill="#2b2a28" />
      <rect x="1226" y="461" width="22" height="11" rx="2" fill="#1a1a18" stroke="#6f6a60" strokeWidth="1" />
      <rect x="1229" y="463" width="16" height="7" fill="#7e8a6c" />
    </g>
  );
}

function LampLight({ id }: { id: string }) {
  return (
    <g className="lamp-pool" style={{ mixBlendMode: 'screen' }}>
      <path d="M1258 364 L1334 364 L1430 476 L1160 476 Z" fill={`url(#${id}cone)`} />
      <ellipse cx="1296" cy="470" rx="150" ry="22" fill={`url(#${id}pool)`} />
    </g>
  );
}

function Lamp({ p, lit }: { p: Palette; lit: boolean }) {
  return (
    <g>
      <ellipse cx="1296" cy="472" rx="28" ry="6" fill={p.brass} />
      <rect x="1293" y="360" width="6" height="112" fill={p.brass} />
      <path d="M1254 364 L1338 364 L1326 336 L1266 336 Z" fill={p.shade} />
      <path d="M1268 340 L1324 340 L1328 348 L1264 348 Z" fill="#ffffff" opacity="0.12" />
      {lit && <rect x="1258" y="362" width="76" height="4" fill="#ffe2a8" className="lamp-bulb" />}
    </g>
  );
}

function Switch({ p, down }: { p: Palette; down: boolean }) {
  return (
    <g>
      <rect x="1350" y="312" width="36" height="54" rx="3" fill={p.paper} stroke={p.shadow} strokeWidth="1" />
      <circle cx="1368" cy="318" r="1.5" fill={p.metal} />
      <circle cx="1368" cy="360" r="1.5" fill={p.metal} />
      <rect x="1362" y="328" width="12" height="22" rx="2" fill={p.metalDark} opacity="0.3" />
      <rect x="1364" y={down ? 339 : 327} width="8" height="12" rx="2" fill={p.paper} stroke={p.shadow} strokeWidth="0.8" />
    </g>
  );
}

function Door({ p, clawed, other }: { p: Palette; clawed: boolean; other: boolean }) {
  return (
    <g>
      <rect x="1414" y="152" width="164" height="524" fill={p.trim} />
      <rect x="1428" y="164" width="136" height="512" fill={p.door} />
      {[
        [1440, 180, 50, 200],
        [1502, 180, 50, 200],
        [1440, 404, 50, 250],
        [1502, 404, 50, 250],
      ].map(([x, y, w, h]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={w} height={h} fill={p.doorPanel} />
          <rect x={x} y={y} width={w} height="3" fill={p.shadow} opacity="0.35" />
          <rect x={x} y={y} width="3" height={h} fill={p.shadow} opacity="0.25" />
        </g>
      ))}
      <circle cx="1446" cy="420" r="8" fill={p.brass} />
      <circle cx="1444" cy="418" r="3" fill="#fff" opacity="0.25" />
      {other && <rect x="1430" y="672" width="132" height="4" fill="#7a1810" className="door-gap" />}
      {clawed && (
        <path
          d="M1456 250 l40 120 M1470 244 l42 124 M1484 240 l40 126 M1498 238 l36 118 M1450 470 l52 110 M1466 466 l50 112 M1482 462 l46 110"
          stroke="#c9a676"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.75"
        />
      )}
    </g>
  );
}

// --- other-side decay ----------------------------------------------------------

function Vines({ p }: { p: Palette }) {
  const vine = '#1f3326';
  const vine2 = '#2c4632';
  return (
    <g className="vines" fill="none" strokeLinecap="round">
      <path d="M-200 60 C0 90 60 40 180 70 C260 90 330 60 420 96 C470 118 470 200 452 300" pathLength={1} stroke={vine} strokeWidth="14" />
      <path d="M180 70 C200 140 150 180 170 240" pathLength={1} stroke={vine2} strokeWidth="6" />
      <path d="M420 96 C520 60 640 80 700 50 C780 20 900 70 1000 44 C1100 20 1180 60 1300 40" pathLength={1} stroke={vine} strokeWidth="11" />
      <path d="M700 50 C690 110 720 150 700 220" pathLength={1} stroke={vine2} strokeWidth="5" />
      <path d="M1000 44 C1010 140 980 220 1010 300 C1030 350 1000 380 1004 392" pathLength={1} stroke={vine} strokeWidth="9" />
      <path d="M1010 300 C1060 330 1120 320 1150 384" pathLength={1} stroke={vine2} strokeWidth="6" />
      <path d="M1300 40 C1380 70 1400 140 1410 240 C1420 360 1400 520 1420 676" pathLength={1} stroke={vine} strokeWidth="12" />
      <path d="M-100 660 C20 620 60 540 64 470 M40 660 C120 640 160 700 240 690" pathLength={1} stroke={vine} strokeWidth="10" />
      <path d="M980 470 C960 520 990 560 960 640 C950 668 930 680 900 690" pathLength={1} stroke={vine2} strokeWidth="7" />
      <path d="M1580 120 C1640 300 1600 500 1680 700" pathLength={1} stroke={vine} strokeWidth="16" />
      {[
        [180, 70],
        [452, 300],
        [700, 50],
        [1010, 300],
        [1410, 240],
        [64, 470],
        [960, 640],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill={p.brass} opacity="0.25" />
      ))}
    </g>
  );
}

function Decay({ id, p }: { id: string; p: Palette }) {
  return (
    <g>
      {[
        [300, 180, 120, 70],
        [900, 250, 160, 90],
        [1220, 150, 90, 120],
        [560, 560, 140, 50],
      ].map(([cx, cy, rx, ry]) => (
        <ellipse key={`${cx}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="#050807" opacity="0.55" filter={`url(#${id}blur12)`} />
      ))}
      {/* peeling wallpaper */}
      <path d="M830 120 l40 6 l-8 30 l22 14 l-40 20 Z" fill={p.panel} opacity="0.8" />
      <path d="M1180 250 l30 -4 l10 40 l-26 8 Z" fill={p.panel} opacity="0.8" />
      {/* torn poster corner left where the poster used to be */}
      <path d="M130 270 l30 0 l-12 22 Z" fill="#3a3f4a" opacity="0.7" />
      <path d="M136 272 l14 0 l-6 6 Z" fill={p.paper} opacity="0.5" />
    </g>
  );
}

function Claws({ fresh, color }: { fresh: boolean; color: string }) {
  const groups: [number, number, number][] = [
    [968, 360, 20],
    [1150, 350, -18],
    [1188, 440, 8],
    [960, 470, -30],
  ];
  return (
    <g strokeLinecap="round">
      {groups.map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`} fill={color}>
          {[0, 9, 18, 27].map((dx, k) => (
            <path key={dx} d={`M${x + dx} ${y + (k % 2) * 4} l2.6 1 l6 ${40 - k * 3} l-1.2 0 Z`} />
          ))}
        </g>
      ))}
      {fresh && (
        <g stroke="#6b1a14" strokeWidth="2.5" opacity="0.85">
          {[0, 10, 20].map((dx) => (
            <line key={dx} x1={1110 + dx} y1={372} x2={1136 + dx} y2={420} />
          ))}
          {[0, 10, 20].map((dx) => (
            <line key={`b${dx}`} x1={1002 + dx} y1={452} x2={1030 + dx} y2={488} />
          ))}
        </g>
      )}
    </g>
  );
}

/** Where the poster hangs on this side, the other side has the count carved into the wall. */
function WallMarks({
  id,
  s,
  count,
  message,
  blur,
  fresh,
}: {
  id: string;
  s: GameState;
  count: number;
  message: boolean;
  blur: boolean;
  /** Carve the newest mark in front of the player (it appears each time this side is entered). */
  fresh: boolean;
}) {
  const groups = Math.max(1, Math.ceil(count / 5));
  const scale = Math.min(320 / (groups * 30), 5.6);
  const w = groups * 30 * scale;
  return (
    <g>
      {/* Doc §J.1: in the flicker glimpse the marks are visible but cannot be counted. */}
      <g transform={`translate(${256 - w / 2} ${300}) scale(${scale})`} filter={blur ? `url(#${id}smear)` : undefined}>
        <g className="carved-groove" transform="translate(0.35 0.35)">
          <TallyStrokes count={count} freshLast={fresh} />
        </g>
        <g className="carved">
          <TallyStrokes count={count} freshLast={fresh} />
        </g>
      </g>
      {s.choice === 'A' && !s.rescued && (
        <g>
          <path d="M214 486 l10 -40 l-6 -30 l14 -24 l6 34 l-4 36 l8 26 Z" fill="#000" />
          <path
            d="M220 470 q-4 -18 2 -34 l4 -2 l2 18 l4 -26 l6 0 l0 24 l4 -26 l6 0 l-2 28 l6 -20 l6 2 l-6 28 q-2 12 -14 14 Z"
            fill="#caa88a"
            className="theo-hand"
          />
        </g>
      )}
      {message && (
        <text x="256" y="524" textAnchor="middle" className="carved-text">
          EM ỔN. ĐÊM MAI. CÙNG GIỜ.
        </text>
      )}
    </g>
  );
}

function Creature({ c }: { c: NonNullable<VisualState['creature']> }) {
  return (
    <g
      className={`creature ${c.leaving ? 'leaving' : ''}`}
      style={{ transform: `translate(${c.x * 16}px, ${c.y * 9}px)` }}
    >
      <g filter="blur(1.5px)">
        <ellipse cx="0" cy="-60" rx="20" ry="30" fill="#020303" />
        <path
          d="M-8 -34 C-40 -20 -46 20 -40 70 C-38 110 -58 160 -70 210 L-60 212 C-44 170 -30 130 -22 100 L-18 214 L-8 214 L0 110 L8 214 L18 214 L22 100 C30 130 44 170 60 212 L70 210 C58 160 38 110 40 70 C46 20 40 -20 8 -34 Z"
          fill="#020303"
        />
        <path d="M-40 60 C-60 110 -64 150 -80 190 M40 60 C60 110 66 150 84 186" stroke="#020303" strokeWidth="7" strokeLinecap="round" />
      </g>
    </g>
  );
}

// --- room ----------------------------------------------------------------------

export interface RoomProps {
  s: GameState;
  v: VisualState;
  /** Which side to draw; defaults to v.world. The flicker glimpse draws the other side while v.world is normal. */
  world?: World;
  /** Crop for Case File photos; defaults to the full scene. */
  viewBox?: string;
  className?: string;
  /** Film-grain texture; off for small thumbnails. */
  grain?: boolean;
  /** Drawn for the split-second flicker glimpse. */
  glimpse?: boolean;
  /** The room the player is standing in (not a photo or a glimpse): rain, the landing light, fresh marks. */
  live?: boolean;
  /** The radio is surging. */
  surge?: boolean;
  /** Something is moving in the house. */
  presence?: boolean;
  children?: ReactNode;
}

export function Room({
  s,
  v,
  world = v.world,
  viewBox = '0 0 1600 900',
  className = '',
  grain = true,
  glimpse = false,
  live = false,
  surge = false,
  presence = false,
  children,
}: RoomProps) {
  const id = useId().replace(/[^\w-]/g, '');
  const other = world === 'other';
  const p = other ? OTHER : NORMAL;
  const lit = !other;

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      className={`room room-${world} ${className}`}
      aria-hidden
    >
      <Defs id={id} p={p} other={other} />
      <Architecture id={id} p={p} other={other} />
      <CeilingLight p={p} lit={lit} />
      <Window id={id} p={p} other={other} rain={live && !other} />
      <svg x="192" y="72" width="144" height="144">
        {other ? <OtherClock /> : <NormalClock stopped={v.wallClock === 'stopped'} seconds={live} />}
      </svg>
      {other ? <Decay id={id} p={p} /> : <Poster p={p} />}
      {other && (
        <WallMarks id={id} s={s} count={tally(s)} message={s.theoLightSeen} blur={glimpse} fresh={live && s.lightOffCount > 0} />
      )}
      <Bed id={id} p={p} />
      <Rug p={p} lifted={!other && s.diaryFound} />
      {/* The pried board must stay visible on the other side: it is what sends the player back for the diary. */}
      {(other || s.diaryFound) && <FloorHole p={p} />}
      <Desk p={p} />
      <Radio id={id} p={p} s={s} broken={!other && s.radio.broken} overgrown={other} surge={surge} />
      <Lamp p={p} lit={lit} />
      {!other && <DeskThings p={p} />}
      {!other && <Mic p={p} fallen={false} />}
      <Switch p={p} down={other} />
      <Door p={p} clawed={!other && v.scarred} other={other} />
      {!other && s.contactMade && (
        <path d="M884 484 l36 10 M896 482 l34 12 M910 481 l30 12" stroke="#2a180c" strokeWidth="1.6" opacity="0.8" />
      )}
      {!other && v.scarred && <Claws fresh={false} color="#c9a676" />}
      {other && <Vines p={p} />}
      {other && <Claws fresh={s.contactMade} color="#050605" />}
      {other && <Mic p={p} fallen />}
      {other && v.creature && <Creature c={v.creature} />}
      {/* lighting */}
      {lit && (
        <rect x="-1400" y="-1600" width="4400" height="4200" fill={`url(#${id}dim)`} style={{ mixBlendMode: 'multiply' }} />
      )}
      {lit && <LampLight id={id} />}
      {live && <UnderDoor id={id} other={other} presence={presence} />}
      {grain && (
        <rect x="-1400" y="-1600" width="4400" height="4200" filter={`url(#${id}grain)`} opacity={other ? 0.5 : 0.35} />
      )}
      {children}
    </svg>
  );
}
