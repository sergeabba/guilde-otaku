// Couleur dominante « vive » d'un portrait (cheveux, tenue, aura du personnage) pour
// personnaliser la carte d'un membre. Rendu serveur uniquement (sharp).

type RGB = [number, number, number];

function toHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `#${[f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Couleur la plus présente parmi les pixels saturés, ramenée à une teinte lisible
 * sur fond sombre. Les tons chair et les gris pèsent peu. Null si rien de net.
 */
export async function dominantVivid(image: Buffer): Promise<string | null> {
  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(image).resize(48, 48, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const BINS = 24;
    const weight = new Array<number>(BINS).fill(0);
    const sum = Array.from({ length: BINS }, () => [0, 0, 0]);
    for (let i = 0; i < data.length; i += info.channels) {
      const rgb: RGB = [data[i], data[i + 1], data[i + 2]];
      const [h, s, l] = toHsl(rgb);
      if (s < 0.3 || l < 0.16 || l > 0.9) continue;
      let w = s * (1 - Math.abs(l - 0.5));
      if (h >= 12 && h <= 42 && l > 0.55) w *= 0.25; // peau
      const bin = Math.floor(h / (360 / BINS)) % BINS;
      weight[bin] += w;
      sum[bin][0] += rgb[0] * w; sum[bin][1] += rgb[1] * w; sum[bin][2] += rgb[2] * w;
    }
    // Lissage : une teinte et ses deux voisines.
    let best = -1, bestW = 0;
    for (let b = 0; b < BINS; b++) {
      const w = weight[b] + 0.5 * (weight[(b + 1) % BINS] + weight[(b + BINS - 1) % BINS]);
      if (w > bestW) { bestW = w; best = b; }
    }
    if (best < 0 || bestW < 18) return null;
    const avg: RGB = [sum[best][0] / weight[best], sum[best][1] / weight[best], sum[best][2] / weight[best]];
    const [h, s, l] = toHsl(avg);
    return hslToHex(h, Math.max(s, 0.62), Math.min(0.62, Math.max(0.48, l)));
  } catch {
    return null;
  }
}
