// =====================================================================
//  states.js — 14 animation state functions
//  Each state is a pure function: (time) → particle[40]
//  particle = { sx, sy, depth, r, opacity, rgb, idx }
//
//  Depends on: core.js (PTS, GRID, slot, rot, lerp, clamp, dRGB, bRGB, cRGB),
//              config.js ($ helper / CFG)
// =====================================================================

// 0 ── IDLE: static hex grid ──────────────────────────────────────────
function stateIdle() {
  const dr = $('idle','dotR'), dop = $('idle','dotOp'), sp = $('idle','gridSp');
  const sf = sp / 2.8;                                   // rescale factor
  return PTS.map((_, idx) => {
    const s = slot[idx];
    if (s >= 0) {
      const g = GRID[s];
      return { sx: CX + (g.x - CX) * sf, sy: CY + (g.y - CY) * sf,
               depth: .8, r: dr, opacity: dop, rgb: RGB_F, idx };
    }
    return { sx: CX, sy: CY, depth: 0, r: .2, opacity: 0, rgb: RGB_F, idx };
  });
}

// 1 ── THINKING: Y-spin + horizontal band sweep ─────────────────────
function stateThinking(time) {
  const sp=$('thinking','spin'), ti=$('thinking','tilt');
  const bs=$('thinking','bandSpd'), bw=$('thinking','bandW'), ba=$('thinking','bandAmp');
  const a = time * sp, cY = Math.cos(a), sY = Math.sin(a);
  const cX = Math.cos(ti), sX = Math.sin(ti);
  return PTS.map((pt, idx) => {
    const c = rot(pt, cY, sY, cX, sX), d = (c.z + 1) / 2;
    let r = .95 * (.4 + .6 * d), op = (.2 + .8 * d) * .9;
    const band = Math.abs(c.x - ba * Math.sin(bs * time));
    if (band < bw && d > .25) {
      const i = (1 - band / bw) * Math.min(1, (d - .25) / .3);
      r *= 1 + .7 * i;
      op = Math.min(1, op + .9 * i);
    }
    return { sx: 9.5 * c.x + CX, sy: 9.5 * c.y + CY, depth: d,
             r: Math.max(.4, r), opacity: clamp(op), rgb: dRGB(d), idx };
  });
}

// 2 ── PULSE: breathing sphere + vertical glow wave ─────────────────
function statePulse(time) {
  const ro=$('pulse','rot'), ba=$('pulse','bAmp'), bf=$('pulse','bFreq');
  const ti=$('pulse','tilt'), wd=$('pulse','waveD');
  const a = time * ro, breath = 1 + ba * Math.sin(time * bf);
  const cY = Math.cos(a), sY = Math.sin(a), cX = Math.cos(ti), sX = Math.sin(ti);
  return PTS.map((pt, idx) => {
    const c = rot(pt, cY, sY, cX, sX), d = (c.z + 1) / 2, R = 9.5 * breath;
    const wave = .5 + .5 * Math.sin(time * bf - c.y * wd);
    const r = .45 + .35 * d + .2 * wave;
    const op = (.25 + .5 * d + .25 * wave) * .95;
    return { sx: R * c.x + CX, sy: R * c.y + CY, depth: d,
             r: Math.max(.35, r), opacity: clamp(op), rgb: dRGB(d), idx };
  });
}

// 3 ── SWIRL: differential rotation (tornado) + spiral band ─────────
function stateSwirl(time) {
  const sp=$('swirl','spd'), tw=$('swirl','twist'), ti=$('swirl','tilt');
  const bs=$('swirl','bSpd'), bt=$('swirl','bThresh');
  const cX = Math.cos(ti), sX = Math.sin(ti);
  return PTS.map((pt, idx) => {
    const lat = pt.y, spd = sp * (1 + tw * lat), a = time * spd;
    const cA = Math.cos(a), sA = Math.sin(a);
    const rx = pt.x * cA + pt.z * sA, rz = -pt.x * sA + pt.z * cA;
    const x = rx, y = pt.y * cX - rz * sX, z = pt.y * sX + rz * cX, d = (z + 1) / 2;
    const sa = Math.atan2(rz, rx);
    const phase = sa - time * bs + lat * PI;
    const hi = Math.max(0, (.5 + .5 * Math.sin(phase)) - bt) / (1 - bt);
    const r = .95 * (.4 + .6 * d) * (1 + .5 * hi);
    const op = ((.2 + .8 * d) + .3 * hi) * .9;
    return { sx: 9.5 * x + CX, sy: 9.5 * y + CY, depth: d,
             r: Math.max(.4, r), opacity: clamp(op), rgb: dRGB(d), idx };
  });
}

