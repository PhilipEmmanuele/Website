# Plan: Upgrade Scatter Plot from 2D to 3D

## Status
- `export_for_web.py` — DONE. Already re-run. `data/projection_3d.json` now
  contains `x`, `y`, `z` arrays and `pca_components` is shape [3][10].
- `index.html` — TODO. This is the only file that needs changes.

---

## Context

The app is a fully client-side phylogenetic explorer. It loads two JSON files:
- `data/species_10d.json` — 2469 species, each with 10D coords + taxonomy
- `data/projection_3d.json` — PCA projection of those 10D coords (now 3D)

The current scatter plot uses a raw HTML5 Canvas with 2D drawing. The goal is
to replace it with a Three.js 3D scatter while leaving everything else
(sliders, species panel, search selector, data loading, nearest-neighbour
search, results panel) completely untouched.

---

## Changes to `index.html`

### Step 1 — Add Three.js CDN scripts

In the `<head>` block, add these two lines right before `</head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/three@0.163/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.163/examples/js/controls/OrbitControls.js"></script>
```

---

### Step 2 — Replace the plot panel HTML

Find:
```html
  <!-- ── Scatter plot ── -->
  <div class="plot-panel" id="plot-panel">
    <canvas id="scatter-canvas"></canvas>
    <div class="legend" id="legend"></div>
  </div>
```

Replace with:
```html
  <!-- ── Scatter plot ── -->
  <div class="plot-panel" id="plot-panel">
    <div id="three-container" style="width:100%;height:100%;"></div>
    <div class="legend" id="legend"></div>
    <div id="plot-hint" style="position:absolute;bottom:10px;left:12px;font-size:0.7rem;color:var(--text-muted);">
      Drag to rotate &middot; Scroll to zoom &middot; Click dot to snap sliders
    </div>
  </div>
```

---

### Step 3 — Update the `init()` function

Find:
```javascript
function init() {
  assignColors(DATA.taxonomy);
  buildSliders();
  buildSpeciesSelector();
  buildLegend();
  initCanvas();

  // Start at mean position
  currentVec = [...DATA.dim_mean];
  setSliderValues(currentVec);
  update();

  window.addEventListener("resize", () => { resizeCanvas(); drawScatter(); });
}
```

Replace with:
```javascript
function init() {
  assignColors(DATA.taxonomy);
  buildSliders();
  buildSpeciesSelector();
  buildLegend();
  initThree();

  // Start at mean position
  currentVec = [...DATA.dim_mean];
  setSliderValues(currentVec);
  update();
  // resize listener is registered inside initThree()
}
```

---

### Step 4 — Delete the old scatter block and replace with Three.js

Find and delete everything from this comment:
```javascript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scatter plot (2D PCA of 10D coords)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
...all the way down to and including this line:
```javascript
  canvas.addEventListener("click", onCanvasClick);
}
```

The full list of things being deleted:
- Variable declarations: `canvas`, `ctx`, `scatterX`, `scatterY`, `plotBounds`, `hoveredIdx`, `PAD`
- Functions: `initCanvas()`, `resizeCanvas()`, `precomputeScatterCoords()`,
  `projectCurrentVec()`, `drawScatter()`, `getHoveredSpecies()`,
  `onCanvasMouseMove()`, `onCanvasClick()`

Then find and replace the old `update()` and boot block:

Old `update()`:
```javascript
function update() {
  const ranked = cosineDistTo(currentVec);
  updateResults(ranked.slice(0, 5));
  drawScatter();
}
```

New `update()` (replace in place):
```javascript
function update() {
  const ranked = cosineDistTo(currentVec);
  updateResults(ranked.slice(0, 5));
  updateMarker();
  updateHighlight(ranked[0].idx);
}
```

---

### Step 5 — Paste the new Three.js block

Paste this entire block between the `update()` function and the `// Boot` comment:

