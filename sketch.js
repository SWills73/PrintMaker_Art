// ART CANVAS SETUP
let sketchName = "Image_To_PrintMaker";

const paperSize = {
  A1: { width: 594, height: 841 },
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
  Inch8x10: { width: 203, height: 254 },
  Inch12x16: { width: 305, height: 406 },
  Inch16x20: { width: 406, height: 508 },
  Square30: { width: 300, height: 300 },
  Square50: { width: 500, height: 500 },
};

const dpi = 96;
const mmToInch = 25.4;
const MIN_BANDS = 3;
const MAX_BANDS = 8;
const NUM_BANDS = 5;
const WHITE_BAND = 0;

let paper;
let nwidth;
let nheight;
let cnv;
let previewScale = 0.6;
let seed;

// Input + processing state
let sourceImage = null;
let processed = null;
let lastGoodSourceImage = null;
let lastGoodProcessed = null;
let fileInput;
let gui;
let isProcessing = false;
let isExportingPNGLayers = false;
let isExportingSVGLayers = false;
let processingTimer = null;
let processingMessage = "Processing image";
let isDraftRender = false;
let lastProcessedSignature = "";
let svgRendererAvailable = true;
const DEFAULT_IMAGE_EXTRACTED_PALETTE = [
  "#ffffff",
  "#efeadd",
  "#cbb89f",
  "#8e7760",
  "#241f1a",
];
let imageExtractedPalette = DEFAULT_IMAGE_EXTRACTED_PALETTE.slice();

const DEFAULT_MANUAL_PALETTE = {
  tone0: "#ffffff",
  tone1: "#efeadd",
  tone2: "#cbb89f",
  tone3: "#8e7760",
  tone4: "#241f1a",
  tone5: "#241f1a",
  tone6: "#241f1a",
  tone7: "#241f1a",
};
const manualPalette = { ...DEFAULT_MANUAL_PALETTE };

const DEFAULT_TONE_VISIBILITY = {
  tone0: true,
  tone1: true,
  tone2: true,
  tone3: true,
  tone4: true,
  tone5: true,
  tone6: true,
  tone7: true,
};
const toneVisibility = { ...DEFAULT_TONE_VISIBILITY };

const DEFAULT_TUNING = {
  processScale: 0.82,
  cellSize: 1,
  smoothRadius: 2,
  smoothSigmaSpatial: 2.4,
  smoothSigmaRange: 24,
  edgeStrength: 0.3,
  darkEdgeBias: 0.45,
  bandWeight0: 0.08,
  bandWeight1: 0.34,
  bandWeight2: 0.28,
  bandWeight3: 0.22,
  bandWeight4: 0.16,
  thresholdLift: 0,
  minRegionArea: 14,
  regionCleanupPasses: 2,
  tonalSmoothPasses: 1,
  tonalMergeRange: 1,
  tonalConsensus: 0.66,
  maxProcessDim: 1800,
  draftOnSliderRelease: true,
  forceDraftQuality: false,
  draftScale: 0.55,
};

const DEFAULT_BAND_WEIGHT_ANCHORS = [
  DEFAULT_TUNING.bandWeight0,
  DEFAULT_TUNING.bandWeight1,
  DEFAULT_TUNING.bandWeight2,
  DEFAULT_TUNING.bandWeight3,
  DEFAULT_TUNING.bandWeight4,
];

const PROCESS_PRESETS = {
  Crisp: {
    processScale: 0.95,
    cellSize: 1,
    smoothRadius: 1,
    smoothSigmaSpatial: 1.2,
    smoothSigmaRange: 12,
    edgeStrength: 0.36,
    darkEdgeBias: 0.52,
    minRegionArea: 6,
    regionCleanupPasses: 1,
    tonalSmoothPasses: 0,
    tonalMergeRange: 1,
    tonalConsensus: 0.68,
    maxProcessDim: 2200,
  },
  Balanced: {
    ...DEFAULT_TUNING,
  },
  Cleanup: {
    processScale: 0.78,
    cellSize: 1,
    smoothRadius: 6,
    smoothSigmaSpatial: 5.5,
    smoothSigmaRange: 72,
    edgeStrength: 0.22,
    darkEdgeBias: 0.38,
    minRegionArea: 24,
    regionCleanupPasses: 4,
    tonalSmoothPasses: 2,
    tonalMergeRange: 1,
    tonalConsensus: 0.74,
    maxProcessDim: 1700,
  },
  Painterly: {
    processScale: 0.7,
    cellSize: 3,
    smoothRadius: 4,
    smoothSigmaSpatial: 4.2,
    smoothSigmaRange: 50,
    edgeStrength: 0.18,
    darkEdgeBias: 0.3,
    minRegionArea: 20,
    regionCleanupPasses: 3,
    tonalSmoothPasses: 3,
    tonalMergeRange: 2,
    tonalConsensus: 0.62,
    maxProcessDim: 1500,
  },
};

const DEFAULT_PALETTE_TUNING = {
  paletteMode: "Image Extracted",
  paletteExtractMethod: "Hue Families",
  paletteSatWeight: 0.35,
  paletteChromaPercentile: 0.2,
  paletteVibranceBoost: 0,
  paletteAnchorDistance: 16,
  paletteHueSeparation: 34,
  paletteAccentStrength: 0.32,
  paletteSubjectPriority: 0.65,
  paletteProtectedStrength: 0.72,
  paletteProtectedColor0: "#d5672a",
  paletteProtectedColor1: "#2f8ec9",
  paletteProtectedColor2: "#f2b134",
  paletteSampleScale: 1,
  paletteLumaAlign: 0,
};

const DEFAULT_PROTECTED_COLOR_ENABLED = {
  color0: false,
  color1: false,
  color2: false,
};
const protectedColorEnabled = { ...DEFAULT_PROTECTED_COLOR_ENABLED };

const COLOR_FAITHFUL_PRESET = {
  paletteMode: "Image Extracted",
  paletteExtractMethod: "Hue Families",
  paletteSatWeight: 0.5,
  paletteChromaPercentile: 0.42,
  paletteVibranceBoost: 0,
  paletteAnchorDistance: 18,
  paletteHueSeparation: 54,
  paletteAccentStrength: 0.24,
  paletteSampleScale: 1,
  paletteLumaAlign: 0.1,
};

const DEFAULT_CONFIG = {
  paperSizeName: "A4",
  orientation: "landscape",

  numTones: NUM_BANDS,
  toneBandMode: "Luminance (Weighted)",
  fitToPaper: true,
  ...DEFAULT_TUNING,
  ...DEFAULT_PALETTE_TUNING,
  bandWeights: DEFAULT_BAND_WEIGHT_ANCHORS.slice(),
  showKeyline: true,
  keylineThreshold: 0.28,
  keylineWeight: 1,
  showOriginalReference: true,
  exportAtSourceResolution: false,
  svgLayerMode: "Smooth Contours",
};

const config = {
  ...DEFAULT_CONFIG,
  bandWeights: DEFAULT_CONFIG.bandWeights.slice(),
};

const palettePresets = {
  Default: ["#ffffff", "#efeadd", "#cbb89f", "#8e7760", "#241f1a"],
  Mono: ["#ffffff", "#f3f3f3", "#c8c8c8", "#787878", "#161616"],
  Sepia: ["#ffffff", "#f2e1c2", "#d0aa73", "#8e6237", "#2f1d10"],
  Cool: ["#ffffff", "#ecf2f4", "#b4c4cc", "#6d8089", "#1a2228"],
};

function getNumBands() {
  return constrain(round(config.numTones || NUM_BANDS), MIN_BANDS, MAX_BANDS);
}

function getDarkestBand() {
  return getNumBands() - 1;
}

function normalizePaletteExtractMethod() {
  const allowed = new Set([
    "Hue Families",
    "Hue Families + Accent",
    "Subject First",
  ]);
  if (!allowed.has(config.paletteExtractMethod)) {
    config.paletteExtractMethod = "Hue Families";
  }
}

function parseHexColor(hex) {
  const cleaned = (hex || "#000000").replace("#", "");
  const full =
    cleaned.length === 3
      ? `${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`
      : cleaned.padStart(6, "0").slice(0, 6);
  const rr = parseInt(full.slice(0, 2), 16);
  const gg = parseInt(full.slice(2, 4), 16);
  const bb = parseInt(full.slice(4, 6), 16);
  return {
    r: Number.isFinite(rr) ? rr : 0,
    g: Number.isFinite(gg) ? gg : 0,
    b: Number.isFinite(bb) ? bb : 0,
  };
}

function interpolatePalette(basePalette, count) {
  const targetCount = max(1, floor(count));
  if (!basePalette || basePalette.length === 0) {
    return [];
  }
  if (basePalette.length === targetCount) {
    return basePalette.slice();
  }
  if (targetCount === 1) {
    return [basePalette[0]];
  }

  const out = [];
  const maxIdx = basePalette.length - 1;
  for (let i = 0; i < targetCount; i++) {
    const pos = (i / (targetCount - 1)) * maxIdx;
    const lo = floor(pos);
    const hi = min(maxIdx, ceil(pos));
    const t = pos - lo;
    const c1 = parseHexColor(basePalette[lo]);
    const c2 = parseHexColor(basePalette[hi]);
    const r = round(lerp(c1.r, c2.r, t));
    const g = round(lerp(c1.g, c2.g, t));
    const b = round(lerp(c1.b, c2.b, t));
    out.push(rgbToHex(r, g, b));
  }
  return out;
}

function interpolateNumberArray(baseValues, count) {
  const targetCount = max(1, floor(count));
  if (!baseValues || baseValues.length === 0) {
    return [];
  }
  if (baseValues.length === targetCount) {
    return baseValues.slice();
  }
  if (targetCount === 1) {
    return [baseValues[0]];
  }

  const out = [];
  const maxIdx = baseValues.length - 1;
  for (let i = 0; i < targetCount; i++) {
    const pos = (i / (targetCount - 1)) * maxIdx;
    const lo = floor(pos);
    const hi = min(maxIdx, ceil(pos));
    const t = pos - lo;
    out.push(lerp(baseValues[lo], baseValues[hi], t));
  }
  return out;
}

function getDefaultPaletteForToneCount() {
  return interpolatePalette(palettePresets.Default, getNumBands());
}

function getEnabledProtectedColors() {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const enabled = !!protectedColorEnabled[`color${i}`];
    const key = `paletteProtectedColor${i}`;
    const hex = config[key];
    if (enabled && typeof hex === "string" && hex.length > 0) {
      out.push(hex);
    }
  }
  return out;
}

function applyProtectedColorsToPalette(basePalette) {
  // Keep extracted palette stable; protected colours are now applied locally
  // at render-time only where source pixels actually match those colours.
  return interpolatePalette(basePalette, getNumBands());
}

function buildProtectedColorRenderContext(data) {
  if (!data || !data.sampleImage) {
    return null;
  }

  const strength = constrain(config.paletteProtectedStrength, 0, 1);
  if (strength <= 0) {
    return null;
  }

  const hexes = getEnabledProtectedColors();
  if (!Array.isArray(hexes) || hexes.length < 1) {
    return null;
  }

  const entries = [];
  for (let i = 0; i < hexes.length; i++) {
    const rgb = parseHexColor(hexes[i]);
    const hue = rgbHueDeg(rgb.r, rgb.g, rgb.b);
    const sat = rgbSaturation01(rgb.r, rgb.g, rgb.b);
    const chroma = (max(rgb.r, rgb.g, rgb.b) - min(rgb.r, rgb.g, rgb.b)) / 255;
    const lum = luminanceFromRGB(rgb.r, rgb.g, rgb.b);
    entries.push({
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      hue,
      sat,
      chroma,
      lum,
    });
  }

  if (entries.length < 1) {
    return null;
  }

  data.sampleImage.loadPixels();
  return {
    entries,
    sampleImage: data.sampleImage,
    strength,
  };
}

