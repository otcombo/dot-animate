# Dot Animate — Animation Catalog

## Architecture

- **40 particles** on a Fibonacci sphere (golden-angle uniform distribution)
- **SVG viewBox** 22×22, center (11, 11), projection radius 9.5
- **State function**: `(time) → particle[40]`, each particle has `{ sx, sy, depth, r, opacity, rgb, idx }`
- **Transitions**: any state → any state via linear interpolation with easing (0.7–1.2s)
- **Depth system**: 3-tier coloring by z-depth
  - Front (d > 0.65): `#74B8D4`
  - Mid (d > 0.4): `#3C78A8`
  - Back: `#1A2840`
  - Size and opacity also scale with depth

---

## States

### 0. idle — 静止网格

| Property | Value |
|----------|-------|
| Motion | None |
| Visible dots | 14 (hex diamond 2-3-4-3-2) |
| Highlight | None |

**Concept**: Resting state. 14 dots at fixed hexagonal grid positions, remaining 26 hidden at center (opacity 0). All dots uniform size (0.62) and color (front blue).

**Math**: Pure static coordinates. Grid spacing S=2.8, row height S×0.75 for square aspect ratio.

---

### 1. thinking — 旋转球体 + 扫光

| Property | Value |
|----------|-------|
| Motion | Y-axis spin @ 1.4 rad/s |
| Tilt | X-axis 0.2 rad |
| Highlight | Horizontal band sweep |

**Concept**: From Luma's original `SpinningAgentBall`. Smooth sphere rotation with a bright band sweeping left-right across the surface.

**Math**:
- Rotation: standard Y-axis rotation matrix
- Band: `|c.x − 0.85 × sin(2.2t)|`, intensity ramps when band < 0.5 and depth > 0.25
- Band boosts both size (×1.7) and opacity (+0.9)

---

### 2. pulse — 呼吸脉冲

| Property | Value |
|----------|-------|
| Motion | Slow rotation @ 0.35 rad/s |
| Scale | Radius oscillates ±14% |
| Highlight | Vertical glow wave (top → bottom) |

**Concept**: Calm, meditative breathing. The whole sphere expands and contracts while a brightness wave rolls down from top to bottom.

**Math**:
- Breathing: `R = 9.5 × (1 + 0.14 × sin(t × 1.8))`
- Wave: `0.5 + 0.5 × sin(t × 1.8 − c.y × 2)` — synced with breath, offset by latitude
- Tilt: 0.3 rad (slightly more than thinking, for variety)

---

### 3. swirl — 龙卷风漩涡

| Property | Value |
|----------|-------|
| Motion | Differential Y-rotation (top fast, bottom slow) |
| Tilt | X-axis 0.38 rad |
| Highlight | Spiral band wrapping the surface |

**Concept**: Tornado / vortex twist. Each point rotates at a speed proportional to its latitude, twisting the sphere into a helix-like shape.

**Math**:
- Per-point speed: `1.6 × (1 + 0.8 × latitude)` — top at 2.88 rad/s, bottom at 0.48 rad/s (6× ratio)
- Spiral band: `atan2(rz, rx) − t×2.8 + latitude×π` — phase wraps around the twisted surface
- Highlight threshold at sin > 0.7, normalized to [0, 1]

---

### 4. ripple — 涟漪波纹

| Property | Value |
|----------|-------|
| Motion | Very slow rotation @ 0.18 rad/s |
| Distortion | Radial sine wave from north pole |
| Highlight | Wave crest glow |

**Concept**: Water droplet on a sphere. Concentric waves radiate from the top pole, distorting the sphere's radius at each point.

**Math**:
- Angular distance from pole: `acos(pt.y)`
- Wave: `sin(dist × 3.5 − t × 2.8) × 0.16` — 3.5 cycles pole-to-pole, speed 2.8
- Each point's radius scaled by `1 + wave`
- Crest highlight: `cos(...)` peaks, threshold at > 0.78

---

### 5. orbit — 电子轨道

| Property | Value |
|----------|-------|
| Motion | 3 independent orbital rings |
| Shape | Circles at different tilted planes |
| Highlight | Depth-based only |

**Concept**: Atom / gyroscope. Three rings of dots orbit the center at different inclinations and speeds, like electron shells.