// 4 ── RIPPLE: spherical wave from pole + crest highlight ───────────
function stateRipple(time) {
  const ro=$('ripple','rot'), wf=$('ripple','wFreq'), ws=$('ripple','wSpd');
  const wa=$('ripple','wAmp'), cr=$('ripple','crest');
  const a = time * ro, cY = Math.cos(a), sY = Math.sin(a);
  const cX = Math.cos(.22), sX = Math.sin(.22);
  return PTS.map((pt, idx) => {
    const dist = Math.acos(Math.max(-1, Math.min(1, pt.y)));
    const wave = Math.sin(dist * wf - time * ws) * wa, sc = 1 + wave;
    const dp = { x: pt.x * sc, y: pt.y * sc, z: pt.z * sc };
    const c = rot(dp, cY, sY, cX, sX), d = (c.z + 1) / 2;
    const crest = .5 + .5 * Math.cos(dist * wf - time * ws);
    const hi = crest > cr ? (crest - cr) / (1 - cr) : 0;
    const r = .95 * (.4 + .6 * d) * (1 + .4 * hi);
    const op = ((.2 + .8 * d) + .25 * hi) * .9;
    return { sx: 9.5 * c.x + CX, sy: 9.5 * c.y + CY, depth: d,
             r: Math.max(.4, r), opacity: clamp(op), rgb: dRGB(d), idx };
  });
}

// 5 ── ORBIT: 3 orbital rings + comet-trail band ───────────────────
function stateOrbit(time) {
  const r1=$('orbit','r1'), r2=$('orbit','r2'), r3=$('orbit','r3');
  const cm=$('orbit','comet'), cw=$('orbit','cometW');
  const rings = [
    { tx: .25,  tz: 0,   spd: r1, s: 0,  n: 14 },
    { tx: 1.15, tz: .55, spd: r2, s: 14, n: 13 },
    { tx: -.75, tz: -.4, spd: r3, s: 27, n: 13 },
  ];
  return PTS.map((pt, idx) => {
    const ring = rings.find(r => idx >= r.s && idx < r.s + r.n);
    const pos = idx - ring.s;
    const angle = (pos / ring.n) * PI * 2 + time * ring.spd;
    let x = Math.cos(angle), y = 0, z = Math.sin(angle);
    const cx1 = Math.cos(ring.tx), sx1 = Math.sin(ring.tx);
    let y1 = y * cx1 - z * sx1, z1 = y * sx1 + z * cx1;
    const cz1 = Math.cos(ring.tz), sz1 = Math.sin(ring.tz);
    const x2 = x * cz1 - y1 * sz1, y2 = x * sz1 + y1 * cz1;
    const d = clamp((z1 + 1) / 2);
    const ref = time * ring.spd * cm;
    const diff = Math.atan2(Math.sin(angle - ref), Math.cos(angle - ref));
    const hi = Math.abs(diff) < cw ? (1 - Math.abs(diff) / cw) ** 2 : 0;
    const r = Math.max(.38, (.42 + .44 * d) * (1 + .6 * hi));
    const op = clamp((.2 + .7 * d) + .5 * hi);
    return { sx: 9.5 * x2 + CX, sy: 9.5 * y2 + CY, depth: d,
             r, opacity: op, rgb: bRGB(d, hi), idx };
  });
}

