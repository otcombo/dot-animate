// =====================================================================
//  states.js — 14 animation state functions
//  Each state is a pure function: (time) → particle[40]
//  particle = { sx, sy, depth, r, opacity, rgb, idx }
//
//  Depends on: core.js (PTS, GRID, slot, rot, lerp, clamp, dRGB, bRGB, cRGB),
//              config.js ($ helper / CFG)
// =====================================================================

// 0 ── IDLE: static diamond + ring (avatar layout) w/ depth-varied sizes
//      16 visible dots arranged as avatar's 4-inner-diamond + 12-outer-
//      ring. Each dot's depth is derived from its vertical position
//      (bottom = closer/larger, top = farther/smaller), feeding into
//      thinking's standard size/opacity/color formulas so dots have
//      organic size variation even while fully static.
function stateIdle() {
  const r1      = $('idle','r1');
  const r2      = $('idle','r2');
  const depthAmt = $('idle','depthAmt');
  return PTS.map((_, idx) => {
    if (idx >= 16) {
      return { sx: CX, sy: CY, depth: 0, r: .2, opacity: 0, rgb: RGB_F, idx };
    }
    let pos, count, radius;
    if (idx < 4) { pos = idx;     count = 4;  radius = r1; }
    else         { pos = idx - 4; count = 12; radius = r2; }
    const angle = -PI / 2 + (pos / count) * PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    // Pseudo-depth from y-position — top = back (small), bottom = front (big)
    const d = clamp(0.55 + Math.sin(angle) * depthAmt);
    // Thinking's size/opacity formulas (depth → organic variation)
    const r  = Math.max(.35, .95 * (.4 + .6 * d));
    const op = clamp((.3 + .7 * d) * .9);
    return { sx: CX + x, sy: CY + y, depth: d,
             r, opacity: op, rgb: dRGB(d), idx };
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
  const ro=$('ripple','rot'), ti=$('ripple','tilt'), wf=$('ripple','wFreq'), ws=$('ripple','wSpd');
  const wa=$('ripple','wAmp'), cr=$('ripple','crest');
  const a = time * ro, cY = Math.cos(a), sY = Math.sin(a);
  const cX = Math.cos(ti), sX = Math.sin(ti);
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
  const ts=$('orbit','tiltSpread');
  const cm=$('orbit','comet'), cw=$('orbit','cometW');
  const rings = [
    { tx: .25*ts,  tz: 0*ts,   spd: r1, s: 0,  n: 14 },
    { tx: 1.15*ts, tz: .55*ts, spd: r2, s: 14, n: 13 },
    { tx: -.75*ts, tz: -.4*ts, spd: r3, s: 27, n: 13 },
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
    // Size formula matches thinking: .95*(.4+.6*d), min 0.4
    const r = Math.max(.4, .95 * (.4 + .6 * d) * (1 + .9 * hi));
    const op = clamp((.2 + .8 * d) * .9 + .6 * hi);
    return { sx: x * rx + CX, sy: y * ry + CY, depth: d,
             r, opacity: op, rgb: cRGB(d, hi), idx };
  });
}

// 7 ── NOVA: cascading radial pulse + sweeping band ────────────────
function stateNova(time) {
  const ro=$('nova','rot'), ti=$('nova','tilt'), pf=$('nova','pFreq'), pr=$('nova','pRange');
  const bs=$('nova','bSpd'), bw=$('nova','bW');
  const a = time * ro, cY = Math.cos(a), sY = Math.sin(a);
  const cX = Math.cos(ti), sX = Math.sin(ti);
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
    const r = Math.max(.4, .95 * (.4 + .6 * d) * (1 + .9 * hi));
    const op = clamp((.2 + .8 * d) * .9 + .6 * hi);
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
  const sY=$('pendulum','spanY'), zA=$('pendulum','zAmt');
  const bs=$('pendulum','bSpd'), bw=$('pendulum','bW');
  return PTS.map((pt, idx) => {
    const freq = bf + idx * fs;
    const phase = time * freq * PI * 2;
    const x = (idx / (N - 1)) * 2 - 1;
    const swing = Math.sin(phase), y = swing * am, z = Math.cos(phase) * zA;
    const d = clamp((z + 1) / 2);
    const bandX = Math.sin(time * bs), bDist = Math.abs(x - bandX);
    const hi = bDist < bw ? (1 - bDist / bw) : 0;
    const r = Math.max(.38, .85 * (.4 + .6 * d) * (1 + .6 * hi));
    const op = clamp((.2 + .8 * d) * .9 + .5 * hi);
    return { sx: x * 9 + CX, sy: y * sY + CY, depth: d,
             r, opacity: op, rgb: cRGB(d, hi), idx };
  });
}

// 11 ── WOBBLE: precessing tumble + sweeping band ──────────────────
function stateWobble(time) {
  const sp=$('wobble','spin'), pa=$('wobble','pAmp'), pf=$('wobble','pFreq'), asym=$('wobble','asym');
  const bs=$('wobble','bSpd'), br=$('wobble','bRange'), bw=$('wobble','bW');
  const a1 = time * sp, a2 = Math.sin(time * pf) * pa, a3 = Math.cos(time * pf * asym) * pa * .75;
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
  const sY=$('rain','spanY'), bs=$('rain','bSpd'), bw=$('rain','bW');
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
    return { sx: x * 8.5 + CX, sy: y * sY + CY, depth: d,
             r, opacity: op, rgb: bRGB(d, hi), idx };
  });
}

