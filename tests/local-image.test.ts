import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import variants from "../lib/image-variants.json";
import { hasLocalVariants, localVariant, originalOf, tinyWebp } from "../lib/local-image";

const PUB = join(__dirname, "..", "public");
const MAP = variants as Record<string, { w: number[]; h: string; dir: string; ow: number }>;

describe("versions AVIF et WebP des images du site", () => {
  it("chaque entrée pointe vers un original et des fichiers existants, plus légers", () => {
    for (const [src, v] of Object.entries(MAP)) {
      expect(existsSync(join(PUB, src))).toBe(true);
      for (const w of v.w) {
        expect(existsSync(join(PUB, v.dir, `${w}-${v.h}.avif`))).toBe(true);
      }
      for (const w of v.w) expect(statSync(join(PUB, v.dir, `${w}-${v.h}.avif`)).size).toBeLessThan(statSync(join(PUB, src)).size);
    }
  });
  it("choisit la plus petite version qui couvre la largeur demandée", () => {
    const [src, v] = Object.entries(MAP).find(([, x]) => x.w.length > 2)!;
    expect(localVariant(src, 1)).toBe(`${v.dir}/${v.w[0]}-${v.h}.avif`);
    expect(localVariant(src, 99999)).toBe((v as { full?: boolean }).full ? src : `${v.dir}/${v.w[v.w.length - 1]}-${v.h}.avif`);
    expect(localVariant(encodeURI(src), 1)).toBe(`${v.dir}/${v.w[0]}-${v.h}.avif`);
    expect(hasLocalVariants("/inconnue.png")).toBe(false);
    expect(originalOf(`${v.dir}/${v.w[0]}-${v.h}.avif`)).toBe(src);
    expect(originalOf(`https://site.example${v.dir}/${v.w[0]}-${v.h}.avif`)).toBe(src);
    expect(originalOf("/photos/a.jpg")).toBeNull();
    expect(tinyWebp(src)).toBe(`${v.dir}/32-${v.h}.webp`);
    expect(existsSync(join(PUB, v.dir, `32-${v.h}.webp`))).toBe(true);
  });
  it("aucune grande image du site sans ses versions (pixel art de Fighters exclu)", () => {
    // scripts/optimize-images.mjs --check fait la vérification complète.
    expect(Object.keys(MAP).length).toBeGreaterThan(30);
    expect(Object.keys(MAP).some((k) => k.startsWith("/fighters/"))).toBe(false);
  });
});