function blendProtectedColorForPixel(baseRGB, data, idx, context) {
  if (!context || !baseRGB || !data) {
    return baseRGB;
  }

  const sample = context.sampleImage;
  if (!sample || !sample.pixels || sample.pixels.length < 4) {
    return baseRGB;
  }

  const pi = idx * 4;
  const sr = sample.pixels[pi];
  const sg = sample.pixels[pi + 1];
  const sb = sample.pixels[pi + 2];
  if (!Number.isFinite(sr) || !Number.isFinite(sg) || !Number.isFinite(sb)) {
    return baseRGB;
  }

  const sat = rgbSaturation01(sr, sg, sb);
  const chroma = (max(sr, sg, sb) - min(sr, sg, sb)) / 255;
  if (sat < 0.045 && chroma < 0.045) {
    return baseRGB;
  }

  const hue = rgbHueDeg(sr, sg, sb);
  const lum = luminanceFromRGB(sr, sg, sb);
  let best = null;
  let bestScore = -Infinity;

  for (let i = 0; i < context.entries.length; i++) {
    const entry = context.entries[i];
    const hueDist = hueDistanceDeg(hue, entry.hue);
    const hueScore = 1 - min(1, hueDist / 72);
    const dr = sr - entry.r;
    const dg = sg - entry.g;
    const db = sb - entry.b;
    const rgbDist = sqrt(dr * dr + dg * dg + db * db);
    const rgbScore = 1 - min(1, rgbDist / 190);
    const lumScore = 1 - min(1, abs(lum - entry.lum) / 120);
    const score = hueScore * 0.58 + rgbScore * 0.3 + lumScore * 0.12;

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  const matchThreshold = 0.59;
  if (!best || bestScore < matchThreshold) {
    return baseRGB;
  }

  const match = constrain(
    (bestScore - matchThreshold) / (1 - matchThreshold),
    0,
    1,
  );
  const sourceColorEnergy = constrain(sat * 0.55 + chroma * 0.75, 0.18, 1);
  const blend = constrain(context.strength * match * sourceColorEnergy, 0, 1);

  const rr = round(lerp(baseRGB.r, best.r, blend));
  const gg = round(lerp(baseRGB.g, best.g, blend));
  const bb = round(lerp(baseRGB.b, best.b, blend));
  return { r: rr, g: gg, b: bb };
}

function ensurePaletteStateForToneCount() {
  const toneCount = getNumBands();
  const defaultPalette = getDefaultPaletteForToneCount();

  if (!imageExtractedPalette || imageExtractedPalette.length !== toneCount) {
    const sourcePalette =
      imageExtractedPalette && imageExtractedPalette.length > 0
        ? imageExtractedPalette
        : defaultPalette;
    imageExtractedPalette = interpolatePalette(sourcePalette, toneCount);
  }

  for (let i = 0; i < toneCount; i++) {
    const key = `tone${i}`;
    if (!manualPalette[key]) {
      manualPalette[key] =
        imageExtractedPalette[i] ||
        defaultPalette[i] ||
        defaultPalette[defaultPalette.length - 1];
    }
  }
}

function ensureToneVisibilityForToneCount() {
  const toneCount = getNumBands();
  for (let i = 0; i < toneCount; i++) {
    const key = `tone${i}`;
    if (!Object.prototype.hasOwnProperty.call(toneVisibility, key)) {
      toneVisibility[key] = true;
    }
    toneVisibility[key] = !!toneVisibility[key];
  }
}

function syncManualPaletteFromExtracted() {
  const toneCount = getNumBands();
  if (
    !Array.isArray(imageExtractedPalette) ||
    imageExtractedPalette.length < 1
  ) {
    return false;
  }

  const extracted = interpolatePalette(imageExtractedPalette, toneCount);
  if (!Array.isArray(extracted) || extracted.length !== toneCount) {
    return false;
  }

  for (let i = 0; i < toneCount; i++) {
    const hex = extracted[i];
    if (typeof hex === "string" && hex.length > 0) {
      manualPalette[`tone${i}`] = hex;
    }
  }

  return true;
}

function getManualPaletteSignature() {
  const toneCount = getNumBands();
  const values = [];
  for (let i = 0; i < toneCount; i++) {
    values.push(manualPalette[`tone${i}`] || "");
  }
  return values.join("|");
}

function syncManualPaletteToCurrentExtraction(updateGui = true) {
  const before = getManualPaletteSignature();
  recomputeExtractedPalette();
  const didSync = syncManualPaletteFromExtracted();

  if (!didSync) {
    return false;
  }

  config.paletteMode = "Manual";

  if (updateGui && gui && before !== getManualPaletteSignature()) {
    gui.build();
  }

  return true;
}

function ensureBandWeightsForToneCount() {
  const toneCount = getNumBands();
  const fallback = DEFAULT_BAND_WEIGHT_ANCHORS;
  const hasExisting = Array.isArray(config.bandWeights);
  const current = hasExisting ? config.bandWeights.slice() : fallback.slice();

  const resized =
    current.length === toneCount
      ? current
      : interpolateNumberArray(
          current.length > 0 ? current : fallback,
          toneCount,
        );

  const normalized = resized.map((weight) =>
    max(0.001, Number.isFinite(weight) ? weight : 0.001),
  );

  if (!hasExisting) {
    config.bandWeights = normalized;
    return;
  }

  config.bandWeights.length = normalized.length;
  for (let i = 0; i < normalized.length; i++) {
    config.bandWeights[i] = normalized[i];
  }
}

function getToneWeightLabel(band, toneCount) {
  if (band === WHITE_BAND) {
    return "Weight White";
  }
  if (band === 1) {
    return "Weight Light";
  }
  if (band === toneCount - 1) {
    return "Weight Dark";
  }
  return `Weight Mid ${band - 1}`;
}

function getToneWeightHelp(band, toneCount) {
  if (band === WHITE_BAND) {
    return "Proportion of pixels assigned to white highlight band (paper/no-ink).";
  }
  if (band === toneCount - 1) {
    return "Proportion of pixels assigned to the darkest band.";
  }
  if (band === 1) {
    return "Proportion of pixels assigned to the lightest non-white tone band.";
  }
  return "Proportion of pixels assigned to this middle tone band.";
}

function getProcessingSignature(isDraft) {
  if (!sourceImage) {
    return "no-source";
  }

  const toneCount = getNumBands();
  const weights = (config.bandWeights || [])
    .slice(0, toneCount)
    .map((w) => Number(w).toFixed(4))
    .join(",");

  return [
    sourceImage.width,
    sourceImage.height,
    nwidth,
    nheight,
    isDraft ? "draft" : "final",
    config.toneBandMode,
    toneCount,
    config.fitToPaper,
    config.processScale,
    config.cellSize,
    config.smoothRadius,
    config.smoothSigmaSpatial,
    config.smoothSigmaRange,
    config.edgeStrength,
    config.darkEdgeBias,
    config.thresholdLift,
    config.minRegionArea,
    config.regionCleanupPasses,
    config.tonalSmoothPasses,
    config.tonalMergeRange,
    config.tonalConsensus,
    config.maxProcessDim,
    config.draftScale,
    weights,
  ].join("|");
}

function refreshKeylineMaskFromProcessed() {
  if (!processed || !processed.bandMap || !processed.gradient) {
    return;
  }

  processed.keylineMask = buildKeylineMask(
    processed.bandMap,
    processed.gradient,
    processed.width,
    processed.height,
  );
}

function redrawOutput() {
  redraw();
}

function updateKeylineAndRedraw() {
  refreshKeylineMaskFromProcessed();
  redraw();
}

function setup() {
  pixelDensity(1);
  updatePaperDimensions();
  normalizePaletteExtractMethod();

  svgRendererAvailable = typeof SVG !== "undefined";
  if (svgRendererAvailable) {
    cnv = createCanvas(nwidth, nheight, SVG);
  } else {
    cnv = createCanvas(nwidth, nheight);
    console.warn(
      "p5.js-svg addon not loaded: running with default renderer; SVG save will fall back to PNG.",
    );
  }

  applyPreviewScale(previewScale);

  seed = int(random(999999));
  randomSeed(seed);

  ensureBandWeightsForToneCount();
  ensurePaletteStateForToneCount();
  ensureToneVisibilityForToneCount();
  setupImageInput();
  setupGUI();

  noLoop();
}

function draw() {
  background("#ffffff");

  if (!sourceImage && lastGoodSourceImage) {
    sourceImage = lastGoodSourceImage;
  }

  if (!processed && lastGoodProcessed) {
    processed = lastGoodProcessed;
  }

  if (!sourceImage) {
    drawUploadPrompt();
    return;
  }

  if (!processed && !isProcessing) {
    const bootMode = config.forceDraftQuality ? "draft" : "final";
    requestProcessing(bootMode);
  }

  if (processed) {
    try {
      displayBands(processed);
    } catch (err) {
      console.error("displayBands failed", err);
      if (lastGoodProcessed && lastGoodProcessed !== processed) {
        processed = lastGoodProcessed;
        try {
          displayBands(processed);
        } catch (retryErr) {
          console.error("displayBands fallback failed", retryErr);
        }
      }
    }
  }

  if (isProcessing) {
    drawProcessingIndicator();
  }

  drawRenderModeBadge();
}

function requestProcessing(mode = "final") {
  const useDraft = mode === "draft";
  const delay = useDraft ? 40 : 20;
  const nextSignature = getProcessingSignature(useDraft);

  if (
    sourceImage &&
    processed &&
    !isProcessing &&
    lastProcessedSignature === nextSignature
  ) {
    redraw();
    return;
  }

  if (processingTimer) {
    clearTimeout(processingTimer);
    processingTimer = null;
  }

  isProcessing = true;
  isDraftRender = useDraft;
  processingMessage = useDraft
    ? "Generating draft preview"
    : "Processing image";
  redraw();

  processingTimer = setTimeout(() => {
    try {
      processImagePipelineWithMode(useDraft);
      lastProcessedSignature = nextSignature;
    } catch (err) {
      processingMessage = "Processing failed";
      console.error("Processing pipeline failed", err);
    } finally {
      isProcessing = false;
      processingTimer = null;
      redraw();
    }
  }, delay);
}

function drawProcessingIndicator() {
  const barH = 34;
  noStroke();
  fill(0, 155);
  rect(0, 0, nwidth, barH);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(13);
  const phase = floor((millis() / 300) % 4);
  const dots = ".".repeat(phase);
  text(`${processingMessage}${dots}`, nwidth / 2, barH / 2 + 1);
}

function drawRenderModeBadge() {
  if (!sourceImage) {
    return;
  }

  const mode = isProcessing
    ? isDraftRender
      ? "Draft"
      : "Final"
    : config.forceDraftQuality
      ? "Draft"
      : "Final";

  const label = `Render: ${mode}`;
  textSize(11);
  const padX = 8;
  const padY = 4;
  const boxW = textWidth(label) + padX * 2;
  const boxH = 22;
  const x = nwidth - boxW - 10;
  const y = isProcessing ? 40 : 10;

  noStroke();
  fill(
    mode === "Draft" ? "rgba(219, 130, 0, 0.86)" : "rgba(16, 125, 79, 0.86)",
  );
  rect(x, y, boxW, boxH, 6);

  fill(255);
  textAlign(LEFT, CENTER);
  text(label, x + padX, y + boxH / 2 + 0.5);
}

function setupImageInput() {
  fileInput = createFileInput(handleImageUpload);
  fileInput.position(20, 20);
  fileInput.style("z-index", "1100");
  fileInput.style("background", "rgba(255,255,255,0.9)");
  fileInput.style("padding", "4px");
  fileInput.style("border-radius", "4px");
}

function setupGUI(collapsedState = null) {
  if (gui) {
    gui.remove();
  }

  normalizePaletteExtractMethod();

  gui = new GUIPanel({
    width: 300,
    sliderLiveInput: false,
  });

  const startCollapsed = (name, defaultValue) => {
    if (
      collapsedState &&
      Object.prototype.hasOwnProperty.call(collapsedState, name)
    ) {
      return !!collapsedState[name];
    }
    return defaultValue;
  };

  const grpPaper = gui.addGroup("Paper", startCollapsed("Paper", false));
  gui.addDropdown(
    grpPaper,
    "Paper Size",
    config,
    "paperSizeName",
    Object.keys(paperSize),
    handlePaperChange,
    "Select print target size in physical units (mm converted to px at 96 dpi).",
  );
  gui.addDropdown(
    grpPaper,
    "Orientation",
    config,
    "orientation",
    ["portrait", "landscape"],
    handlePaperChange,
    "Swap width/height orientation for the selected paper size.",
  );

  const grpInput = gui.addGroup("Input", startCollapsed("Input", false));
  gui.addSlider(
    grpInput,
    "Tone Count",
    config,
    "numTones",
    MIN_BANDS,
    MAX_BANDS,
    1,
    handleToneCountChange,
    "Number of tonal bands used across segmentation, rendering, extraction, and palette editing.",
  );
  gui.addDropdown(
    grpInput,
    "Tone Band Mode",
    config,
    "toneBandMode",
    [
      "Luminance (Weighted)",
      "Hue Groups",
      "Saturation Groups",
      "Hue-Luma Hybrid",
    ],
    updateArt,
    "Choose how tone bands are assigned before cleanup and rendering: by luminance, hue similarity, saturation, or a hue-luminance hybrid.",
  );
  gui.addCheckbox(
    grpInput,
    "Fit Image to Paper",
    config,
    "fitToPaper",
    updateArt,
    "When enabled, input image is scaled to the current paper aspect before processing.",
  );
  gui.addSlider(
    grpInput,
    "Process Scale",
    config,
    "processScale",
    0.2,
    1,
    0.01,
    updateArt,
    "Resolution used for analysis (higher = more detail, slower processing).",
  );
  gui.addSlider(
    grpInput,
    "Cell Size",
    config,
    "cellSize",
    1,
    20,
    1,
    updateArt,
    "Display block size control (lower = finer detail). Value 1 now maps to a finer-than-before output.",
  );

  const grpPaletteEdit = gui.addGroup(
    "Palette Edit",
    startCollapsed("Palette Edit", false),
  );
  gui.addButton(
    grpPaletteEdit,
    "Extract Palette",
    extractPaletteFromSource,
    "Extract colors for the current tone count (including white highlight), apply them to the editable manual palette, and show the result.",
  );
  gui.addDropdown(
    grpPaletteEdit,
    "Extract Method",
    config,
    "paletteExtractMethod",
    ["Hue Families", "Hue Families + Accent", "Subject First"],
    updateExtractedPaletteAndRedraw,
    "Hue Families maps dominant hue groups; Hue Families + Accent injects a rarer vivid hue; Subject First prioritizes vivid/rare colors over majority neutrals.",
  );
  gui.addSlider(
    grpPaletteEdit,
    "Saturation Weight",
    config,
    "paletteSatWeight",
    0,
    6,
    0.1,
    updateExtractedPaletteAndRedraw,
    "Higher values give more influence to saturated pixels during extraction (helps preserve sky blues).",
  );
  gui.addSlider(
    grpPaletteEdit,
    "Chroma Cutoff",
    config,
    "paletteChromaPercentile",
    0,
    0.95,
    0.01,
    updateExtractedPaletteAndRedraw,
    "Uses top-chroma pixels per tonal band for extraction (higher = less muddy, but more stylized).",
  );
  gui.addSlider(
    grpPaletteEdit,
    "Vibrance Boost",
    config,
    "paletteVibranceBoost",
    0,
    1,
    0.01,
    updateExtractedPaletteAndRedraw,
    "Post-boosts extracted colors away from gray while keeping luminance order.",
  );
  gui.addSlider(
    grpPaletteEdit,
    "Luma Align",
    config,
    "paletteLumaAlign",
    0,
    0.5,
    0.01,
    updateExtractedPaletteAndRedraw,
    "How strongly extracted colors are nudged to tonal luminance slots (lower keeps original hue/chroma).",
  );
  gui.addSlider(
    grpPaletteEdit,
    "Hue Separation",
    config,
    "paletteHueSeparation",
    8,
    90,
    1,
    updateExtractedPaletteAndRedraw,
    "Minimum hue-angle separation when selecting dominant hue families (higher = more varied hue picks).",
  );
  gui.addSlider(
    grpPaletteEdit,
    "Accent Strength",
    config,
    "paletteAccentStrength",
    0,
    1,
    0.01,
    updateExtractedPaletteAndRedraw,
    "Blend amount for accent injection in Hue Families + Accent mode.",
  );
  gui.addSlider(
    grpPaletteEdit,
    "Subject Priority",
    config,
    "paletteSubjectPriority",
    0,
    1,
    0.01,
    updateExtractedPaletteAndRedraw,
    "Weights extraction toward vivid/rare colors so key subject hues survive even when neutrals dominate area.",
  );
  gui.addSlider(
    grpPaletteEdit,
    "Protected Colour Strength",
    config,
    "paletteProtectedStrength",
    0,
    1,
    0.01,
    updateExtractedPaletteAndRedraw,
    "How strongly user-picked colors are injected into the extracted palette.",
  );
  gui.addColorPicker(
    grpPaletteEdit,
    "Include Colour 1",
    config,
    "paletteProtectedColor0",
    updateExtractedPaletteAndRedraw,
    "Optional user-selected subject colour to protect during extraction.",
    {
      checkbox: {
        variable: protectedColorEnabled,
        varName: "color0",
        onChange: updateExtractedPaletteAndRedraw,
      },
    },
  );
  gui.addColorPicker(
    grpPaletteEdit,
    "Include Colour 2",
    config,
    "paletteProtectedColor1",
    updateExtractedPaletteAndRedraw,
    "Second optional subject colour to preserve.",
    {
      checkbox: {
        variable: protectedColorEnabled,
        varName: "color1",
        onChange: updateExtractedPaletteAndRedraw,
      },
    },
  );
  gui.addColorPicker(
    grpPaletteEdit,
    "Include Colour 3",
    config,
    "paletteProtectedColor2",
    updateExtractedPaletteAndRedraw,
    "Third optional subject colour to preserve.",
    {
      checkbox: {
        variable: protectedColorEnabled,
        varName: "color2",
        onChange: updateExtractedPaletteAndRedraw,
      },
    },
  );
  const toneCount = getNumBands();
  ensureToneVisibilityForToneCount();
  for (let band = 0; band < toneCount; band++) {
    const key = `tone${band}`;
    const visKey = `tone${band}`;
    const isWhite = band === WHITE_BAND;
    const isDark = band === toneCount - 1;
    let label = `Manual Tone ${band}`;
    if (isWhite) {
      label += " (White)";
    } else if (isDark) {
      label += " (Dark)";
    }

    gui.addColorPicker(
      grpPaletteEdit,
      label,
      manualPalette,
      key,
      applyManualPaletteMode,
      isWhite
        ? "White highlight/no-ink tone for manual palette mode."
        : isDark
          ? "Darkest tone color for manual palette mode."
          : "Intermediate tone color for manual palette mode.",
      {
        checkbox: {
          variable: toneVisibility,
          varName: visKey,
          onChange: redrawOutput,
        },
      },
    );
  }

  const grpSmooth = gui.addGroup(
    "Smoothing",
    startCollapsed("Smoothing", true),
  );
  gui.addSlider(
    grpSmooth,
    "Radius",
    config,
    "smoothRadius",
    1,
    8,
    1,
    updateArt,
    "Neighborhood size for bilateral smoothing (higher removes more small texture and speckle).",
  );
  gui.addSlider(
    grpSmooth,
    "Spatial Sigma",
    config,
    "smoothSigmaSpatial",
    0.8,
    8,
    0.1,
    updateArt,
    "How strongly nearby pixels influence smoothing over distance (higher = broader cleanup).",
  );
  gui.addSlider(
    grpSmooth,
    "Range Sigma",
    config,
    "smoothSigmaRange",
    6,
    90,
    1,
    updateArt,
    "How tolerant smoothing is to brightness differences (higher can suppress confetti-like tonal noise).",
  );

  const grpTone = gui.addGroup(
    "Tonal Bands",
    startCollapsed("Tonal Bands", true),
  );
  const toneCountForWeights = getNumBands();
  ensureBandWeightsForToneCount();
  for (let band = 0; band < toneCountForWeights; band++) {
    gui.addSlider(
      grpTone,
      getToneWeightLabel(band, toneCountForWeights),
      config.bandWeights,
      String(band),
      0.01,
      0.9,
      0.01,
      updateArt,
      getToneWeightHelp(band, toneCountForWeights),
    );
  }
  gui.addSlider(
    grpTone,
    "Threshold Lift",
    config,
    "thresholdLift",
    -40,
    40,
    1,
    updateArt,
    "Shifts all tonal cut points up/down (negative = darker overall, positive = lighter).",
  );

  const grpStructure = gui.addGroup(
    "Structure",
    startCollapsed("Structure", true),
  );
  gui.addSlider(
    grpStructure,
    "Edge Strength",
    config,
    "edgeStrength",
    0,
    1.5,
    0.01,
    updateArt,
    "Amount of structural edge influence applied during tonal assignment.",
  );
  gui.addSlider(
    grpStructure,
    "Dark Edge Bias",
    config,
    "darkEdgeBias",
    0,
    1.8,
    0.01,
    updateArt,
    "How much strong edges are nudged toward darker bands (keyline/shadow emphasis).",
  );
  gui.addSlider(
    grpStructure,
    "Min Region Area",
    config,
    "minRegionArea",
    0,
    300,
    1,
    updateArt,
    "Removes small isolated specks by merging regions below this pixel area.",
  );
  gui.addSlider(
    grpStructure,
    "Cleanup Passes",
    config,
    "regionCleanupPasses",
    1,
    5,
    1,
    updateArt,
    "How many times tiny-region cleanup runs (higher removes more confetti, slower).",
  );
  gui.addSlider(
    grpStructure,
    "Tone Smooth Passes",
    config,
    "tonalSmoothPasses",
    0,
    4,
    1,
    updateArt,
    "Neighborhood smoothing passes that merge nearby tonal bands to reduce speckle.",
  );
  gui.addSlider(
    grpStructure,
    "Tone Merge Range",
    config,
    "tonalMergeRange",
    0,
    2,
    1,
    updateArt,
    "Only merge bands within this band-distance (0=off, 1=adjacent only).",
  );
  gui.addSlider(
    grpStructure,
    "Tone Consensus",
    config,
    "tonalConsensus",
    0.5,
    0.95,
    0.01,
    updateArt,
    "Required local majority before changing a pixel to a neighboring tone band.",
  );

  const grpDisplay = gui.addGroup("Display", startCollapsed("Display", false));
  gui.addDropdown(
    grpDisplay,
    "Palette",
    config,
    "paletteMode",
    ["Default", "Mono", "Sepia", "Cool", "Image Extracted", "Manual"],
    redrawOutput,
    "Select the ink/paper palette used to render the current number of segmented tone bands.",
  );
  gui.addCheckbox(
    grpDisplay,
    "Show Keyline",
    config,
    "showKeyline",
    redrawOutput,
    "Draw dark linework along tone boundaries for stronger printmaker-style separation.",
  );
  gui.addCheckbox(
    grpDisplay,
    "Show Original Ref",
    config,
    "showOriginalReference",
    redrawOutput,
    "Show the original uploaded image as a reference below the processed output.",
  );
  gui.addSlider(
    grpDisplay,
    "Keyline Threshold",
    config,
    "keylineThreshold",
    0.05,
    0.6,
    0.01,
    updateKeylineAndRedraw,
    "Minimum edge strength required before tone-boundary lines are drawn as keyline.",
  );
  gui.addSlider(
    grpDisplay,
    "Keyline Weight",
    config,
    "keylineWeight",
    0.4,
    2.4,
    0.05,
    redrawOutput,
    "Thickness multiplier for keyline boundary strokes.",
  );
  const grpActions = gui.addGroup("Actions", startCollapsed("Actions", false));
  gui.addButton(
    grpActions,
    "Reprocess",
    updateArt,
    "Re-run the full image processing pipeline with the current settings.",
  );
  gui.addButton(
    grpActions,
    "Save PNG",
    savePNGExport,
    "Save the current output as PNG using sketch name, date, and seed.",
  );
  gui.addButton(
    grpActions,
    "Export PNG Layers",
    savePNGLayerExports,
    "Save one transparent PNG per tone color using the current segmentation.",
  );
  gui.addButton(
    grpActions,
    "Export SVG Layers",
    saveSVGLayerExports,
    "Save one SVG per tone color using the current palette and segmentation.",
  );
  gui.addDropdown(
    grpActions,
    "SVG Layer Mode",
    config,
    "svgLayerMode",
    ["Run Rects", "Smooth Contours"],
    null,
    "Run Rects uses fast horizontal run fills; Smooth Contours traces tone boundaries into closed vector paths.",
  );
  gui.addCheckbox(
    grpActions,
    "Export at Source Res",
    config,
    "exportAtSourceResolution",
    null,
    "Generate PNG exports at the original source-image pixel dimensions when enabled.",
  );
  gui.addCheckbox(
    grpActions,
    "Use Draft on Slider Release",
    config,
    "draftOnSliderRelease",
    handleRenderModeToggle,
    "Process slider changes in draft quality after release when enabled; otherwise process them in final quality.",
  );
  gui.addCheckbox(
    grpActions,
    "Lock Draft Quality",
    config,
    "forceDraftQuality",
    handleRenderModeToggle,
    "Always process in draft quality, including slider-release changes and manual reprocess, until turned off.",
  );
  gui.addSlider(
    grpActions,
    "Draft Scale",
    config,
    "draftScale",
    0.25,
    0.9,
    0.01,
    handleRenderModeToggle,
    "Set the processing resolution used in draft mode (lower = faster, softer).",
  );
  gui.addButton(
    grpActions,
    "Preset Crisp",
    () => applyProcessingPreset("Crisp"),
    "Apply a high-detail preset with minimal smoothing.",
  );
  gui.addButton(
    grpActions,
    "Preset Balanced",
    () => applyProcessingPreset("Balanced"),
    "Apply the balanced default between detail and cleanup with natural base-image color extraction.",
  );
  gui.addButton(
    grpActions,
    "Preset Cleanup",
    () => applyProcessingPreset("Cleanup"),
    "Apply an aggressive confetti/speckle cleanup preset.",
  );
  gui.addButton(
    grpActions,
    "Preset Painterly",
    () => applyProcessingPreset("Painterly"),
    "Apply a softer abstract look with broader tonal blending.",
  );
  gui.addButton(
    grpActions,
    "Preset Color Faithful",
    applyColorFaithfulPreset,
    "Hue-first baseline preset tuned for source fidelity: higher Chroma Cutoff, stronger Hue Separation, and light Luma Align.",
  );
  gui.addButton(
    grpActions,
    "Reset Defaults",
    resetTuningDefaults,
    "Restore all settings to project defaults.",
  );

  gui.build();
}

function rebuildGUI() {
  const collapsedState = gui ? { ...gui.collapsed } : null;
  const prevScrollTop =
    gui && gui.container && gui.container.elt ? gui.container.elt.scrollTop : 0;

  setupGUI(collapsedState);

  if (gui && gui.container && gui.container.elt) {
    gui.container.elt.scrollTop = prevScrollTop;
  }
}

function handleImageUpload(file) {
  if (!file || file.type !== "image") {
    return;
  }

  loadImage(
    file.data,
    (img) => {
      if (processingTimer) {
        clearTimeout(processingTimer);
        processingTimer = null;
      }
      isProcessing = false;
      processed = null;
      lastGoodProcessed = null;
      lastProcessedSignature = "";
      sourceImage = img;
      lastGoodSourceImage = img;
      extractPaletteFromSource(false);
      updateArt();
    },
    (err) => {
      console.error("Could not load image", err);
    },
  );
}

function updateArt() {
  const useDraft = config.forceDraftQuality || config.draftOnSliderRelease;
  requestProcessing(useDraft ? "draft" : "final");
}

function handleToneCountChange() {
  config.numTones = getNumBands();
  ensureBandWeightsForToneCount();
  ensurePaletteStateForToneCount();
  ensureToneVisibilityForToneCount();

  if (sourceImage) {
    ensureProcessedForCurrentToneCount("tone-count-change");
    extractPaletteFromSource(false);
  }

  rebuildGUI();

  updateArt();
}

function handleRenderModeToggle() {
  if (!sourceImage) {
    return;
  }

  if (config.forceDraftQuality) {
    requestProcessing("draft");
  } else {
    requestProcessing("final");
  }
}

function applyProcessingPreset(name) {
  const preset = PROCESS_PRESETS[name];
  if (!preset) {
    return;
  }

  Object.assign(config, preset);
  ensureBandWeightsForToneCount();
  ensurePaletteStateForToneCount();
  ensureToneVisibilityForToneCount();

  if (name === "Balanced") {
    Object.assign(config, DEFAULT_PALETTE_TUNING);
  }

  if (gui) {
    gui.build();
  }
  updateArt();
}

function resetTuningDefaults() {
  const paperOrOrientationChanged =
    config.paperSizeName !== DEFAULT_CONFIG.paperSizeName ||
    config.orientation !== DEFAULT_CONFIG.orientation;

  Object.assign(config, DEFAULT_CONFIG);
  config.bandWeights = DEFAULT_CONFIG.bandWeights.slice();

  imageExtractedPalette = DEFAULT_IMAGE_EXTRACTED_PALETTE.slice();

  for (const key in DEFAULT_MANUAL_PALETTE) {
    manualPalette[key] = DEFAULT_MANUAL_PALETTE[key];
  }

  for (const key in DEFAULT_TONE_VISIBILITY) {
    toneVisibility[key] = DEFAULT_TONE_VISIBILITY[key];
  }

  for (const key in DEFAULT_PROTECTED_COLOR_ENABLED) {
    protectedColorEnabled[key] = DEFAULT_PROTECTED_COLOR_ENABLED[key];
  }

  ensureBandWeightsForToneCount();
  ensurePaletteStateForToneCount();
  ensureToneVisibilityForToneCount();

  if (gui) {
    gui.build();
  }

  if (paperOrOrientationChanged) {
    updatePaperDimensions();
    resizeCanvas(nwidth, nheight);
    applyPreviewScale(previewScale);
  }

  updateArt();
}

function applyColorFaithfulPreset() {
  Object.assign(config, PROCESS_PRESETS.Balanced, COLOR_FAITHFUL_PRESET);
  ensureBandWeightsForToneCount();
  ensurePaletteStateForToneCount();
  ensureToneVisibilityForToneCount();

  if (sourceImage) {
    extractPaletteFromSource(false);
  }

  if (gui) {
    gui.build();
  }
  updateArt();
}

function handlePaperChange() {
  updatePaperDimensions();
  resizeCanvas(nwidth, nheight);
  applyPreviewScale(previewScale);
  updateArt();
}

function processImagePipeline() {
  processImagePipelineWithMode(config.forceDraftQuality);
}

function processImagePipelineWithMode(isDraft = false) {
  const sampleImage = loadAndPrepareImage(sourceImage, isDraft);
  processed = buildProcessedFromSampleImage(sampleImage, isDraft);
  if (processed && processed.sampleImage && processed.bandMap) {
    lastGoodProcessed = processed;
  }
}

function ensureProcessedForCurrentToneCount(trigger = "unknown") {
  if (!sourceImage) {
    return false;
  }

  try {
    const toneCount = getNumBands();
    const hasProcessed =
      processed &&
      processed.sampleImage &&
      processed.bandMap &&
      processed.bandMap.length ===
        processed.sampleImage.width * processed.sampleImage.height;

    if (!hasProcessed) {
      processImagePipeline();
      return true;
    }

    let maxBand = 0;
    for (let i = 0; i < processed.bandMap.length; i++) {
      const b = processed.bandMap[i];
      if (b > maxBand) {
        maxBand = b;
        if (maxBand >= toneCount) {
          processImagePipeline();
          return true;
        }
      }
    }

    return true;
  } catch (err) {
    console.error("ensureProcessedForCurrentToneCount failed", {
      trigger,
      toneCount: getNumBands(),
      hasSourceImage: !!sourceImage,
      hasProcessed: !!processed,
      hasSampleImage: !!(processed && processed.sampleImage),
      hasBandMap: !!(processed && processed.bandMap),
    });
    console.error(err);
    return false;
  }
}

function hasUsableProcessedFrameForToneCount() {
  const toneCount = getNumBands();
  const candidate = processed || lastGoodProcessed;
  const hasProcessed =
    candidate &&
    candidate.sampleImage &&
    candidate.bandMap &&
    candidate.bandMap.length ===
      candidate.sampleImage.width * candidate.sampleImage.height;

  if (!hasProcessed) {
    return false;
  }

  if (candidate !== processed) {
    processed = candidate;
  }

  for (let i = 0; i < candidate.bandMap.length; i++) {
    const b = candidate.bandMap[i];
    if (!Number.isFinite(b) || b < 0 || b >= toneCount) {
      return false;
    }
  }

  return true;
}

function buildProcessedFromSampleImage(sampleImage, isDraft = false) {
  const luminance = imageToLuminance(sampleImage);
  const smoothed = applyEdgePreservingSmoothing(
    luminance,
    sampleImage.width,
    sampleImage.height,
    isDraft,
  );
  const gradient = computeGradientMagnitude(
    smoothed,
    sampleImage.width,
    sampleImage.height,
  );
  const segmented = segmentTonalBands(
    luminance,
    smoothed,
    gradient,
    sampleImage,
    sampleImage.width,
    sampleImage.height,
  );
  let cleanedBands = segmented.bandMap;
  const cleanupPasses = isDraft
    ? min(1, max(1, floor(config.regionCleanupPasses)))
    : max(1, floor(config.regionCleanupPasses));
  for (let pass = 0; pass < cleanupPasses; pass++) {
    cleanedBands = mergeSmallRegions(
      cleanedBands,
      sampleImage.width,
      sampleImage.height,
      config.minRegionArea,
    );
  }

  cleanedBands = smoothCloseToneBands(
    cleanedBands,
    sampleImage.width,
    sampleImage.height,
    isDraft
      ? min(1, floor(config.tonalSmoothPasses))
      : floor(config.tonalSmoothPasses),
    floor(config.tonalMergeRange),
    config.tonalConsensus,
  );

  const result = {
    width: sampleImage.width,
    height: sampleImage.height,
    sampleImage,
    bandMap: cleanedBands,
    gradient,
    thresholds: segmented.thresholds,
    keylineMask: buildKeylineMask(
      cleanedBands,
      gradient,
      sampleImage.width,
      sampleImage.height,
    ),
  };

  applyTextureOverlayPlaceholder(result);
  return result;
}

function extractPaletteFromSource(switchMode = true) {
  if (!sourceImage) {
    return;
  }

  if (!processed || !processed.sampleImage || !processed.bandMap) {
    processImagePipeline();
  }

  syncManualPaletteToCurrentExtraction(false);

  if (switchMode) {
    redrawOutput();
  }
}

function updateExtractedPaletteAndRedraw() {
  if (!sourceImage) {
    redrawOutput();
    return;
  }

  const previousMethod = config.paletteExtractMethod;

  try {
    if (
      config.paletteExtractMethod === "Band Map" ||
      config.paletteExtractMethod === "Band Map Direct"
    ) {
      if (!hasUsableProcessedFrameForToneCount()) {
        if (!isProcessing) {
          updateArt();
        }
        redrawOutput();
        return;
      }
    }

    syncManualPaletteToCurrentExtraction(false);
  } catch (err) {
    console.error("Extract method switch failed", err);

    config.paletteExtractMethod = "Hue Families";
    try {
      syncManualPaletteToCurrentExtraction(false);
    } catch (fallbackErr) {
      console.error("Fallback extraction failed", fallbackErr);
      config.paletteExtractMethod = previousMethod;
    }
  }

  redrawOutput();
}

function recomputeExtractedPalette() {
  if (!sourceImage) {
    return null;
  }

  try {
    if (
      config.paletteExtractMethod === "Band Map" ||
      config.paletteExtractMethod === "Band Map Direct"
    ) {
      if (!hasUsableProcessedFrameForToneCount()) {
        return null;
      }
    }

    if (config.paletteExtractMethod === "Source Anchors") {
      const sample = getPaletteSampleImage();
      const palette = extractPaletteFromSourceAnchors(sample);
      if (Array.isArray(palette) && palette.length > 0) {
        const withProtected = applyProtectedColorsToPalette(palette);
        imageExtractedPalette = withProtected;
        return withProtected;
      }
      return null;
    }

    if (
      config.paletteExtractMethod === "Hue Families" ||
      config.paletteExtractMethod === "Hue Families + Accent" ||
      config.paletteExtractMethod === "Subject First"
    ) {
      const includeAccent =
        config.paletteExtractMethod === "Hue Families + Accent" ||
        config.paletteExtractMethod === "Subject First";
      const isSubjectFirst = config.paletteExtractMethod === "Subject First";
      const sample =
        processed && processed.sampleImage
          ? processed.sampleImage
          : getPaletteSampleImage();
      const bandMap = processed && processed.bandMap ? processed.bandMap : null;
      const palette = extractPaletteFromHueFamilies(
        sample,
        includeAccent,
        bandMap,
        {
          subjectPriority: isSubjectFirst ? config.paletteSubjectPriority : 0,
          minDistinctHues: isSubjectFirst ? 2 : 1,
        },
      );
      if (Array.isArray(palette) && palette.length > 0) {
        const withProtected = applyProtectedColorsToPalette(palette);
        imageExtractedPalette = withProtected;
        return withProtected;
      }
      return null;
    }

    if (processed && processed.sampleImage && processed.bandMap) {
      const directBandMap = config.paletteExtractMethod === "Band Map Direct";
      const palette = extractPaletteFromBandMap(
        processed.sampleImage,
        processed.bandMap,
        directBandMap,
      );
      if (Array.isArray(palette) && palette.length > 0) {
        const withProtected = applyProtectedColorsToPalette(palette);
        imageExtractedPalette = withProtected;
        return withProtected;
      }
    }

    return null;
  } catch (err) {
    console.error("Palette recompute failed", err);
    return null;
  }
}

function getPaletteSampleImage() {
  const src = sourceImage || lastGoodSourceImage;
  if (!src) {
    return null;
  }

  const sampleScale = constrain(config.paletteSampleScale, 0.25, 1);
  const targetW = max(60, floor(src.width * sampleScale));
  const targetH = max(60, floor(src.height * sampleScale));
  const dimCap = max(300, floor(config.maxProcessDim));
  const capRatio = min(1, dimCap / max(targetW, targetH));
  const w = max(1, floor(targetW * capRatio));
  const h = max(1, floor(targetH * capRatio));

  const g = createGraphics(w, h);
  g.pixelDensity(1);
  g.image(src, 0, 0, w, h);
  const img = g.get();
  g.remove();
  return img;
}

function buildHueFamilyStats(sampleImage, options = {}) {
  if (!sampleImage) {
    return {
      totalPixels: 0,
      colorfulPixels: 0,
      neutralPixels: 0,
      hueBins: [],
    };
  }

  sampleImage.loadPixels();

  const totalPixels = max(1, sampleImage.width * sampleImage.height);
  const colorfulThresholdSat = 0.06;
  const colorfulThresholdChroma = 0.07;
  const lumBucketCount = 16;
  const hueBucketSize = 20;
  const satWeight = constrain(config.paletteSatWeight, 0, 6);
  const subjectPriority = constrain(options.subjectPriority || 0, 0, 1);
  const centerX = (sampleImage.width - 1) * 0.5;
  const centerY = (sampleImage.height - 1) * 0.5;
  const invDiag =
    1 /
    max(
      1,
      sqrt(
        sampleImage.width * sampleImage.width +
          sampleImage.height * sampleImage.height,
      ) * 0.5,
    );

  let colorfulPixels = 0;
  let neutralPixels = 0;
  const bins = new Map();

  for (let y = 0; y < sampleImage.height; y++) {
    for (let x = 0; x < sampleImage.width; x++) {
      const i = (y * sampleImage.width + x) * 4;
      const r = sampleImage.pixels[i];
      const g = sampleImage.pixels[i + 1];
      const b = sampleImage.pixels[i + 2];

      if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
        continue;
      }

      const sat = rgbSaturation01(r, g, b);
      const chroma = (max(r, g, b) - min(r, g, b)) / 255;
      const lum = luminanceFromRGB(r, g, b);
      const isColorful =
        sat >= colorfulThresholdSat || chroma >= colorfulThresholdChroma;

      if (!isColorful) {
        neutralPixels++;
        continue;
      }

      colorfulPixels++;
      const hue = rgbHueDeg(r, g, b);
      const bucket = floor((hue % 360) / hueBucketSize);
      const key = String(bucket);
      if (!bins.has(key)) {
        bins.set(key, {
          bucket,
          count: 0,
          w: 0,
          r: 0,
          g: 0,
          b: 0,
          sat: 0,
          chroma: 0,
          vividCount: 0,
          lumBuckets: new Array(lumBucketCount).fill(0).map(() => ({
            count: 0,
            w: 0,
            r: 0,
            g: 0,
            b: 0,
            sat: 0,
            chroma: 0,
          })),
        });
      }

      const distCenter = sqrt(
        (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY),
      );
      const centerBoost = constrain(1 - distCenter * invDiag, 0, 1);
      const subjectBoost =
        1 + subjectPriority * (sat * 0.55 + chroma * 0.85 + centerBoost * 0.35);
      const weight = (1 + sat * satWeight * 0.2 + chroma * 0.35) * subjectBoost;
      const bin = bins.get(key);
      bin.count++;
      bin.w += weight;
      bin.r += r * weight;
      bin.g += g * weight;
      bin.b += b * weight;
      bin.sat += sat;
      bin.chroma += chroma;
      if (sat >= 0.35 && chroma >= 0.28) {
        bin.vividCount++;
      }

      const lumBucket = constrain(
        floor((constrain(lum, 0, 255) / 256) * lumBucketCount),
        0,
        lumBucketCount - 1,
      );
      const lb = bin.lumBuckets[lumBucket];
      lb.count++;
      lb.w += weight;
      lb.r += r * weight;
      lb.g += g * weight;
      lb.b += b * weight;
      lb.sat += sat;
      lb.chroma += chroma;
    }
  }

  const hueBins = Array.from(bins.values())
    .filter((bin) => bin.count > 0)
    .map((bin) => {
      const avgR = bin.r / max(1, bin.w);
      const avgG = bin.g / max(1, bin.w);
      const avgB = bin.b / max(1, bin.w);
      const avgSat = bin.sat / max(1, bin.count);
      const avgChroma = bin.chroma / max(1, bin.count);
      const prevalence = bin.count / totalPixels;
      const vividRatio = bin.vividCount / max(1, bin.count);
      const hueCenter = ((bin.bucket + 0.5) * hueBucketSize) % 360;
      const score =
        pow(bin.count, 0.96) *
        (0.72 +
          avgSat * (0.2 + subjectPriority * 0.07) +
          avgChroma * (0.25 + subjectPriority * 0.1) +
          vividRatio * (0.16 + subjectPriority * 0.15));

      return {
        ...bin,
        hue: hueCenter,
        avgR,
        avgG,
        avgB,
        avgSat,
        avgChroma,
        prevalence,
        vividRatio,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    totalPixels,
    colorfulPixels,
    neutralPixels,
    hueBins,
  };
}

function selectHueFamiliesForExtraction(hueBins, targetCount, minHueDistance) {
  if (!Array.isArray(hueBins) || hueBins.length === 0 || targetCount <= 0) {
    return [];
  }

  const selected = [];
  const sorted = hueBins.slice().sort((a, b) => b.score - a.score);
  const minDistance = constrain(minHueDistance, 8, 120);

  for (let i = 0; i < sorted.length && selected.length < targetCount + 1; i++) {
    const candidate = sorted[i];
    let farEnough = true;
    for (let j = 0; j < selected.length; j++) {
      const dist = hueDistanceDeg(candidate.hue, selected[j].hue);
      if (dist < minDistance) {
        farEnough = false;
        break;
      }
    }
    if (farEnough) {
      selected.push(candidate);
    }
  }

  if (selected.length < targetCount) {
    for (let i = 0; i < sorted.length && selected.length < targetCount; i++) {
      if (!selected.includes(sorted[i])) {
        selected.push(sorted[i]);
      }
    }
  }

  return selected;
}

function pickHueFamilyColorForLuminance(bin, targetLum) {
  if (!bin || !Array.isArray(bin.lumBuckets) || bin.lumBuckets.length < 1) {
    return null;
  }

  const bucketCount = bin.lumBuckets.length;
  const targetIdx = constrain(
    floor((constrain(targetLum, 0, 255) / 256) * bucketCount),
    0,
    bucketCount - 1,
  );

  let chosen = null;
  for (let radius = 0; radius < bucketCount; radius++) {
    const low = targetIdx - radius;
    const high = targetIdx + radius;

    if (low >= 0 && bin.lumBuckets[low].count > 0) {
      chosen = bin.lumBuckets[low];
      break;
    }
    if (high < bucketCount && bin.lumBuckets[high].count > 0) {
      chosen = bin.lumBuckets[high];
      break;
    }
  }

  if (!chosen || chosen.w <= 0) {
    return {
      r: bin.avgR,
      g: bin.avgG,
      b: bin.avgB,
      sat: bin.avgSat,
      chroma: bin.avgChroma,
      hue: bin.hue,
    };
  }

  return {
    r: chosen.r / chosen.w,
    g: chosen.g / chosen.w,
    b: chosen.b / chosen.w,
    sat: chosen.sat / max(1, chosen.count),
    chroma: chosen.chroma / max(1, chosen.count),
    hue: bin.hue,
  };
}

function findAccentHueFamily(hueBins, selectedFamilies) {
  if (!Array.isArray(hueBins) || hueBins.length === 0) {
    return null;
  }

  const selected = Array.isArray(selectedFamilies) ? selectedFamilies : [];
  let best = null;
  let bestScore = -Infinity;

  for (let i = 0; i < hueBins.length; i++) {
    const bin = hueBins[i];
    const isSelected = selected.includes(bin);
    const rarity = 1 - constrain(bin.prevalence * 5.5, 0, 1);
    const vividness = constrain(bin.avgSat * 0.5 + bin.avgChroma * 0.8, 0, 1.4);
    const sizeGuard = constrain(bin.prevalence * 60, 0.18, 1);
    const selectedPenalty = isSelected ? 0.1 : 1;
    const score = vividness * rarity * sizeGuard * selectedPenalty;

    if (score > bestScore) {
      bestScore = score;
      best = bin;
    }
  }

  if (!best || bestScore < 0.12) {
    return null;
  }

  return {
    r: best.avgR,
    g: best.avgG,
    b: best.avgB,
    hue: best.hue,
    sat: best.avgSat,
    chroma: best.avgChroma,
    prevalence: best.prevalence,
    score: bestScore,
  };
}

function extractPaletteFromHueFamilies(
  sampleImage,
  includeAccent = false,
  toneBandMap = null,
  options = {},
) {
  const fallback = getDefaultPaletteForToneCount();
  if (!sampleImage) {
    return fallback;
  }

  if (
    toneBandMap &&
    toneBandMap.length === sampleImage.width * sampleImage.height
  ) {
    return extractPaletteFromBandHuePriority(
      sampleImage,
      toneBandMap,
      includeAccent,
    );
  }

  const toneCount = getNumBands();
  const targetCount = max(1, toneCount - 1);
  const subjectPriority = constrain(options.subjectPriority || 0, 0, 1);
  const minDistinctHues = constrain(floor(options.minDistinctHues || 0), 0, 4);
  const stats = buildHueFamilyStats(sampleImage, { subjectPriority });
  if (!stats || !Array.isArray(stats.hueBins) || stats.hueBins.length < 1) {
    return fallback;
  }

  const selectedFamilies = selectHueFamiliesForExtraction(
    stats.hueBins,
    targetCount,
    config.paletteHueSeparation,
  );
  if (selectedFamilies.length < 1) {
    return fallback;
  }

  const extracted = [];
  const familyUse = new Map();

  for (let slot = 0; slot < targetCount; slot++) {
    const refLum = luminanceFromHex(fallback[slot + 1]);
    let bestFamily = null;
    let bestFamilyColor = null;
    let bestScore = -Infinity;

    for (let i = 0; i < selectedFamilies.length; i++) {
      const family = selectedFamilies[i];
      const familyColor = pickHueFamilyColorForLuminance(family, refLum);
      if (!familyColor) {
        continue;
      }

      const lum = luminanceFromRGB(familyColor.r, familyColor.g, familyColor.b);
      const lumProximity = 1 - min(1, abs(lum - refLum) / 150);
      const prevalence = constrain(family.prevalence * 30, 0, 1);
      const colorEnergy = constrain(
        familyColor.sat * 0.45 + familyColor.chroma * 0.75,
        0,
        1.5,
      );
      const repeats = familyUse.get(i) || 0;
      const repeatPenalty = repeats * 0.14;

      const score =
        lumProximity * (0.56 - subjectPriority * 0.2) +
        prevalence * (0.24 - subjectPriority * 0.06) +
        colorEnergy * (0.22 + subjectPriority * 0.34) -
        repeatPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestFamily = i;
        bestFamilyColor = familyColor;
      }
    }

    if (!bestFamilyColor) {
      extracted.push(fallback[slot + 1]);
      continue;
    }

    familyUse.set(bestFamily, (familyUse.get(bestFamily) || 0) + 1);

    let rr = round(bestFamilyColor.r);
    let gg = round(bestFamilyColor.g);
    let bb = round(bestFamilyColor.b);
    [rr, gg, bb] = applyVibranceBoost(rr, gg, bb, config.paletteVibranceBoost);

    const curLum = luminanceFromRGB(rr, gg, bb);
    const align = constrain(config.paletteLumaAlign, 0, 0.5);
    const delta = constrain((refLum - curLum) * align, -16, 16);
    rr = constrain(round(rr + delta), 0, 255);
    gg = constrain(round(gg + delta), 0, 255);
    bb = constrain(round(bb + delta), 0, 255);

    extracted.push(rgbToHex(rr, gg, bb));
  }

  if (includeAccent && extracted.length > 1) {
    const accent = findAccentHueFamily(stats.hueBins, selectedFamilies);
    if (accent) {
      const accentStrength = constrain(config.paletteAccentStrength, 0, 1);
      if (accentStrength > 0) {
        const accentSlot = constrain(
          floor(extracted.length * 0.6),
          1,
          extracted.length - 1,
        );
        const base = parseHexColor(extracted[accentSlot]);
        const rarityBoost = constrain(1 - accent.prevalence * 4.5, 0.4, 1);
        const blendAmount = constrain(accentStrength * rarityBoost, 0, 0.85);

        let rr = round(lerp(base.r, accent.r, blendAmount));
        let gg = round(lerp(base.g, accent.g, blendAmount));
        let bb = round(lerp(base.b, accent.b, blendAmount));
        [rr, gg, bb] = applyVibranceBoost(
          rr,
          gg,
          bb,
          min(1, config.paletteVibranceBoost + 0.08),
        );
        extracted[accentSlot] = rgbToHex(rr, gg, bb);
      }
    }
  }

  if (minDistinctHues > 0) {
    const existingHues = [];
    for (let i = 0; i < extracted.length; i++) {
      const cc = parseHexColor(extracted[i]);
      const sat = rgbSaturation01(cc.r, cc.g, cc.b);
      const chroma = (max(cc.r, cc.g, cc.b) - min(cc.r, cc.g, cc.b)) / 255;
      if (sat >= 0.12 || chroma >= 0.1) {
        existingHues.push(rgbHueDeg(cc.r, cc.g, cc.b));
      }
    }

    let distinctCount = 0;
    for (let i = 0; i < existingHues.length; i++) {
      let isDistinct = true;
      for (let j = 0; j < i; j++) {
        if (hueDistanceDeg(existingHues[i], existingHues[j]) < 20) {
          isDistinct = false;
          break;
        }
      }
      if (isDistinct) {
        distinctCount++;
      }
    }

    if (distinctCount < minDistinctHues) {
      const candidateFamilies = stats.hueBins
        .slice()
        .sort((a, b) => {
          const scoreA =
            (a.avgSat * 0.48 + a.avgChroma * 0.75) * (1 - a.prevalence * 2.6);
          const scoreB =
            (b.avgSat * 0.48 + b.avgChroma * 0.75) * (1 - b.prevalence * 2.6);
          return scoreB - scoreA;
        })
        .slice(0, 8);

      for (let c = 0; c < candidateFamilies.length; c++) {
        if (distinctCount >= minDistinctHues) {
          break;
        }

        const family = candidateFamilies[c];
        let farEnough = true;
        for (let h = 0; h < existingHues.length; h++) {
          if (hueDistanceDeg(family.hue, existingHues[h]) < 22) {
            farEnough = false;
            break;
          }
        }
        if (!farEnough) {
          continue;
        }

        const slot = constrain(
          floor(extracted.length * 0.6),
          1,
          extracted.length - 1,
        );
        const refLum = luminanceFromHex(fallback[slot + 1]);
        const familyColor = pickHueFamilyColorForLuminance(family, refLum);
        if (!familyColor) {
          continue;
        }

        let rr = round(familyColor.r);
        let gg = round(familyColor.g);
        let bb = round(familyColor.b);
        [rr, gg, bb] = applyVibranceBoost(
          rr,
          gg,
          bb,
          min(1, config.paletteVibranceBoost + 0.1),
        );
        extracted[slot] = rgbToHex(rr, gg, bb);
        existingHues.push(rgbHueDeg(rr, gg, bb));
        distinctCount++;
      }
    }
  }

  return ["#ffffff", ...extracted];
}

function pixelToHueFeature(px) {
  const hue = rgbHueDeg(px.r, px.g, px.b);
  const chroma = Number.isFinite(px.chroma)
    ? px.chroma
    : (max(px.r, px.g, px.b) - min(px.r, px.g, px.b)) / 255;
  const sat = Number.isFinite(px.sat)
    ? px.sat
    : rgbSaturation01(px.r, px.g, px.b);
  const lum = luminanceFromRGB(px.r, px.g, px.b);
  const angle = radians(hue);
  const chromaStretch = 1.25;
  return {
    x: cos(angle) * chroma * chromaStretch,
    y: sin(angle) * chroma * chromaStretch,
    z: (lum / 255) * 0.85,
    hue,
    sat,
    chroma,
    lum,
    r: px.r,
    g: px.g,
    b: px.b,
  };
}

function clusterHueFeatures(features, k = 3, iterations = 7) {
  if (!Array.isArray(features) || features.length < 1) {
    return [];
  }

  const clusterCount = constrain(floor(k), 1, min(6, features.length));
  const centers = [];

  const sortedByEnergy = features
    .slice()
    .sort((a, b) => b.chroma + b.sat - (a.chroma + a.sat));
  centers.push({
    x: sortedByEnergy[0].x,
    y: sortedByEnergy[0].y,
    z: sortedByEnergy[0].z,
  });

  while (centers.length < clusterCount) {
    let bestIdx = 0;
    let bestDist = -Infinity;
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      let minDist = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const dx = f.x - centers[c].x;
        const dy = f.y - centers[c].y;
        const dz = f.z - centers[c].z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < minDist) {
          minDist = d2;
        }
      }
      if (minDist > bestDist) {
        bestDist = minDist;
        bestIdx = i;
      }
    }
    const pick = features[bestIdx];
    centers.push({ x: pick.x, y: pick.y, z: pick.z });
  }

  let assignment = new Array(features.length).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const dx = f.x - centers[c].x;
        const dy = f.y - centers[c].y;
        const dz = f.z - centers[c].z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < bestDist) {
          bestDist = d2;
          best = c;
        }
      }
      assignment[i] = best;
    }

    const next = new Array(centers.length).fill(0).map(() => ({
      x: 0,
      y: 0,
      z: 0,
      w: 0,
      count: 0,
      sat: 0,
      chroma: 0,
      lum: 0,
      hx: 0,
      hy: 0,
      members: [],
    }));

    for (let i = 0; i < features.length; i++) {
      const idx = assignment[i];
      const f = features[i];
      const w =
        1 +
        f.sat * constrain(config.paletteSatWeight, 0, 6) * 0.24 +
        f.chroma * 0.6;
      const c = next[idx];
      c.x += f.x * w;
      c.y += f.y * w;
      c.z += f.z * w;
      c.w += w;
      c.count++;
      c.sat += f.sat;
      c.chroma += f.chroma;
      c.lum += f.lum;
      const rad = radians(f.hue);
      c.hx += cos(rad) * w;
      c.hy += sin(rad) * w;
      c.members.push(f);
    }

    for (let c = 0; c < next.length; c++) {
      if (next[c].w > 0) {
        centers[c] = {
          x: next[c].x / next[c].w,
          y: next[c].y / next[c].w,
          z: next[c].z / next[c].w,
        };
      }
    }

    if (iter === iterations - 1) {
      return next
        .filter((c) => c.count > 0)
        .map((c) => {
          let hue = degrees(atan2(c.hy, c.hx));
          if (hue < 0) {
            hue += 360;
          }
          return {
            center: {
              x: c.x / max(1e-6, c.w),
              y: c.y / max(1e-6, c.w),
              z: c.z / max(1e-6, c.w),
            },
            hue,
            sat: c.sat / max(1, c.count),
            chroma: c.chroma / max(1, c.count),
            lum: c.lum / max(1, c.count),
            prevalence: c.count / max(1, features.length),
            members: c.members,
          };
        });
    }
  }

  return [];
}

