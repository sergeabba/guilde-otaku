// Emmanuel Melrick (Revenant). Référence : photo réelle du membre (public/photos/melrick.jpg).
// Grand et mince, costume bleu nuit, chemise blanche, cravate noire fine, ceinture à
// boucle claire, épinglette bleu-vert au revers ; lunettes, masque blanc, cheveux
// hauts. Pose de la photo : mains dans les poches, menton levé.
// Style : il se bat les mains dans les poches (longs coups de pied) et ne les sort
// que pour les coups de poing, la garde et la projection.
// L'avatar anime du membre représente un personnage protégé : il n'est pas repris.
import { Mask, add, fill, lerp, paint, stamp, type Canvas, type Joints, type Pose, type Vec } from "../sprite-kit.ts";
import { hand, shoe, type Anim, type Colors, type SpriteChar } from "../rig.ts";
import { CELL_H as H, CELL_W as W } from "../rig.ts";

const HEAD = [
  "...oooooooo...",
  "..ohhhhHhhhho.",
  "..ohhhhhhhHho.",
  "..ohhhhhhhhhho",
  ".ohhhHhhhhhhho",
  ".ohhhhhhhhhhho",
  ".ohhhhhhhsssso",
  "ohhhhhSssssLso",
  "ohhhhSssBBBBso",
  "oSShSsgggggggo",
  "oSLSSsglpgglpo",
  "oSSSSsgggggggo",
  "oSSkwwwwwwwwwo",
  ".oSkwwwwwwwwWo",
  ".okwwwwwwwwWo.",
  "..owwwwwwwWWo.",
  "...oooooooooo.",
];
const FACES: Record<string, (r: string[]) => string[]> = {
  normal: (r) => r,
  hurt: (r) => r.map((row, i) => i === 10 ? "oSLSSsgllggllo" : i === 8 ? "ohhhhSssssBBso" : row),
  ko: (r) => r.map((row, i) => i === 10 ? "oSLSSsgpgggpgo" : row),
  shout: (r) => r.map((row, i) => i === 8 ? "ohhhhSsBBBssso" : row),
};