// 13 ── INFINITE: lemniscate infinity loop + traveling pulse ─────
//      Math: x=sin θ, y=sin 2θ/2 — Lissajous 1:2 figure.
//      Uses 20 dots on the curve (20 hidden at center) so spacing
//      along the curve matches thinking's sphere density (~3–4 svg
//      units between dots). Avoids the pile-up from 40 points on
//      the self-intersecting lemniscate.
const INFINITE_N = 20;
function stateInfinite(time) {
  const lp=$('infinite','loop'), ys=$('infinite','yScale'), zd=$('infinite','zDepth');
  const ro=$('infinite','rot'), ti=$('infinite','tilt'), sc=$('infinite','scale');
  const ps=$('infinite','pSpd'), pw=$('infinite','pW');
  return PTS.map((pt, idx) => {
    if (idx >= INFINITE_N) {
      return { sx: CX, sy: CY, depth: 0, r: .2, opacity: 0, rgb: RGB_F, idx };
    }
    // Half-step offset so no dot sits exactly at the crossover (θ=0, π)
    const theta = ((idx + .5) / INFINITE_N) * PI * 2 + time * lp;
    let x = Math.sin(theta), y = Math.sin(2 * theta) * ys, z = Math.cos(theta) * zd;
    const a = time * ro, c1 = Math.cos(a), s1 = Math.sin(a);
    const rx = x * c1 + z * s1, rz = -x * s1 + z * c1; x = rx; z = rz;
    const ct = Math.cos(ti), st = Math.sin(ti);
    const ry = y * ct - z * st; z = y * st + z * ct; y = ry;
    const d = clamp((z + 1) / 2);
    const pT = (time * ps) % 1;
    const dist = Math.abs(idx / INFINITE_N - pT), wrap = Math.min(dist, 1 - dist);
    const hi = wrap < pw ? (1 - wrap / pw) ** 2 : 0;
    // Thinking-style size/opacity so visible dots feel comparable to sphere states
    const r = Math.max(.4, .95 * (.4 + .6 * d) * (1 + .7 * hi));
    const op = clamp((.2 + .8 * d) * .9 + .6 * hi);
    return { sx: x * sc + CX, sy: y * sc + CY, depth: d,
             r, opacity: op, rgb: cRGB(d, hi), idx };
  });
}

// 14 ── GRID: offmenu nav-toggle — 3×3 dot matrix (9 visible) ──────
//      Exactly matches the original 3×3 kebab-menu layout. Our
//      enhancement: a vertical bright column sweeps left→right,
//      lighting up each of the 3 columns in turn. Remaining 31 dots
//      hide at center (opacity 0) and fade/expand during transitions.
function stateGrid(time) {
  const sp = $('grid','sp'), bSpd = $('grid','bSpd'), bW = $('grid','bW');
  const cols = 3;                                      // 3 × 3 = 9
  return PTS.map((_, idx) => {
    if (idx >= 9) {
      return { sx: CX, sy: CY, depth: 0, r: .2, opacity: 0, rgb: RGB_F, idx };
    }
    const col = idx % cols, row = Math.floor(idx / cols);
    const x = (col - 1) * sp, y = (row - 1) * sp;      // centered on 11, 11
    // Column-sweep spotlight: wave cycles from -1 → cols+1
    const wavePos = ((time * bSpd) % (cols + 2)) - 1;
    const dist = Math.abs(col - wavePos);
    const hi = dist < bW ? (1 - dist / bW) ** 1.5 : 0;
    // Uniform dots at rest; band boosts size + opacity (matches
    // offmenu's "all-white dots, highlight on interaction" feel)
    const d = 0.7 + 0.3 * hi;                          // stays in front tier for white
    const r = Math.max(.4, .58 * (1 + .7 * hi));
    const op = clamp(.78 + .22 * hi);
    return { sx: CX + x, sy: CY + y, depth: d,
             r, opacity: op, rgb: bRGB(d, hi), idx };
  });
}

