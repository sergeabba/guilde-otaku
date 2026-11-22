import { findBySlug, shortSlug, slugOf, tagOf } from "../lib/atelier-slug";

describe("liens courts des futilités", () => {
  const all = [
    { title: "Raijin de Craig !", key: "craig-raijin-final-v3-upscaled-4k.png" },
    { title: "Portrait de groupe", key: "groupe-2025-01.png" },
    { title: "Portrait de groupe", key: "groupe-2026-02.png" },
    { title: "Été à Tokyo", key: "drive:1AbCdEf" },
  ];
  it("tire le lien du titre, sans le nom du fichier", () => {
    expect(slugOf("Raijin de Craig !")).toBe("raijin-de-craig");
    expect(slugOf("Été à Tokyo")).toBe("ete-a-tokyo");
    expect(slugOf("!!!")).toBe("futilite");
    expect(shortSlug(all[0], all)).toBe("raijin-de-craig");
    expect(shortSlug(all[0], all)).not.toContain("png");
  });
  it("départage deux titres identiques par 4 caractères stables", () => {
    const a = shortSlug(all[1], all), b = shortSlug(all[2], all);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^portrait-de-groupe-[0-9a-z]{4}$/);
    expect(tagOf(all[1].key)).toBe(tagOf(all[1].key));
  });
  it("retrouve la futilité depuis le lien court", () => {
    const get = (x: (typeof all)[number]) => x;
    expect(findBySlug("raijin-de-craig", all, get)).toBe(all[0]);
    expect(findBySlug(shortSlug(all[2], all), all, get)).toBe(all[2]);
    expect(findBySlug("ete-a-tokyo", all, get)).toBe(all[3]);
    expect(findBySlug("inconnue", all, get)).toBeNull();
  });
});
