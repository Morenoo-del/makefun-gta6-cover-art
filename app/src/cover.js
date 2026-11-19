// Sunset Cover Studio — cover rendering engine.
// All drawing happens on a 2D canvas: panels, colour grades, lettering and
// effects. No network, no library: every pixel comes from photos the user
// loaded on their own machine and gradients computed here.

export const LAYOUTS = [
  { id: 'fourPanel', name: 'Four Panel Grid', panels: 4 },
  { id: 'heroThree', name: 'Hero + Three', panels: 4 },
  { id: 'fullBleed', name: 'Full Bleed', panels: 1 },
  { id: 'nineGrid', name: 'Nine Panel Cover', panels: 8 },
  { id: 'tiltedCollage', name: 'Tilted Snapshot Collage', panels: 4 },
  { id: 'storyPortrait', name: 'Story Portrait', panels: 3 },
];

export const GRADES = [
  { id: 'viceSunset', name: 'Vice Sunset', stops: ['#ff9a3c', '#ff5e78', '#7b2ff7'], tint: '#ff7a3c', sat: 1.35, contrast: 1.08 },
  { id: 'neonNights', name: 'Neon Nights', stops: ['#ff2e88', '#7b2ff7', '#00e5ff'], tint: '#ff2e88', sat: 1.45, contrast: 1.12 },
  { id: 'palmDusk', name: 'Palm Dusk', stops: ['#ffb347', '#e2583e', '#2b1055'], tint: '#e2583e', sat: 1.25, contrast: 1.05 },
  { id: 'goldenHour', name: 'Golden Hour', stops: ['#ffd76a', '#ff9a3c', '#c96f2e'], tint: '#ffb347', sat: 1.3, contrast: 1.06 },
  { id: 'tealNoir', name: 'Teal Noir', stops: ['#0f2027', '#2c5364', '#00d2ff'], tint: '#00d2ff', sat: 1.15, contrast: 1.14 },
];

export const EXPORT_SIZES = [
  { id: '1920x1080', label: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
  { id: '1080x1350', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: '1080x1080', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
];

const GUTTER = 10;

/** A cover's editable state (photos live outside it, as loaded Images). */
export function defaultCoverState() {
  return {
    layout: 'heroThree',
    grade: 'viceSunset',
    title: 'SUNSET CITY',
    subtitle: 'one last ride',
    ribbon: 'SUNSET CITY',
    // one slot per panel: { photo: index into photos, zoom, dx, dy }
    slots: [],
    grain: true,
    vignette: true,
    halftone: true,
    size: '1920x1080',
  };
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export function sizeById(id) {
  return EXPORT_SIZES.find((s) => s.id === id) || EXPORT_SIZES[0];
}

/** Panel rectangles (and the title block) for a layout at W x H. */
export function layoutFourPanel(W, H) {
  const g = GUTTER;
  const hw = (W - g * 3) / 2;
  const hh = (H - g * 3) / 2;
  return {
    panels: [
      { x: g, y: g, w: hw, h: hh },
      { x: g * 2 + hw, y: g, w: hw, h: hh },
      { x: g, y: g * 2 + hh, w: hw, h: hh },
      { x: g * 2 + hw, y: g * 2 + hh, w: hw, h: hh },
    ],
    title: { x: 0, y: H * 0.62, w: W, h: H * 0.38, align: 'center' },
  };
}

export function layoutHeroThree(W, H) {
  const g = GUTTER;
  const heroW = W * 0.62 - g;
  const sideW = W - heroW - g * 3;
  const sideH = (H - g * 4) / 3;
  return {
    panels: [
      { x: g, y: g, w: heroW, h: H - g * 2 },
      { x: heroW + g * 2, y: g, w: sideW, h: sideH },
      { x: heroW + g * 2, y: g * 2 + sideH, w: sideW, h: sideH },
      { x: heroW + g * 2, y: g * 3 + sideH * 2, w: sideW, h: sideH },
    ],
    title: { x: 0, y: H * 0.58, w: heroW + g, h: H * 0.42, align: 'left' },
  };
}

export function layoutFullBleed(W, H) {
  return {
    panels: [{ x: 0, y: 0, w: W, h: H }],
    title: { x: 0, y: H * 0.66, w: W, h: H * 0.34, align: 'center' },
  };
}

export function layoutNineGrid(W, H) {
  const g = GUTTER;
  const cw = (W - g * 4) / 3;
  const ch = (H - g * 4) / 3;
  const panels = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (r === 1 && c === 1) continue; // centre cell is the title block
      panels.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch });
    }
  }
  return {
    panels,
    title: { x: g + cw + g, y: g + ch + g, w: cw, h: ch, align: 'center', block: true },
  };
}

