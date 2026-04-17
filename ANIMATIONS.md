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
| Highlight | Comet trail — bright arc chasing each ring |

**Concept**: Atom / gyroscope. Three rings of dots orbit the center at different inclinations and speeds, like electron shells. A bright "comet" arc sweeps around each ring slightly faster than the ring itself.

**Math**:
- Ring 1 (14 dots): tiltX=0.25, near-horizontal, 1.3 rad/s CW
- Ring 2 (13 dots): tiltX=1.15 tiltZ=0.55, steep, −0.85 rad/s CCW
- Ring 3 (13 dots): tiltX=−0.75 tiltZ=−0.4, opposite tilt, 0.6 rad/s CW
- Each point: unit circle → tilt around X → tilt around Z → project
- **Band**: reference angle at 1.6× ring speed, `atan2(sin(angle−ref), cos(angle−ref))` for shortest arc distance, quadratic falloff `(1−d/0.8)²` within 0.8 rad

---

### 6. helix — DNA 双螺旋

| Property | Value |
|----------|-------|
| Motion | Rotation around vertical axis @ 0.9 rad/s |
| Shape | Two intertwined helical strands |
| Highlight | Traveling pulse — bright dot runs along each strand |

**Concept**: DNA double helix. 40 dots split into 2 strands of 20, winding around a vertical axis. A bright pulse travels along each strand continuously, offset by half a cycle between strands.

**Math**:
- Strand assignment: even indices → strand 0, odd → strand 1
- Helix angle: `t × 1.5 × 2π + strand × π + time × 0.9`
- 1.5 full turns, x = cos(angle), z = sin(angle), y spans [−1, 1]
- Projection: x scaled ×5.2, y scaled ×7.2 from center
- **Band**: pulse position `(time×0.5 + strand×0.5) mod 1`, wrapped distance to each dot's `t` parameter, quadratic falloff within 0.12

---

### 7. nova — 脉冲星

| Property | Value |
|----------|-------|
| Motion | Slow rotation @ 0.4 rad/s + cascading radial pulse |
| Shape | Sphere with oscillating per-point radius |
| Highlight | Scanning latitude band sweeping pole to pole |

**Concept**: Pulsating energy orb. Each point expands and contracts radially with a phase offset based on its longitude and latitude, creating a cascading ripple of expansion across the sphere. A bright horizontal band sweeps up and down.

**Math**:
- Phase delay: `atan2(pt.z, pt.x) × 0.4 + pt.y × 0.7` — diagonal cascade
- Radial scale: `0.65 + 0.35 × sin(t × 1.6 + delay)` — each point between 30%–100% radius
- **Band**: `|pt.y − sin(t × 1.3)|`, power falloff 1.5 within 0.28, boosts size ×1.65 and opacity +0.45
- Band highlight blends color toward front blue via `lerpC`

---

### 8. knot — 三叶结

| Property | Value |
|----------|-------|
| Motion | Rotation @ 0.45 rad/s around Y, tilt 0.35 rad |
| Shape | Trefoil knot curve (topology) |
| Highlight | Traveling pulse along the knot |

**Concept**: A trefoil knot — the simplest non-trivial mathematical knot. 40 dots trace the curve, the whole structure rotates in 3D. A bright pulse runs along the knot path.

**Math**:
- Trefoil parametric: `x = (sin θ + 2 sin 2θ)/3`, `y = (cos θ − 2 cos 2θ)/3`, `z = −sin 3θ / 1.5`
- θ = idx/40 × 2π — evenly distributed along curve
- **Band**: traveling pulse at `(time × 0.3) mod 1`, wrap-around distance, quadratic falloff within 0.09 of parameter space

---

### 9. torus — 环面

| Property | Value |
|----------|-------|
| Motion | Rotation @ 0.55 rad/s, tilt 0.55 rad |
| Shape | Torus surface (R=0.65, r=0.28) |
| Highlight | Bright ring circling the tube cross-section |

**Concept**: A mathematical torus (donut). Different topology from the sphere — genus 1 surface. 40 dots distributed as 10 around the ring × 4 around the tube. A bright band circles the tube.

**Math**:
- Parametric torus: `x = (R + r cos v) cos u`, `y = (R + r cos v) sin u`, `z = r sin v`
- u = idx%10/10 × 2π (ring position), v = floor(idx/10)/4 × 2π (tube position)
- **Band**: reference v angle at `time × 1.8`, shortest arc distance via `atan2`, quadratic falloff within 0.8 rad

---

### 10. pendulum — 波摆

| Property | Value |
|----------|-------|
| Motion | Each dot swings at incrementally different frequency |
| Shape | Horizontal array, vertical oscillation |
| Highlight | Glow at swing extremes (mathematical turning points) |

**Concept**: The classic wave pendulum — 40 pendulums in a row, each with slightly higher frequency. They periodically align into waves, scatter, then realign. A direct visualization of harmonic analysis.

**Math**:
- Frequency gradient: `ω_i = 0.5 + i × 0.032` Hz (0.50 → 1.75 Hz)
- Position: `x = 2i/39 − 1` (horizontal), `y = sin(ω_i × 2πt) × 0.78` (vertical swing)
- Depth: `z = cos(ω_i × 2πt) × 0.45` — each pendulum traces an ellipse in y-z plane
- **Band**: `|sin(phase)|` > 0.86 — dots glow at turning points where velocity = 0

---

### 11. split — 双星

| Property | Value |
|----------|-------|
| Motion | Two 20-point spheres orbiting shared center, counter-rotating |
| Shape | Binary system (2-body orbit) |
| Highlight | Horizontal wave band across both spheres |

**Concept**: Binary star system / cell mitosis. The original sphere splits into two smaller counter-rotating spheres orbiting each other in an elliptical path. Each sub-sphere has its own 20-point fibonacci distribution.

**Math**:
- Orbit: center offset `(cos(t×0.6)×0.45, sin(t×0.6)×0.25)`, mirrored for each sphere
- Sub-sphere: fresh 20-point fibonacci sphere, each spinning at `t × 1.5` (CW) and `t × −1.05` (CCW)
- Tilt ±0.3 rad per sphere for visual separation
- **Band**: `|y − sin(t×1.5)×0.35|`, power falloff 1.5 within 0.18

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
- **magnetic** — field lines: dots trace paths along a dipole magnetic field
- **lorenz** — Lorenz attractor: dots trace the butterfly-shaped strange attractor (chaos theory)
- **mobius** — Möbius strip: dots on a non-orientable surface
- **fourier** — epicycloids: dots trace Fourier series as nested rotating circles (spirograph)
- ~~galaxy~~ — tried, 40 dots too sparse for a disc. Needs 80+
- ~~firefly~~ — replaced by knot. Too similar to ripple in visual result