function pickClusterMedoid(cluster) {
  if (
    !cluster ||
    !Array.isArray(cluster.members) ||
    cluster.members.length < 1
  ) {
    return null;
  }

  let best = cluster.members[0];
  let bestScore = -Infinity;
  for (let i = 0; i < cluster.members.length; i++) {
    const px = cluster.members[i];
    const dx = px.x - cluster.center.x;
    const dy = px.y - cluster.center.y;
    const dz = px.z - cluster.center.z;
    const dist = sqrt(dx * dx + dy * dy + dz * dz);
    const score =
      px.chroma * 0.55 + px.sat * 0.35 + constrain(1 - dist * 2.4, 0, 1) * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = px;
    }
  }

  return {
    r: best.r,
    g: best.g,
    b: best.b,
    hue: best.hue,
    sat: best.sat,
    chroma: best.chroma,
    lum: best.lum,
  };
}

function extractPaletteFromBandHuePriority(
  sampleImage,
  bandMap,
  includeAccent = false,
) {
  const fallback = getDefaultPaletteForToneCount();
  if (!sampleImage || !bandMap) {
    return fallback;
  }

  sampleImage.loadPixels();
  const expected = sampleImage.width * sampleImage.height;
  if (bandMap.length !== expected) {
    return fallback;
  }

  const toneCount = getNumBands();
  const pixelsByBand = new Array(toneCount).fill(0).map(() => []);

  for (let idx = 0; idx < bandMap.length; idx++) {
    const rawBand = bandMap[idx];
    const band = Number.isFinite(rawBand)
      ? constrain(floor(rawBand), 0, toneCount - 1)
      : toneCount - 1;
    const pi = idx * 4;
    const r = sampleImage.pixels[pi];
    const g = sampleImage.pixels[pi + 1];
    const b = sampleImage.pixels[pi + 2];
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
      continue;
    }

    const sat = rgbSaturation01(r, g, b);
    const chroma = (max(r, g, b) - min(r, g, b)) / 255;
    pixelsByBand[band].push({ r, g, b, sat, chroma });
  }

  const extracted = ["#ffffff"];
  const usedHues = [];

  for (let band = 1; band < toneCount; band++) {
    const bandPixels = pixelsByBand[band];
    if (!bandPixels || bandPixels.length < 1) {
      extracted.push(fallback[band]);
      continue;
    }

    let meanR = 0;
    let meanG = 0;
    let meanB = 0;
    for (let i = 0; i < bandPixels.length; i++) {
      meanR += bandPixels[i].r;
      meanG += bandPixels[i].g;
      meanB += bandPixels[i].b;
    }
    meanR /= max(1, bandPixels.length);
    meanG /= max(1, bandPixels.length);
    meanB /= max(1, bandPixels.length);

    const selectedPixels = selectHighChromaSubset(
      bandPixels,
      config.paletteChromaPercentile,
    );
    const candidatePixels =
      selectedPixels.length >= max(18, floor(bandPixels.length * 0.08))
        ? selectedPixels
        : bandPixels;

    const targetLimit = 2200;
    const stride = max(1, floor(candidatePixels.length / targetLimit));
    const sampled = [];
    for (let i = 0; i < candidatePixels.length; i += stride) {
      sampled.push(candidatePixels[i]);
    }

    const features = sampled.map((px) => pixelToHueFeature(px));
    const clusterCount = constrain(
      floor(map(min(features.length, 1200), 12, 1200, 2, 4)),
      2,
      4,
    );
    const clusters = clusterHueFeatures(features, clusterCount, 7);

    let chosen = null;
    let chosenScore = -Infinity;
    const refLum = luminanceFromHex(fallback[band]);
    const minHueSep = constrain(config.paletteHueSeparation, 8, 90);

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const medoid = pickClusterMedoid(cluster);
      if (!medoid) {
        continue;
      }

      let minHueDist = 180;
      for (let h = 0; h < usedHues.length; h++) {
        const dist = hueDistanceDeg(medoid.hue, usedHues[h]);
        if (dist < minHueDist) {
          minHueDist = dist;
        }
      }

      const hueSepScore =
        usedHues.length < 1
          ? 0.28
          : constrain(minHueDist / max(1, minHueSep), 0, 1.3) * 0.3;
      const lumProx = 1 - min(1, abs(cluster.lum - refLum) / 155);
      const score =
        cluster.prevalence * 0.3 +
        cluster.chroma * 0.38 +
        cluster.sat * 0.24 +
        lumProx * 0.24 +
        hueSepScore;

      if (score > chosenScore) {
        chosenScore = score;
        chosen = medoid;
      }
    }

    let rr = meanR;
    let gg = meanG;
    let bb = meanB;

    if (chosen) {
      usedHues.push(chosen.hue);
      const blend = constrain(
        0.42 +
          config.paletteSatWeight * 0.05 +
          config.paletteChromaPercentile * 0.2,
        0.35,
        0.86,
      );
      rr = lerp(meanR, chosen.r, blend);
      gg = lerp(meanG, chosen.g, blend);
      bb = lerp(meanB, chosen.b, blend);
    }

    [rr, gg, bb] = applyVibranceBoost(rr, gg, bb, config.paletteVibranceBoost);

    const curLum = luminanceFromRGB(rr, gg, bb);
    const align = constrain(config.paletteLumaAlign, 0, 0.5);
    const delta = constrain((refLum - curLum) * align, -18, 18);
    rr = constrain(round(rr + delta), 0, 255);
    gg = constrain(round(gg + delta), 0, 255);
    bb = constrain(round(bb + delta), 0, 255);

    extracted.push(rgbToHex(rr, gg, bb));
  }

  if (includeAccent && extracted.length > 3) {
    const stats = buildHueFamilyStats(sampleImage);
    const selectedFamilies = selectHueFamiliesForExtraction(
      stats.hueBins,
      max(1, toneCount - 1),
      config.paletteHueSeparation,
    );
    const accent = findAccentHueFamily(stats.hueBins, selectedFamilies);
    if (accent) {
      const accentStrength = constrain(config.paletteAccentStrength, 0, 1);
      const accentSlot = constrain(
        floor((toneCount - 1) * 0.6),
        2,
        toneCount - 1,
      );
      const base = parseHexColor(extracted[accentSlot]);
      const blendAmount = constrain(
        accentStrength * (1 - accent.prevalence * 4),
        0,
        0.82,
      );
      let rr = lerp(base.r, accent.r, blendAmount);
      let gg = lerp(base.g, accent.g, blendAmount);
      let bb = lerp(base.b, accent.b, blendAmount);
      [rr, gg, bb] = applyVibranceBoost(
        rr,
        gg,
        bb,
        min(1, config.paletteVibranceBoost + 0.1),
      );
      extracted[accentSlot] = rgbToHex(rr, gg, bb);
    }
  }

  return extracted;
}

