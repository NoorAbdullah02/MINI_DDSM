// Browser port of preprocess_image() from the training notebook:
// grayscale → Otsu mask → 7×7 closing → largest external region → crop →
// resize to 512 (cv2.INTER_AREA semantics) → 3 channels → ImageNet normalise.

export const SIZE = 512;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

export type Prepared = {
  tensor: Float32Array; // 1×3×512×512, CHW
  crop: { x: number; y: number; w: number; h: number };
  width: number;
  height: number;
  preview: ImageData; // 512×512 view of what the network sees
};

export function toGray(data: Uint8ClampedArray, n: number): Uint8Array {
  const g = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], gg = data[i * 4 + 1], b = data[i * 4 + 2];
    g[i] = Math.round(0.299 * r + 0.587 * gg + 0.114 * b);
  }
  return g;
}

// cv2.THRESH_OTSU on an 8-bit image: maximise between-class variance.
export function otsu(gray: Uint8Array): number {
  const hist = new Float64Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const N = gray.length;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];
  let w0 = 0, sum0 = 0, best = 0, maxVar = -1;
  for (let t = 0; t < 256; t++) {
    w0 += hist[t];
    sum0 += t * hist[t];
    const w1 = N - w0;
    if (w0 === 0 || w1 === 0) continue;
    const m0 = sum0 / w0, m1 = (sumAll - sum0) / w1;
    const v = w0 * w1 * (m0 - m1) * (m0 - m1);
    if (v > maxVar) {
      maxVar = v;
      best = t;
    }
  }
  return best;
}

// Separable 7×7 max/min; pixels outside the image are ignored (cv2 default border).
function morph(src: Uint8Array, w: number, h: number, isMax: boolean): Uint8Array {
  const r = 3;
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  const pick = isMax ? Math.max : Math.min;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = src[y * w + x];
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) v = pick(v, src[y * w + k]);
      tmp[y * w + x] = v;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = tmp[y * w + x];
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) v = pick(v, tmp[k * w + x]);
      out[y * w + x] = v;
    }
  }
  return out;
}

// Bounding box of the largest 8-connected foreground region.
function largestRegion(mask: Uint8Array, w: number, h: number) {
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let best = { area: 0, x: 0, y: 0, w: 0, h: 0 };
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    let top = 0, area = 0;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    stack[top++] = s;
    seen[s] = 1;
    while (top) {
      const p = stack[--top];
      const px = p % w, py = (p - px) / w;
      area++;
      if (px < x0) x0 = px;
      if (px > x1) x1 = px;
      if (py < y0) y0 = py;
      if (py > y1) y1 = py;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = py + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx;
          if (nx < 0 || nx >= w) continue;
          const q = ny * w + nx;
          if (mask[q] && !seen[q]) {
            seen[q] = 1;
            stack[top++] = q;
          }
        }
      }
    }
    if (area > best.area) best = { area, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  return best;
}

type Taps = { idx: number[]; w: number[] }[];

// cv2.INTER_AREA taps for one shrinking axis: each output pixel averages the source span it covers.
function areaWeights(srcLen: number, dstLen: number): Taps {
  const scale = srcLen / dstLen;
  const out: Taps = [];
  for (let d = 0; d < dstLen; d++) {
    const a = d * scale, b = a + scale;
    const idx: number[] = [], w: number[] = [];
    for (let s = Math.floor(a); s < Math.ceil(b) && s < srcLen; s++) {
      const cover = Math.min(b, s + 1) - Math.max(a, s);
      if (cover > 1e-9) {
        idx.push(s);
        w.push(cover / scale);
      }
    }
    out.push({ idx, w });
  }
  return out;
}

// cv2.INTER_AREA averages only when shrinking along both axes.
function resize(src: Float32Array, sw: number, sh: number, dw: number, dh: number): Float32Array {
  if (sw > dw && sh > dh) return separable(src, sw, sh, dw, dh, areaWeights(sw, dw), areaWeights(sh, dh));
  return separable(src, sw, sh, dw, dh, areaUpWeights(sw, dw), areaUpWeights(sh, dh));
}

// Otherwise OpenCV uses its own INTER_AREA enlarge taps (not plain bilinear):
// sx = floor(d·s), fx = (d+1) − (sx+1)/s, blended only across source-pixel boundaries.
function areaUpWeights(srcLen: number, dstLen: number): Taps {
  const scale = srcLen / dstLen, inv = dstLen / srcLen;
  const out: Taps = [];
  for (let d = 0; d < dstLen; d++) {
    const sx = Math.floor(d * scale);
    let fx = d + 1 - (sx + 1) * inv;
    fx = fx <= 0 ? 0 : fx - Math.floor(fx);
    out.push({ idx: [Math.min(sx, srcLen - 1), Math.min(sx + 1, srcLen - 1)], w: [1 - fx, fx] });
  }
  return out;
}

function separable(
  src: Float32Array,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  wx: Taps,
  wy: Taps,
) {
  const tmp = new Float32Array(dw * sh);
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < dw; x++) {
      let v = 0;
      const k = wx[x];
      for (let i = 0; i < k.idx.length; i++) v += src[y * sw + k.idx[i]] * k.w[i];
      tmp[y * dw + x] = v;
    }
  const out = new Float32Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    const k = wy[y];
    for (let x = 0; x < dw; x++) {
      let v = 0;
      for (let i = 0; i < k.idx.length; i++) v += tmp[k.idx[i] * dw + x] * k.w[i];
      out[y * dw + x] = v;
    }
  }
  return out;
}

export function preprocess(img: ImageData): Prepared {
  const { width: w, height: h } = img;
  const gray = toGray(img.data, w * h);
  const t = otsu(gray);
  let mask: Uint8Array = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) mask[i] = gray[i] > t ? 1 : 0;
  mask = morph(morph(mask, w, h, true), w, h, false);
  const reg = largestRegion(mask, w, h);
  const crop = reg.area && reg.w > 20 && reg.h > 20 ? { x: reg.x, y: reg.y, w: reg.w, h: reg.h } : { x: 0, y: 0, w, h };

  const cropped = new Float32Array(crop.w * crop.h);
  for (let y = 0; y < crop.h; y++)
    for (let x = 0; x < crop.w; x++) cropped[y * crop.w + x] = gray[(crop.y + y) * w + crop.x + x] / 255;

  const r = resize(cropped, crop.w, crop.h, SIZE, SIZE);
  const plane = SIZE * SIZE;
  const tensor = new Float32Array(3 * plane);
  const preview = new ImageData(SIZE, SIZE);
  for (let i = 0; i < plane; i++) {
    const v = r[i];
    for (let c = 0; c < 3; c++) tensor[c * plane + i] = (v - MEAN[c]) / STD[c];
    const b = Math.max(0, Math.min(255, Math.round(v * 255)));
    preview.data[i * 4] = preview.data[i * 4 + 1] = preview.data[i * 4 + 2] = b;
    preview.data[i * 4 + 3] = 255;
  }
  return { tensor, crop, width: w, height: h, preview };
}