// 6 ── HELIX: DNA double strand + traveling pulse ──────────────────
function stateHelix(time) {
  const tu=$('helix','turns'), sp=$('helix','spin'), ps=$('helix','pSpd');
  const pw=$('helix','pW'), rx=$('helix','radX'), ry=$('helix','radY');
  return PTS.map((pt, idx) => {
    const strand = idx % 2, pos = Math.floor(idx / 2), t = pos / 19;
    const angle = t * tu * 2 * PI + strand * PI + time * sp;
    const x = Math.cos(angle), z = Math.sin(angle), y = t * 2 - 1;
    const d = clamp((z + 1) / 2);
    const pT = ((time * ps + strand * .5) % 1);
    const dist = Math.abs(t - pT), wrap = Math.min(dist, 1 - dist);
    const hi = wrap < pw ? (1 - wrap / pw) ** 2 : 0;
    const r = Math.max(.3, (.28 + .22 * d) * (1 + 1.2 * hi));
    const op = clamp((.15 + .5 * d) + .55 * hi);
    return { sx: x * rx + CX, sy: y * ry + CY, depth: d,
             r, opacity: op, rgb: cRGB(d, hi), idx };
  });
}

// 7 ── NOVA: cascading radial pulse + sweeping band ────────────────
function stateNova(time) {
  const ro=$('nova','rot'), pf=$('nova','pFreq'), pr=$('nova','pRange');
  const bs=$('nova','bSpd'), bw=$('nova','bW');
  const a = time * ro, cY = Math.cos(a), sY = Math.sin(a);
  const cX = Math.cos(.2), sX = Math.sin(.2);
  return PTS.map((pt, idx) => {
    const lon = Math.atan2(pt.z, pt.x);
    const delay = lon * .4 + pt.y * .7;
    const pulse = Math.sin(time * pf + delay);
    const scale = (.65 + pr) + pr * pulse;
    const c = rot(pt, cY, sY, cX, sX), d = clamp((c.z * scale + 1) / 2);
    const bandY = Math.sin(time * bs);
    const bandDist = Math.abs(pt.y - bandY);
    const hi = bandDist < bw ? (1 - bandDist / bw) ** 1.5 : 0;
    const r = .95 * (.4 + .6 * d) * (1 + .65 * hi);
    const op = ((.2 + .8 * d) + .45 * hi) * .9;
    return { sx: 9.5 * scale * c.x + CX, sy: 9.5 * scale * c.y + CY, depth: d,
             r: Math.max(.4, r), opacity: clamp(op), rgb: bRGB(d, hi), idx };
  });
}

// 8 ── KNOT: trefoil knot + traveling pulse ────────────────────────
//     Math: x=sin θ+2sin 2θ,  y=cos θ−2cos 2θ,  z=−sin 3θ
function stateKnot(time) {
  const ro=$('knot','rot'), ti=$('knot','tilt'), ps=$('knot','pSpd');
  const pw=$('knot','pW'), sc=$('knot','scale');
  return PTS.map((pt, idx) => {
    const theta = (idx / N) * PI * 2;
    let x = (Math.sin(theta) + 2 * Math.sin(2 * theta)) / 3;
    let y = (Math.cos(theta) - 2 * Math.cos(2 * theta)) / 3;
    let z = -Math.sin(3 * theta) / 1.5;
    const a = time * ro, c1 = Math.cos(a), s1 = Math.sin(a);
    let rx = x * c1 + z * s1, rz = -x * s1 + z * c1; x = rx; z = rz;
    const ct = Math.cos(ti), st = Math.sin(ti);
    let ry = y * ct - z * st, rz2 = y * st + z * ct; y = ry; z = rz2;
    const d = clamp((z + 1) / 2);
    const pT = (time * ps) % 1;
    const dist = Math.abs(idx / N - pT), wrap = Math.min(dist, 1 - dist);
    const hi = wrap < pw ? (1 - wrap / pw) ** 2 : 0;
    const r = Math.max(.3, (.28 + .22 * d) * (1 + 1.2 * hi));
    const op = clamp((.15 + .5 * d) + .55 * hi);
    return { sx: x * sc + CX, sy: y * sc + CY, depth: d,
             r, opacity: op, rgb: cRGB(d, hi), idx };
  });
}