```javascript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Three.js 3D Scatter Plot
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let threeRenderer, threeScene, threeCamera, threeControls;
let threePoints;          // THREE.Points — all species dots
let markerMesh;           // THREE.Mesh sphere — current slider position
let highlightMesh;        // THREE.Mesh sphere — top-1 nearest species (gold)
let hoveredIdx = -1;
let scatterPositions;     // Float32Array [N*3] for raycasting index lookup
let scatterScale;         // {cx,cy,cz,scale} normalisation so coords fit in [-1,1]

const POINT_SIZE    = 4.0;   // dot size in screen pixels (sizeAttenuation: false)
const MARKER_RADIUS = 0.035; // sphere radius in scene units

function initThree() {
  const container = document.getElementById("three-container");
  const W = container.clientWidth;
  const H = container.clientHeight;

  // Renderer
  threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  threeRenderer.setPixelRatio(window.devicePixelRatio);
  threeRenderer.setSize(W, H);
  threeRenderer.setClearColor(0x0f1117);
  container.appendChild(threeRenderer.domElement);

  // Scene
  threeScene = new THREE.Scene();

  // Camera
  threeCamera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
  threeCamera.position.set(0, 0, 3);

  // OrbitControls — drag to rotate, scroll to zoom
  threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
  threeControls.enableDamping = true;
  threeControls.dampingFactor = 0.08;
  threeControls.minDistance   = 0.5;
  threeControls.maxDistance   = 10;

  buildPointCloud();

  // White sphere — current slider position
  markerMesh = new THREE.Mesh(
    new THREE.SphereGeometry(MARKER_RADIUS, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false })
  );
  markerMesh.renderOrder = 2;
  threeScene.add(markerMesh);

  // Gold sphere — nearest species
  highlightMesh = new THREE.Mesh(
    new THREE.SphereGeometry(MARKER_RADIUS * 1.4, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffd166, depthTest: false })
  );
  highlightMesh.renderOrder = 1;
  highlightMesh.visible = false;
  threeScene.add(highlightMesh);

  window.addEventListener("resize", onThreeResize);
  threeRenderer.domElement.addEventListener("mousemove", onThreeMouseMove);
  threeRenderer.domElement.addEventListener("click",     onThreeClick);

  animate();
}

function buildPointCloud() {
  const px = PROJ2D.x;
  const py = PROJ2D.y;
  const pz = PROJ2D.z;
  const N  = px.length;

  // Normalise all axes uniformly to fit in roughly [-1, 1]
  let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity,zmin=Infinity,zmax=-Infinity;
  for (let i=0;i<N;i++){
    if(px[i]<xmin)xmin=px[i]; if(px[i]>xmax)xmax=px[i];
    if(py[i]<ymin)ymin=py[i]; if(py[i]>ymax)ymax=py[i];
    if(pz[i]<zmin)zmin=pz[i]; if(pz[i]>zmax)zmax=pz[i];
  }
  const cx = (xmin+xmax)/2, cy = (ymin+ymax)/2, cz = (zmin+zmax)/2;
  const scale = 2 / Math.max(xmax-xmin, ymax-ymin, zmax-zmin, 1e-9);
  scatterScale = { cx, cy, cz, scale };

  const positions = new Float32Array(N * 3);
  const colors    = new Float32Array(N * 3);
  const tmp = new THREE.Color();

  for (let i = 0; i < N; i++) {
    positions[i*3+0] = (px[i] - cx) * scale;
    positions[i*3+1] = (py[i] - cy) * scale;
    positions[i*3+2] = (pz[i] - cz) * scale;
    tmp.set(colorForSpecies(i));
    colors[i*3+0] = tmp.r;
    colors[i*3+1] = tmp.g;
    colors[i*3+2] = tmp.b;
  }
  scatterPositions = positions;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(colors,    3));

  const mat = new THREE.PointsMaterial({
    size:            POINT_SIZE,
    sizeAttenuation: false,  // constant pixel size at all zoom levels
    vertexColors:    true,
    transparent:     true,
    opacity:         0.75,
  });

  threePoints = new THREE.Points(geo, mat);
  threeScene.add(threePoints);
}

function projectToScene(vec10d) {
  // Project a 10D vector through PCA into Three.js scene coordinates.
  // PROJ2D.pca_components is [3][10], PROJ2D.pca_mean is [10].
  const mean  = PROJ2D.pca_mean;
  const comps = PROJ2D.pca_components;
  let pc = [0, 0, 0];
  for (let c = 0; c < 3; c++)
    for (let d = 0; d < 10; d++)
      pc[c] += (vec10d[d] - mean[d]) * comps[c][d];
  const { cx, cy, cz, scale } = scatterScale;
  return {
    x: (pc[0] - cx) * scale,
    y: (pc[1] - cy) * scale,
    z: (pc[2] - cz) * scale,
  };
}

function updateMarker() {
  if (!markerMesh || !currentVec || !scatterScale) return;
  const { x, y, z } = projectToScene(currentVec);
  markerMesh.position.set(x, y, z);
}

function updateHighlight(speciesIdx) {
  if (!highlightMesh || !scatterPositions) return;
  if (speciesIdx < 0) { highlightMesh.visible = false; return; }
  highlightMesh.position.set(
    scatterPositions[speciesIdx*3+0],
    scatterPositions[speciesIdx*3+1],
    scatterPositions[speciesIdx*3+2],
  );
  highlightMesh.visible = true;
}

function animate() {
  requestAnimationFrame(animate);
  threeControls.update();
  threeRenderer.render(threeScene, threeCamera);
}

function onThreeResize() {
  const container = document.getElementById("three-container");
  const W = container.clientWidth;
  const H = container.clientHeight;
  threeCamera.aspect = W / H;
  threeCamera.updateProjectionMatrix();
  threeRenderer.setSize(W, H);
}

// ── Raycasting for hover & click ──────────────────────────────────────
const _raycaster = new THREE.Raycaster();
_raycaster.params.Points.threshold = 0.04;  // pick radius in scene units; tune if needed
const _mouse = new THREE.Vector2();

function getMouseNDC(e) {
  const rect = threeRenderer.domElement.getBoundingClientRect();
  _mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
  _mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
}

function onThreeMouseMove(e) {
  getMouseNDC(e);
  _raycaster.setFromCamera(_mouse, threeCamera);
  const hits = _raycaster.intersectObject(threePoints);
  const tip  = document.getElementById("tooltip");

  if (hits.length > 0) {
    const idx = hits[0].index;
    hoveredIdx = idx;
    const t = DATA.taxonomy[idx];
    const name = t.species || DATA.species_ids[idx];
    tip.style.display = "block";
    tip.style.left    = (e.clientX + 14) + "px";
    tip.style.top     = (e.clientY - 10) + "px";
    tip.innerHTML = `
      <div class="t-name">${name}</div>
      <div class="t-row">Class: ${t.class  || "—"}</div>
      <div class="t-row">Order: ${t.order  || "—"}</div>
      <div class="t-row">Family: ${t.family || "—"}</div>
    `;
    threeRenderer.domElement.style.cursor = "pointer";
  } else {
    hoveredIdx = -1;
    tip.style.display = "none";
    threeRenderer.domElement.style.cursor = "default";
  }
}

function onThreeClick(e) {
  getMouseNDC(e);
  _raycaster.setFromCamera(_mouse, threeCamera);
  const hits = _raycaster.intersectObject(threePoints);
  if (hits.length > 0) {
    const idx = hits[0].index;
    currentVec = [...DATA.coords[idx]];
    setSliderValues(currentVec);
    update();
  }
}
```

