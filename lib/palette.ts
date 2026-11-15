// Palette d'une image, calculée dans le navigateur à partir d'une petite vignette :
// chaque création des futilités habille sa planche et sa visionneuse de ses propres
// couleurs (aucune donnée inventée : tout vient des pixels de l'image).

export interface Palette {
  /** Teinte dominante vive, lisible sur fond sombre (cadres, titres, boutons). */
  vivid: string;
  /** Seconde teinte, différente de la première quand l'image en a une. */
  alt: string;
  /** Fond profond dans la teinte dominante. */
  deep: string;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

const BUCKETS = 12;

/**
 * Palette à partir de pixels RGBA. Les teintes sont regroupées en 12 familles,
 * pondérées par la saturation ; une image en noir et blanc reçoit une palette
 * neutre réchauffée par `fallback` (teinte de repli, en degrés).
 */
export function paletteFromPixels(data: ArrayLike<number>, fallbackHue = 43): Palette {
  const score = new Array<number>(BUCKETS).fill(0);
  const sumH = new Array<number>(BUCKETS).fill(0);
  const sumS = new Array<number>(BUCKETS).fill(0);
  let colourful = 0, total = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    total++;
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    if (s < 0.22 || l < 0.12 || l > 0.9) continue;
    colourful++;
    // Pondération : les couleurs franches comptent plus ; les tons chair (orangés peu
    // saturés), présents sur presque tous les portraits, comptent beaucoup moins.
    const skin = h >= 8 && h <= 48 && s < 0.72;
    const w = s * s * (1 - Math.abs(l - 0.5) * 1.4) * (skin ? 0.2 : 1);
    const k = Math.floor(h / (360 / BUCKETS)) % BUCKETS;
    score[k] += w; sumH[k] += h * w; sumS[k] += s * w;
  }
  const order = score.map((v, k) => [v, k]).sort((a, b) => b[0] - a[0]).map(([, k]) => k);
  const top = order[0];
  // Image presque sans couleur : palette neutre, légèrement teintée.
  if (!total || colourful / total < 0.04 || score[top] === 0) {
    return { vivid: hsl(fallbackHue, 0.55, 0.62), alt: hsl(fallbackHue + 180, 0.12, 0.6), deep: hsl(fallbackHue, 0.06, 0.1) };
  }
  const hueOf = (k: number) => sumH[k] / score[k];
  const satOf = (k: number) => sumS[k] / score[k];
  // Seconde teinte : une famille assez éloignée (au moins 3 crans), sinon la complémentaire douce.
  const far = order.find((k) => score[k] > score[top] * 0.12 && Math.min(Math.abs(k - top), BUCKETS - Math.abs(k - top)) >= 3);
  const h1 = hueOf(top), s1 = satOf(top);
  const h2 = far !== undefined ? hueOf(far) : (h1 + 150) % 360;
  const s2 = far !== undefined ? satOf(far) : s1 * 0.6;
  return {
    vivid: hsl(h1, clamp(s1 * 1.15, 0.72, 0.92), 0.6),
    alt: hsl(h2, clamp(s2 * 1.15, 0.58, 0.88), 0.58),
    deep: hsl(h1, clamp(s1 * 0.7, 0.28, 0.55), 0.15),
  };
}

const cache = new Map<string, Palette>();

/** Palette d'une image déjà chargée (même origine), ou null si la lecture est refusée. */
export function paletteOf(img: HTMLImageElement, key = img.currentSrc, fallbackHue?: number): Palette | null {
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const n = 28;
    const c = document.createElement("canvas");
    c.width = n; c.height = n;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx || !img.naturalWidth) return null;
    ctx.drawImage(img, 0, 0, n, n);
    const p = paletteFromPixels(ctx.getImageData(0, 0, n, n).data, fallbackHue);
    cache.set(key, p);
    return p;
  } catch {
    return null; // image d'une autre origine sans autorisation : couleurs par défaut
  }
}

/** Pose la palette en variables CSS (--pv, --pa, --pd) sur un élément. */
export function applyPalette(el: HTMLElement | null | undefined, p: Palette | null) {
  if (!el || !p) return;
  el.style.setProperty("--pv", p.vivid);
  el.style.setProperty("--pa", p.alt);
  el.style.setProperty("--pd", p.deep);
}
