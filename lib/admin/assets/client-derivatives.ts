'use client';

import type { EventAssetKind } from './domain';
import {
  calculateMediaCoverCrop,
  type MediaDerivativePreset,
} from './derivatives';
import {
  getMediaOverlayStyle,
  type MediaOverlayRecipe,
} from './overlays';

interface DrawableSource {
  element: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

function waitForEvent(
  target: EventTarget,
  eventName: string,
  errorName = 'error',
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Could not decode source media (${eventName}).`));
    };
    const cleanup = () => {
      target.removeEventListener(eventName, onSuccess);
      target.removeEventListener(errorName, onError);
    };
    target.addEventListener(eventName, onSuccess, { once: true });
    target.addEventListener(errorName, onError, { once: true });
  });
}

async function imageSource(blob: Blob): Promise<DrawableSource> {
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  if (!image.complete) await waitForEvent(image, 'load');
  if (!image.naturalWidth || !image.naturalHeight) {
    URL.revokeObjectURL(url);
    throw new Error('The source image has invalid dimensions.');
  }
  return {
    element: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

async function videoSource(
  blob: Blob,
  frameTimeSeconds: number,
): Promise<DrawableSource> {
  const url = URL.createObjectURL(blob);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  await waitForEvent(video, 'loadedmetadata');
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const requested = Math.max(0, frameTimeSeconds);
  const safeTime = duration > 0 ? Math.min(requested, Math.max(0, duration - 0.05)) : 0;
  if (Math.abs(video.currentTime - safeTime) > 0.01) {
    video.currentTime = safeTime;
    await waitForEvent(video, 'seeked');
  } else if (video.readyState < 2) {
    await waitForEvent(video, 'loadeddata');
  }
  if (!video.videoWidth || !video.videoHeight) {
    URL.revokeObjectURL(url);
    throw new Error('The source video has invalid dimensions.');
  }
  return {
    element: video,
    width: video.videoWidth,
    height: video.videoHeight,
    cleanup: () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
    },
  };
}

function canvasJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The browser could not encode the platform image.'));
      },
      'image/jpeg',
      0.9,
    );
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${clamp(alpha, 0, 1)})`;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) {
    const remainingStart = words.indexOf(current.split(' ')[0]);
    const remaining = remainingStart >= 0 ? words.slice(remainingStart).join(' ') : current;
    let fitted = remaining;
    while (context.measureText(fitted).width > maxWidth && fitted.length > 3) {
      fitted = `${fitted.slice(0, -2).trim()}…`;
    }
    lines.push(fitted);
  }
  return lines.slice(0, maxLines);
}

function titleLayout(input: {
  context: CanvasRenderingContext2D;
  title: string;
  maxWidth: number;
  baseSize: number;
  fontFamily: string;
  maxLines: number;
}): { fontSize: number; lines: string[] } {
  let fontSize = input.baseSize;
  let lines: string[] = [];
  while (fontSize >= input.baseSize * 0.58) {
    input.context.font = `700 ${fontSize}px ${input.fontFamily}`;
    lines = wrapText(input.context, input.title, input.maxWidth, input.maxLines);
    const fits = lines.every(
      (line) => input.context.measureText(line).width <= input.maxWidth + 1,
    );
    if (fits && lines.length <= input.maxLines) break;
    fontSize -= 4;
  }
  return { fontSize, lines };
}

function drawTrackingText(input: {
  context: CanvasRenderingContext2D;
  text: string;
  x: number;
  y: number;
  tracking: number;
  align: 'left' | 'center';
}): void {
  const characters = [...input.text];
  const widths = characters.map((character) => input.context.measureText(character).width);
  const total = widths.reduce((sum, width) => sum + width, 0) +
    Math.max(0, characters.length - 1) * input.tracking;
  let cursor = input.align === 'center' ? input.x - total / 2 : input.x;
  characters.forEach((character, index) => {
    input.context.fillText(character, cursor, input.y);
    cursor += widths[index] + input.tracking;
  });
}