function assessSourceColors() {
  if (!sourceImage) {
    return;
  }

  const sample = getPaletteSampleImage();
  const stats = buildHueFamilyStats(sample);
  const top = stats.hueBins.slice(0, 10).map((bin) => ({
    hue: round(bin.hue),
    prevalencePct: round(bin.prevalence * 1000) / 10,
    avgSat: round(bin.avgSat * 100) / 100,
    avgChroma: round(bin.avgChroma * 100) / 100,
    swatch: rgbToHex(bin.avgR, bin.avgG, bin.avgB),
  }));

  const selectedFamilies = selectHueFamiliesForExtraction(
    stats.hueBins,
    max(1, getNumBands() - 1),
    config.paletteHueSeparation,
  );
  const accent = findAccentHueFamily(stats.hueBins, selectedFamilies);

  console.groupCollapsed("Image_To_PrintMaker • Base Colour Assessment");
  console.info(
    `Colorful pixels: ${round((stats.colorfulPixels / max(1, stats.totalPixels)) * 100)}% • Neutral pixels: ${round((stats.neutralPixels / max(1, stats.totalPixels)) * 100)}%`,
  );
  console.table(top);

  const recommendations = [];
  recommendations.push(
    "Use 'Hue Families' when dominant hue groups are visible and you want cleaner non-brown tone mapping.",
  );
  if (accent) {
    recommendations.push(
      `Use 'Hue Families + Accent' to inject a rarer vivid hue around ${round(accent.hue)}° (strength via Accent Strength).`,
    );
  } else {
    recommendations.push(
      "No strong rare accent hue detected; keep Accent Strength low or off.",
    );
  }
  recommendations.push(
    "If output still feels muddy, raise Chroma Cutoff and/or Vibrance Boost slightly.",
  );

  for (let i = 0; i < recommendations.length; i++) {
    console.info(`${i + 1}. ${recommendations[i]}`);
  }
  console.groupEnd();

  redrawOutput();
}