export function layoutTiltedCollage(W, H) {
  const pw = W * 0.42;
  const ph = H * 0.52;
  return {
    panels: [
      { x: W * 0.06, y: H * 0.05, w: pw, h: ph, rot: -4 },
      { x: W * 0.52, y: H * 0.04, w: pw, h: ph, rot: 3 },
      { x: W * 0.10, y: H * 0.47, w: pw, h: ph, rot: 3 },
      { x: W * 0.50, y: H * 0.48, w: pw, h: ph, rot: -3 },
    ],
    title: { x: 0, y: H * 0.40, w: W, h: H * 0.22, align: 'center', band: true },
  };
}

export function layoutStoryPortrait(W, H) {
  const g = GUTTER;
  const topH = H * 0.55 - g;
  const botH = H - topH - g * 3;
  const botW = (W - g * 3) / 2;
  return {
    panels: [
      { x: g, y: g, w: W - g * 2, h: topH },
      { x: g, y: topH + g * 2, w: botW, h: botH },
      { x: g * 2 + botW, y: topH + g * 2, w: botW, h: botH },
    ],
    title: { x: 0, y: H * 0.36, w: W, h: H * 0.2, align: 'center', band: true },
  };
}

/** Dispatch: panel geometry for any layout id. */
export function layoutPanels(layoutId, W, H) {
  switch (layoutId) {
    case 'fourPanel': return layoutFourPanel(W, H);
    case 'heroThree': return layoutHeroThree(W, H);
    case 'fullBleed': return layoutFullBleed(W, H);
    case 'nineGrid': return layoutNineGrid(W, H);
    case 'tiltedCollage': return layoutTiltedCollage(W, H);
    case 'storyPortrait': return layoutStoryPortrait(W, H);
    default: return layoutHeroThree(W, H);
  }
}

/** Draw one photo into a panel rect, honouring its crop (zoom + pan). */
export function drawPhotoPanel(ctx, img, rect, slot) {
  const zoom = slot?.zoom ?? 1;
  const dx = slot?.dx ?? 0;
  const dy = slot?.dy ?? 0;
  ctx.save();
  if (rect.rot) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.beginPath();
    ctx.rect(0, 0, rect.w, rect.h);
    ctx.clip();
    drawCoverFit(ctx, img, 0, 0, rect.w, rect.h, zoom, dx, dy);
    ctx.restore();
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  drawCoverFit(ctx, img, rect.x, rect.y, rect.w, rect.h, zoom, dx, dy);
  ctx.restore();
}

/** Cover-fit an image into a rect, scaled by zoom and panned by dx/dy (-1..1). */
export function drawCoverFit(ctx, img, x, y, w, h, zoom, dx, dy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = x + (w - dw) / 2 + dx * (dw - w) * 0.5;
  const oy = y + (h - dh) / 2 + dy * (dh - h) * 0.5;
  ctx.drawImage(img, ox, oy, dw, dh);
}

/** Wash the whole cover with the grade: tint, saturation, contrast, gradient. */
export function applyGrade(ctx, W, H, grade) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, grade.stops[0]);
  grad.addColorStop(0.55, grade.stops[1]);
  grad.addColorStop(1, grade.stops[2]);
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // Warm bottom glow, like a sunset over the panels.
  const glow = ctx.createLinearGradient(0, H * 0.55, 0, H);
  glow.addColorStop(0, 'rgba(255,122,60,0)');
  glow.addColorStop(1, 'rgba(255,122,60,0.22)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);
}

