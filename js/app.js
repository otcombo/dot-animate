// =====================================================================
//  app.js — UI construction, state machine, and animation loop
//  Depends on: core.js, config.js, states.js
// =====================================================================

// ── DOM references ──────────────────────────────────────────────────
const svg       = document.getElementById('ball');
const trigger   = document.getElementById('trigger');
const labelEl   = document.getElementById('label');
const btnsEl    = document.getElementById('buttons');
const globalEl  = document.getElementById('globalSection');
const stateEl   = document.getElementById('stateSection');
const ns        = 'http://www.w3.org/2000/svg';

// ── Create the 40 SVG circles ───────────────────────────────────────
const circles = PTS.map(() => {
  const el = document.createElementNS(ns, 'circle');
  svg.appendChild(el);
  return el;
});

// ── State-button row ────────────────────────────────────────────────
const btns = STATES.map((st, i) => {
  const b = document.createElement('button');
  b.textContent = st.name;
  b.className = i === 0 ? 'on' : '';
  b.addEventListener('click', () => switchTo(i));
  btnsEl.appendChild(b);
  return b;
});

// =====================================================================
//  Parameter Panel
// =====================================================================

// Shared: render a grid of sliders for a given state name.
function renderSliders(parent, stateName) {
  const defs = PARAM_DEFS[stateName];
  const grid = document.createElement('div');
  grid.className = 'param-grid';
  defs.forEach(p => {
    const k = stateName + '.' + p.key;
    const row = document.createElement('div');
    row.className = 'pr';

    const lbl = document.createElement('span');
    lbl.className = 'pr-label';
    lbl.textContent = p.label;

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = p.min; sl.max = p.max; sl.step = p.step;
    sl.value = CFG[k];

    const val = document.createElement('span');
    val.className = 'pr-val';
    val.textContent = Number(CFG[k]).toFixed(2);

    sl.addEventListener('input', () => {
      CFG[k] = parseFloat(sl.value);
      val.textContent = Number(CFG[k]).toFixed(2);
      persistCFG();
    });

    row.append(lbl, sl, val);
    grid.appendChild(row);
  });
  parent.appendChild(grid);
}

// Global section: always visible above the state-specific section.
function buildGlobalSection() {
  globalEl.innerHTML = '';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = 'GLOBAL';
  globalEl.appendChild(title);

  renderSliders(globalEl, 'global');

  // Color pickers row
  const colorRow = document.createElement('div');
  colorRow.className = 'color-inputs';
  colorRow.style.marginTop = '8px';
  [['Front', 'color.front'], ['Mid', 'color.mid'], ['Back', 'color.back']].forEach(([lbl, k]) => {
    const wrap = document.createElement('div');
    wrap.className = 'c-pr';
    const l = document.createElement('span'); l.textContent = lbl;
    const ci = document.createElement('input');
    ci.type = 'color'; ci.value = CFG[k]; ci.dataset.key = k;
    ci.addEventListener('input', () => { CFG[k] = ci.value; applyPalette(); persistCFG(); });
    wrap.append(l, ci);
    colorRow.appendChild(wrap);
  });
  globalEl.appendChild(colorRow);

  // Preset buttons
  const presets = document.createElement('div');
  presets.className = 'color-presets';
  Object.entries(COLOR_PRESETS).forEach(([name, cs]) => {
    const b = document.createElement('button');
    b.textContent = name;
    b.addEventListener('click', () => {
      CFG['color.front'] = cs[0];
      CFG['color.mid']   = cs[1];
      CFG['color.back']  = cs[2];
      applyPalette();
      persistCFG();
      colorRow.querySelectorAll('input[type=color]')
        .forEach(ci => { ci.value = CFG[ci.dataset.key]; });
    });
    presets.appendChild(b);
  });
  globalEl.appendChild(presets);
}