function extractPaletteFromSourceAnchors(sampleImage) {
  const fallback = getDefaultPaletteForToneCount();
  if (!sampleImage) {
    return fallback;
  }

  sampleImage.loadPixels();
  const totalPixels = max(1, sampleImage.width * sampleImage.height);
  const bins = new Map();
  const step = 1;

  for (let y = 0; y < sampleImage.height; y += step) {
    for (let x = 0; x < sampleImage.width; x += step) {
      const i = (y * sampleImage.width + x) * 4;
      const r = sampleImage.pixels[i];
      const g = sampleImage.pixels[i + 1];
      const b = sampleImage.pixels[i + 2];
      const sat = rgbSaturation01(r, g, b);
      const chroma = (max(r, g, b) - min(r, g, b)) / 255;
      const satInfluence = constrain(config.paletteSatWeight, 0, 4);
      const weight =
        1 +
        (pow(sat, 1.02) * 0.45 + pow(chroma, 1.05) * 0.55) *
          satInfluence *
          0.16;

      const rb = floor(r / 24);
      const gb = floor(g / 24);
      const bb = floor(b / 24);
      const key = `${rb}-${gb}-${bb}`;

      if (!bins.has(key)) {
        bins.set(key, {
          r: 0,
          g: 0,
          b: 0,
          w: 0,
          count: 0,
          sat: 0,
          chroma: 0,
        });
      }
      const bin = bins.get(key);
      bin.r += r * weight;
      bin.g += g * weight;
      bin.b += b * weight;
      bin.w += weight;
      bin.count++;
      bin.sat += sat;
      bin.chroma += chroma;
    }
  }

  const candidates = Array.from(bins.values())
    .filter(
      (bin) => bin.w > 0 && bin.count >= max(4, floor(totalPixels * 0.00015)),
    )
    .map((bin) => {
      const r = bin.r / bin.w;
      const g = bin.g / bin.w;
      const b = bin.b / bin.w;
      const lum = luminanceFromRGB(r, g, b);
      const avgSat = bin.sat / max(1, bin.count);
      const avgChroma = bin.chroma / max(1, bin.count);
      const hue = rgbHueDeg(r, g, b);
      const colorEnergy = avgSat * 0.45 + avgChroma * 0.55;
      const prevalence = bin.count / totalPixels;
      const score = pow(bin.count, 0.98) * (0.82 + colorEnergy * 0.18);
      return {
        r,
        g,
        b,
        lum,
        hue,
        score,
        prevalence,
        avgSat,
        avgChroma,
        colorEnergy,
        count: bin.count,
      };
    })
    .sort((a, b) => b.score - a.score);

  let satThreshold = 0;
  let brightLumThreshold = 190;
  let darkLumThreshold = 65;
  if (candidates.length > 0) {
    const satValues = candidates.map((c) => c.avgSat).sort((a, b) => a - b);
    const adaptivePercentile = constrain(
      config.paletteChromaPercentile,
      0,
      0.95,
    );
    const satIdx = floor((satValues.length - 1) * adaptivePercentile);
    satThreshold = satValues[satIdx];

    const lumValues = candidates.map((c) => c.lum).sort((a, b) => a - b);
    const lumIdx = floor((lumValues.length - 1) * 0.7);
    const darkIdx = floor((lumValues.length - 1) * 0.2);
    brightLumThreshold = lumValues[lumIdx];
    darkLumThreshold = lumValues[darkIdx];
  }

  const picked = [];
  const targetCount = getNumBands() - 1;
  const prevalentPool = candidates.filter((c) => c.prevalence >= 0.0004);
  const seedPool = prevalentPool.length > 0 ? prevalentPool : candidates;

  const brightSeed = seedPool
    .slice()
    .sort((a, b) => b.lum - a.lum)
    .find((c) => c.lum >= brightLumThreshold);
  if (brightSeed) {
    picked.push(brightSeed);
  }

  const darkSeed = seedPool
    .slice()
    .sort((a, b) => a.lum - b.lum)
    .find((c) => c.lum <= darkLumThreshold);
  if (darkSeed && !picked.includes(darkSeed)) {
    picked.push(darkSeed);
  }

  const minDist = max(5, config.paletteAnchorDistance);
  const maxCandidateCount = max(12, targetCount * 4);
  for (let i = 0; i < candidates.length; i++) {
    if (picked.length >= maxCandidateCount) {
      break;
    }

    const c = candidates[i];
    const isBrightCandidate = c.lum >= brightLumThreshold;

    // Chroma filtering should not eliminate light tones.
    if (
      !isBrightCandidate &&
      c.colorEnergy + 0.02 < satThreshold &&
      picked.length >= max(2, targetCount - 1)
    ) {
      continue;
    }

    let farEnough = true;
    for (let j = 0; j < picked.length; j++) {
      if (colorDistanceRGB(c, picked[j]) < minDist) {
        farEnough = false;
        break;
      }
    }
    if (farEnough) {
      picked.push(c);
    }
  }

  if (picked.length === 0) {
    return fallback;
  }

  const selected = selectAnchorsByToneSlots(picked, targetCount, minDist);

  const mapped = selected.map((c, idx) => {
    let rr = round(c.r);
    let gg = round(c.g);
    let bb = round(c.b);
    [rr, gg, bb] = applyVibranceBoost(rr, gg, bb, config.paletteVibranceBoost);

    const refLum = luminanceFromHex(fallback[idx + 1]);
    const curLum = luminanceFromRGB(rr, gg, bb);
    const align = constrain(config.paletteLumaAlign, 0, 0.5);
    const delta = constrain((refLum - curLum) * align, -16, 16);
    rr = constrain(round(rr + delta), 0, 255);
    gg = constrain(round(gg + delta), 0, 255);
    bb = constrain(round(bb + delta), 0, 255);

    return rgbToHex(rr, gg, bb);
  });

  return ["#ffffff", ...mapped];
}

