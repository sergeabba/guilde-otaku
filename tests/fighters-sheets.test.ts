import { SHEETS, CRAIG, MELRICK, characterFor, sheetFor } from "../lib/fighters/characters";

const REQUIRED = ["idle", "walk", "walkback", "crouch", "guard", "cguard", "jump", "jumpfwd", "s_lp", "s_hp", "s_lk", "s_hk", "c_lp", "c_hp", "c_lk", "c_hk",
  "j_lp", "j_hp", "j_lk", "j_hk", "throw", "special", "super", "hit", "chit", "block", "cblock", "fall", "down", "getup", "dizzy", "dodge", "ko", "win", "intro"];

describe("planches de sprites", () => {
  it.each(Object.values(SHEETS))("$key : animations complètes et images valides", (sheet) => {
    for (const a of REQUIRED) expect(sheet.anims[a]?.frames.length).toBeGreaterThan(0);
    for (const a of Object.values(sheet.anims)) for (const f of a.frames) { expect(f).toBeGreaterThanOrEqual(0); expect(f).toBeLessThan(sheet.count); }
    expect(sheet.image).toMatch(/^\/fighters\/sheets\/[a-z0-9]+\.png$/);
  });

  it("les membres avec une apparence dessinée ont une planche, les inconnus restent provisoires", () => {
    expect(sheetFor(CRAIG)?.key).toBe("craig");
    expect(sheetFor(MELRICK)?.key).toBe("melrick");
    expect(sheetFor(characterFor(3))?.key).toBe("m3");
    expect(characterFor(3).custom).toBe(true);
    expect(sheetFor(characterFor(54))).toBeNull();
    expect(sheetFor(characterFor(999))).toBeNull();
  });

  it("les zones d'attaque suivent la portée réelle du dessin", () => {
    expect(CRAIG.normals.s_hp.hit.x + CRAIG.normals.s_hp.hit.w).toBe(SHEETS.craig.reach.s_hp + 2);
    expect(MELRICK.normals.s_lk.hit.x + MELRICK.normals.s_lk.hit.w).toBe(SHEETS.melrick.reach.s_lk + 2);
  });
});