---

## Verification checklist

1. Browser console is clean (no errors on load)
2. 3D point cloud appears, colored by taxonomic class
3. Drag rotates the cloud (OrbitControls)
4. Scroll zooms in/out
5. White sphere is visible and moves when sliders change
6. Gold sphere jumps to the nearest species when sliders change
7. Hovering a dot shows the tooltip with name/class/order/family
8. Clicking a dot snaps all 10 sliders to that species
9. Selecting from the species dropdown moves the white sphere
10. Reset button returns to mean position and repositions marker

---

## Pitfalls

- **OrbitControls CDN**: use `examples/js/controls/OrbitControls.js` (non-module),
  which attaches to `THREE.OrbitControls` as a global. Do NOT use the `jsm/`
  ES-module version — it requires an import map.
- **`sizeAttenuation: false`**: keeps dots a constant pixel size regardless of zoom. Keep it.
- **`depthTest: false`** on marker/highlight meshes: ensures they always render
  on top and are never hidden inside the cloud. Keep it.
- **Raycaster threshold** (`0.04`): if hover feels hard to trigger, increase to `0.06`.
  If nearby dots steal hover, decrease to `0.02`.
- **Do not call `drawScatter()`** anywhere — that function no longer exists.
  The `animate()` loop handles all redraws.

---

## Re-packaging for deployment after changes

```bash
cd ~/Goodfire_Evo2
tar -czf phylo-tuner.tar.gz phylo-tuner/index.html phylo-tuner/data/
```

Three.js loads from CDN so the tar stays small. The `data/` folder now contains
the updated `projection_3d.json` with `x`, `y`, `z` fields.