function drawMediaOverlay(input: {
  context: CanvasRenderingContext2D;
  preset: MediaDerivativePreset;
  overlay: MediaOverlayRecipe;
  logo?: DrawableSource;
}): void {
  const { context, preset, overlay } = input;
  const style = getMediaOverlayStyle(overlay.styleId);
  const width = preset.width;
  const height = preset.height;
  const safe = preset.safeArea ?? {
    topPercent: 6,
    rightPercent: 6,
    bottomPercent: 6,
    leftPercent: 6,
    label: '',
  };
  const safeLeft = (safe.leftPercent / 100) * width;
  const safeRight = width - (safe.rightPercent / 100) * width;
  const safeTop = (safe.topPercent / 100) * height;
  const safeBottom = height - (safe.bottomPercent / 100) * height;
  const safeWidth = safeRight - safeLeft;
  const isWide = width / height > 1.25;
  const blockWidth = isWide ? safeWidth * 0.58 : safeWidth;
  const x = overlay.alignment === 'center' ? width / 2 : safeLeft;
  const textAlign = overlay.alignment;
  const scale = clamp(overlay.textScale, 0.7, 1.3);

  context.save();
  const gradient = context.createLinearGradient(
    0,
    overlay.placement === 'top-left' ? 0 : height * 0.35,
    0,
    overlay.placement === 'top-left' ? height * 0.7 : height,
  );
  if (overlay.placement === 'top-left') {
    gradient.addColorStop(0, `rgba(0,0,0,${overlay.shadeOpacity})`);
    gradient.addColorStop(0.62, `rgba(0,0,0,${overlay.shadeOpacity * 0.34})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.44, `rgba(0,0,0,${overlay.shadeOpacity * 0.26})`);
    gradient.addColorStop(1, `rgba(0,0,0,${overlay.shadeOpacity})`);
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  const titleBase = clamp((isWide ? width * 0.064 : width * 0.086) * scale, 54, 132);
  const maxLines = isWide ? 2 : 3;
  const layout = titleLayout({
    context,
    title: overlay.title,
    maxWidth: blockWidth,
    baseSize: titleBase,
    fontFamily: style.titleFont,
    maxLines,
  });
  const lineHeight = layout.fontSize * 1.04;
  const wordmarkSize = clamp(width * 0.025 * scale, 20, 38);
  const detailSize = clamp(width * 0.029 * scale, 24, 42);
  const ctaSize = clamp(width * 0.024 * scale, 20, 34);
  const logoHeight = input.logo ? clamp(height * 0.065, 54, 116) : 0;
  const contentHeight =
    logoHeight +
    (logoHeight ? height * 0.018 : 0) +
    wordmarkSize * 1.5 +
    layout.lines.length * lineHeight +
    detailSize * 1.7 +
    ctaSize * 2.25;
  let cursorY =
    overlay.placement === 'top-left'
      ? safeTop
      : overlay.placement === 'center'
        ? Math.max(safeTop, (height - contentHeight) / 2)
        : Math.max(safeTop, safeBottom - contentHeight);

  if (input.logo) {
    const logoWidth = Math.min(
      blockWidth * 0.36,
      (input.logo.width / input.logo.height) * logoHeight,
    );
    const logoX = overlay.alignment === 'center' ? x - logoWidth / 2 : x;
    context.drawImage(input.logo.element, logoX, cursorY, logoWidth, logoHeight);
    cursorY += logoHeight + height * 0.018;
  }

  context.textBaseline = 'top';
  context.fillStyle = overlay.accentColor;
  context.font = `700 ${wordmarkSize}px ${style.bodyFont}`;
  drawTrackingText({
    context,
    text: overlay.wordmark.toUpperCase(),
    x,
    y: cursorY,
    tracking: Math.max(2, wordmarkSize * 0.16),
    align: overlay.alignment,
  });
  cursorY += wordmarkSize * 1.55;

  const lineStartX = overlay.alignment === 'center' ? x - blockWidth * 0.12 : x;
  context.fillStyle = overlay.accentColor;
  context.fillRect(lineStartX, cursorY, blockWidth * 0.24, Math.max(4, height * 0.004));
  cursorY += height * 0.026;

  context.fillStyle = overlay.textColor;
  context.font = `700 ${layout.fontSize}px ${style.titleFont}`;
  context.textAlign = textAlign;
  for (const line of layout.lines) {
    context.fillText(line, x, cursorY, blockWidth);
    cursorY += lineHeight;
  }
  cursorY += height * 0.018;

  context.font = `600 ${detailSize}px ${style.bodyFont}`;
  context.fillStyle = hexToRgba(overlay.textColor, 0.92);
  const details = `${overlay.dateLabel} · ${overlay.timeLabel}`;
  context.fillText(details, x, cursorY, blockWidth);
  cursorY += detailSize * 1.65;

  context.font = `700 ${ctaSize}px ${style.bodyFont}`;
  const horizontalPadding = ctaSize * 0.9;
  const pillWidth = Math.min(
    blockWidth,
    context.measureText(overlay.cta).width + horizontalPadding * 2,
  );
  const pillHeight = ctaSize * 2.05;
  const pillX = overlay.alignment === 'center' ? x - pillWidth / 2 : x;
  roundedRect(context, pillX, cursorY, pillWidth, pillHeight, pillHeight / 2);
  context.fillStyle = overlay.accentColor;
  context.fill();
  context.fillStyle = '#0b0a09';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(overlay.cta, pillX + pillWidth / 2, cursorY + pillHeight / 2, pillWidth - horizontalPadding);
  context.restore();
}

export async function renderMediaDerivative(input: {
  sourceBlob: Blob;
  kind: EventAssetKind;
  preset: MediaDerivativePreset;
  focalX: number;
  focalY: number;
  zoom: number;
  frameTimeSeconds?: number;
  overlay?: MediaOverlayRecipe;
  logoBlob?: Blob;
}): Promise<{
  blob: Blob;
  sourceWidth: number;
  sourceHeight: number;
}> {
  const source =
    input.kind === 'video'
      ? await videoSource(input.sourceBlob, input.frameTimeSeconds ?? 0)
      : await imageSource(input.sourceBlob);
  const logo = input.logoBlob ? await imageSource(input.logoBlob) : undefined;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = input.preset.width;
    canvas.height = input.preset.height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
    context.fillStyle = '#0b0a09';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const crop = calculateMediaCoverCrop({
      sourceWidth: source.width,
      sourceHeight: source.height,
      targetWidth: input.preset.width,
      targetHeight: input.preset.height,
      focalX: input.focalX,
      focalY: input.focalY,
      zoom: input.zoom,
    });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      source.element,
      crop.sourceX,
      crop.sourceY,
      crop.sourceWidth,
      crop.sourceHeight,
      0,
      0,
      input.preset.width,
      input.preset.height,
    );
    if (input.overlay) {
      drawMediaOverlay({
        context,
        preset: input.preset,
        overlay: input.overlay,
        logo,
      });
    }
    return {
      blob: await canvasJpeg(canvas),
      sourceWidth: source.width,
      sourceHeight: source.height,
    };
  } finally {
    source.cleanup();
    logo?.cleanup();
  }
}