/** Sunset-gradient title lettering with a dark outline and soft shadow. */
export function drawTitleLettering(ctx, title, subtitle, rect, W, H, grade, halftone) {
  const pad = Math.max(24, W * 0.03);
  const cx = rect.align === 'left' ? rect.x + pad : rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const titleSize = Math.min(rect.h * 0.52, (rect.w - pad * 2) / Math.max(4, title.length * 0.62));
  const fontPx = Math.max(28, titleSize);
  ctx.save();
  ctx.textAlign = rect.align === 'left' ? 'left' : 'center';
  ctx.textBaseline = 'middle';
  // Dark scrim behind the lettering so it reads on any photo.
  const scrim = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  scrim.addColorStop(0, 'rgba(10,6,20,0)');
  scrim.addColorStop(0.35, 'rgba(10,6,20,0.55)');
  scrim.addColorStop(1, 'rgba(10,6,20,0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (halftone) drawHalftoneDots(ctx, rect);
  const grad = ctx.createLinearGradient(0, cy - fontPx * 0.6, 0, cy + fontPx * 0.6);
  grad.addColorStop(0, '#ffe259');
  grad.addColorStop(0.45, grade.stops[0]);
  grad.addColorStop(0.75, grade.stops[1]);
  grad.addColorStop(1, grade.stops[2]);
  ctx.font = `${fontPx}px Anton, 'Arial Narrow', sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = fontPx * 0.12;
  ctx.shadowOffsetY = fontPx * 0.05;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160a24';
  ctx.lineWidth = Math.max(3, fontPx * 0.09);
  const upper = title.toUpperCase();
  ctx.strokeText(upper, cx, cy - fontPx * 0.18);
  ctx.fillStyle = grad;
  ctx.fillText(upper, cx, cy - fontPx * 0.18);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (subtitle) {
    const subPx = Math.max(20, fontPx * 0.34);
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(20,8,30,0.85)';
    ctx.lineWidth = Math.max(2, subPx * 0.12);
    ctx.strokeText(subtitle, cx, cy + fontPx * 0.52);
    ctx.fillText(subtitle, cx, cy + fontPx * 0.52);
  }
  ctx.restore();
}

/** Halftone dots across a title block. */
export function drawHalftoneDots(ctx, rect) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#fff';
  const step = Math.max(10, rect.w / 90);
  for (let y = rect.y + step / 2; y < rect.y + rect.h; y += step) {
    for (let x = rect.x + step / 2; x < rect.x + rect.w; x += step) {
      const r = step * 0.16 * (0.6 + 0.4 * Math.sin(x * 0.05 + y * 0.03));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** The ribbon badge in the top-right corner ("SUNSET CITY" style, our own words). */
export function drawRibbonBadge(ctx, text, W, H) {
  const bandH = Math.max(34, H * 0.045);
  const label = `★ ${text.toUpperCase()} ★`;
  ctx.save();
  ctx.font = `${Math.round(bandH * 0.52)}px Anton, sans-serif`;
  const tw = ctx.measureText(label).width + bandH * 1.6;
  const margin = Math.max(12, W * 0.012);
  const x = W - margin - tw;
  const y = margin;
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.roundRect(x, y, tw, bandH, bandH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(x + 8, y + bandH - 5, tw - 16, 3);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + tw / 2, y + bandH / 2);
  ctx.restore();
}

/** Film grain: a seeded noise tile stamped over the cover. */
let grainTile = null;
export function drawFilmGrain(ctx, W, H) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 160;
    grainTile.height = 160;
    const g = grainTile.getContext('2d');
    const data = g.createImageData(160, 160);
    let seed = 1234567;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.floor(rnd() * 255);
      data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 28;
    }
    g.putImageData(data, 0, 0);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Darkened corners, like a printed poster. */
export function drawVignette(ctx, W, H) {
  const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(8,4,18,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

/**
 * Render the whole cover onto a canvas of W x H and return it.
 * photos: loaded HTMLImageElements; state: the cover state; slots pick a
 * photo per panel (slot i uses photos[slot.photo], defaulting to i % n).
 */
export function renderCover(photos, state, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.grade);
  const geo = layoutPanels(state.layout, W, H);
  // Sunset backdrop behind the gutters.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1b0b2e');
  bg.addColorStop(0.5, '#3d1155');
  bg.addColorStop(1, '#12081f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Photos, one per panel.
  ctx.save();
  try { ctx.filter = `saturate(${grade.sat}) contrast(${grade.contrast})`; } catch (e) { /* older canvas: skip */ }
  geo.panels.forEach((rect, i) => {
    const slot = state.slots[i] || { photo: photos.length ? i % photos.length : 0, zoom: 1, dx: 0, dy: 0 };
    const img = photos[slot.photo] || photos[0];
    if (!img) return;
    drawPhotoPanel(ctx, img, rect, slot);
  });
  try { ctx.filter = 'none'; } catch (e) { /* ignore */ }
  ctx.restore();
  // White gutters: thin frames around each panel.
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, W / 640);
  geo.panels.forEach((rect) => {
    if (rect.rot) return; // tilted panels already drew their own frame
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
  applyGrade(ctx, W, H, grade);
  drawTitleLettering(ctx, state.title || 'SUNSET CITY', state.subtitle || '', geo.title, W, H, grade, state.halftone);
  if (state.ribbon) drawRibbonBadge(ctx, state.ribbon, W, H);
  if (state.vignette) drawVignette(ctx, W, H);
  if (state.grain) drawFilmGrain(ctx, W, H);
  return canvas;
}

/** One-click PNG export: render at the chosen size and download the blob. */
export function exportCoverPng(photos, state, sizeId) {
  const size = sizeById(sizeId || state.size);
  const canvas = renderCover(photos, state, size.w, size.h);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('export failed: no PNG bytes')); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sunset-cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve({ blob, width: size.w, height: size.h });
    }, 'image/png');
  });
}
