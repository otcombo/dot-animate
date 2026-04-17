// =====================================================================
//  config.js — Parameter definitions, CFG store, localStorage, palette
//  Depends on: core.js (RGB_F/M/B arrays, hexToRGB)
// =====================================================================

// ── Param descriptors — each state's tunable constants ──────────────
const PARAM_DEFS = {
  global: [
    { key: 'scale',    label: 'Scale',        min: .3, max: 1.5,  step: .05,  default: 1 },
    { key: 'dotSize',  label: 'Dot size',     min: .3, max: 2,    step: .05,  default: 1 },
    { key: 'opacity',  label: 'Opacity',      min: .3, max: 1.2,  step: .05,  default: 1 },
    { key: 'bandGlow', label: 'Band glow',    min: 0,  max: 2,    step: .05,  default: 1 },
  ],
  idle: [
    { key: 'r1',       label: 'Inner radius',  min: 1.5, max: 5,   step: .1,   default: 4.3 },
    { key: 'r2',       label: 'Outer radius',  min: 6,   max: 10,  step: .2,   default: 8 },
    { key: 'depthAmt', label: 'Depth variance',min: 0,   max: .5,  step: .05,  default: 0 },
  ],
  thinking: [
    { key: 'spin',     label: 'Spin speed',   min: .2, max: 4,    step: .1,   default: 1.4 },
    { key: 'tilt',     label: 'Tilt',         min: 0,  max: 1,    step: .05,  default: .2 },
    { key: 'bandSpd',  label: 'Band speed',   min: .5, max: 5,    step: .1,   default: 2.2 },
    { key: 'bandW',    label: 'Band width',   min: .1, max: 1.2,  step: .05,  default: .5 },
    { key: 'bandAmp',  label: 'Band sweep',   min: .2, max: 1,    step: .05,  default: .85 },
  ],
  pulse: [
    { key: 'rot',      label: 'Rotation',     min: 0,  max: 1.2,  step: .05,  default: .35 },
    { key: 'bAmp',     label: 'Breath amp',   min: 0,  max: .4,   step: .02,  default: .14 },
    { key: 'bFreq',    label: 'Breath freq',  min: .5, max: 4,    step: .1,   default: 1.8 },
    { key: 'tilt',     label: 'Tilt',         min: 0,  max: .8,   step: .05,  default: .3 },
    { key: 'waveD',    label: 'Wave depth',   min: .5, max: 5,    step: .1,   default: 2 },
  ],
  swirl: [
    { key: 'spd',      label: 'Base speed',   min: .4, max: 3.5,  step: .1,   default: 1.6 },
    { key: 'twist',    label: 'Twist amount', min: 0,  max: 1.5,  step: .1,   default: .8 },
    { key: 'tilt',     label: 'Tilt',         min: 0,  max: 1,    step: .05,  default: .38 },
    { key: 'bSpd',     label: 'Spiral speed', min: .5, max: 5,    step: .1,   default: 2.8 },
    { key: 'bThresh',  label: 'Band thresh',  min: .3, max: .9,   step: .05,  default: .7 },
  ],
  ripple: [
    { key: 'rot',      label: 'Rotation',     min: 0,   max: .5,  step: .02,  default: .18 },
    { key: 'tilt',     label: 'Tilt',         min: 0,   max: 1,   step: .05,  default: .22 },
    { key: 'wFreq',    label: 'Wave count',   min: 1,   max: 7,   step: .1,   default: 3.5 },
    { key: 'wSpd',     label: 'Wave speed',   min: .5,  max: 5,   step: .1,   default: 2.8 },
    { key: 'wAmp',     label: 'Wave amp',     min: .02, max: .4,  step: .02,  default: .16 },
    { key: 'crest',    label: 'Crest thresh', min: .5,  max: .95, step: .01,  default: .78 },
  ],
  orbit: [
    { key: 'r1',       label: 'Ring 1 speed', min: -3,  max: 3,   step: .1,   default: 1.3 },
    { key: 'r2',       label: 'Ring 2 speed', min: -3,  max: 3,   step: .1,   default: -.85 },
    { key: 'r3',       label: 'Ring 3 speed', min: -3,  max: 3,   step: .1,   default: .6 },
    { key: 'tiltSpread',label:'Tilt spread',  min: 0,   max: 2,   step: .05,  default: 1 },
    { key: 'comet',    label: 'Comet speed',  min: 1,   max: 3,   step: .1,   default: 1.6 },
    { key: 'cometW',   label: 'Comet width',  min: .2,  max: 2,   step: .1,   default: .8 },
  ],
  helix: [
    { key: 'turns',    label: 'Turns',        min: .5,  max: 2.5, step: .1,   default: 1.2 },
    { key: 'spin',     label: 'Spin speed',   min: .2,  max: 2.5, step: .1,   default: .9 },
    { key: 'pSpd',     label: 'Pulse speed',  min: .1,  max: 1.5, step: .1,   default: .5 },
    { key: 'pW',       label: 'Pulse width',  min: .04, max: .25, step: .01,  default: .12 },
    { key: 'radX',     label: 'Width',        min: 3,   max: 9,   step: .5,   default: 6.5 },
    { key: 'radY',     label: 'Height',       min: 4,   max: 10,  step: .5,   default: 8.5 },
  ],
  nova: [
    { key: 'rot',      label: 'Rotation',     min: 0,   max: 1.2, step: .05,  default: .4 },
    { key: 'tilt',     label: 'Tilt',         min: 0,   max: 1,   step: .05,  default: .2 },
    { key: 'pFreq',    label: 'Pulse freq',   min: .5,  max: 3.5, step: .1,   default: 1.6 },
    { key: 'pRange',   label: 'Pulse range',  min: .1,  max: .5,  step: .02,  default: .35 },
    { key: 'bSpd',     label: 'Band speed',   min: .3,  max: 3.5, step: .1,   default: 1.3 },
    { key: 'bW',       label: 'Band width',   min: .1,  max: .6,  step: .02,  default: .28 },
  ],
  knot: [
    { key: 'loop',     label: 'Loop speed',   min: 0,   max: 1,   step: .05,  default: .2 },
    { key: 'rot',      label: 'Rotation',     min: 0,   max: 1.5, step: .05,  default: .35 },
    { key: 'tilt',     label: 'Tilt',         min: 0,   max: 1,   step: .05,  default: .35 },
    { key: 'pSpd',     label: 'Pulse speed',  min: .05, max: 1,   step: .05,  default: .3 },
    { key: 'pW',       label: 'Pulse width',  min: .03, max: .2,  step: .01,  default: .09 },
    { key: 'scale',    label: 'Scale',        min: 5,   max: 11,  step: .5,   default: 9.5 },
  ],
  torus: [
    { key: 'R',        label: 'Major radius', min: .3,  max: 1,   step: .05,  default: .65 },
    { key: 'r',        label: 'Tube radius',  min: .1,  max: .6,  step: .02,  default: .45 },
    { key: 'spin',     label: 'Spin speed',   min: .1,  max: 1.5, step: .05,  default: .55 },
    { key: 'tilt',     label: 'Tilt',         min: .1,  max: 1.2, step: .05,  default: .55 },
    { key: 'bSpd',     label: 'Band speed',   min: .5,  max: 5,   step: .1,   default: 2.2 },
    { key: 'bAmp',     label: 'Band sweep',   min: .2,  max: 1.5, step: .05,  default: .85 },
    { key: 'bW',       label: 'Band width',   min: .1,  max: 1.2, step: .05,  default: .5 },
  ],
  pendulum: [
    { key: 'base',     label: 'Base freq',    min: .1,   max: .8,  step: .02,  default: .32 },
    { key: 'step',     label: 'Freq spread',  min: .005, max: .05, step: .002, default: .018 },
    { key: 'amp',      label: 'Swing amp',    min: .2,   max: 1,   step: .05,  default: .78 },
    { key: 'spanY',    label: 'Vertical span',min: 3,    max: 10,  step: .2,   default: 7.5 },
    { key: 'zAmt',     label: 'Depth osc',    min: 0,    max: 1,   step: .05,  default: .45 },
    { key: 'bSpd',     label: 'Band speed',   min: .2,   max: 2,   step: .1,   default: .7 },
    { key: 'bW',       label: 'Band width',   min: .1,   max: .5,  step: .02,  default: .25 },
  ],
  wobble: [
    { key: 'spin',     label: 'Spin speed',   min: .3,   max: 3,   step: .1,   default: 1.2 },
    { key: 'pAmp',     label: 'Precession',   min: .1,   max: 1.2, step: .05,  default: .6 },
    { key: 'pFreq',    label: 'Prec. freq',   min: .05,  max: .8,  step: .05,  default: .3 },
    { key: 'asym',     label: 'Axis asym.',   min: .3,   max: 1.5, step: .05,  default: .77 },
    { key: 'bSpd',     label: 'Band speed',   min: .5,   max: 4,   step: .1,   default: 1.8 },
    { key: 'bRange',   label: 'Band range',   min: .1,   max: .8,  step: .05,  default: .55 },
    { key: 'bW',       label: 'Band width',   min: .1,   max: .6,  step: .05,  default: .3 },
  ],
  rain: [
    { key: 'spd',      label: 'Fall speed',   min: .1,   max: 1,   step: .05,  default: .4 },
    { key: 'var',      label: 'Speed var',    min: 0,    max: .3,  step: .02,  default: .12 },
    { key: 'drift',    label: 'Drift',        min: 0,    max: .2,  step: .02,  default: .08 },
    { key: 'spanY',    label: 'Vertical span',min: 3,    max: 10,  step: .2,   default: 7.5 },
    { key: 'bSpd',     label: 'Band speed',   min: .1,   max: 1.5, step: .05,  default: .55 },
    { key: 'bW',       label: 'Band width',   min: .05,  max: .5,  step: .02,  default: .25 },
  ],
  infinite: [
    { key: 'loop',     label: 'Loop speed',   min: .1,   max: 1.2, step: .05,  default: .45 },
    { key: 'yScale',   label: 'Y scale',      min: .2,   max: .9,  step: .05,  default: .55 },
    { key: 'zDepth',   label: 'Z depth',      min: .1,   max: .6,  step: .05,  default: .35 },
    { key: 'rot',      label: 'Rotation',     min: 0,    max: .8,  step: .05,  default: .25 },
    { key: 'tilt',     label: 'Tilt',         min: 0,    max: .8,  step: .05,  default: .2 },
    { key: 'scale',    label: 'Scale',        min: 5,    max: 11,  step: .5,   default: 9 },
    { key: 'pSpd',     label: 'Pulse speed',  min: .1,   max: 1,   step: .05,  default: .35 },
    { key: 'pW',       label: 'Pulse width',  min: .03,  max: .2,  step: .01,  default: .1 },
  ],
  // offmenu.design nav-toggle — 3×3 menu dot matrix (9 dots visible)
  grid: [
    { key: 'sp',       label: 'Spacing',      min: 3,    max: 8,   step: .2,   default: 5.5 },
    { key: 'bSpd',     label: 'Wave speed',   min: .2,   max: 3,   step: .1,   default: 1.2 },
    { key: 'bW',       label: 'Wave width',   min: .2,   max: 2,   step: .1,   default: .9 },
  ],
  // offmenu.design chat-icon — 4-dot diamond + 12-dot outer ring (16 dots visible)
  chat: [
    { key: 'r1',       label: 'Inner radius', min: 1.5,  max: 5,   step: .2,   default: 3 },
    { key: 'r2',       label: 'Outer radius', min: 6,    max: 10,  step: .2,   default: 9 },
    { key: 's1',       label: 'Inner speed',  min: -2,   max: 2,   step: .05,  default: .25 },
    { key: 's2',       label: 'Outer speed',  min: -2,   max: 2,   step: .05,  default: -.15 },
    { key: 'bSpd',     label: 'Pulse speed',  min: .1,   max: 2,   step: .05,  default: .7 },
  ],
  // offmenu nav-toggle — auto-cycling dots ⟷ X morph (hamburger menu ⟷ close)
  menu: [
    { key: 'sp',       label: 'Spacing',      min: 3,    max: 8,   step: .2,   default: 4.5 },
    { key: 'period',   label: 'Cycle time',   min: 2,    max: 8,   step: .5,   default: 4 },
    { key: 'idleHold', label: 'Idle hold %',  min: .2,   max: .6,  step: .05,  default: .4 },
    { key: 'xHold',    label: 'X hold %',     min: .2,   max: .6,  step: .05,  default: .4 },
  ],
  // offmenu chat-icon — auto-cycling idle (static) ⟷ thinking (rotating+pulsing)
  avatar: [
    { key: 'r1',       label: 'Inner radius', min: 1.5,  max: 5,   step: .2,   default: 3 },
    { key: 'r2',       label: 'Outer radius', min: 6,    max: 10,  step: .2,   default: 9 },
    { key: 'period',   label: 'Cycle time',   min: 3,    max: 10,  step: .5,   default: 5.5 },
    { key: 'thinkSpd', label: 'Think speed',  min: .3,   max: 3,   step: .1,   default: 1.2 },
    { key: 'pulseSpd', label: 'Pulse speed',  min: .3,   max: 3,   step: .1,   default: 1.5 },
    { key: 'breathAmt',label: 'Breath amp',   min: 0,    max: .4,  step: .02,  default: .18 },
  ],
};