// 15 ── CHAT: offmenu chat icon — 4-dot diamond + 12-dot ring ──────
//      Exactly matches the original: 4 inner dots in diamond, 12
//      outer dots on a ring, both at their original geometric
//      positions (4 + 12 = 16 visible, 24 hidden at center).
//      Our enhancement: rings can counter-rotate at independent
//      speeds, and a radial pulse expands from inner → outer,
//      evoking a "thinking" / "listening" avatar.
function stateChat(time) {
  const r1 = $('chat','r1'), r2 = $('chat','r2');
  const s1 = $('chat','s1'), s2 = $('chat','s2');
  const bSpd = $('chat','bSpd');
  return PTS.map((_, idx) => {
    if (idx >= 16) {
      return { sx: CX, sy: CY, depth: 0, r: .2, opacity: 0, rgb: RGB_F, idx };
    }
    let ring, pos, count, radius, speed;
    if (idx < 4) { ring = 0; pos = idx;     count = 4;  radius = r1; speed = s1; }
    else         { ring = 1; pos = idx - 4; count = 12; radius = r2; speed = s2; }
    // Inner diamond aligned to cardinal axes (match original offmenu);
    // outer ring starts from the top (−π/2) like the original.
    const offset = ring === 0 ? -PI / 2 : -PI / 2;
    const angle = offset + (pos / count) * PI * 2 + time * speed;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    // Outward pulse: inner ring highlights, then outer, then a gap
    const pulse = (time * bSpd) % 2.5;
    const hi = pulse < 2 ? Math.max(0, 1 - Math.abs(pulse - ring) * 1.4) : 0;
    const d = 0.7 + 0.3 * hi;                          // front tier → white
    const dotR = Math.max(.4, .55 * (1 + .7 * hi));
    const op = clamp(.72 + .28 * hi);
    return { sx: CX + x, sy: CY + y, depth: d,
             r: dotR, opacity: op, rgb: bRGB(d, hi), idx };
  });
}

