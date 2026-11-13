// Craig Ryan (Fondateur). Référence : photo réelle du membre (public/photos/craig.jpg).
// Tunique longue noire (boubou) à col rond, plastron brodé blanc vertical et poche de
// poitrine brodée, pantalon sombre ; cheveux courts, barbe fournie le long de la
// mâchoire, moustache. Style : calme, frappes paume ouverte, balayages.
// L'avatar anime du membre représente un personnage protégé : il n'est pas repris.
import { Mask, add, lerp, paint, stamp, type Canvas, type Joints, type Pose, type Vec } from "../sprite-kit.ts";
import { hand, shoe, type Anim, type Colors, type SpriteChar } from "../rig.ts";
import { CELL_H as H, CELL_W as W } from "../rig.ts";

const HEAD = [
  "....oooooo....",
  "..oohhhhhhoo..",
  ".ohhhhhhhhhho.",
  ".ohhhhhhhhhhho",
  ".ohhhhhhhhhhho",
  "ohhhhhhsssssso",
  "ohhhhSsssBBsso",
  "oSShSssssseLso",
  "oSLSSsssssepso",
  "oSSSSssssssSso",
  ".oSbbssssssLSo",
  ".obbbbbbbmmbo.",
  "..obbbbbbbbbo.",
  "...obbbbbbbo..",
  "....ooooooo...",
];
const FACES: Record<string, (r: string[]) => string[]> = {
  normal: (r) => r,
  hurt: (r) => r.map((row, i) => i === 7 ? "oSShSssssssLso" : i === 8 ? "oSLSSssssBBpso" : i === 11 ? ".obbbbbbbmmmo." : row),
  ko: (r) => r.map((row, i) => i === 7 ? "oSShSsssssBsBo" : i === 8 ? "oSLSSssssssBso" : row),
  shout: (r) => r.map((row, i) => i === 11 ? ".obbbbbbmmmmo." : i === 12 ? "..obbbbbmmmbo." : row),
};

function draw(cv: Canvas, j: Joints, p: Pose, C: Colors) {
  const ink = C.ink;
  const skin = { base: C.skin, shadow: C.skinS, light: C.skinL };
  const cloth = { base: C.robe, shadow: C.robeS, light: C.robeL };
  const pants = { base: C.pants, shadow: C.pantsS };
  const flow = p.flow ?? 0;
  const F = j.fwd, D: Vec = [-j.up[0], -j.up[1]];
  const lowFoot = Math.max(j.footF[1], j.footB[1]);

  // Bras arrière (manche longue, légèrement ample).
  const sleeve = (s: Vec, e: Vec, h: Vec) => { const m = new Mask(W, H); m.limb(s, e, 7.4, 6.6); m.limb(e, lerp(e, h, 0.8), 6.6, 6); paint(cv, m, cloth, ink); };
  sleeve(j.shoulderB, j.elbowB, j.handB);
  hand(cv, W, H, j.elbowB, j.handB, p.handB, { base: C.skinS }, ink);

  // Jambes : pantalon puis chaussures.
  const leg = (hip: Vec, knee: Vec, foot: Vec, front: boolean) => {
    const m = new Mask(W, H); m.limb(hip, knee, 6.6, 6); m.limb(knee, foot, 6, 5);
    paint(cv, m, front ? pants : { base: C.pantsS }, ink);
    shoe(cv, W, H, knee, foot, 7, { base: C.shoe, light: C.shoeL }, ink, Math.abs(foot[1] - lowFoot) < 1.5 && !p.rot);
  };
  leg(j.hipB, j.kneeB, j.footB, false);
  leg(j.hipF, j.kneeF, j.footF, true);

  // Tunique : des épaules jusqu'aux genoux, pan qui suit les cuisses et flotte.
  const shF = add(add(j.neck, F, 8.5), D, 1.5), shB = add(add(j.neck, F, -8), D, 1.5);
  const sideF = add(j.hip, F, 7.5), sideB = add(j.hip, F, -7.5);
  const hemF = add(add(lerp(j.hipF, j.kneeF, 0.92), F, 5.5), [flow * 0.5, 0]);
  const hemB = add(add(lerp(j.hipB, j.kneeB, 0.92), F, -5.5), [-flow, -flow * 0.3]);
  const robe = new Mask(W, H);
  robe.poly([add(j.neck, F, -3), add(j.neck, F, 3), shF, add(sideF, D, -6), sideF, hemF, lerp(hemF, hemB, 0.5), hemB, sideB, add(sideB, D, -6), shB]);
  robe.disc(add(j.neck, D, 2), 5);
  paint(cv, robe, cloth, ink);
  // Col rond.
  const neckM = new Mask(W, H); neckM.limb(add(j.neck, D, 1), j.headC, 5, 5);
  paint(cv, neckM, { base: C.skinS }, ink);
  // Plastron brodé : colonne blanche en zigzag, du col jusqu'au bas de la tunique.
  const len = Math.round(Math.hypot(hemF[0] - j.neck[0], hemF[1] - j.neck[1]) * 0.86);
  for (let t = 1; t < len; t++) {
    const q = add(add(j.neck, D, t), F, 1.5);
    const x = Math.round(q[0]), y = Math.round(q[1]);
    if (!robe.has(x, y)) continue;
    cv.set(x - 1, y, C.robeL); cv.set(x + 2, y, C.robeL);
    cv.set(x + (t % 2), y, C.embro); cv.set(x + 1 - (t % 2), y, C.embroS);
  }
  // Poche de poitrine brodée (côté avant).
  const pc = add(add(j.neck, D, 7), F, 4.5);
  for (let yy = 0; yy < 6; yy++) for (let xx = 0; xx < 4; xx++) {
    const x = Math.round(pc[0]) + xx, y = Math.round(pc[1]) + yy;
    if (robe.has(x, y)) cv.set(x, y, (xx + yy) % 2 === 0 ? C.embro : C.embroS);
  }

  // Tête (tampon pixel), puis bras avant.
  const face = FACES[p.face ?? "normal"](HEAD);
  stamp(cv, face, { o: ink, h: C.hair, s: C.skin, S: C.skinS, L: C.skinL, e: C.eye, p: C.pupil, b: C.beard, m: C.mouth, B: C.hair }, Math.round(j.headC[0] - 7), Math.round(j.headC[1] - 8));
  sleeve(j.shoulderF, j.elbowF, j.handF);
  hand(cv, W, H, j.elbowF, j.handF, p.handF, skin, ink);
}

