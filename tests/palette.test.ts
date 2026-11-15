import { paletteFromPixels, rgbToHsl } from "../lib/palette";

const px = (...rgbs: [number, number, number][]) => rgbs.flatMap(([r, g, b]) => [r, g, b, 255]);
const hue = (c: string) => Number(/hsl\((\d+)/.exec(c)![1]);

describe("palette", () => {
  it("convertit le RGB en TSL", () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect([Math.round(h), s, l]).toEqual([0, 1, 0.5]);
  });

  it("prend la teinte dominante et une seconde teinte éloignée", () => {
    const blue: [number, number, number] = [30, 90, 220], orange: [number, number, number] = [240, 140, 30];
    const p = paletteFromPixels(px(...Array(30).fill(blue), ...Array(12).fill(orange)));
    expect(hue(p.vivid)).toBeGreaterThan(200);
    expect(hue(p.vivid)).toBeLessThan(235);
    expect(hue(p.alt)).toBeGreaterThan(20);
    expect(hue(p.alt)).toBeLessThan(45);
  });

  it("donne une palette neutre à une image en noir et blanc", () => {
    const p = paletteFromPixels(px(...Array(40).fill([20, 20, 20]), ...Array(40).fill([235, 235, 235])), 43);
    expect(hue(p.vivid)).toBe(43);
    expect(p.deep).toMatch(/hsl\(43 6% 10%\)/);
  });
});