**Math**:
- Ring 1 (14 dots): tiltX=0.25, near-horizontal, 1.3 rad/s CW
- Ring 2 (13 dots): tiltX=1.15 tiltZ=0.55, steep, −0.85 rad/s CCW
- Ring 3 (13 dots): tiltX=−0.75 tiltZ=−0.4, opposite tilt, 0.6 rad/s CW
- Each point: unit circle → tilt around X → tilt around Z → project
- Rings are roughly 60° apart in orientation for clear visual separation

---

### 6. helix — DNA 双螺旋

| Property | Value |
|----------|-------|
| Motion | Rotation around vertical axis @ 0.9 rad/s |
| Shape | Two intertwined helical strands |
| Highlight | Depth-based only |

**Concept**: DNA double helix. 40 dots split into 2 strands of 20, winding around a vertical axis. The entire structure rotates.

**Math**:
- Strand assignment: even indices → strand 0, odd → strand 1
- Helix angle: `t × 1.5 × 2π + strand × π + time × 0.9`
- 1.5 full turns visible
- x = cos(angle), z = sin(angle), y spans [−1, 1]
- Projection: x scaled ×5.2, y scaled ×7.2 from center
- Depth from z component (front/back of helix)

---

### 7. galaxy — 银河旋臂

| Property | Value |
|----------|-------|
| Motion | Keplerian differential rotation in disc |
| Shape | Flattened sphere → thin disc, tilted 0.55 rad |
| Highlight | Depth-based only |

**Concept**: Spiral galaxy. The sphere flattens into a disc viewed at an angle. Inner points rotate faster than outer points (like real galaxies).

**Math**:
- Flatten: `y_flat = pt.y × 0.12` (compress to ~12% height)
- Radial distance: `sqrt(x² + z²)`
- Speed: `0.8 / (0.3 + dist × 1.5)` — Keplerian falloff, inner ≈5× faster than outer
- View tilt: 0.55 rad around X-axis gives perspective of a tilted disc
- Fibonacci distribution ensures even dot density across the disc

---

### 8. firefly — 萤火虫

| Property | Value |
|----------|-------|
| Motion | Pseudo-random organic drift |
| Shape | Loose cloud (no rigid structure) |
| Highlight | Per-dot random twinkling + flash |

**Concept**: Fireflies in a jar. Each dot drifts slowly on its own path and periodically twinkles bright. The most organic, non-geometric state.

**Math**:
- Seed: `idx × φ` (golden ratio for maximum variety)
- Drift: sum of 2 sine waves per axis at irrational frequency ratios
  - `sin(t×0.31 + seed×3.7)×0.45 + sin(t×0.17 + seed×2.3)×0.25`
  - Frequencies chosen to avoid repeating patterns
- Twinkle speed: `1.5 + sin(seed×7.1)×0.8` — each dot has its own rhythm
- Flash: triggers when twinkle > 0.85, boosts size and switches to front color

---

## Transitions

| From → To | Duration | Easing | Character |
|-----------|----------|--------|-----------|
| idle → any | 0.7s | easeOutCubic | Snappy expansion |
| any → idle | 1.2s | easeInOutCubic | Gentle collapse |
| animated → animated | 0.8s | easeInOutCubic | Smooth morph |

All transitions interpolate per-particle: position, size, opacity, and color are independently lerped. Both source and target states continue computing during the transition (no frozen snapshots), so animated states maintain their motion while morphing.

---

## Adding a New State

1. Write a function `stateMyAnim(time) → particle[40]`
2. Each particle needs: `sx, sy` (SVG coords), `depth` [0,1], `r` (radius), `opacity` [0,1], `rgb` [r,g,b], `idx` (fibonacci index)
3. Add `{ name: 'my-anim', fn: stateMyAnim }` to the `STATES` array
4. The blend system handles transitions automatically

---

## Ideas for Future States

- **bounce** — elastic collision: dots bounce off sphere boundary walls
- **flock** — boids: dots follow flocking rules (separation, alignment, cohesion)
- **morph** — shape shift: dots rearrange into geometric solids (cube, tetrahedron, octahedron)
- **rain** — cascade: dots fall from top with staggered timing, reform at top
- **wave-2d** — surface wave: XY plane standing wave pattern, no sphere structure
- **split** — mitosis: sphere splits into two smaller spheres that orbit each other
- **magnetic** — field lines: dots trace paths along a dipole magnetic field