// ─── Poses ───────────────────────────────────────────────────────────────────
const S: Pose = { lean: 5, head: -3, armF: [62, 84], armB: [36, 86], legF: [18, -6], legB: [-16, -4], handF: "open", handB: "fist" };
const P = (o: Partial<Pose>): Pose => ({ ...S, ...o });
const CROUCH: Pose = P({ lean: 22, head: -16, armF: [74, 80], armB: [50, 90], legF: [62, -102], legB: [22, -92] });
const C_ = (o: Partial<Pose>): Pose => ({ ...CROUCH, ...o });
const TUCK: Pose = P({ lean: 10, armF: [100, 70], armB: [70, 80], legF: [76, -124], legB: [36, -116], handF: "fist" });
const T = (o: Partial<Pose>): Pose => ({ ...TUCK, ...o });
const GUARD: Pose = P({ lean: -4, head: -8, armF: [142, 156], armB: [128, 162], legF: [12, -6], legB: [-22, -4], handF: "fist", handB: "fist" });
const HURT: Pose = P({ lean: -22, head: -20, armF: [-10, 30], armB: [-36, 24], legF: [8, -14], legB: [-22, 0], handF: "open", handB: "open", face: "hurt" });
const LIE: Pose = P({ lean: 0, head: 0, armF: [10, 6], armB: [-6, 4], legF: [4, 0], legB: [-4, 2], handF: "open", handB: "open", face: "ko", rot: -90 });

const walkLegs: [Pose["legF"], Pose["legB"]][] = [
  [[24, -8], [-20, -4]], [[10, -34], [-12, -8]], [[-8, -16], [6, -6]], [[-20, -4], [22, -8]], [[-10, -8], [10, -34]], [[8, -6], [-6, -16]],
];

