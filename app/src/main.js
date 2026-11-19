// Sunset Cover Studio — editor wiring.
// Owns the page: photo tray, layout + grade pickers, caption fields, panel
// crop/position, undo/redo, randomise and export. The live preview is a
// canvas re-rendered from src/cover.js on every edit.

import {
  LAYOUTS, GRADES, EXPORT_SIZES, defaultCoverState, layoutById, gradeById,
  sizeById, layoutPanels, renderCover, exportCoverPng,
} from './cover.js';

const SAMPLE_PHOTOS = [
  { src: 'samples/boulevard.jpg', name: 'Boulevard' },
  { src: 'samples/pier.jpg', name: 'Pier' },
  { src: 'samples/convertible.jpg', name: 'Convertible' },
  { src: 'samples/neon-friends.jpg', name: 'Neon Friends' },
];

const state = defaultCoverState();
const photos = []; // { img, name, src }
let selectedPanel = 0;
let undoStack = [];
let redoStack = [];
let fontsReady = false;

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

/** Load the vendored fonts, then re-render so lettering uses them. */
async function loadCoverFonts() {
  try {
    const anton = new FontFace('Anton', "url('fonts/Anton-Regular.ttf')");
    const pacifico = new FontFace('Pacifico', "url('fonts/Pacifico-Regular.ttf')");
    const [a, p] = await Promise.all([anton.load(), pacifico.load()]);
    document.fonts.add(a);
    document.fonts.add(p);
    await Promise.all([document.fonts.load('100px Anton'), document.fonts.load('40px Pacifico')]);
    fontsReady = true;
  } catch (err) {
    console.warn('cover fonts did not load, using fallback', err);
  }
  renderPreview();
}

