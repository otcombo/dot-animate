// =====================================================================
//  app.js — UI construction, state machine, and animation loop
//  Depends on: core.js, config.js, states.js
// =====================================================================

// ── DOM references ──────────────────────────────────────────────────
const svg       = document.getElementById('ball');
const trigger   = document.getElementById('trigger');
const labelEl   = document.getElementById('label');
const navEl     = document.getElementById('nav');
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

// ── Nav dots + state-button row ─────────────────────────────────────
const navDots = STATES.map((_, i) => {
  const d = document.createElement('span');
  d.className = 'dot' + (i === 0 ? ' on' : '');
  navEl.appendChild(d);
  return d;
});

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
    '<button data-a="save">Save preset</button>' +
    '<button data-a="load">Load preset</button>' +
    '<span class="spacer"></span>' +
    '<button data-a="export">Export all</button>' +
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
      (PARAM_DEFS[stateName] || []).forEach(p => {
        CFG[stateName + '.' + p.key] = p.default;
      });
      buildStateSection(stateName);
      persistCFG();
    }

    if (a === 'save') {
      const n = prompt('Preset name:');
      if (!n) return;
      const ps = JSON.parse(localStorage.getItem('dotanim_presets') || '{}');
      const sub = {};
      Object.keys(CFG).forEach(k => {
        if (k.startsWith(stateName + '.')) sub[k] = CFG[k];
      });
      ps[stateName + '/' + n] = sub;
      localStorage.setItem('dotanim_presets', JSON.stringify(ps));
      alert('Saved: ' + n);
    }

    if (a === 'load') {
      const ps = JSON.parse(localStorage.getItem('dotanim_presets') || '{}');
      const names = Object.keys(ps)
        .filter(n => n.startsWith(stateName + '/'))
        .map(n => n.split('/')[1]);
      if (!names.length) { alert('No presets for ' + stateName); return; }
      const n = prompt('Load preset:\n' + names.join(', '));
      if (n && ps[stateName + '/' + n]) {
        Object.assign(CFG, ps[stateName + '/' + n]);
        buildStateSection(stateName);
        persistCFG();
      }
    }

    if (a === 'export') {
      navigator.clipboard
        .writeText(JSON.stringify(CFG, null, 2))
        .then(() => alert('Copied all config to clipboard'));
    }

    if (a === 'import') {
      const txt = prompt('Paste JSON config:');
      if (!txt) return;
      try {
        Object.assign(CFG, JSON.parse(txt));
        applyPalette();
        buildGlobalSection();
        buildStateSection(stateName);
        persistCFG();
      } catch (err) {
        alert('Invalid JSON');
      }
    }
  };
}

// =====================================================================
//  State machine (click → transition target state)
// =====================================================================
let fromIdx = 0, toIdx = 0, progress = 1, trStart = null;

function trDur(f, t) {
  return STATES[t].name === 'idle' ? 1.2
       : STATES[f].name === 'idle' ? 0.7
       : 0.8;
}
function trEase(f) {
  return STATES[f].name === 'idle' ? easeO3 : easeIO3;
}

function switchTo(i) {
  if (i === toIdx && progress >= 1) return;
  fromIdx = toIdx; toIdx = i;
  progress = 0; trStart = null;
  labelEl.textContent = STATES[i].name;
  navDots.forEach((d, j) => d.classList.toggle('on', j === i));
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
    const raw = clamp((t - trStart) / trDur(fromIdx, toIdx));
    progress = trEase(fromIdx)(raw);
    if (raw >= 1) progress = 1;
  }

  // Compute particles (blended or pure)
  const particles = progress >= 1
    ? STATES[toIdx].fn(elapsed)
    : blend(STATES[fromIdx].fn(elapsed), STATES[toIdx].fn(elapsed), progress);

  // Render with global multipliers
  const gS = $('global', 'scale');
  const gD = $('global', 'dotSize');
  const gO = $('global', 'opacity');

  particles.forEach(p => {
    const el = circles[p.idx];
    el.setAttribute('cx', CX + (p.sx - CX) * gS);
    el.setAttribute('cy', CY + (p.sy - CY) * gS);
    el.setAttribute('r', p.r * gD);
    el.setAttribute('fill', rgbStr(p.rgb));
    const op = p.opacity * gO;
    el.setAttribute('opacity', op < 0.005 ? 0 : op > 1 ? 1 : op);
    el._d = p.depth;
  });

  // Sort SVG elements by depth for correct layering
  [...circles].sort((a, b) => a._d - b._d).forEach(el => svg.appendChild(el));

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