function selectAnchorsByToneSlots(candidates, targetCount, minDist = 12) {
  if (!candidates || candidates.length === 0) {
    return [];
  }

  const sorted = candidates
    .slice()
    .map((c) => ({ ...c, lum: luminanceFromRGB(c.r, c.g, c.b) }))
    .sort((a, b) => b.lum - a.lum);

  const lums = sorted.map((c) => c.lum).sort((a, b) => a - b);
  const brightTarget = lums[floor((lums.length - 1) * 0.88)] || 220;
  const darkTarget = lums[floor((lums.length - 1) * 0.12)] || 40;

  const selected = [];
  const used = new Set();

  for (let slot = 0; slot < targetCount; slot++) {
    const t = targetCount <= 1 ? 0 : slot / (targetCount - 1);
    const targetLum = lerp(brightTarget, darkTarget, t);

    let bestIndex = -1;
    let bestScore = -Infinity;
    let lumWindow = 42;

    for (let pass = 0; pass < 3 && bestIndex < 0; pass++) {
      for (let i = 0; i < sorted.length; i++) {
        if (used.has(i)) {
          continue;
        }

        const c = sorted[i];
        if (abs(c.lum - targetLum) > lumWindow) {
          continue;
        }

        const lumProximity = 1 - min(1, abs(c.lum - targetLum) / 120);
        const prevalence = min(1, (c.count || 1) / 900);
        const fidelity = min(
          1,
          (c.prevalence || 0) * 1200 + (c.colorEnergy || c.avgSat || 0) * 0.6,
        );

        let mildHueDiversity = 0;
        if (selected.length > 0 && c.avgSat > 0.08) {
          let minHueDist = 180;
          for (let j = 0; j < selected.length; j++) {
            const s = selected[j];
            if ((s.avgSat || 0) <= 0.08) {
              continue;
            }
            const dist = hueDistanceDeg(c.hue, s.hue);
            if (dist < minHueDist) {
              minHueDist = dist;
            }
          }
          mildHueDiversity = minHueDist / 180;
        }

        let distPenalty = 0;
        for (let j = 0; j < selected.length; j++) {
          const d = colorDistanceRGB(c, selected[j]);
          if (d < minDist) {
            distPenalty = max(distPenalty, (minDist - d) / minDist);
          }
        }

        const score =
          lumProximity * 0.52 +
          prevalence * 0.28 +
          fidelity * 0.24 +
          mildHueDiversity * 0.08 -
          distPenalty * 0.3;

        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      lumWindow += 30;
    }

    if (bestIndex >= 0) {
      selected.push(sorted[bestIndex]);
      used.add(bestIndex);
    }
  }

  if (selected.length < targetCount) {
    for (let i = 0; i < sorted.length && selected.length < targetCount; i++) {
      if (!used.has(i)) {
        selected.push(sorted[i]);
        used.add(i);
      }
    }
  }

  return selected.sort((a, b) => b.lum - a.lum).slice(0, targetCount);
}

function rgbHueDeg(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const maxc = max(rn, gn, bn);
  const minc = min(rn, gn, bn);
  const d = maxc - minc;
  if (d <= 0) {
    return 0;
  }

  let h;
  if (maxc === rn) {
    h = ((gn - bn) / d) % 6;
  } else if (maxc === gn) {
    h = (bn - rn) / d + 2;
  } else {
    h = (rn - gn) / d + 4;
  }
  h *= 60;
  if (h < 0) {
    h += 360;
  }
  return h;
}

function hueDistanceDeg(a, b) {
  const d = abs(a - b) % 360;
  return min(d, 360 - d);
}

function colorDistanceRGB(c1, c2) {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return sqrt(dr * dr + dg * dg + db * db);
}

function luminanceFromRGB(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function luminanceFromHex(hex) {
  const c = color(hex);
  return luminanceFromRGB(red(c), green(c), blue(c));
}

function computeRepresentativeBandColor(bandPixels) {
  if (!bandPixels || bandPixels.length < 1) {
    return null;
  }

  const binSize = 24;
  const bins = new Map();
  let validPixelCount = 0;
  for (let i = 0; i < bandPixels.length; i++) {
    const px = bandPixels[i];
    if (
      !px ||
      !Number.isFinite(px.r) ||
      !Number.isFinite(px.g) ||
      !Number.isFinite(px.b)
    ) {
      continue;
    }

    validPixelCount++;
    const key = `${floor(px.r / binSize)}-${floor(px.g / binSize)}-${floor(px.b / binSize)}`;
    if (!bins.has(key)) {
      bins.set(key, { count: 0, r: 0, g: 0, b: 0 });
    }
    const entry = bins.get(key);
    entry.count++;
    entry.r += px.r;
    entry.g += px.g;
    entry.b += px.b;
  }

  const ordered = Array.from(bins.values()).sort((a, b) => b.count - a.count);
  if (ordered.length < 1) {
    return null;
  }

  const targetCoverage = max(1, floor(validPixelCount * 0.65));
  const maxBins = min(4, ordered.length);
  let selectedCount = 0;
  let rAcc = 0;
  let gAcc = 0;
  let bAcc = 0;

  for (let i = 0; i < maxBins; i++) {
    const bin = ordered[i];
    rAcc += bin.r;
    gAcc += bin.g;
    bAcc += bin.b;
    selectedCount += bin.count;
    if (selectedCount >= targetCoverage) {
      break;
    }
  }

  if (selectedCount <= 0) {
    return null;
  }

  const r = rAcc / selectedCount;
  const g = gAcc / selectedCount;
  const b = bAcc / selectedCount;
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return null;
  }

  return {
    r,
    g,
    b,
  };
}

function extractPaletteFromBandMap(sampleImage, bandMap, direct = false) {
  const fallback = getDefaultPaletteForToneCount();
  if (!sampleImage || !bandMap) {
    return fallback;
  }

  sampleImage.loadPixels();
  const expected = sampleImage.width * sampleImage.height;
  if (bandMap.length !== expected) {
    return fallback;
  }

  const toneCount = getNumBands();
  const pixelsByBand = new Array(toneCount).fill(0).map(() => []);

  for (let idx = 0; idx < bandMap.length; idx++) {
    const rawBand = bandMap[idx];
    const band = Number.isFinite(rawBand)
      ? constrain(floor(rawBand), 0, toneCount - 1)
      : toneCount - 1;
    const pi = idx * 4;
    const r = sampleImage.pixels[pi];
    const g = sampleImage.pixels[pi + 1];
    const b = sampleImage.pixels[pi + 2];
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
      continue;
    }
    const sat = rgbSaturation01(r, g, b);
    pixelsByBand[band].push({ r, g, b, sat });
  }

  const palette = ["#ffffff"];
  for (let band = 1; band < toneCount; band++) {
    const bandPixels = pixelsByBand[band];
    if (!bandPixels || bandPixels.length === 0) {
      palette.push(fallback[band]);
      continue;
    }

    const representative = computeRepresentativeBandColor(bandPixels);
    const bandCount = max(1, bandPixels.length);

    let meanR = 0;
    let meanG = 0;
    let meanB = 0;
    for (let i = 0; i < bandPixels.length; i++) {
      meanR += bandPixels[i].r;
      meanG += bandPixels[i].g;
      meanB += bandPixels[i].b;
    }
    meanR /= bandCount;
    meanG /= bandCount;
    meanB /= bandCount;

    if (direct) {
      const directR = representative ? representative.r : meanR;
      const directG = representative ? representative.g : meanG;
      const directB = representative ? representative.b : meanB;
      palette.push(rgbToHex(round(directR), round(directG), round(directB)));
      continue;
    }

    const selectedPixels = selectHighChromaSubset(
      bandPixels,
      config.paletteChromaPercentile,
    );

    let rAcc = 0;
    let gAcc = 0;
    let bAcc = 0;
    let wAcc = 0;
    for (let i = 0; i < selectedPixels.length; i++) {
      const px = selectedPixels[i];
      const weight = 1 + pow(px.sat, 1.5) * config.paletteSatWeight;
      rAcc += px.r * weight;
      gAcc += px.g * weight;
      bAcc += px.b * weight;
      wAcc += weight;
    }

    if (wAcc <= 0) {
      palette.push(fallback[band]);
      continue;
    }

    const accentR = rAcc / wAcc;
    const accentG = gAcc / wAcc;
    const accentB = bAcc / wAcc;

    const selectedRatio = selectedPixels.length / bandCount;
    let accentBlend = constrain(
      0.34 + config.paletteSatWeight * 0.1,
      0.34,
      0.78,
    );
    accentBlend *= constrain(0.55 + selectedRatio * 0.9, 0.55, 1);

    let rr = round(lerp(meanR, accentR, accentBlend));
    let gg = round(lerp(meanG, accentG, accentBlend));
    let bb = round(lerp(meanB, accentB, accentBlend));

    [rr, gg, bb] = applyVibranceBoost(rr, gg, bb, config.paletteVibranceBoost);
    palette.push(rgbToHex(rr, gg, bb));
  }

  return palette;
}

function selectHighChromaSubset(pixels, percentile = 0.72) {
  if (!pixels || pixels.length === 0) {
    return [];
  }

  const p = constrain(percentile, 0, 0.99);
  if (p <= 0) {
    return pixels;
  }

  const satValues = pixels.map((px) => px.sat).sort((a, b) => a - b);
  const idx = floor((satValues.length - 1) * p);
  const threshold = satValues[idx];
  const selected = pixels.filter((px) => px.sat >= threshold);

  // Keep extraction stable when a band has mostly low-chroma colors.
  if (selected.length < max(12, floor(pixels.length * 0.05))) {
    return pixels;
  }

  return selected;
}

function applyVibranceBoost(r, g, b, amount) {
  const a = constrain(amount, 0, 1);
  if (a <= 0) {
    return [r, g, b];
  }

  const gray = (r + g + b) / 3;
  const scale = 1 + a;
  const rr = round(constrain(gray + (r - gray) * scale, 0, 255));
  const gg = round(constrain(gray + (g - gray) * scale, 0, 255));
  const bb = round(constrain(gray + (b - gray) * scale, 0, 255));
  return [rr, gg, bb];
}

function rgbSaturation01(r, g, b) {
  const maxc = max(r, g, b);
  const minc = min(r, g, b);
  if (maxc <= 0) {
    return 0;
  }
  return (maxc - minc) / maxc;
}

function applyManualPaletteMode() {
  config.paletteMode = "Manual";
  redrawOutput();
}

function rgbToHex(r, g, b) {
  const toHex = (v) => {
    const normalized = Number.isFinite(v) ? v : 0;
    const clamped = constrain(round(normalized), 0, 255);
    const hex = Number(clamped).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function loadAndPrepareImage(img, isDraft = false) {
  const fitW = config.fitToPaper ? nwidth : img.width;
  const fitH = config.fitToPaper ? nheight : img.height;
  const effectiveCell = getEffectiveCellSize();
  const detailBoost = 1 / effectiveCell;
  const qualityScale = isDraft ? constrain(config.draftScale, 0.25, 0.9) : 1;
  const maxW = max(
    40,
    floor(fitW * config.processScale * detailBoost * qualityScale),
  );
  const maxH = max(
    40,
    floor(fitH * config.processScale * detailBoost * qualityScale),
  );
  const dimCap = max(
    200,
    floor(isDraft ? config.maxProcessDim * 0.7 : config.maxProcessDim),
  );
  const cappedRatio = min(1, dimCap / max(maxW, maxH));
  const cappedW = floor(maxW * cappedRatio);
  const cappedH = floor(maxH * cappedRatio);

  const ratio = min(cappedW / img.width, cappedH / img.height);
  const w = max(1, floor(img.width * ratio));
  const h = max(1, floor(img.height * ratio));

  const g = createGraphics(w, h);
  g.pixelDensity(1);
  g.image(img, 0, 0, w, h);
  return g.get();
}

function imageToLuminance(img) {
  img.loadPixels();
  const out = new Float32Array(img.width * img.height);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const r = img.pixels[i];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];
      out[y * img.width + x] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
  }
  return out;
}

function applyEdgePreservingSmoothing(values, w, h, isDraft = false) {
  const draftMul = isDraft ? 0.7 : 1;
  const radius = max(1, floor(config.smoothRadius * draftMul));
  const sigmaS = max(0.001, config.smoothSigmaSpatial * draftMul);
  const sigmaR = max(0.001, config.smoothSigmaRange * draftMul);
  const out = new Float32Array(values.length);

  const spatial = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const d2 = dx * dx + dy * dy;
      spatial.push(Math.exp(-d2 / (2 * sigmaS * sigmaS)));
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const centre = values[y * w + x];
      let sum = 0;
      let wsum = 0;
      let k = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const yy = constrain(y + dy, 0, h - 1);
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = constrain(x + dx, 0, w - 1);
          const v = values[yy * w + xx];
          const diff = v - centre;
          const rangeW = Math.exp(-(diff * diff) / (2 * sigmaR * sigmaR));
          const ww = spatial[k] * rangeW;
          sum += v * ww;
          wsum += ww;
          k++;
        }
      }

      out[y * w + x] = wsum > 0 ? sum / wsum : centre;
    }
  }

  return out;
}

function computeGradientMagnitude(values, w, h) {
  const out = new Float32Array(values.length);
  const sx = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];
  const sy = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];

  let maxGrad = 1;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const v = values[(y + ky) * w + (x + kx)];
          gx += v * sx[ky + 1][kx + 1];
          gy += v * sy[ky + 1][kx + 1];
        }
      }

      const g = Math.sqrt(gx * gx + gy * gy);
      out[y * w + x] = g;
      if (g > maxGrad) {
        maxGrad = g;
      }
    }
  }

  for (let i = 0; i < out.length; i++) {
    out[i] /= maxGrad;
  }

  return out;
}

function quantilesFromArray(values, sortedProbabilities) {
  if (!values || values.length === 0) {
    return sortedProbabilities.map(() => 0);
  }

  const sorted = values.slice().sort((a, b) => a - b);
  return sortedProbabilities.map((p) => {
    const idx = constrain(
      floor((sorted.length - 1) * constrain(p, 0, 1)),
      0,
      sorted.length - 1,
    );
    return sorted[idx];
  });
}

function bandFromThresholds(value, thresholds, darkestBand) {
  let assignedBand = WHITE_BAND;
  for (let t = 0; t < thresholds.length; t++) {
    if (value < thresholds[t]) {
      assignedBand = darkestBand - t;
      break;
    }
  }
  return assignedBand;
}

function getNonWhiteBandFromUnit(unitValue, toneCount) {
  const darkestBand = toneCount - 1;
  const bins = max(1, toneCount - 1);
  const idx = constrain(
    floor(constrain(unitValue, 0, 0.999999) * bins),
    0,
    bins - 1,
  );
  return 1 + idx;
}

function segmentByHueGroups(lumaOriginal, lumaSmoothed, sampleImage, w, h) {
  const toneCount = getNumBands();
  const darkestBand = getDarkestBand();
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < lumaSmoothed.length; i++) {
    histogram[constrain(floor(lumaSmoothed[i]), 0, 255)]++;
  }
  const whiteThreshold = quantileFromHistogram(
    histogram,
    lumaSmoothed.length,
    0.93,
  );

  const bandMap = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const luma = lumaOriginal[i];
    if (luma >= whiteThreshold) {
      bandMap[i] = WHITE_BAND;
      continue;
    }

    const pi = i * 4;
    const hDeg = rgbHueDeg(
      sampleImage.pixels[pi],
      sampleImage.pixels[pi + 1],
      sampleImage.pixels[pi + 2],
    );
    bandMap[i] = getNonWhiteBandFromUnit(hDeg / 360, toneCount);
  }

  return { bandMap, thresholds: [] };
}