/** Load one image from a URL or object URL. */
function loadPhotoImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load photo ${src}`));
    img.src = src;
  });
}

/** Add a photo to the tray and re-render. */
async function addPhoto(src, name) {
  const img = await loadPhotoImage(src);
  photos.push({ img, name, src });
  renderPhotoTray();
  renderPreview();
  return photos.length - 1;
}

/** Load the built-in sample photos. */
async function loadSamplePhotos() {
  for (const s of SAMPLE_PHOTOS) {
    try { await addPhoto(s.src, s.name); } catch (e) { console.warn(e.message); }
  }
}

/** The slot for panel i, created on demand. */
function slotFor(i) {
  if (!state.slots[i]) state.slots[i] = { photo: photos.length ? i % photos.length : 0, zoom: 1, dx: 0, dy: 0 };
  return state.slots[i];
}

/** Size the preview canvas to the chosen export aspect and draw the cover. */
function renderPreview() {
  const size = sizeById(state.size);
  const maxW = 960;
  const scale = Math.min(1, maxW / size.w, 620 / size.h);
  const W = Math.round(size.w * scale);
  const H = Math.round(size.h * scale);
  preview.width = W;
  preview.height = H;
  if (!photos.length) {
    pctx.fillStyle = '#1b0b2e';
    pctx.fillRect(0, 0, W, H);
    pctx.fillStyle = '#fff';
    pctx.font = '20px sans-serif';
    pctx.textAlign = 'center';
    pctx.fillText('Add a photo to start your cover', W / 2, H / 2);
    return;
  }
  const cover = renderCover(photos.map((p) => p.img), state, size.w, size.h);
  pctx.drawImage(cover, 0, 0, W, H);
  drawPanelSelection(W, H, size.w, size.h);
}

/** Outline the selected panel on the preview, scaled to preview size. */
function drawPanelSelection(pw, ph, cw, ch) {
  const geo = layoutPanels(state.layout, cw, ch);
  const rect = geo.panels[selectedPanel];
  if (!rect) return;
  const sx = pw / cw;
  const sy = ph / ch;
  pctx.save();
  pctx.strokeStyle = '#ffd76a';
  pctx.lineWidth = 3;
  pctx.setLineDash([10, 6]);
  pctx.strokeRect(rect.x * sx, rect.y * sy, rect.w * sx, rect.h * sy);
  pctx.setLineDash([]);
  pctx.fillStyle = '#ffd76a';
  pctx.font = 'bold 13px sans-serif';
  pctx.textAlign = 'left';
  pctx.fillText(`Panel ${selectedPanel + 1} — drag to pan, wheel to zoom`, rect.x * sx + 6, rect.y * sy + 20);
  pctx.restore();
}

/** Rebuild the photo tray thumbnails. */
function renderPhotoTray() {
  const tray = $('photoTray');
  tray.innerHTML = '';
  photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.className = 'tray-thumb';
    btn.title = `${photo.name} — click to put in panel ${selectedPanel + 1}`;
    const thumb = document.createElement('img');
    thumb.src = photo.src;
    thumb.alt = photo.name;
    btn.appendChild(thumb);
    const label = document.createElement('span');
    label.textContent = photo.name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      pushUndo();
      slotFor(selectedPanel).photo = i;
      renderPreview();
      renderPanelEditor();
    });
    tray.appendChild(btn);
  });
  const hint = document.createElement('p');
  hint.className = 'tray-hint';
  hint.textContent = 'Click a photo to place it in the selected panel. Drag files onto the page to add your own.';
  tray.appendChild(hint);
}

/** Build the layout picker buttons. */
function renderLayoutPicker() {
  const el = $('layoutPicker');
  el.innerHTML = '';
  LAYOUTS.forEach((layout) => {
    const btn = document.createElement('button');
    btn.className = 'pick' + (state.layout === layout.id ? ' active' : '');
    btn.textContent = layout.name;
    btn.addEventListener('click', () => {
      pushUndo();
      state.layout = layout.id;
      selectedPanel = 0;
      renderLayoutPicker();
      renderPanelEditor();
      renderPreview();
    });
    el.appendChild(btn);
  });
}

/** Build the grade picker swatches. */
function renderGradePicker() {
  const el = $('gradePicker');
  el.innerHTML = '';
  GRADES.forEach((grade) => {
    const btn = document.createElement('button');
    btn.className = 'grade' + (state.grade === grade.id ? ' active' : '');
    btn.style.background = `linear-gradient(135deg, ${grade.stops.join(', ')})`;
    const label = document.createElement('span');
    label.textContent = grade.name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      pushUndo();
      state.grade = grade.id;
      renderGradePicker();
      renderPreview();
    });
    el.appendChild(btn);
  });
}

/** Build the export-size picker. */
function renderSizePicker() {
  const el = $('sizePicker');
  el.innerHTML = '';
  EXPORT_SIZES.forEach((size) => {
    const btn = document.createElement('button');
    btn.className = 'pick' + (state.size === size.id ? ' active' : '');
    btn.textContent = size.label;
    btn.addEventListener('click', () => {
      state.size = size.id;
      renderSizePicker();
      renderPreview();
    });
    el.appendChild(btn);
  });
}

/** Panel editor: which photo, zoom slider, reset crop. */
function renderPanelEditor() {
  const geo = layoutPanels(state.layout, 100, 100);
  const sel = $('panelSelect');
  sel.innerHTML = '';
  geo.panels.forEach((_, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Panel ${i + 1}`;
    sel.appendChild(opt);
  });
  sel.value = String(Math.min(selectedPanel, geo.panels.length - 1));
  const slot = slotFor(selectedPanel);
  $('zoomSlider').value = String(slot.zoom);
  $('zoomLabel').textContent = `${Math.round(slot.zoom * 100)}%`;
  const photoSel = $('panelPhoto');
  photoSel.innerHTML = '';
  photos.forEach((photo, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = photo.name;
    photoSel.appendChild(opt);
  });
  photoSel.value = String(slot.photo);
}

/** Snapshot the state for undo. */
function pushUndo() {
  undoStack.push(JSON.stringify(state));
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function undoEdit() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(state));
  Object.assign(state, JSON.parse(undoStack.pop()));
  syncEditor();
  updateUndoButtons();
}

function redoEdit() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(state));
  Object.assign(state, JSON.parse(redoStack.pop()));
  syncEditor();
  updateUndoButtons();
}