// State section: rebuilt every time a different state is selected.
function buildStateSection(stateName) {
  stateEl.innerHTML = '';
  if (stateName === 'global') return;

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = stateName.toUpperCase() + ' PARAMETERS';
  title.style.marginTop = '12px';
  title.style.paddingTop = '10px';
  title.style.borderTop = '1px solid #1e1e1e';
  stateEl.appendChild(title);

  const defs = PARAM_DEFS[stateName];
  if (!defs || !defs.length) {
    const n = document.createElement('div');
    n.style.cssText = 'color:#444;text-align:center;padding:6px';
    n.textContent = 'No parameters for this state';
    stateEl.appendChild(n);
  } else {
    renderSliders(stateEl, stateName);
  }

  // Action buttons
  const acts = document.createElement('div');
  acts.className = 'panel-actions';
  acts.innerHTML =
    '<button data-a="reset">Reset</button>' +
    '<span class="spacer"></span>' +
    '<button data-a="export">Export</button>' +
    '<button data-a="import">Import</button>';
  acts.addEventListener('click', onPanelAction(stateName));
  stateEl.appendChild(acts);
}

// Action handler factory ────────────────────────────────────────────
function onPanelAction(stateName) {
  return e => {
    const a = e.target.dataset.a;
    if (!a) return;

    if (a === 'reset') {
      PARAM_DEFS.global.forEach(p => {
        CFG['global.' + p.key] = p.default;
      });
      CFG['color.front'] = '#FFFFFF';
      CFG['color.mid']   = '#888888';
      CFG['color.back']  = '#333333';
      applyPalette();

      (PARAM_DEFS[stateName] || []).forEach(p => {
        CFG[stateName + '.' + p.key] = p.default;
      });
      buildGlobalSection();
      buildStateSection(stateName);
      persistCFG();
    }

    if (a === 'export') {
      const ps = JSON.parse(localStorage.getItem('dotanim_presets') || '{}');
      navigator.clipboard
        .writeText(JSON.stringify(ps, null, 2))
        .then(() => alert('Copied all presets to clipboard'));
    }

    if (a === 'import') {
      const txt = prompt('Paste JSON presets:');
      if (!txt) return;
      try {
        const parsed = JSON.parse(txt);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Invalid preset payload');
        }
        localStorage.setItem('dotanim_presets', JSON.stringify(parsed));
        alert('Imported all presets');
      } catch (err) {
        alert('Invalid JSON');
      }
    }
  };
}

// =====================================================================
//  State machine — nearest-neighbor particle matching on transitions
// =====================================================================
//
//  Each physical circle (DOM element) is assigned to a fibonacci idx
//  of the active state. On a transition the assignment is recomputed
//  by pairing every physical particle with its nearest target slot
//  (minimum-distance greedy matching). This keeps dot travel paths
//  short — no more dots flying across the whole canvas.
//
//  renderAssignment[physI] = fibIdx the physical circle is playing
//  fromSnapshot — the physical positions captured at transition start
// =====================================================================

let fromIdx = 0, toIdx = 0, progress = 1, trStart = null;
let renderAssignment = Array.from({ length: 40 }, (_, i) => i);  // identity
let fromSnapshot = null;

// All transitions: 0.8s with easeOutCubic
const TR_DURATION = 0.8;
const TR_EASE = easeO3;

// Greedy minimum-distance assignment (process smallest pair first).
// O(n² log n) — for n=40 this is ~17k ops, computed once per switch.
function assignNearest(from, to) {
  const n = from.length;
  const pairs = new Array(n * n);
  let k = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dx = from[i].sx - to[j].sx;
      const dy = from[i].sy - to[j].sy;
      pairs[k++] = [dx * dx + dy * dy, i, j];
    }
  }
  pairs.sort((a, b) => a[0] - b[0]);
  const fUsed = new Uint8Array(n);
  const tUsed = new Uint8Array(n);
  const asgn = new Array(n);
  for (let p = 0; p < pairs.length; p++) {
    const [, i, j] = pairs[p];
    if (fUsed[i] || tUsed[j]) continue;
    asgn[i] = j;
    fUsed[i] = 1;
    tUsed[j] = 1;
  }
  return asgn;
}