function segmentBySaturationGroups(lumaOriginal, sampleImage, w, h) {
  const toneCount = getNumBands();
  const darkestBand = getDarkestBand();
  const satValues = new Array(w * h);
  const lumaValues = new Array(w * h);

  for (let i = 0; i < w * h; i++) {
    const pi = i * 4;
    const r = sampleImage.pixels[pi];
    const g = sampleImage.pixels[pi + 1];
    const b = sampleImage.pixels[pi + 2];
    satValues[i] = rgbSaturation01(r, g, b);
    lumaValues[i] = lumaOriginal[i];
  }

  const whiteThreshold = quantilesFromArray(lumaValues, [0.93])[0];
  const satThresholds = quantilesFromArray(
    satValues,
    Array.from({ length: toneCount - 1 }, (_, i) => (i + 1) / toneCount),
  );

  const bandMap = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (lumaOriginal[i] >= whiteThreshold) {
      bandMap[i] = WHITE_BAND;
      continue;
    }

    const sat = satValues[i];
    let assigned = darkestBand;
    for (let t = 0; t < satThresholds.length; t++) {
      if (sat < satThresholds[t]) {
        assigned = 1 + t;
        break;
      }
    }
    bandMap[i] = constrain(assigned, 1, darkestBand);
  }

  return { bandMap, thresholds: satThresholds };
}

function segmentByHueLumaHybrid(
  lumaOriginal,
  lumaSmoothed,
  grad,
  sampleImage,
  w,
  h,
) {
  const toneCount = getNumBands();
  const darkestBand = getDarkestBand();
  const thresholds = weightedThresholds(lumaSmoothed);
  const bandMap = new Uint8Array(w * h);

  for (let i = 0; i < w * h; i++) {
    const baseTone = lerp(lumaOriginal[i], lumaSmoothed[i], 0.7);
    const edgeDarken = config.darkEdgeBias * grad[i] * config.edgeStrength * 18;
    const tone = baseTone - edgeDarken;
    let band = bandFromThresholds(tone, thresholds, darkestBand);

    if (band !== WHITE_BAND) {
      const pi = i * 4;
      const hDeg = rgbHueDeg(
        sampleImage.pixels[pi],
        sampleImage.pixels[pi + 1],
        sampleImage.pixels[pi + 2],
      );
      const hueSector = floor((hDeg / 360) * 6);
      const shift = hueSector % 2 === 0 ? -1 : 1;
      band = constrain(band + shift, 1, darkestBand);
    }

    bandMap[i] = band;
  }

  return { bandMap, thresholds };
}

function segmentTonalBands(
  lumaOriginal,
  lumaSmoothed,
  grad,
  sampleImage,
  w,
  h,
) {
  const mode = config.toneBandMode || "Luminance (Weighted)";

  if (mode === "Hue Groups") {
    return segmentByHueGroups(lumaOriginal, lumaSmoothed, sampleImage, w, h);
  }

  if (mode === "Saturation Groups") {
    return segmentBySaturationGroups(lumaOriginal, sampleImage, w, h);
  }

  if (mode === "Hue-Luma Hybrid") {
    return segmentByHueLumaHybrid(
      lumaOriginal,
      lumaSmoothed,
      grad,
      sampleImage,
      w,
      h,
    );
  }

  const thresholds = weightedThresholds(lumaSmoothed);
  const darkestBand = getDarkestBand();
  const bandMap = new Uint8Array(w * h);

  for (let i = 0; i < lumaSmoothed.length; i++) {
    const baseTone = lerp(lumaOriginal[i], lumaSmoothed[i], 0.7);
    const edgeDarken = config.darkEdgeBias * grad[i] * config.edgeStrength * 18;
    const tone = baseTone - edgeDarken;

    let assignedBand = WHITE_BAND;
    for (let t = 0; t < thresholds.length; t++) {
      if (tone < thresholds[t]) {
        assignedBand = darkestBand - t;
        break;
      }
    }

    bandMap[i] = assignedBand;
  }

  return { bandMap, thresholds };
}

function weightedThresholds(luma) {
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < luma.length; i++) {
    const v = constrain(floor(luma[i]), 0, 255);
    histogram[v]++;
  }

  const total = luma.length;
  ensureBandWeightsForToneCount();
  const toneCount = getNumBands();
  const rawWeights = config.bandWeights
    .slice(0, toneCount)
    .map((w) => max(0.001, w));

  // Amplify user slider influence so tonal weight edits have clearer visual impact.
  const WEIGHT_RESPONSE = 1.65;
  const weights = rawWeights.map((w) => pow(w, WEIGHT_RESPONSE));

  const sum = weights.reduce((acc, v) => acc + v, 0);
  const thresholds = [];
  let run = 0;
  for (let band = toneCount - 1; band >= 1; band--) {
    run += weights[band];
    const p = run / sum;
    const t = quantileFromHistogram(histogram, total, p) - config.thresholdLift;
    thresholds.push(constrain(t, 0, 255));
  }

  for (let i = 1; i < thresholds.length; i++) {
    thresholds[i] = constrain(
      max(thresholds[i], thresholds[i - 1] + 1),
      0,
      255,
    );
  }

  return thresholds;
}

function quantileFromHistogram(hist, total, q) {
  const target = total * constrain(q, 0, 1);
  let run = 0;
  for (let i = 0; i < hist.length; i++) {
    run += hist[i];
    if (run >= target) {
      return i;
    }
  }
  return 255;
}

function mergeSmallRegions(bandMap, w, h, minArea) {
  if (minArea <= 1) {
    return bandMap;
  }

  const out = new Uint8Array(bandMap);
  const visited = new Uint8Array(w * h);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (let i = 0; i < out.length; i++) {
    if (visited[i]) {
      continue;
    }

    const band = out[i];
    const component = [];
    const queue = [i];
    visited[i] = 1;

    while (queue.length > 0) {
      const idx = queue.pop();
      component.push(idx);
      const x = idx % w;
      const y = floor(idx / w);

      for (let d = 0; d < dirs.length; d++) {
        const nx = x + dirs[d][0];
        const ny = y + dirs[d][1];
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
          continue;
        }
        const nidx = ny * w + nx;
        if (!visited[nidx] && out[nidx] === band) {
          visited[nidx] = 1;
          queue.push(nidx);
        }
      }
    }

    if (component.length >= minArea) {
      continue;
    }

    const toneCount = getNumBands();
    const neighborCount = new Array(toneCount).fill(0);
    for (let c = 0; c < component.length; c++) {
      const idx = component[c];
      const x = idx % w;
      const y = floor(idx / w);
      for (let d = 0; d < dirs.length; d++) {
        const nx = x + dirs[d][0];
        const ny = y + dirs[d][1];
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
          continue;
        }
        const nidx = ny * w + nx;
        if (out[nidx] !== band) {
          neighborCount[out[nidx]]++;
        }
      }
    }

    let replacement = band;
    let best = -1;
    for (let b = 0; b < toneCount; b++) {
      if (neighborCount[b] > best) {
        best = neighborCount[b];
        replacement = b;
      }
    }

    for (let c = 0; c < component.length; c++) {
      out[component[c]] = replacement;
    }
  }

  return out;
}

function smoothCloseToneBands(
  bandMap,
  w,
  h,
  passes = 1,
  mergeRange = 1,
  consensus = 0.62,
) {
  if (passes <= 0 || mergeRange <= 0) {
    return bandMap;
  }

  let current = new Uint8Array(bandMap);
  const toneCount = getNumBands();
  const threshold = constrain(consensus, 0.5, 0.99);

  for (let pass = 0; pass < passes; pass++) {
    const next = new Uint8Array(current);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const baseBand = current[idx];

        const counts = new Array(toneCount).fill(0);
        let eligible = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) {
              continue;
            }
            const nidx = (y + dy) * w + (x + dx);
            const nb = current[nidx];
            if (abs(nb - baseBand) <= mergeRange) {
              counts[nb]++;
              eligible++;
            }
          }
        }

        if (eligible === 0) {
          continue;
        }

        let bestBand = baseBand;
        let bestCount = counts[baseBand];
        for (let band = 0; band < toneCount; band++) {
          if (counts[band] > bestCount) {
            bestCount = counts[band];
            bestBand = band;
          }
        }

        if (bestBand !== baseBand && bestCount / eligible >= threshold) {
          next[idx] = bestBand;
        }
      }
    }

    current = next;
  }

  return current;
}

function buildKeylineMask(bandMap, grad, w, h) {
  const mask = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (grad[idx] < config.keylineThreshold) {
        continue;
      }

      const band = bandMap[idx];
      const left = bandMap[idx - 1];
      const right = bandMap[idx + 1];
      const up = bandMap[idx - w];
      const down = bandMap[idx + w];
      const isBoundary =
        left !== band || right !== band || up !== band || down !== band;

      if (isBoundary) {
        mask[idx] = 1;
      }
    }
  }
  return mask;
}

function displayBands(data) {
  const palette = resolvePalette();
  const paletteRGB = palette.map((p) => parseHexColor(p));
  const protectedContext = buildProtectedColorRenderContext(data);
  const toneCount = getNumBands();
  const showReference = !!sourceImage && config.showOriginalReference;
  const referenceGap = showReference ? 18 : 0;
  const outputAreaHeight = showReference
    ? max(1, floor((nheight - referenceGap) / 2))
    : nheight;

  const scale = outputAreaHeight / data.height;
  const drawW = max(1, floor(data.width * scale));
  const drawH = max(1, floor(data.height * scale));
  const xOffset = floor((nwidth - drawW) * 0.5);
  const yOffset = 0;
  const renderScaleX = drawW / data.width;
  const renderScaleY = drawH / data.height;
  const effectiveCell = getEffectiveCellSize();
  const cell = max(1, floor(effectiveCell));
  const isBandVisible = (band) => {
    const key = `tone${band}`;
    return !!toneVisibility[key];
  };

  noStroke();

  if (cell === 1) {
    const layer = createImage(data.width, data.height);
    layer.loadPixels();
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const idx = y * data.width + x;
        const band = data.bandMap[idx];
        let rgb = isBandVisible(band)
          ? paletteRGB[band] || { r: 0, g: 0, b: 0 }
          : { r: 255, g: 255, b: 255 };
        if (isBandVisible(band) && band !== WHITE_BAND) {
          rgb = blendProtectedColorForPixel(rgb, data, idx, protectedContext);
        }
        const pi = idx * 4;
        layer.pixels[pi] = rgb.r;
        layer.pixels[pi + 1] = rgb.g;
        layer.pixels[pi + 2] = rgb.b;
        layer.pixels[pi + 3] = 255;
      }
    }
    layer.updatePixels();
    noSmooth();
    image(layer, xOffset, yOffset, drawW, drawH);
  } else {
    for (let y = 0; y < data.height; y += cell) {
      for (let x = 0; x < data.width; x += cell) {
        const idx = y * data.width + x;
        const band = data.bandMap[idx];
        if (!isBandVisible(band)) {
          continue;
        }
        let rgb = paletteRGB[band] || { r: 0, g: 0, b: 0 };
        if (band !== WHITE_BAND) {
          rgb = blendProtectedColorForPixel(rgb, data, idx, protectedContext);
        }
        fill(rgb.r, rgb.g, rgb.b);
        rect(
          xOffset + x * renderScaleX,
          yOffset + y * renderScaleY,
          cell * renderScaleX,
          cell * renderScaleY,
        );
      }
    }
  }

  // Keyline overlay on tone boundaries.
  if (config.showKeyline) {
    stroke("#000000");
    const keylineBase = 0.75 * min(renderScaleX, renderScaleY);
    strokeWeight(max(0.2, keylineBase * max(0.1, config.keylineWeight)));
    noFill();
    for (let y = 1; y < data.height - 1; y += cell) {
      for (let x = 1; x < data.width - 1; x += cell) {
        const idx = y * data.width + x;
        if (!data.keylineMask[idx]) {
          continue;
        }

        const band = data.bandMap[idx];
        if (!isBandVisible(band)) {
          continue;
        }
        const right = data.bandMap[idx + 1];
        const down = data.bandMap[idx + data.width];

        const px = xOffset + x * renderScaleX;
        const py = yOffset + y * renderScaleY;
        if (right !== band) {
          line(
            px + renderScaleX * 0.5,
            py,
            px + renderScaleX * 0.5,
            py + renderScaleY,
          );
        }
        if (down !== band) {
          line(
            px,
            py + renderScaleY * 0.5,
            px + renderScaleX,
            py + renderScaleY * 0.5,
          );
        }
      }
    }
  }

  if (showReference) {
    displayOriginalReference(
      outputAreaHeight + referenceGap,
      nheight - (outputAreaHeight + referenceGap),
    );
  }
}

function displayOriginalReference(yStart, areaHeight) {
  const refImage = sourceImage || lastGoodSourceImage;
  if (!refImage || areaHeight <= 0) {
    return;
  }

  stroke(0, 35);
  strokeWeight(1);
  line(0, yStart - 9, nwidth, yStart - 9);

  noStroke();
  fill(20, 110);
  textAlign(LEFT, TOP);
  textSize(11);
  text("Original Reference", 12, yStart - 7);

  const scale = areaHeight / refImage.height;
  const refW = max(1, floor(refImage.width * scale));
  const refH = max(1, floor(refImage.height * scale));
  const xOffset = floor((nwidth - refW) * 0.5);
  const yOffset = yStart;

  image(refImage, xOffset, yOffset, refW, refH);
}

function resolvePalette() {
  const toneCount = getNumBands();

  if (config.paletteMode === "Image Extracted") {
    return interpolatePalette(imageExtractedPalette, toneCount);
  }

  if (config.paletteMode === "Manual") {
    const manual = [];
    for (let i = 0; i < toneCount; i++) {
      manual.push(manualPalette[`tone${i}`]);
    }
    return manual;
  }

  if (palettePresets[config.paletteMode]) {
    return interpolatePalette(palettePresets[config.paletteMode], toneCount);
  }

  const chooser = new ColorChoice(4);
  const fallback = ["#ffffff"];
  for (let i = 1; i < toneCount - 1; i++) {
    fallback.push(chooser.rcol().toString("#rrggbb"));
  }
  fallback.push("#1a1a1a");
  return fallback;
}

function applyTextureOverlayPlaceholder(data) {
  return data;
}

function savePNGExport() {
  if (!sourceImage) {
    return;
  }

  let exportData = processed;
  let exportWidth = nwidth;
  let exportHeight = nheight;

  if (config.exportAtSourceResolution) {
    const sourceSample = sourceImage.get();
    exportData = buildProcessedFromSampleImage(sourceSample, false);
    exportWidth = sourceSample.width;
    exportHeight = sourceSample.height;
  } else {
    if (!exportData) {
      processImagePipelineWithMode(false);
      exportData = processed;
    }
  }

  const exportGraphics = createGraphics(exportWidth, exportHeight);
  exportGraphics.pixelDensity(1);
  exportGraphics.background("#ffffff");
  renderProcessedToGraphics(
    exportGraphics,
    exportData,
    exportWidth,
    exportHeight,
  );

  const filenameBase = sketchName + "-" + getTimeStamp() + "-seed" + seed;
  saveCanvas(exportGraphics.elt, filenameBase, "png");
  exportGraphics.remove();
}

function saveSVGLayerExports() {
  if (!sourceImage || isExportingSVGLayers) {
    return;
  }

  let exportData = processed;
  if (!exportData) {
    processImagePipelineWithMode(false);
    exportData = processed;
  }
  if (!exportData) {
    return;
  }

  const filenameBase = sketchName + "-" + getTimeStamp() + "-seed" + seed;

  const toneCount = getNumBands();
  const palette = resolvePalette();
  const exportBands = [];
  for (let i = 0; i < toneCount; i++) {
    if (!isPureWhiteHex(palette[i])) {
      exportBands.push(i);
    }
  }
  if (exportBands.length < 1) {
    redraw();
    return;
  }

  const exportDelayMs = 240;
  let exportIdx = 0;
  isExportingSVGLayers = true;

  const exportNextBand = () => {
    if (exportIdx >= exportBands.length) {
      isExportingSVGLayers = false;
      redraw();
      return;
    }

    const band = exportBands[exportIdx];
    clear();
    renderSingleBandToCanvas(exportData, band, true, config.svgLayerMode);
    const toneName = getToneLayerName(band);
    save(`${filenameBase}-${toneName}.svg`);

    exportIdx++;
    setTimeout(exportNextBand, exportDelayMs);
  };

  exportNextBand();
}

function isPureWhiteHex(hex) {
  const c = parseHexColor(hex || "#000000");
  return c.r === 255 && c.g === 255 && c.b === 255;
}