// 9 ── TORUS: donut surface + tube-circling band ───────────────────
//     Math: ((R+r cos v) cos u, (R+r cos v) sin u, r sin v)
function stateTorus(time) {
  const R=$('torus','R'), tr=$('torus','r'), sp=$('torus','spin');
  const ti=$('torus','tilt'), bs=$('torus','bSpd'), bw=$('torus','bW');
  return PTS.map((pt, idx) => {
    const u = (idx % 10) / 10 * PI * 2;         // 10 around ring
    const v = Math.floor(idx / 10) / 4 * PI * 2; // 4 around tube
    let x = (R + tr * Math.cos(v)) * Math.cos(u);
    let y = (R + tr * Math.cos(v)) * Math.sin(u);
    let z = tr * Math.sin(v);
    const a = time * sp, c1 = Math.cos(a), s1 = Math.sin(a);
    let nx = x * c1 + z * s1, nz = -x * s1 + z * c1; x = nx; z = nz;
    const ct = Math.cos(ti), st = Math.sin(ti);
    let ny = y * ct - z * st; nz = y * st + z * ct; y = ny; z = nz;
    const d = clamp((z / .95 + 1) / 2);
    const bv = (time * bs) % (PI * 2);
    const vd = Math.abs(Math.atan2(Math.sin(v - bv), Math.cos(v - bv)));
    const hi = vd < bw ? (1 - vd / bw) ** 2 : 0;
    const r = Math.max(.38, (.42 + .42 * d) * (1 + .6 * hi));
    const op = clamp((.2 + .7 * d) + .5 * hi);
    return { sx: x * 9.5 + CX, sy: y * 9.5 + CY, depth: d,
             r, opacity: op, rgb: bRGB(d, hi), idx };
  });
}

// 10 ── PENDULUM: wave pendulum — incremental frequencies ──────────
//      Math: y_i = A·sin(ω_i·t),  ω_i = ω₀ + i·Δω
function statePendulum(time) {
  const bf=$('pendulum','base'), fs=$('pendulum','step'), am=$('pendulum','amp');
  const bs=$('pendulum','bSpd'), bw=$('pendulum','bW');
  return PTS.map((pt, idx) => {
    const freq = bf + idx * fs;
    const phase = time * freq * PI * 2;
    const x = (idx / (N - 1)) * 2 - 1;
    const swing = Math.sin(phase), y = swing * am, z = Math.cos(phase) * .45;
    const d = clamp((z + 1) / 2);
    const bandX = Math.sin(time * bs), bDist = Math.abs(x - bandX);
    const hi = bDist < bw ? (1 - bDist / bw) : 0;
    const r = Math.max(.28, .28 + .2 * d + .35 * hi);
    const op = clamp(.2 + .45 * d + .5 * hi);
    return { sx: x * 9 + CX, sy: y * 7.5 + CY, depth: d,
             r, opacity: op, rgb: cRGB(d, hi), idx };
  });
}

// 11 ── WOBBLE: precessing tumble + sweeping band ──────────────────
function stateWobble(time) {
  const sp=$('wobble','spin'), pa=$('wobble','pAmp'), pf=$('wobble','pFreq');
  const bs=$('wobble','bSpd'), br=$('wobble','bRange'), bw=$('wobble','bW');
  const a1 = time * sp, a2 = Math.sin(time * pf) * pa, a3 = Math.cos(time * pf * .77) * pa * .75;
  const c1 = Math.cos(a1), s1 = Math.sin(a1);
  const c2 = Math.cos(a2), s2 = Math.sin(a2);
  const c3 = Math.cos(a3), s3 = Math.sin(a3);
  return PTS.map((pt, idx) => {
    let x = pt.x * c1 + pt.z * s1, z = -pt.x * s1 + pt.z * c1, y = pt.y;
    let ny = y * c2 - z * s2, nz = y * s2 + z * c2; y = ny; z = nz;
    let nx = x * c3 - y * s3; ny = x * s3 + y * c3; x = nx; y = ny;
    const d = clamp((z + 1) / 2);
    const bandY = Math.sin(time * bs) * br, bDist = Math.abs(y - bandY);
    const hi = bDist < bw ? (1 - bDist / bw) : 0;
    const r = .95 * (.4 + .6 * d) * (1 + .6 * hi);
    const op = ((.2 + .8 * d) + .45 * hi) * .9;
    return { sx: 9.5 * x + CX, sy: 9.5 * y + CY, depth: d,
             r: Math.max(.4, r), opacity: clamp(op), rgb: bRGB(d, hi), idx };
  });
}