export const CRAIG_SPRITES: SpriteChar = {
  key: "craig",
  name: "Craig Ryan",
  reference: "Photo réelle : tunique noire à plastron et poche brodés blanc, barbe courte, cheveux courts.",
  palette: {
    ink: "#120c12", skin: "#7a4c34", skinS: "#5a3524", skinL: "#9a6646", hair: "#151015", beard: "#1f1518",
    eye: "#efe6da", pupil: "#100a0e", mouth: "#5e2a26",
    robe: "#25222c", robeS: "#16141b", robeL: "#3b3746", embro: "#eeebe2", embroS: "#a8a499",
    pants: "#2c2a36", pantsS: "#1d1b24", shoe: "#3a2619", shoeL: "#5a3d28",
  },
  body: { head: 14, neck: 3, torso: 21, thigh: 17, shin: 17, upper: 12, fore: 12, hipW: 12, chestW: 15, waistW: 13, armW: 6, legW: 6, footL: 7 },
  draw,
  anims: {
    intro: { poses: [P({ armF: [150, 150], handF: "grab", head: 6 }), P({ armF: [140, 150], handF: "grab", head: 4 }), S], dur: [24, 24, 12] },
    idle: { poses: [S, P({ lean: 6, armF: [80, 60], flow: 1 }), P({ lean: 6, armF: [80, 58], flow: 1, legF: [18, -7] }), P({ armF: [79, 61] })], dur: [12, 10, 12, 10], loop: true },
    walk: { poses: walkLegs.map(([f, b], i) => P({ lean: 8, legF: f, legB: b, armF: [78 + (i % 3) * 2, 60], flow: i % 2 })), dur: [6, 6, 6, 6, 6, 6], loop: true },
    walkback: { poses: [...walkLegs].reverse().map(([f, b]) => P({ lean: 1, legF: f, legB: b, armF: [74, 66], flow: -1 })), dur: [6, 6, 6, 6, 6, 6], loop: true },
    crouch: { poses: [C_({ lean: 12, legF: [40, -66], legB: [8, -56] }), CROUCH], dur: [3, 99] },
    guard: { poses: [GUARD], loop: true },
    cguard: { poses: [C_({ lean: 8, head: -6, armF: [150, 152], armB: [132, 160], handF: "fist", handB: "fist" })], loop: true },
    jump: { poses: [C_({ lean: 8, legF: [40, -70], legB: [-14, -60] }), T({}), T({ legF: [50, -90], legB: [10, -80], flow: -2 }), T({ legF: [26, -30], legB: [-8, -24], flow: -3 })], dur: [3, 12, 10, 99] },
    jumpfwd: { poses: [C_({ lean: 8, legF: [40, -70], legB: [-14, -60] }), T({ lean: 24 }), T({ lean: 30, legF: [90, -130], legB: [50, -120] }), T({ lean: 14, legF: [30, -40], legB: [-6, -30], flow: -3 })], dur: [3, 10, 12, 99] },
    // Coups (phases : s = démarrage, a = actif, r = récupération)
    s_lp: { poses: [P({ armF: [84, 36] }), P({ lean: 11, armF: [92, 0], legF: [24, -6], flow: 1 }), P({ lean: 8, armF: [86, 26] })], phases: ["s", "a", "r"] },
    s_hp: { poses: [P({ lean: -4, armF: [56, 104], armB: [48, 100], handB: "open" }), P({ lean: 18, dx: 3, armF: [94, 0], armB: [90, 6], handB: "open", legF: [34, -6], legB: [-30, 0], flow: 2 }), P({ lean: 12, armF: [86, 24], armB: [70, 40] })], phases: ["s", "a", "r"] },
    s_lk: { poses: [P({ legF: [54, -86] }), P({ lean: -4, legF: [84, -6], flow: 2 }), P({ legF: [44, -64] })], phases: ["s", "a", "r"] },
    s_hk: { poses: [P({ lean: -6, legF: [72, -104], armB: [10, 60] }), P({ lean: -22, head: -6, legF: [120, -6], legB: [-8, 0], armF: [60, 60], armB: [-24, 40], flow: 3 }), P({ lean: -10, legF: [64, -84] })], phases: ["s", "a", "r"] },
    c_lp: { poses: [C_({ armF: [86, 40] }), C_({ armF: [92, 0], handF: "fist" }), C_({ armF: [88, 30] })], phases: ["s", "a", "r"] },
    c_hp: { poses: [C_({ armF: [60, 100] }), P({ lean: 10, head: 8, armF: [168, 8], legF: [44, -70], legB: [-12, -56], flow: -2 }), C_({ armF: [120, 60] })], phases: ["s", "a", "r"] },
    c_lk: { poses: [C_({ legF: [72, -60] }), C_({ legF: [84, 4] }), C_({ legF: [72, -50] })], phases: ["s", "a", "r"] },
    c_hk: { poses: [C_({ lean: 30, legF: [70, -40] }), C_({ lean: 44, head: -30, legF: [96, 0], armF: [24, 30], handF: "open", flow: 3 }), C_({ lean: 30, legF: [80, -60] })], phases: ["s", "a", "r"] },
    j_lp: { poses: [T({ armF: [100, 40] }), T({ armF: [118, -12], handF: "open" })], phases: ["s", "a"] },
    j_hp: { poses: [T({ lean: -4, armF: [150, 20], armB: [140, 30], handB: "fist" }), T({ lean: 16, armF: [118, -24], armB: [108, -18], handB: "fist" })], phases: ["s", "a"] },
    j_lk: { poses: [T({}), T({ legF: [100, -14], lean: 4 })], phases: ["s", "a"] },
    j_hk: { poses: [T({ legF: [70, -90] }), T({ lean: -16, legF: [124, 0], legB: [40, -110], armB: [-10, 40], flow: -3 })], phases: ["s", "a"] },
    throw: { poses: [P({ lean: 12, armF: [96, 18], armB: [90, 24], handF: "grab", handB: "grab" }), P({ lean: 16, armF: [100, 30], armB: [96, 34], handF: "grab", handB: "grab" }), P({ lean: -14, head: -10, armF: [172, -6], armB: [162, 6], handF: "open", handB: "open", legF: [10, -4], legB: [-30, 0], flow: 2 }), P({ lean: 10, armF: [90, 10], armB: [60, 40] })], phases: ["s", "a", "r", "r"] },
    // Quiz Omniscient : il lève l'index (« une question ! »), puis la pointe vers l'adversaire.
    special: { poses: [P({ lean: -2, head: 8, armF: [166, 6], handF: "point", armB: [26, 96], face: "shout" }), P({ lean: 12, armF: [94, 0], handF: "point", legF: [26, -6], flow: 2 }), P({ lean: 8, armF: [88, 20], handF: "point" })], phases: ["s", "a", "r"] },
    super: { poses: [P({ lean: -8, armF: [124, 20], armB: [112, 24], handB: "open", face: "shout" }), P({ lean: 26, dx: 6, armF: [94, 0], armB: [92, 4], handB: "open", legF: [38, -6], legB: [-36, 0], flow: 3, face: "shout" }), P({ lean: -18, legF: [116, -6], armF: [60, 60], armB: [-20, 40], flow: 3, face: "shout" }), P({ lean: 10 })], phases: ["s", "a", "a", "r"] },
    hit: { poses: [HURT, P({ ...HURT, lean: -14, head: -12 })], dur: [6, 99] },
    chit: { poses: [C_({ lean: 2, head: -20, armF: [20, 40], armB: [-10, 30], face: "hurt" })], dur: [99] },
    block: { poses: [P({ ...GUARD, lean: -10, head: -12 })], dur: [99] },
    cblock: { poses: [C_({ lean: 2, head: -10, armF: [150, 152], armB: [132, 160], handF: "fist", handB: "fist" })], dur: [99] },
    fall: { poses: [P({ ...HURT, rot: -30 }), P({ ...HURT, rot: -60, legF: [30, -20] })], dur: [8, 99] },
    down: { poses: [LIE], dur: [99] },
    getup: { poses: [P({ ...LIE, rot: -50, face: "hurt" }), C_({}), P({ lean: 8 })], dur: [5, 5, 4] },
    dizzy: { poses: [P({ ...HURT, lean: -8, head: -16, armF: [10, 10], armB: [-8, 10] }), P({ ...HURT, lean: 6, head: 10, armF: [6, 10], armB: [-14, 10] })], dur: [14, 14], loop: true },
    dodge: { poses: [C_({ lean: 40, head: -40, armF: [100, 60], armB: [80, 70] }), T({ rot: 90 }), T({ rot: 180 }), T({ rot: 270 }), C_({})], dur: [4, 5, 5, 5, 7] },
    ko: { poses: [P({ ...HURT, rot: -40, face: "ko" }), P({ ...LIE })], dur: [12, 99] },
    win: { poses: [P({ lean: 0, head: 6, armF: [168, 4], handF: "point", armB: [24, 110], handB: "fist" }), P({ lean: 0, head: 8, armF: [170, 2], handF: "point", armB: [24, 110], handB: "fist", flow: 1 })], dur: [20, 20], loop: true },
  } satisfies Record<string, Anim>,
};