// 16 ── MENU: nav-toggle style, auto-cycling 3×3 dots ⟷ X morph ────
//      Self-cycles on a period: holds dots (idle), snaps to X (click),
//      holds X, morphs back. Captures the hamburger-menu → close-icon
//      transform that UI kits like offmenu use.
//
//      Dot → X mapping uses a 45° CW rotation of edge-mid dots so
//      they collapse inward to arm midpoints. Corners and center stay
//      put. Motion paths are short and symmetric.
const _MENU_DOTS = [
  [-1,-1], [0,-1], [1,-1],
  [-1, 0], [0, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];
const _MENU_X = [
  [-1,-1], [.5,-.5], [1,-1],    // top row: TL stays, top-mid → TR arm, TR stays
  [-.5,-.5], [0, 0], [.5,.5],   // mid row: mid-L → TL arm, center stays, mid-R → BR arm
  [-1, 1], [-.5,.5], [1, 1],    // bot row: BL stays, bot-mid → BL arm, BR stays
];
function stateMenu(time) {
  const sp     = $('menu','sp');
  const period = $('menu','period');
  const idleH  = $('menu','idleHold');
  const xH     = $('menu','xHold');

  // Cycle phase m ∈ [0,1], with plateaus at 0 (dots) and 1 (X).
  //   0 ──idle hold──┐ morph ┌──X hold──┐ morph ┌── 1
  const phase  = (time / period) % 1;
  const morph  = (1 - idleH - xH) / 2;              // fraction on each side
  let m;
  if      (phase < idleH)               m = 0;
  else if (phase < idleH + morph)       m = (phase - idleH) / morph;
  else if (phase < idleH + morph + xH)  m = 1;
  else                                   m = 1 - (phase - idleH - morph - xH) / morph;
  m = m * m * (3 - 2 * m);                           // smoothstep eases ends

  // Brief highlight flash at the midpoint of each morph transition
  const hiT = Math.abs(m - .5) < .4 ? 1 - Math.abs(m - .5) / .4 : 0;
  const hi  = hiT * .8;

  return PTS.map((_, idx) => {
    if (idx >= 9) return { sx: CX, sy: CY, depth: 0, r: .2, opacity: 0, rgb: RGB_F, idx };
    const a = _MENU_DOTS[idx], b = _MENU_X[idx];
    const x = lerp(a[0], b[0], m) * sp;
    const y = lerp(a[1], b[1], m) * sp;
    const d = 0.7 + 0.2 * hi;
    const r = Math.max(.4, .6 * (1 + .3 * hi));
    const op = clamp(.82 + .12 * hi);
    return { sx: CX + x, sy: CY + y, depth: d, r, opacity: op, rgb: bRGB(d, hi), idx };
  });
}

// 17 ── AVATAR: chat-icon style, auto-cycling idle ⟷ thinking ─────
//      Holds static diamond+ring (idle), fades in a "thinking"
//      phase where the rings counter-rotate and a traveling pulse
//      sweeps the outer ring while the inner diamond breathes.
//      Fades back to idle. Captures a chat-assistant's idle → active
//      → idle lifecycle.
function stateAvatar(time) {
  const r1      = $('avatar','r1');
  const r2      = $('avatar','r2');
  const period  = $('avatar','period');
  const thinkSp = $('avatar','thinkSpd');
  const pulseSp = $('avatar','pulseSpd');
  const breathAmt = $('avatar','breathAmt');

  // Cycle: 35% idle, 10% fade-in, 45% thinking, 10% fade-out
  const phase = (time / period) % 1;
  let m;
  if      (phase < .35) m = 0;
  else if (phase < .45) m = (phase - .35) / .1;
  else if (phase < .9)  m = 1;
  else                  m = 1 - (phase - .9) / .1;
  m = m * m * (3 - 2 * m);

  return PTS.map((_, idx) => {
    if (idx >= 16) return { sx: CX, sy: CY, depth: 0, r: .2, opacity: 0, rgb: RGB_F, idx };

    let ring, pos, count, radius;
    if (idx < 4) { ring = 0; pos = idx;     count = 4;  radius = r1; }
    else         { ring = 1; pos = idx - 4; count = 12; radius = r2; }

    const idleA = -PI / 2 + (pos / count) * PI * 2;
    // Thinking-mode rotation: inner spins CW faster, outer CCW slower
    const spd = ring === 0 ? thinkSp * 1.5 : -thinkSp * 0.7;
    const angle = idleA + time * spd * m;

    // Inner diamond breathes in thinking mode
    const breath = ring === 0 ? (1 + breathAmt * Math.sin(time * pulseSp * 1.5) * m) : 1;
    const rEff = radius * breath;

    const x = Math.cos(angle) * rEff;
    const y = Math.sin(angle) * rEff;

    // Band: outer ring gets a traveling comet, inner a phase pulse
    let hi = 0;
    if (m > 0.15) {
      if (ring === 1) {
        const refA = -PI / 2 + time * pulseSp;
        const diff = Math.atan2(Math.sin(angle - refA), Math.cos(angle - refA));
        hi = Math.abs(diff) < 0.7 ? ((1 - Math.abs(diff) / 0.7) ** 2) * m : 0;
      } else {
        hi = (0.5 + 0.5 * Math.sin(time * pulseSp * 2 + idx * 1.57)) * m * 0.6;
      }
    }

    const d = 0.7 + 0.3 * hi;
    const dotR = Math.max(.4, .55 * (1 + .6 * hi));
    const op = clamp(.75 + .25 * hi);
    return { sx: CX + x, sy: CY + y, depth: d, r: dotR, opacity: op, rgb: bRGB(d, hi), idx };
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
  { name: 'infinite', fn: stateInfinite },
  { name: 'grid',     fn: stateGrid     },
  { name: 'chat',     fn: stateChat     },
  { name: 'menu',     fn: stateMenu     },
  { name: 'avatar',   fn: stateAvatar   },
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