function draw(cv: Canvas, j: Joints, p: Pose, C: Colors) {
  const ink = C.ink;
  const suit = { base: C.suit, shadow: C.suitS, light: C.suitL };
  const pants = { base: C.pants, shadow: C.pantsS };
  const F = j.fwd, D: Vec = [-j.up[0], -j.up[1]];
  const lowFoot = Math.max(j.footF[1], j.footB[1]);
  const flow = p.flow ?? 0;

  const sleeve = (s: Vec, e: Vec, h: Vec, shape: Pose["handF"], front: boolean) => {
    const m = new Mask(W, H); m.limb(s, e, 5.4, 5); m.limb(e, lerp(e, h, shape === "pocket" ? 1 : 0.82), 5, 4.6);
    paint(cv, m, front ? suit : { base: C.suitS, light: C.suit }, ink);
    if (shape !== "pocket") { const c = lerp(e, h, 0.86); cv.set(Math.round(c[0]), Math.round(c[1]), C.shirt); }
  };
  // Bras arrière.
  sleeve(j.shoulderB, j.elbowB, j.handB, p.handB, false);
  hand(cv, W, H, j.elbowB, j.handB, p.handB, { base: C.skinS }, ink);

  // Jambes : pantalon droit, chaussures noires vernies.
  const leg = (hip: Vec, knee: Vec, foot: Vec, front: boolean) => {
    const m = new Mask(W, H); m.limb(hip, knee, 6, 5.4); m.limb(knee, foot, 5.4, 5);
    paint(cv, m, front ? pants : { base: C.pantsS }, ink);
    shoe(cv, W, H, knee, foot, 7, { base: C.shoe, light: C.shoeL }, ink, Math.abs(foot[1] - lowFoot) < 1.5 && !p.rot);
  };
  leg(j.hipB, j.kneeB, j.footB, false);
  leg(j.hipF, j.kneeF, j.footF, true);

  // Veste : épaules marquées, s'arrête sous les hanches, pans ouverts.
  const shF = add(add(j.neck, F, 6.5), D, 0.5), shB = add(add(j.neck, F, -6.5), D, 0.5);
  const sideF = add(j.hip, F, 5.5), sideB = add(j.hip, F, -5.5);
  const hemF = add(lerp(j.hipF, j.kneeF, 0.3), F, 4 + flow * 0.4);
  const hemB = add(lerp(j.hipB, j.kneeB, 0.3), F, -4 - flow * 0.6);
  const jacket = new Mask(W, H);
  jacket.poly([add(j.neck, F, -3), add(j.neck, F, 3), shF, add(sideF, D, -8), sideF, hemF, hemB, sideB, add(sideB, D, -8), shB]);
  paint(cv, jacket, suit, ink);
  // Chemise en V, cravate fine, revers, épinglette, ceinture.
  const vTop = add(j.neck, F, -0.5), vL = add(add(j.neck, D, 16), F, -0.5), vA = add(add(j.neck, F, -5), D, 1), vB = add(add(j.neck, F, 4), D, 1);
  const shirt = new Mask(W, H); shirt.poly([vA, vB, vL]); shirt.disc(add(vTop, D, 1), 2.2);
  fill(cv, shirt, C.shirt);
  // Revers : liseré plus clair le long du V.
  for (let t = 0; t <= 10; t++) for (const a of [vA, vB]) { const q = lerp(a, vL, t / 10); const x = Math.round(q[0]) + (a === vA ? -1 : 1), y = Math.round(q[1]); if (jacket.has(x, y)) cv.set(x, y, C.suitL); }
  for (let t = 1; t < 14; t++) {
    const q = lerp(add(vTop, D, 1), vL, t / 15);
    cv.set(Math.round(q[0]), Math.round(q[1]), C.tie);
    if (t < 3) cv.set(Math.round(q[0]) + 1, Math.round(q[1]), C.tie);
  }
  const pin = add(add(j.neck, D, 6), F, -4.5);
  cv.set(Math.round(pin[0]), Math.round(pin[1]), C.pin);
  // Ceinture visible entre les pans.
  const belt = add(add(j.hip, D, -3), F, 2);
  for (let k = -2; k <= 2; k++) { const b = add(belt, F, k); cv.set(Math.round(b[0]), Math.round(b[1]), k === 1 ? C.buckle : C.belt); }
  // Cou, tête.
  const neckM = new Mask(W, H); neckM.limb(add(j.neck, D, 1), j.headC, 4.4, 4.4);
  paint(cv, neckM, { base: C.skinS }, ink);
  const face = FACES[p.face ?? "normal"](HEAD);
  stamp(cv, face, { o: ink, h: C.hair, H: C.hairL, s: C.skin, S: C.skinS, L: C.skinL, B: C.hair, g: C.frame, l: C.lens, p: C.pupil, w: C.mask, W: C.maskS, k: C.maskS }, Math.round(j.headC[0] - 7), Math.round(j.headC[1] - 10));
  // Bras avant.
  sleeve(j.shoulderF, j.elbowF, j.handF, p.handF, true);
  hand(cv, W, H, j.elbowF, j.handF, p.handF, { base: C.skin, shadow: C.skinS, light: C.skinL }, ink);
}

// ─── Poses ───────────────────────────────────────────────────────────────────
// Garde « mains dans les poches », menton levé (pose de la photo).
const S: Pose = { lean: -3, head: 5, armF: [-12, 30], armB: [-22, 34], legF: [14, -3], legB: [-10, -1], handF: "pocket", handB: "pocket" };
const P = (o: Partial<Pose>): Pose => ({ ...S, ...o });
const CROUCH: Pose = P({ lean: 18, head: -8, armF: [10, 40], armB: [-4, 40], legF: [60, -100], legB: [22, -92] });
const C_ = (o: Partial<Pose>): Pose => ({ ...CROUCH, ...o });
const TUCK: Pose = P({ lean: 6, head: 0, legF: [70, -120], legB: [30, -112] });
const T = (o: Partial<Pose>): Pose => ({ ...TUCK, ...o });
const GUARD: Pose = P({ lean: -6, head: -6, armF: [140, 158], armB: [126, 162], handF: "fist", handB: "fist", legF: [12, -6], legB: [-20, -4] });
const HURT: Pose = P({ lean: -24, head: -22, armF: [-6, 30], armB: [-34, 24], handF: "open", handB: "open", legF: [8, -14], legB: [-20, 0], face: "hurt" });
const LIE: Pose = P({ lean: 0, head: 0, armF: [8, 6], armB: [-6, 4], handF: "open", handB: "open", legF: [4, 0], legB: [-4, 2], face: "ko", rot: -90 });

const walkLegs: [Pose["legF"], Pose["legB"]][] = [
  [[22, -6], [-18, -4]], [[10, -30], [-10, -6]], [[-6, -14], [6, -4]], [[-18, -4], [20, -6]], [[-8, -6], [10, -30]], [[6, -4], [-6, -14]],
];