// ── Color presets (front, mid, back) ────────────────────────────────
const COLOR_PRESETS = {
  white:  ['#FFFFFF', '#888888', '#333333'],
  blue:   ['#FFFFFF', '#3C78A8', '#1A2840'],
  red:    ['#FF8A8A', '#CC5555', '#5A2020'],
  green:  ['#7AD49F', '#3CA86A', '#1A4028'],
  purple: ['#BC90DC', '#7A50B0', '#3A2060'],
  amber:  ['#FFD580', '#C89A3C', '#5C3E1A'],
  mono:   ['#E0E0E0', '#707070', '#2A2A2A'],
};

// ── Build flat CFG store from defaults ──────────────────────────────
const CFG = {};
for (const [state, params] of Object.entries(PARAM_DEFS)) {
  for (const p of params) CFG[state + '.' + p.key] = p.default;
}

// Color palette stored as hex strings (separate from numeric params)
CFG['color.front'] = '#FFFFFF';
CFG['color.mid']   = '#888888';
CFG['color.back']  = '#333333';

// Restore user's previous tweaks from localStorage
try {
  const saved = JSON.parse(localStorage.getItem('dotanim_cfg'));
  if (saved) Object.assign(CFG, saved);
} catch (e) { /* ignore */ }

// Lookup helper ─────────────────────────────────────────────────────
const $ = (state, key) => CFG[state + '.' + key];

// Debounced auto-persist ────────────────────────────────────────────
let _saveT;
function persistCFG() {
  clearTimeout(_saveT);
  _saveT = setTimeout(() => {
    localStorage.setItem('dotanim_cfg', JSON.stringify(CFG));
  }, 300);
}

// ── Mutate the RGB_F/M/B arrays in core.js from CFG color hexes ────
function applyPalette() {
  const f = hexToRGB(CFG['color.front']);
  const m = hexToRGB(CFG['color.mid']);
  const b = hexToRGB(CFG['color.back']);
  RGB_F[0] = f[0]; RGB_F[1] = f[1]; RGB_F[2] = f[2];
  RGB_M[0] = m[0]; RGB_M[1] = m[1]; RGB_M[2] = m[2];
  RGB_B[0] = b[0]; RGB_B[1] = b[1]; RGB_B[2] = b[2];
}
applyPalette();