function updateUndoButtons() {
  $('undoBtn').disabled = undoStack.length === 0;
  $('redoBtn').disabled = redoStack.length === 0;
}

/** Randomise layout + grade (shuffle button). */
function randomiseCover() {
  pushUndo();
  state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
  state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
  selectedPanel = 0;
  syncEditor();
}

/** Fill every panel with one photo (the "one photo everywhere" shortcut). */
function fillAllWithPhoto(index) {
  pushUndo();
  const geo = layoutPanels(state.layout, 100, 100);
  geo.panels.forEach((_, i) => { slotFor(i).photo = index; });
  renderPreview();
  renderPanelEditor();
}

/** Rebuild every picker from the current state (after undo/redo/randomise). */
function syncEditor() {
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('ribbonInput').value = state.ribbon;
  $('grainToggle').checked = state.grain;
  $('vignetteToggle').checked = state.vignette;
  $('halftoneToggle').checked = state.halftone;
  renderLayoutPicker();
  renderGradePicker();
  renderSizePicker();
  renderPanelEditor();
  renderPreview();
}

/** Deterministic screenshot scenes via query params, e.g.
 * ?shot=cover&layout=heroThree&photo=pier&title=VICE%20CITY&grade=neonNights
 * ?shot=editor&layout=fourPanel&grade=viceSunset */
function applyShotParams() {
  const q = new URLSearchParams(location.search);
  if (q.get('layout') && layoutById(q.get('layout'))) state.layout = q.get('layout');
  if (q.get('grade') && gradeById(q.get('grade'))) state.grade = q.get('grade');
  if (q.get('size') && sizeById(q.get('size'))) state.size = q.get('size');
  if (q.get('title')) state.title = q.get('title');
  if (q.get('subtitle') !== null) state.subtitle = q.get('subtitle') || '';
  if (q.get('ribbon') !== null) state.ribbon = q.get('ribbon') || '';
  if (q.get('grain') === '0') state.grain = false;
  if (q.get('vignette') === '0') state.vignette = false;
  if (q.get('halftone') === '0') state.halftone = false;
  const photoName = q.get('photo');
  if (photoName) {
    // The named photo leads; the other panels cycle through the samples,
    // so a shot shows several photos instead of one photo repeated.
    const idx = SAMPLE_PHOTOS.findIndex((s) => s.src.includes(photoName));
    if (idx >= 0) {
      const geo = layoutPanels(state.layout, 100, 100);
      geo.panels.forEach((_, i) => { slotFor(i).photo = (idx + i) % SAMPLE_PHOTOS.length; });
    }
  }
}

