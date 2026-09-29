// Quality checks on a citizen's photo, run in their browser before the report is sent.

export type Check = { name: string; pass: boolean; detail: string };

// Set on a photo of Blaarmeersen scaled to 256 px wide: sharp it scores about 3,000; with an 8 px
// Gaussian blur at 1280 px, about 27; with 4 px, about 265. A city can loosen these if good reports get turned back.
export const LIMITS = { dark: 45, bright: 225, sharp: 100 };

/** RGBA pixels to luminance, 0 to 255. */
export function toGray(rgba: Uint8ClampedArray): Float32Array {
  const g = new Float32Array(rgba.length / 4);
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
  return g;
}

/** Variance of the Laplacian: low means few edges, which means blur. */
export function sharpness(g: Float32Array, w: number, h: number): number {
  let n = 0, sum = 0, sq = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = g[i - w] + g[i + w] + g[i - 1] + g[i + 1] - 4 * g[i];
      sum += lap;
      sq += lap * lap;
      n++;
    }
  }
  const mean = sum / n;
  return sq / n - mean * mean;
}

export function checkPhoto(g: Float32Array, w: number, h: number, lim = LIMITS): Check[] {
  const light = g.reduce((a, b) => a + b, 0) / g.length;
  const sharp = sharpness(g, w, h);
  return [
    {
      name: "Light",
      pass: light >= lim.dark && light <= lim.bright,
      detail: light < lim.dark ? "too dark" : light > lim.bright ? "washed out" : `brightness ${light.toFixed(0)} of 255`,
    },
    { name: "Focus", pass: sharp >= lim.sharp, detail: sharp < lim.sharp ? "blurred" : `sharpness ${sharp.toFixed(0)}` },
  ];
}

/** ImageNet labels that mean open water is in frame. */
export const WATER_LABELS = ["lakeside", "seashore", "sandbar", "dam", "breakwater", "boathouse", "canoe", "paddle", "fireboat", "speedboat", "gondola", "catamaran"];

export const isWater = (label: string) => WATER_LABELS.some((w) => label.toLowerCase().includes(w));
