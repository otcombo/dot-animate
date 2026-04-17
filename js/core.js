// =====================================================================
//  core.js — Math foundation
//  Fibonacci sphere, hex grid layout, rotation/interpolation helpers,
//  and the mutable color palette arrays. No dependencies.
// =====================================================================

// ── Constants ────────────────────────────────────────────────────────
const PI = Math.PI;
const PHI = PI * (3 - Math.sqrt(5));   // golden angle
const N = 40;                           // particle count
const CX = 11, CY = 11;                 // SVG viewBox center

// ── Mutable palette (updated by applyPalette in config.js) ───────────
const RGB_F = [255, 255, 255];          // front / brightest
const RGB_M = [136, 136, 136];          // mid
const RGB_B = [51, 51, 51];             // back / dimmest

// ── Fibonacci sphere: 40 evenly distributed points on a unit sphere ──
const PTS = Array.from({ length: N }, (_, i) => {
  const y = 1 - (2 * i) / (N - 1);
  const r = Math.sqrt(1 - y * y);
  const t = PHI * i;
  return { x: Math.cos(t) * r, y, z: Math.sin(t) * r };
});

// ── Idle hex grid: 14 dots in a diamond (2-3-4-3-2) ──────────────────
const SP = 2.8, HH = SP * 0.75;         // horizontal spacing, row height
const ROWDEF = [
  [-0.5, 0.5],
  [-1, 0, 1],
  [-1.5, -0.5, 0.5, 1.5],
  [-1, 0, 1],
  [-0.5, 0.5],
];
const GRID = [];
ROWDEF.forEach((ox, ri) => {
  const y = CY + (ri - 2) * HH;
  ox.forEach(o => GRID.push({ x: CX + o * SP, y }));
});
GRID.sort((a, b) => a.y - b.y || a.x - b.x);

// ── Rotation (Y-axis spin, then X-axis tilt) ─────────────────────────
function rot(pt, cY, sY, cX, sX) {
  const rx = pt.x * cY + pt.z * sY;
  const rz = -pt.x * sY + pt.z * cY;
  return { x: rx, y: pt.y * cX - rz * sX, z: pt.y * sX + rz * cX };
}

// ── Map the 14 most front-facing fibonacci points → grid slots ───────
const cX0 = Math.cos(0.2), sX0 = Math.sin(0.2);
const top14 = [...PTS.map((pt, idx) => {
  const c = rot(pt, 1, 0, cX0, sX0);
  return { depth: (c.z + 1) / 2, idx };
})].sort((a, b) => b.depth - a.depth).slice(0, 14);
top14.sort((a, b) => {
  const ca = rot(PTS[a.idx], 1, 0, cX0, sX0);
  const cb = rot(PTS[b.idx], 1, 0, cX0, sX0);
  return ca.y - cb.y || ca.x - cb.x;
});
const slot = new Int8Array(N).fill(-1);
top14.forEach((p, i) => { slot[p.idx] = i; });

// ── Math helpers ─────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
const easeO3 = t => 1 - (1 - t) ** 3;
const easeIO3 = t => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// ── Color helpers ────────────────────────────────────────────────────
const rgbStr = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const lerpC = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
function hexToRGB(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

// Depth → color (3-tier) ────────────────────────────────────────────
const dRGB = d => d > 0.65 ? RGB_F : d > 0.4 ? RGB_M : RGB_B;

// Band-highlight color helpers. `hi` ∈ [0,1] is band intensity.
// CFG is defined in config.js (loaded after) but these closures only
// evaluate it at call-time during animation, so load order is fine.
const bRGB = (d, hi) => {
  const h = Math.min(1, hi * (CFG['global.bandGlow'] || 1));
  return h > 0.3 ? lerpC(dRGB(d), RGB_F, h) : dRGB(d);
};
const cRGB = (d, hi) => {                           // for curve states
  const h = Math.min(1, hi * (CFG['global.bandGlow'] || 1));
  const b = d > 0.5 ? RGB_M : RGB_B;
  return h > 0.15 ? lerpC(b, RGB_F, h) : b;
};