export const MELRICK_SPRITES: SpriteChar = {
  key: "melrick",
  name: "Emmanuel Melrick",
  reference: "Photo réelle : costume bleu nuit, chemise blanche, cravate noire, lunettes, masque blanc, cheveux hauts, mains dans les poches.",
  palette: {
    ink: "#0e0c14", skin: "#6e4330", skinS: "#4f2e20", skinL: "#8c5a40", hair: "#141012", hairL: "#2a2226",
    frame: "#2b2b30", lens: "#a9bccb", pupil: "#0c0a10", mask: "#f3f5f8", maskS: "#c3cad4",
    suit: "#2e2c52", suitS: "#1d1c38", suitL: "#45437a", shirt: "#f1f1f5", shirtS: "#bfc2d0", tie: "#101016",
    pin: "#43c0cf", belt: "#141414", buckle: "#cfc6a2", pants: "#232238", pantsS: "#17162a", shoe: "#0f0f13", shoeL: "#34343e",
  },
  body: { head: 14, neck: 3, torso: 22, thigh: 19, shin: 19, upper: 13, fore: 12, hipW: 11, chestW: 13, waistW: 11, armW: 5, legW: 5, footL: 7 },
  draw,
  anims: {
    intro: { poses: [P({ head: 10 }), P({ armF: [150, 150], handF: "point", head: 8 }), S], dur: [24, 24, 12] },
    idle: { poses: [S, P({ lean: -4, head: 6, flow: 1 }), P({ lean: -4, head: 6, flow: 1, legF: [14, -4] }), P({ lean: -3, head: 5 })], dur: [14, 12, 14, 12], loop: true },
    walk: { poses: walkLegs.map(([f, b], i) => P({ lean: 1, legF: f, legB: b, flow: i % 2 })), dur: [6, 6, 6, 6, 6, 6], loop: true },
    walkback: { poses: [...walkLegs].reverse().map(([f, b]) => P({ lean: -6, legF: f, legB: b, flow: -1 })), dur: [6, 6, 6, 6, 6, 6], loop: true },
    crouch: { poses: [C_({ lean: 10, legF: [40, -66], legB: [8, -56] }), CROUCH], dur: [3, 99] },
    guard: { poses: [GUARD], loop: true },
    cguard: { poses: [C_({ lean: 6, head: -4, armF: [148, 152], armB: [130, 160], handF: "fist", handB: "fist" })], loop: true },
    jump: { poses: [C_({ lean: 6, legF: [40, -70], legB: [-12, -60] }), T({}), T({ legF: [46, -86], legB: [8, -78], flow: -2 }), T({ legF: [24, -26], legB: [-8, -20], flow: -3 })], dur: [3, 12, 10, 99] },
    jumpfwd: { poses: [C_({ lean: 6, legF: [40, -70], legB: [-12, -60] }), T({ lean: 20 }), T({ lean: 26, legF: [86, -128], legB: [46, -118] }), T({ lean: 12, legF: [28, -36], legB: [-6, -26], flow: -3 })], dur: [3, 10, 12, 99] },
    // Poings : il sort une main de la poche.
    s_lp: { poses: [P({ armF: [70, 60], handF: "fist" }), P({ lean: 8, armF: [92, 0], handF: "fist", legF: [20, -4] }), P({ armF: [76, 40], handF: "fist" })], phases: ["s", "a", "r"] },
    s_hp: { poses: [P({ lean: -6, armB: [60, 90], handB: "fist" }), P({ lean: 16, dx: 3, armB: [92, 0], handB: "fist", armF: [30, 80], handF: "fist", legF: [30, -6], legB: [-26, 0] }), P({ lean: 8, armB: [70, 50], handB: "fist" })], phases: ["s", "a", "r"] },
    // Pieds : mains dans les poches, jambes longues.
    s_lk: { poses: [P({ legF: [50, -84] }), P({ lean: -8, legF: [86, -4] }), P({ legF: [40, -60] })], phases: ["s", "a", "r"] },
    s_hk: { poses: [P({ lean: -10, legF: [80, -110] }), P({ lean: -26, head: -4, legF: [128, -4], legB: [-6, 0], flow: 3 }), P({ lean: -12, legF: [70, -90] })], phases: ["s", "a", "r"] },
    c_lp: { poses: [C_({ armF: [70, 50], handF: "fist" }), C_({ armF: [92, 0], handF: "fist" }), C_({ armF: [80, 40], handF: "fist" })], phases: ["s", "a", "r"] },
    c_hp: { poses: [C_({ armB: [50, 100], handB: "fist" }), P({ lean: 8, head: 10, armB: [170, 6], handB: "fist", legF: [40, -66], legB: [-10, -50] }), C_({ armB: [110, 60], handB: "fist" })], phases: ["s", "a", "r"] },
    c_lk: { poses: [C_({ legF: [70, -60] }), C_({ legF: [86, 4] }), C_({ legF: [70, -50] })], phases: ["s", "a", "r"] },
    c_hk: { poses: [C_({ lean: 26, legF: [70, -40] }), C_({ lean: 40, head: -26, legF: [98, 0], flow: 3 }), C_({ lean: 26, legF: [80, -60] })], phases: ["s", "a", "r"] },
    j_lp: { poses: [T({ armF: [90, 50], handF: "fist" }), T({ armF: [116, -10], handF: "fist" })], phases: ["s", "a"] },
    j_hp: { poses: [T({ armB: [140, 40], handB: "fist" }), T({ lean: 14, armB: [118, -16], handB: "fist" })], phases: ["s", "a"] },
    j_lk: { poses: [T({}), T({ legF: [104, -12], lean: 2 })], phases: ["s", "a"] },
    j_hk: { poses: [T({ legF: [70, -90] }), T({ lean: -18, legF: [128, 0], legB: [36, -108], flow: -3 })], phases: ["s", "a"] },
    throw: { poses: [P({ lean: 12, armF: [96, 16], armB: [90, 22], handF: "grab", handB: "grab" }), P({ lean: 16, armF: [100, 28], armB: [96, 32], handF: "grab", handB: "grab" }), P({ lean: -16, head: -8, armF: [170, -6], armB: [160, 6], handF: "open", handB: "open", legF: [10, -4], legB: [-30, 0], flow: 2 }), P({ lean: 4 })], phases: ["s", "a", "r", "r"] },
    // Spéciale commune provisoire (sa spéciale active n'est pas décrite dans sa fiche).
    special: { poses: [P({ lean: -8, armF: [40, 110], armB: [30, 120], handF: "open", handB: "open" }), P({ lean: 14, armF: [92, 0], armB: [88, 2], handF: "open", handB: "open", legF: [30, -6], legB: [-28, 0] }), P({ lean: 6, armF: [80, 30], handF: "open" })], phases: ["s", "a", "r"] },
    super: { poses: [P({ lean: -10, head: 10, face: "shout" }), P({ lean: -26, legF: [126, -4], legB: [-6, 0], flow: 3, face: "shout" }), T({ lean: -18, legF: [120, 0], legB: [40, -110], face: "shout" }), P({ lean: 0 })], phases: ["s", "a", "a", "r"] },
    hit: { poses: [HURT, P({ ...HURT, lean: -14, head: -12 })], dur: [6, 99] },
    chit: { poses: [C_({ lean: 0, head: -20, armF: [20, 40], armB: [-10, 30], handF: "open", handB: "open", face: "hurt" })], dur: [99] },
    block: { poses: [P({ ...GUARD, lean: -12, head: -10 })], dur: [99] },
    cblock: { poses: [C_({ lean: 0, head: -8, armF: [148, 152], armB: [130, 160], handF: "fist", handB: "fist" })], dur: [99] },
    fall: { poses: [P({ ...HURT, rot: -30 }), P({ ...HURT, rot: -60, legF: [30, -20] })], dur: [8, 99] },
    down: { poses: [LIE], dur: [99] },
    getup: { poses: [P({ ...LIE, rot: -50, face: "hurt" }), C_({}), P({ lean: 0 })], dur: [5, 5, 4] },
    dizzy: { poses: [P({ ...HURT, lean: -8, head: -16, armF: [10, 10], armB: [-8, 10] }), P({ ...HURT, lean: 6, head: 10, armF: [6, 10], armB: [-14, 10] })], dur: [14, 14], loop: true },
    dodge: { poses: [C_({ lean: 40, head: -40 }), T({ rot: 90 }), T({ rot: 180 }), T({ rot: 270 }), C_({})], dur: [4, 5, 5, 5, 7] },
    ko: { poses: [P({ ...HURT, rot: -40, face: "ko" }), P({ ...LIE })], dur: [12, 99] },
    // Victoire : remonte ses lunettes, puis remet la main dans la poche.
    win: { poses: [P({ head: 8, armF: [150, 168], handF: "point" }), P({ head: 10, armF: [150, 166], handF: "point", flow: 1 })], dur: [20, 20], loop: true },
  } satisfies Record<string, Anim>,
};