// Current physical particles — may be mid-transition blend
function currentPhys() {
  const toP = STATES[toIdx].fn(elapsed);
  return renderAssignment.map((fibIdx, physI) => {
    const t = toP[fibIdx];
    if (progress >= 1 || !fromSnapshot) return { ...t };
    const f = fromSnapshot[physI];
    return {
      sx: lerp(f.sx, t.sx, progress),
      sy: lerp(f.sy, t.sy, progress),
      depth: lerp(f.depth, t.depth, progress),
      r: Math.max(.2, lerp(f.r, t.r, progress)),
      opacity: clamp(lerp(f.opacity, t.opacity, progress)),
      rgb: lerpC(f.rgb, t.rgb, progress),
      idx: physI,
    };
  });
}

function switchTo(i) {
  if (i === toIdx) return;

  // Snapshot where circles ARE right now (physical order)
  const curPhys = currentPhys();
  // Where the new state wants particles (fibonacci order)
  const newP = STATES[i].fn(elapsed);
  // Remap: each physical circle picks its closest slot in the new state
  renderAssignment = assignNearest(curPhys, newP);

  fromSnapshot = curPhys;
  fromIdx = toIdx;
  toIdx = i;
  progress = 0;
  trStart = null;

  labelEl.textContent = STATES[i].name;
  btns.forEach((b, j) => b.classList.toggle('on', j === i));
  buildStateSection(STATES[i].name);
}

trigger.addEventListener('click', () => switchTo((toIdx + 1) % STATES.length));

// ── Initial panel render ────────────────────────────────────────────
buildGlobalSection();
buildStateSection('idle');

// =====================================================================
//  Animation loop
// =====================================================================
let elapsed = 0, lastTime = 0;

function frame(now) {
  const t = now / 1000;
  const dt = lastTime === 0 ? 0.016 : Math.min(t - lastTime, 0.05);
  lastTime = t;
  elapsed += dt;

  // Advance transition
  if (progress < 1) {
    if (!trStart) trStart = t;
    const raw = clamp((t - trStart) / TR_DURATION);
    progress = TR_EASE(raw);
    if (raw >= 1) {
      progress = 1;
      fromSnapshot = null;                       // done blending
    }
  }

  // Active state's particles (fibonacci order)
  const toP = STATES[toIdx].fn(elapsed);

  // Global render multipliers
  const gS = $('global', 'scale');
  const gD = $('global', 'dotSize');
  const gO = $('global', 'opacity');

  // Render in physical-circle order via renderAssignment
  for (let phys = 0; phys < 40; phys++) {
    const fibIdx = renderAssignment[phys];
    const target = toP[fibIdx];

    let sx, sy, r, opacity, rgb, depth;
    if (progress >= 1 || !fromSnapshot) {
      sx = target.sx; sy = target.sy;
      r  = target.r;  opacity = target.opacity;
      rgb = target.rgb; depth = target.depth;
    } else {
      const f = fromSnapshot[phys];
      sx = lerp(f.sx, target.sx, progress);
      sy = lerp(f.sy, target.sy, progress);
      r  = Math.max(.2, lerp(f.r, target.r, progress));
      opacity = clamp(lerp(f.opacity, target.opacity, progress));
      rgb = lerpC(f.rgb, target.rgb, progress);
      depth = lerp(f.depth, target.depth, progress);
    }

    const el = circles[phys];
    el.setAttribute('cx', CX + (sx - CX) * gS);
    el.setAttribute('cy', CY + (sy - CY) * gS);
    el.setAttribute('r', r * gD);
    el.setAttribute('fill', rgbStr(rgb));
    const op = opacity * gO;
    el.setAttribute('opacity', op < 0.005 ? 0 : op > 1 ? 1 : op);
    el._d = depth;
  }

  // Sort SVG elements by depth for correct layering
  [...circles].sort((a, b) => a._d - b._d).forEach(el => svg.appendChild(el));

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
