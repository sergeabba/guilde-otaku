import { atelierTitles, looksLikeFilename, titleFromFilename } from "../lib/atelier-title";

const members = ["Godwin", "Traicy", "Nagi", "Floriane", "Jaïze Ben", "Don Sergio"];
describe("noms de l'Atelier", () => {
  it("reconnaît les prénoms collés et retire numéros et extensions", () => {
    expect(titleFromFilename("godwintraicy1.png", members)).toBe("Godwin & Traicy");
    expect(titleFromFilename("godwin-nagi.png", members)).toBe("Godwin & Nagi");
    expect(titleFromFilename("florianemha.png", members)).toBe("Floriane · MHA");
    expect(titleFromFilename("duel-food.png", members)).toBe("Duel Food");
    expect(titleFromFilename("don-bashjjk.png", members)).toBe("Don · Bash JJK");
    expect(titleFromFilename("jise-ben.png", members)).toBe("Jise Ben");
    expect(titleFromFilename("jaize-ben.png", members)).toBe("Jaïze · Ben");
  });
  it("écarte les noms de générateur et les codes illisibles", () => {
    expect(titleFromFilename("gemini-3-pro-image-preview-2k_a_Use_the_first_image_ - 2026-03-30T130216.784.png")).toBeNull();
    expect(titleFromFilename("45488udueyey.jpg")).toBeNull();
    expect(titleFromFilename("IMG_20240512_123456.jpg")).toBeNull();
  });
  it("garde un titre saisi propre, remplace un titre qui ressemble à un fichier", () => {
    expect(looksLikeFilename("Gemini 3 Pro Image Preview 2k")).toBe(true);
    expect(looksLikeFilename("Le duel des chefs")).toBe(false);
    expect(atelierTitles([
      { filename: "a.png", title: "Le duel des chefs" },
      { filename: "45488udueyey.jpg", title: "45488udueyey" },
      { filename: "godwintraicy1.png" }, { filename: "godwintraicy2.png" },
      { filename: "gemini-x.png", title: "Gemini X" },
    ], members)).toEqual(["Le duel des chefs", "Création n°01", "Godwin & Traicy", "Godwin & Traicy II", "Création n°02"]);
  });
});
