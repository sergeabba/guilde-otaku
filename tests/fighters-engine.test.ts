import { createMatch, step, NO_INPUT, MAX_HP, MAX_METER, ROUND_FRAMES, tuning, type Input, type MatchState, type FighterProfile, type MatchEvent } from "../lib/fighters/engine";
import { aiInput, makeRng, newAiMemory } from "../lib/fighters/ai";
import { characterFor, CRAIG, MELRICK } from "../lib/fighters/characters";

const P = (id: number, s = 70): FighterProfile => ({ id, name: `M${id}`, stats: { force: s, vitesse: s, technique: s }, specialName: "Spéciale" });
const I = (p: Partial<Input>): Input => ({ ...NO_INPUT, ...p });
const events: MatchEvent[] = [];
const st = (s: MatchState, a: Input = NO_INPUT, b: Input = NO_INPUT) => { step(s, a, b); events.push(...s.events); return s; };
const run = (s: MatchState, n: number, a: Input = NO_INPUT, b: Input = NO_INPUT) => { for (let i = 0; i < n; i++) st(s, a, b); return s; };
const toFight = (s: MatchState) => { while (s.phase === "intro") st(s); return s; };
/** Rapproche les combattants au contact. */
const closeIn = (s: MatchState, gap = 30) => { let i = 0; while (Math.abs(s.fighters[1].x - s.fighters[0].x) > gap && i++ < 400) st(s, I({ right: true })); run(s, 2); return s; };
const tap = (s: MatchState, a: Partial<Input>, b: Partial<Input> = {}, wait = 30) => { st(s, I(a), I(b)); return run(s, wait, NO_INPUT, I(b)); };
/** Quart de cercle avant (le joueur 1 regarde à droite). */
const qcf = (s: MatchState, btn: Partial<Input>) => { st(s, I({ down: true })); st(s, I({ down: true, right: true })); st(s, I({ right: true })); st(s, I({ right: true, ...btn })); };
const fresh = (a = 1, b = 2) => toFight(createMatch("duel", [P(a)], [P(b)]));

beforeEach(() => { events.length = 0; });