function savePNGLayerExports() {
  if (!sourceImage || isExportingPNGLayers) {
    return;
  }

  let exportData = processed;
  let exportWidth = nwidth;
  let exportHeight = nheight;

  if (config.exportAtSourceResolution) {
    const sourceSample = sourceImage.get();
    exportData = buildProcessedFromSampleImage(sourceSample, false);
    exportWidth = sourceSample.width;
    exportHeight = sourceSample.height;
  } else {
    if (!exportData) {
      processImagePipelineWithMode(false);
      exportData = processed;
    }
  }

  if (!exportData) {
    return;
  }

  const filenameBase = sketchName + "-" + getTimeStamp() + "-seed" + seed;
  const layerGraphics = createGraphics(exportWidth, exportHeight);
  layerGraphics.pixelDensity(1);

  const toneCount = getNumBands();
  const exportDelayMs = 220;
  let band = 0;
  isExportingPNGLayers = true;

  const exportNextBand = () => {
    if (band >= toneCount) {
      layerGraphics.remove();
      isExportingPNGLayers = false;
      redraw();
      return;
    }

    layerGraphics.clear();
    renderSingleBandToGraphics(
      layerGraphics,
      exportData,
      band,
      exportWidth,
      exportHeight,
      true,
    );

    const toneName = getToneLayerName(band);
    saveCanvas(layerGraphics.elt, `${filenameBase}-${toneName}`, "png");

    band++;
    setTimeout(exportNextBand, exportDelayMs);
  };

  exportNextBand();
}

function getToneLayerName(band) {
  const darkestBand = getDarkestBand();
  if (band === WHITE_BAND) {
    return "tone0-white";
  }
  if (band === 1) {
    return "tone1-light";
  }
  if (band === darkestBand) {
    return `tone${band}-darkest`;
  }
  return `tone${band}-mid`;
}

function renderSingleBandToCanvas(
  data,
  targetBand,
  forcePixelAccurate = false,
  svgMode = "Run Rects",
) {
  const palette = resolvePalette();
  const scale = min(nwidth / data.width, nheight / data.height);
  const drawW = max(1, floor(data.width * scale));
  const drawH = max(1, floor(data.height * scale));
  const xOffset = floor((nwidth - drawW) * 0.5);
  const yOffset = floor((nheight - drawH) * 0.5);
  const renderScaleX = drawW / data.width;
  const renderScaleY = drawH / data.height;
  const effectiveCell = getEffectiveCellSize();
  const cell = forcePixelAccurate ? 1 : max(1, floor(effectiveCell));

  noStroke();
  fill(palette[targetBand]);
  const bandMap = data.bandMap;
  const w = data.width;

  if (svgMode === "Smooth Contours") {
    renderSingleBandContoursToCanvas(
      data,
      targetBand,
      xOffset,
      yOffset,
      renderScaleX,
      renderScaleY,
    );
    return;
  }

  for (let y = 0; y < data.height; y += cell) {
    let x = 0;
    while (x < w) {
      const idx = y * w + x;
      if (bandMap[idx] !== targetBand) {
        x += cell;
        continue;
      }

      const startX = x;
      x += cell;
      while (x < w && bandMap[y * w + x] === targetBand) {
        x += cell;
      }

      const runWidth = x - startX;
      rect(
        xOffset + startX * renderScaleX,
        yOffset + y * renderScaleY,
        runWidth * renderScaleX,
        cell * renderScaleY,
      );
    }
  }
}

function renderSingleBandToGraphics(
  g,
  data,
  targetBand,
  targetWidth = nwidth,
  targetHeight = nheight,
  forcePixelAccurate = false,
  svgMode = "Run Rects",
) {
  const palette = resolvePalette();
  const scale = min(targetWidth / data.width, targetHeight / data.height);
  const drawW = max(1, floor(data.width * scale));
  const drawH = max(1, floor(data.height * scale));
  const xOffset = floor((targetWidth - drawW) * 0.5);
  const yOffset = floor((targetHeight - drawH) * 0.5);
  const renderScaleX = drawW / data.width;
  const renderScaleY = drawH / data.height;
  const effectiveCell = getEffectiveCellSize();
  const cell = forcePixelAccurate ? 1 : max(1, floor(effectiveCell));

  g.noStroke();
  g.fill(palette[targetBand]);

  const bandMap = data.bandMap;
  const w = data.width;

  if (svgMode === "Smooth Contours") {
    renderSingleBandContoursToGraphics(
      g,
      data,
      targetBand,
      xOffset,
      yOffset,
      renderScaleX,
      renderScaleY,
    );
    return;
  }

  for (let y = 0; y < data.height; y += cell) {
    let x = 0;
    while (x < w) {
      const idx = y * w + x;
      if (bandMap[idx] !== targetBand) {
        x += cell;
        continue;
      }

      const startX = x;
      x += cell;
      while (x < w && bandMap[y * w + x] === targetBand) {
        x += cell;
      }

      const runWidth = x - startX;
      g.rect(
        xOffset + startX * renderScaleX,
        yOffset + y * renderScaleY,
        runWidth * renderScaleX,
        cell * renderScaleY,
      );
    }
  }
}

function renderSingleBandContoursToCanvas(
  data,
  targetBand,
  xOffset,
  yOffset,
  renderScaleX,
  renderScaleY,
) {
  const contours = traceBandContours(
    data.bandMap,
    data.width,
    data.height,
    targetBand,
  );
  if (!contours || contours.length < 1) {
    return;
  }

  const simplifyTolerance = 0.25;
  const smoothIterations = 1;
  for (let i = 0; i < contours.length; i++) {
    let contour = removeCollinearPoints(contours[i]);
    contour = simplifyClosedContour(contour, simplifyTolerance);
    contour = smoothClosedContourChaikin(contour, smoothIterations);

    if (!contour || contour.length < 3) {
      continue;
    }

    beginShape();
    for (let j = 0; j < contour.length; j++) {
      const pt = contour[j];
      vertex(xOffset + pt.x * renderScaleX, yOffset + pt.y * renderScaleY);
    }
    endShape(CLOSE);
  }
}

function renderSingleBandContoursToGraphics(
  g,
  data,
  targetBand,
  xOffset,
  yOffset,
  renderScaleX,
  renderScaleY,
) {
  const contours = traceBandContours(
    data.bandMap,
    data.width,
    data.height,
    targetBand,
  );
  if (!contours || contours.length < 1) {
    return;
  }

  const simplifyTolerance = 0.25;
  const smoothIterations = 1;
  for (let i = 0; i < contours.length; i++) {
    let contour = removeCollinearPoints(contours[i]);
    contour = simplifyClosedContour(contour, simplifyTolerance);
    contour = smoothClosedContourChaikin(contour, smoothIterations);

    if (!contour || contour.length < 3) {
      continue;
    }

    g.beginShape();
    for (let j = 0; j < contour.length; j++) {
      const pt = contour[j];
      g.vertex(xOffset + pt.x * renderScaleX, yOffset + pt.y * renderScaleY);
    }
    g.endShape(CLOSE);
  }
}

function traceBandContours(bandMap, w, h, targetBand) {
  if (!bandMap || w <= 0 || h <= 0) {
    return [];
  }

  const edges = [];
  const startMap = new Map();
  const addEdge = (sx, sy, ex, ey) => {
    const edge = { sx, sy, ex, ey, used: false };
    const index = edges.length;
    edges.push(edge);
    const key = `${sx},${sy}`;
    if (!startMap.has(key)) {
      startMap.set(key, []);
    }
    startMap.get(key).push(index);
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (bandMap[idx] !== targetBand) {
        continue;
      }

      if (y === 0 || bandMap[(y - 1) * w + x] !== targetBand) {
        addEdge(x, y, x + 1, y);
      }
      if (x === w - 1 || bandMap[y * w + (x + 1)] !== targetBand) {
        addEdge(x + 1, y, x + 1, y + 1);
      }
      if (y === h - 1 || bandMap[(y + 1) * w + x] !== targetBand) {
        addEdge(x + 1, y + 1, x, y + 1);
      }
      if (x === 0 || bandMap[y * w + (x - 1)] !== targetBand) {
        addEdge(x, y + 1, x, y);
      }
    }
  }

  if (edges.length < 1) {
    return [];
  }

  const contours = [];
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].used) {
      continue;
    }

    const loop = [];
    let current = i;
    let safety = 0;
    const maxSteps = edges.length + 5;

    while (current >= 0 && !edges[current].used && safety < maxSteps) {
      const edge = edges[current];
      edge.used = true;
      loop.push({ x: edge.sx, y: edge.sy });

      const key = `${edge.ex},${edge.ey}`;
      const nextCandidates = startMap.get(key) || [];
      let nextIndex = -1;
      for (let j = 0; j < nextCandidates.length; j++) {
        const candidateIndex = nextCandidates[j];
        if (!edges[candidateIndex].used) {
          nextIndex = candidateIndex;
          break;
        }
      }

      current = nextIndex;
      safety++;
    }

    if (loop.length >= 3) {
      contours.push(loop);
    }
  }

  return contours;
}

function removeCollinearPoints(points) {
  if (!Array.isArray(points) || points.length < 4) {
    return points || [];
  }

  const out = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const cross = dx1 * dy2 - dy1 * dx2;
    if (abs(cross) > 1e-6) {
      out.push(curr);
    }
  }
  return out.length >= 3 ? out : points;
}

function simplifyClosedContour(points, epsilon = 0.25) {
  if (!Array.isArray(points) || points.length < 5) {
    return points || [];
  }

  const open = points.slice();
  open.push(points[0]);
  const simplifiedOpen = simplifyPolylineRDP(open, epsilon);
  if (simplifiedOpen.length < 4) {
    return points;
  }

  simplifiedOpen.pop();
  return simplifiedOpen;
}

function simplifyPolylineRDP(points, epsilon) {
  if (!Array.isArray(points) || points.length < 3) {
    return points || [];
  }

  let maxDist = -1;
  let maxIndex = -1;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = pointLineDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist <= epsilon || maxIndex < 0) {
    return [start, end];
  }

  const left = simplifyPolylineRDP(points.slice(0, maxIndex + 1), epsilon);
  const right = simplifyPolylineRDP(points.slice(maxIndex), epsilon);
  return left.slice(0, left.length - 1).concat(right);
}

function pointLineDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  if (abs(dx) < 1e-9 && abs(dy) < 1e-9) {
    const px = point.x - lineStart.x;
    const py = point.y - lineStart.y;
    return sqrt(px * px + py * py);
  }

  const t =
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
    (dx * dx + dy * dy);
  const clamped = constrain(t, 0, 1);
  const projX = lineStart.x + dx * clamped;
  const projY = lineStart.y + dy * clamped;
  const ddx = point.x - projX;
  const ddy = point.y - projY;
  return sqrt(ddx * ddx + ddy * ddy);
}

function smoothClosedContourChaikin(points, iterations = 1) {
  if (!Array.isArray(points) || points.length < 3 || iterations <= 0) {
    return points || [];
  }

  let current = points.slice();
  for (let iter = 0; iter < iterations; iter++) {
    const next = [];
    for (let i = 0; i < current.length; i++) {
      const p0 = current[i];
      const p1 = current[(i + 1) % current.length];
      const q = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
      };
      const r = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
      };
      next.push(q, r);
    }
    current = next;
  }
  return current;
}

function renderProcessedToGraphics(
  g,
  data,
  targetWidth = nwidth,
  targetHeight = nheight,
) {
  const palette = resolvePalette();
  const paletteRGB = palette.map((p) => parseHexColor(p));
  const protectedContext = buildProtectedColorRenderContext(data);
  const toneCount = getNumBands();
  const scale = min(targetWidth / data.width, targetHeight / data.height);
  const drawW = max(1, floor(data.width * scale));
  const drawH = max(1, floor(data.height * scale));
  const xOffset = floor((targetWidth - drawW) * 0.5);
  const yOffset = floor((targetHeight - drawH) * 0.5);
  const renderScaleX = drawW / data.width;
  const renderScaleY = drawH / data.height;
  const effectiveCell = getEffectiveCellSize();
  const cell = max(1, floor(effectiveCell));

  g.noStroke();

  if (cell === 1) {
    const layer = createImage(data.width, data.height);
    layer.loadPixels();
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const idx = y * data.width + x;
        const band = data.bandMap[idx];
        let rgb = paletteRGB[band] || { r: 0, g: 0, b: 0 };
        if (band !== WHITE_BAND) {
          rgb = blendProtectedColorForPixel(rgb, data, idx, protectedContext);
        }
        const pi = idx * 4;
        layer.pixels[pi] = rgb.r;
        layer.pixels[pi + 1] = rgb.g;
        layer.pixels[pi + 2] = rgb.b;
        layer.pixels[pi + 3] = 255;
      }
    }
    layer.updatePixels();
    g.noSmooth();
    g.image(layer, xOffset, yOffset, drawW, drawH);
  } else {
    for (let y = 0; y < data.height; y += cell) {
      for (let x = 0; x < data.width; x += cell) {
        const idx = y * data.width + x;
        const band = data.bandMap[idx];
        let rgb = paletteRGB[band] || { r: 0, g: 0, b: 0 };
        if (band !== WHITE_BAND) {
          rgb = blendProtectedColorForPixel(rgb, data, idx, protectedContext);
        }
        g.fill(rgb.r, rgb.g, rgb.b);
        g.rect(
          xOffset + x * renderScaleX,
          yOffset + y * renderScaleY,
          cell * renderScaleX,
          cell * renderScaleY,
        );
      }
    }
  }

  if (config.showKeyline) {
    g.stroke("#000000");
    const keylineBase = 0.75 * min(renderScaleX, renderScaleY);
    g.strokeWeight(max(0.2, keylineBase * max(0.1, config.keylineWeight)));
    g.noFill();
    for (let y = 1; y < data.height - 1; y += cell) {
      for (let x = 1; x < data.width - 1; x += cell) {
        const idx = y * data.width + x;
        if (!data.keylineMask[idx]) {
          continue;
        }
        const band = data.bandMap[idx];
        const right = data.bandMap[idx + 1];
        const down = data.bandMap[idx + data.width];

        const px = xOffset + x * renderScaleX;
        const py = yOffset + y * renderScaleY;
        if (right !== band) {
          g.line(
            px + renderScaleX * 0.5,
            py,
            px + renderScaleX * 0.5,
            py + renderScaleY,
          );
        }
        if (down !== band) {
          g.line(
            px,
            py + renderScaleY * 0.5,
            px + renderScaleX,
            py + renderScaleY * 0.5,
          );
        }
      }
    }
  }
}

function getEffectiveCellSize() {
  // Remap UI value so Cell Size = 1 is finer than the previous implementation.
  return max(0.25, config.cellSize * 0.5);
}

function drawUploadPrompt() {
  noStroke();
  fill(20);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(
    "Upload an image (top-left) to generate printmaker output",
    nwidth / 2,
    nheight / 2,
  );
}

function updatePaperDimensions() {
  paper = paperSize[config.paperSizeName];
  paper = withOrientation(paper, config.orientation);
  nwidth = round((paper.width / mmToInch) * dpi);
  nheight = round((paper.height / mmToInch) * dpi);
}

function getTimeStamp() {
  let now = new Date();
  return (
    ("0" + now.getDate()).slice(-2) +
    ("0" + (now.getMonth() + 1)).slice(-2) +
    (now.getFullYear() % 100)
  );
}

function keyPressed() {
  if (key == "s") {
    if (svgRendererAvailable) {
      let filename =
        sketchName + "-" + getTimeStamp() + "-seed" + seed + ".svg";
      save(filename);
    } else {
      console.warn("SVG renderer unavailable; saving PNG export instead.");
      savePNGExport();
    }
  } else if (key == "p") {
    savePNGExport();
  } else {
    seed = int(random(999999));
    randomSeed(seed);
    updateArt();
  }
}

function withOrientation(size, orientation = "portrait") {
  if (orientation === "landscape") {
    return { width: size.height, height: size.width };
  }
  return { width: size.width, height: size.height };
}

function applyPreviewScale(s) {
  let elt = cnv && cnv.elt ? cnv.elt : document.querySelector("canvas, svg");
  if (!elt) {
    console.warn("No canvas/svg element found to scale");
    return;
  }

  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth || nwidth;
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight || nheight;

  const uiReserve = max(280, (gui && gui.w ? gui.w : 300) + 36);
  const availableWidth = max(1, viewportWidth - uiReserve - 16);
  const availableHeight = max(1, viewportHeight - 12);
  const widthScale = availableWidth / nwidth;
  const heightScale = availableHeight / nheight;
  const scale = max(0.05, min(widthScale, heightScale));

  elt.style.transformOrigin = "top left";
  elt.style.transform = `scale(${scale})`;
  elt.style.display = "block";
  elt.style.margin = "0";
  elt.style.marginLeft = "8px";
  elt.style.marginRight = `${uiReserve}px`;

  document.body.style.margin = "0";
  document.documentElement.style.overflow = "auto";
}

function windowResized() {
  applyPreviewScale(previewScale);
}