/** Wire up every control on the page. */
function bindEditor() {
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
  $('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });
  $('ribbonInput').addEventListener('input', (e) => { state.ribbon = e.target.value; renderPreview(); });
  $('grainToggle').addEventListener('change', (e) => { state.grain = e.target.checked; renderPreview(); });
  $('vignetteToggle').addEventListener('change', (e) => { state.vignette = e.target.checked; renderPreview(); });
  $('halftoneToggle').addEventListener('change', (e) => { state.halftone = e.target.checked; renderPreview(); });
  $('undoBtn').addEventListener('click', undoEdit);
  $('redoBtn').addEventListener('click', redoEdit);
  $('randomBtn').addEventListener('click', randomiseCover);
  $('fillOneBtn').addEventListener('click', () => {
    const sel = $('panelPhoto');
    fillAllWithPhoto(Number(sel.value || 0));
  });
  $('exportBtn').addEventListener('click', async () => {
    const btn = $('exportBtn');
    btn.disabled = true;
    btn.textContent = 'Exporting…';
    try {
      await exportCoverPng(photos.map((p) => p.img), state, state.size);
      $('statusLine').textContent = `Exported ${state.size} PNG — check your downloads.`;
    } catch (err) {
      $('statusLine').textContent = `Export failed: ${err.message}`;
    }
    btn.disabled = false;
    btn.textContent = 'Export PNG';
  });
  $('panelSelect').addEventListener('change', (e) => {
    selectedPanel = Number(e.target.value);
    renderPanelEditor();
    renderPreview();
  });
  $('panelPhoto').addEventListener('change', (e) => {
    pushUndo();
    slotFor(selectedPanel).photo = Number(e.target.value);
    renderPreview();
  });
  $('zoomSlider').addEventListener('input', (e) => {
    slotFor(selectedPanel).zoom = Number(e.target.value);
    $('zoomLabel').textContent = `${Math.round(slotFor(selectedPanel).zoom * 100)}%`;
    renderPreview();
  });
  // Snapshot undo state when the user starts a zoom drag, not after it.
  $('zoomSlider').addEventListener('pointerdown', pushUndo);
  $('resetCropBtn').addEventListener('click', () => {
    pushUndo();
    slotFor(selectedPanel).zoom = 1;
    slotFor(selectedPanel).dx = 0;
    slotFor(selectedPanel).dy = 0;
    renderPanelEditor();
    renderPreview();
  });
  // File input + drag-and-drop for the user's own photos.
  $('fileInput').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      if (!file.type.startsWith('image/')) continue;
      await addPhoto(URL.createObjectURL(file), file.name.replace(/\.[^.]+$/, ''));
    }
    e.target.value = '';
  });
  const dropZone = $('dropZone');
  ['dragover', 'dragenter'].forEach((ev) => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach((ev) => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.remove('dragging'); }));
  dropZone.addEventListener('drop', async (e) => {
    for (const file of e.dataTransfer.files) {
      if (!file.type.startsWith('image/')) continue;
      await addPhoto(URL.createObjectURL(file), file.name.replace(/\.[^.]+$/, ''));
    }
  });
  // Click a panel on the preview to select it; drag to pan, wheel to zoom.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const panelAt = (e) => {
    const rect = preview.getBoundingClientRect();
    const size = sizeById(state.size);
    const px = (e.clientX - rect.left) * (size.w / rect.width);
    const py = (e.clientY - rect.top) * (size.h / rect.height);
    const geo = layoutPanels(state.layout, size.w, size.h);
    return geo.panels.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
  };
  preview.addEventListener('pointerdown', (e) => {
    const i = panelAt(e);
    if (i < 0) return;
    pushUndo();
    selectedPanel = i;
    renderPanelEditor();
    renderPreview();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const size = sizeById(state.size);
    const rect = preview.getBoundingClientRect();
    const slot = slotFor(selectedPanel);
    const geo = layoutPanels(state.layout, size.w, size.h);
    const panel = geo.panels[selectedPanel];
    slot.dx += ((e.clientX - lastX) / rect.width) * (size.w / panel.w) * 0.9;
    slot.dy += ((e.clientY - lastY) / rect.height) * (size.h / panel.h) * 0.9;
    slot.dx = Math.max(-1, Math.min(1, slot.dx));
    slot.dy = Math.max(-1, Math.min(1, slot.dy));
    lastX = e.clientX;
    lastY = e.clientY;
    renderPreview();
  });
  preview.addEventListener('pointerup', () => { dragging = false; });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const i = panelAt(e);
    if (i < 0) return;
    selectedPanel = i;
    const slot = slotFor(selectedPanel);
    slot.zoom = Math.max(1, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
    renderPanelEditor();
    renderPreview();
  }, { passive: false });
}

/** Boot: fonts, samples, shot params, then the first render. */
async function bootCoverStudio() {
  bindEditor();
  applyShotParams();
  syncEditor();
  await loadSamplePhotos();
  await loadCoverFonts();
  renderPreview();
  // Handle for the shot script: export the real app cover as PNG bytes.
  window.coverApp = {
    state,
    photos,
    renderPreview,
    exportPngBytes: (sizeId) => new Promise((resolve, reject) => {
      const size = sizeById(sizeId || state.size);
      const canvas = renderCover(photos.map((p) => p.img), state, size.w, size.h);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('no PNG bytes')); return; }
        blob.arrayBuffer().then((buf) => resolve({ bytes: new Uint8Array(buf), width: size.w, height: size.h }));
      }, 'image/png');
    }),
  };
  window.coverReady = true;
}

bootCoverStudio();