describe("moteur Guilde Fighters v3", () => {
  it("démarre par une intro puis le combat, sans action possible avant", () => {
    const s = createMatch("duel", [P(1)], [P(2)]);
    const x0 = s.fighters[0].x;
    run(s, 50, I({ right: true }));
    expect(s.phase).toBe("intro");
    expect(s.fighters[0].x).toBe(x0);
    toFight(s);
    expect(s.phase).toBe("fight");
  });

  it("quatre boutons : poing léger plus faible et plus rapide que poing fort", () => {
    const light = closeIn(fresh()); tap(light, { lp: true });
    const heavy = closeIn(fresh()); tap(heavy, { hp: true });
    const dl = MAX_HP - light.fighters[1].hp, dh = MAX_HP - heavy.fighters[1].hp;
    expect(dl).toBeGreaterThan(0);
    expect(dh).toBeGreaterThan(dl * 1.8);
    expect(characterFor(2).normals.s_lp.startup).toBeLessThan(characterFor(2).normals.s_hp.startup);
  });

  it("un coup hors de portée ne touche pas", () => {
    const s = fresh();
    tap(s, { hp: true });
    expect(s.fighters[1].hp).toBe(MAX_HP);
  });

  it("garde haute et basse : le balayage passe la garde debout, pas la garde accroupie", () => {
    const standing = closeIn(fresh()); tap(standing, { down: true, hk: true }, { right: true });
    const crouching = closeIn(fresh()); tap(crouching, { down: true, hk: true }, { right: true, down: true });
    expect(MAX_HP - standing.fighters[1].hp).toBeGreaterThan(50);
    expect(MAX_HP - crouching.fighters[1].hp).toBeLessThan(15);
  });

  it("garde accroupie : un coup sauté (haut) passe", () => {
    const s = closeIn(fresh(), 80);
    const crouchGuard = I({ right: true, down: true });
    st(s, I({ up: true, right: true }), crouchGuard);
    let i = 0;
    while (!(s.fighters[0].vy > 0 && s.fighters[1].x - s.fighters[0].x < 36) && i++ < 60) st(s, I({ right: true }), crouchGuard);
    st(s, I({ hk: true }), crouchGuard);
    run(s, 30, NO_INPUT, crouchGuard);
    expect(MAX_HP - s.fighters[1].hp).toBeGreaterThan(40);
  });

  it("la projection est imparable et met au sol", () => {
    const s = closeIn(fresh());
    st(s, I({ right: true, hp: true }), I({ right: true }));
    run(s, 25, NO_INPUT, I({ right: true }));
    expect(events.some((e) => e.type === "throw")).toBe(true);
    expect(MAX_HP - s.fighters[1].hp).toBeGreaterThan(60);
    run(s, 15);
    expect(s.fighters[1].state).toBe("down");
  });

  it("l'esquive traverse un coup", () => {
    const s = closeIn(fresh());
    st(s, NO_INPUT, I({ dodge: true }));
    st(s, I({ hp: true }));
    run(s, 30);
    expect(s.fighters[1].hp).toBe(MAX_HP);
    expect(events.some((e) => e.type === "dodge")).toBe(true);
  });

  it("enchaînement : poing léger annulé en poing léger puis fort, compteur de combo", () => {
    const s = closeIn(fresh());
    st(s, I({ lp: true })); run(s, 5);
    st(s, I({ lp: true })); run(s, 5);
    st(s, I({ hp: true })); run(s, 30);
    const combos = events.filter((e) => e.type === "hit" && !e.blocked).map((e) => (e as { combo: number }).combo);
    expect(Math.max(...combos)).toBeGreaterThanOrEqual(3);
    expect(s.fighters[0].bestCombo).toBeGreaterThanOrEqual(3);
  });

  it("commande quart de cercle : lance la spéciale, une seule à la fois", () => {
    const s = fresh(2, 3);
    qcf(s, { lp: true });
    run(s, 15);
    expect(s.projectiles.length).toBe(1);
    expect(events.some((e) => e.type === "special" && !e.super)).toBe(true);
    st(s, I({ special: true })); run(s, 15);
    expect(s.projectiles.length).toBe(1);
    run(s, 80);
    expect(s.fighters[1].hp).toBeLessThan(MAX_HP);
  });

  it("la jauge monte en touchant ; la super la vide et ne part qu'avec une jauge pleine", () => {
    const s = closeIn(fresh());
    tap(s, { hp: true });
    expect(s.fighters[0].meter).toBeGreaterThan(0);
    const hp = s.fighters[1].hp;
    tap(s, { super: true });
    expect(s.fighters[1].hp).toBe(hp);
    closeIn(s);
    s.fighters[0].meter = MAX_METER;
    tap(s, { super: true }, {}, 50);
    expect(s.fighters[0].meter).toBeLessThan(MAX_METER);
    expect(events.some((e) => e.type === "special" && e.super)).toBe(true);
    expect(hp - s.fighters[1].hp).toBeGreaterThan(150);
  });

  it("Craig : Quiz Omniscient étourdit l'adversaire", () => {
    expect(CRAIG.specials[0].name).toBe("Quiz Omniscient");
    const s = fresh(1, 2);
    qcf(s, { lp: true });
    run(s, 120);
    expect(events.some((e) => e.type === "dizzy" && e.side === 1)).toBe(true);
  });

  it("Melrick : Régénération de Cell, retour à 20 % une fois par match", () => {
    expect(MELRICK.passive?.hpPct).toBe(0.2);
    const s = toFight(createMatch("duel", [P(1)], [P(56)]));
    s.fighters[1].hp = 1; closeIn(s); tap(s, { hp: true });
    expect(events.some((e) => e.type === "revive")).toBe(true);
    expect(s.phase).toBe("fight");
    expect(s.fighters[1].hp).toBe(MAX_HP * 0.2);
    run(s, 90);
    s.fighters[1].hp = 1; closeIn(s); tap(s, { hp: true });
    expect(s.phase).toBe("roundEnd");
  });

  it("les statistiques réelles nuancent sans déséquilibrer", () => {
    const weak = tuning(P(1, 0)), strong = tuning(P(2, 100));
    expect(strong.damage / weak.damage).toBeLessThan(1.4);
    expect(strong.walk).toBeGreaterThan(weak.walk);
  });

  it("duel : deux manches gagnantes, puis fin de match", () => {
    const s = createMatch("duel", [P(2)], [P(3)]);
    for (let round = 0; round < 2; round++) {
      toFight(s);
      s.fighters[1].hp = 1; closeIn(s); tap(s, { lp: true });
      expect(s.phase).toBe("roundEnd");
      run(s, 140);
    }
    expect(s.phase).toBe("matchEnd");
    expect(s.winner).toBe(0);
    expect(s.wins[0]).toBe(2);
  });

  it("équipes 3 contre 3 : élimination, le suivant entre, le vainqueur garde sa vie et sa jauge passe", () => {
    const s = createMatch("team", [P(2), P(3), P(4)], [P(5), P(6), P(7)]);
    toFight(s);
    s.fighters[0].hp = 600; s.fighters[1].hp = 1; s.fighters[1].meter = 40; closeIn(s); tap(s, { lp: true });
    run(s, 140);
    expect(s.active).toEqual([0, 1]);
    expect(s.fighters[1].profile.id).toBe(6);
    expect(s.fighters[1].hp).toBe(MAX_HP);
    expect(s.fighters[1].meter).toBeGreaterThanOrEqual(40);
    expect(s.fighters[0].hp).toBeGreaterThan(600);
    expect(s.fighters[0].hp).toBeLessThan(MAX_HP);
  });

  it("temps écoulé : le moins de vie perd", () => {
    const s = fresh(2, 3);
    s.fighters[0].hp = 400;
    run(s, ROUND_FRAMES + 1);
    expect(s.phase).toBe("roundEnd");
    expect(s.lastLoser).toEqual([0]);
  });

  it("l'IA joue un match complet sans blocage, de façon reproductible, et utilise ses outils", () => {
    const play = (seed: number) => {
      const s = createMatch("team", [P(1, 40), P(56, 60), P(3, 80)], [P(4), P(5), P(6)]);
      const r0 = makeRng(seed), r1 = makeRng(seed + 1), m0 = newAiMemory(), m1 = newAiMemory();
      const seen = new Set<string>();
      let n = 0;
      while (s.phase !== "matchEnd" && n++ < 60 * 60 * 12) {
        step(s, aiInput(s, 0, m0, r0, "normal"), aiInput(s, 1, m1, r1, "difficile"));
        for (const e of s.events) seen.add(e.type === "hit" && e.combo >= 2 ? "combo" : e.type);
      }
      return { phase: s.phase, winner: s.winner, frames: s.frame, seen: [...seen].sort() };
    };
    const a = play(7), b = play(7);
    expect(a.phase).toBe("matchEnd");
    expect(a).toEqual(b);
    expect(a.seen).toEqual(expect.arrayContaining(["hit", "special", "combo"]));
  });
});
