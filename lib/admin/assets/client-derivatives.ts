'use client';

import type { EventAssetKind } from './domain';
import {
  calculateMediaCoverCrop,
  type MediaDerivativePreset,
} from './derivatives';

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

export async function renderMediaDerivative(input: {
  sourceBlob: Blob;
  kind: EventAssetKind;
  preset: MediaDerivativePreset;
  focalX: number;
  focalY: number;
  zoom: number;
  frameTimeSeconds?: number;
}): Promise<{
  blob: Blob;
  sourceWidth: number;
  sourceHeight: number;
}> {
  const source =
    input.kind === 'video'
      ? await videoSource(input.sourceBlob, input.frameTimeSeconds ?? 0)
      : await imageSource(input.sourceBlob);
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
    return {
      blob: await canvasJpeg(canvas),
      sourceWidth: source.width,
      sourceHeight: source.height,
    };
  } finally {
    source.cleanup();
  }
}