// 12 ── RAIN: cascading fall + horizontal sweep band ──────────────
function stateRain(time) {
  const sp=$('rain','spd'), sv=$('rain','var'), dr=$('rain','drift');
  const bs=$('rain','bSpd'), bw=$('rain','bW');
  return PTS.map((pt, idx) => {
    const s = idx * 1.618;
    const speed = sp + Math.sin(s * 3.7) * sv;
    const x = pt.x * .65 + Math.sin(time * .5 + s * 2.1) * dr;
    const y = 1 - ((time * speed + s * .7) % 2);
    const z = pt.z * .35, d = clamp((z + .4) / .8);
    const bandY = 1 - ((time * bs) % 2);
    const bDist = Math.min(
      Math.abs(y - bandY),
      Math.abs(y - bandY + 2),
      Math.abs(y - bandY - 2),
    );
    const hi = bDist < bw ? (1 - bDist / bw) : 0;
    const r = Math.max(.38, .42 + .35 * d + .3 * hi);
    const op = clamp(.3 + .45 * d + .35 * hi);
    return { sx: x * 8.5 + CX, sy: y * 7.5 + CY, depth: d,
             r, opacity: op, rgb: bRGB(d, hi), idx };
  });
}

// 13 ── FIGURE8: lemniscate infinity loop + traveling pulse ───────
//      Math: x=sin θ, y=sin 2θ/2 — Lissajous 1:2 figure
function stateFigure8(time) {
  const lp=$('figure8','loop'), ys=$('figure8','yScale'), zd=$('figure8','zDepth');
  const ro=$('figure8','rot'), ps=$('figure8','pSpd'), pw=$('figure8','pW');
  return PTS.map((pt, idx) => {
    const theta = (idx / N) * PI * 2 + time * lp;
    let x = Math.sin(theta), y = Math.sin(2 * theta) * ys, z = Math.cos(theta) * zd;
    const a = time * ro, c1 = Math.cos(a), s1 = Math.sin(a);
    const rx = x * c1 + z * s1, rz = -x * s1 + z * c1; x = rx; z = rz;
    const ct = Math.cos(.2), st = Math.sin(.2);
    const ry = y * ct - z * st; z = y * st + z * ct; y = ry;
    const d = clamp((z + 1) / 2);
    const pT = (time * ps) % 1;
    const dist = Math.abs(idx / N - pT), wrap = Math.min(dist, 1 - dist);
    const hi = wrap < pw ? (1 - wrap / pw) ** 2 : 0;
    const r = Math.max(.3, (.28 + .22 * d) * (1 + 1.2 * hi));
    const op = clamp((.15 + .5 * d) + .55 * hi);
    return { sx: x * 9 + CX, sy: y * 9 + CY, depth: d,
             r, opacity: op, rgb: cRGB(d, hi), idx };
  });
}

// ── State registry ───────────────────────────────────────────────
const STATES = [
  { name: 'idle',     fn: stateIdle     },
  { name: 'thinking', fn: stateThinking },
  { name: 'pulse',    fn: statePulse    },
  { name: 'swirl',    fn: stateSwirl    },
  { name: 'ripple',   fn: stateRipple   },
  { name: 'orbit',    fn: stateOrbit    },
  { name: 'helix',    fn: stateHelix    },
  { name: 'nova',     fn: stateNova     },
  { name: 'knot',     fn: stateKnot     },
  { name: 'torus',    fn: stateTorus    },
  { name: 'pendulum', fn: statePendulum },
  { name: 'wobble',   fn: stateWobble   },
  { name: 'rain',     fn: stateRain     },
  { name: 'figure8',  fn: stateFigure8  },
];

// ── Particle blend for smooth transitions ────────────────────────
function blend(from, to, t) {
  return from.map((f, i) => {
    const p = to[i];
    return {
      sx:      lerp(f.sx, p.sx, t),
      sy:      lerp(f.sy, p.sy, t),
      depth:   lerp(f.depth, p.depth, t),
      r:       Math.max(.2, lerp(f.r, p.r, t)),
      opacity: clamp(lerp(f.opacity, p.opacity, t)),
      rgb:     lerpC(f.rgb, p.rgb, t),
      idx:     f.idx,
    };
  });
}
