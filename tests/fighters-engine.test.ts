import { createMatch, step, NO_INPUT, MAX_HP, ROUND_FRAMES, tuning, type Input, type MatchState, type FighterProfile } from "../lib/fighters/engine";
import { aiInput, makeRng, newAiMemory } from "../lib/fighters/ai";

const P = (id: number, s = 70): FighterProfile => ({ id, name: `M${id}`, stats: { force: s, vitesse: s, technique: s }, specialName: "Spéciale" });
const I = (p: Partial<Input>): Input => ({ ...NO_INPUT, ...p });
const run = (s: MatchState, n: number, a: Input = NO_INPUT, b: Input = NO_INPUT) => { for (let i = 0; i < n; i++) step(s, a, b); return s; };
const toFight = (s: MatchState) => { while (s.phase === "intro") step(s, NO_INPUT, NO_INPUT); return s; };
/** Rapproche les combattants à portée de coup. */
const closeIn = (s: MatchState) => { let i = 0; while (Math.abs(s.fighters[1].x - s.fighters[0].x) > 26 && i++ < 400) step(s, I({ right: true }), NO_INPUT); step(s, NO_INPUT, NO_INPUT); return s; };
const tap = (s: MatchState, a: Partial<Input>, b: Partial<Input> = {}, hold = 30) => { step(s, I(a), I(b)); return run(s, hold, NO_INPUT, I(b)); };

describe("moteur Guilde Fighters", () => {
  it("démarre par une intro puis le combat, sans action possible avant", () => {
    const s = createMatch("duel", [P(1)], [P(2)]);
    const x0 = s.fighters[0].x;
    run(s, 50, I({ right: true }));
    expect(s.phase).toBe("intro");
    expect(s.fighters[0].x).toBe(x0);
    toFight(s);
    expect(s.phase).toBe("fight");
  });

  it("un coup de poing à portée touche et retire des points de vie", () => {
    const s = closeIn(toFight(createMatch("duel", [P(1)], [P(2)])));
    tap(s, { punch: true });
    expect(s.fighters[1].hp).toBeLessThan(MAX_HP);
    expect(s.fighters[1].hp).toBeGreaterThan(MAX_HP - 80);
  });

  it("un coup hors de portée ne touche pas", () => {
    const s = toFight(createMatch("duel", [P(1)], [P(2)]));
    tap(s, { punch: true });
    expect(s.fighters[1].hp).toBe(MAX_HP);
  });

  it("reculer protège : dégâts réduits et jamais de K.-O. par la garde", () => {
    const a = closeIn(toFight(createMatch("duel", [P(1)], [P(2)])));
    const b = closeIn(toFight(createMatch("duel", [P(1)], [P(2)])));
    tap(a, { kick: true });
    tap(b, { kick: true }, { right: true }); // le joueur 2 recule (vers la droite) : garde
    const open = MAX_HP - a.fighters[1].hp, guarded = MAX_HP - b.fighters[1].hp;
    expect(open).toBeGreaterThan(0);
    expect(guarded).toBeGreaterThan(0);
    expect(guarded).toBeLessThan(open / 3);
  });

  it("la technique spéciale lance un projectile qui traverse l'écran puis respecte un temps de recharge", () => {
    const s = toFight(createMatch("duel", [P(1)], [P(2)]));
    step(s, I({ special: true }), NO_INPUT);
    run(s, 15);
    expect(s.projectiles.length).toBe(1);
    run(s, 80);
    expect(s.fighters[1].hp).toBeLessThan(MAX_HP);
    const hp = s.fighters[1].hp;
    tap(s, { special: true }, {}, 60);
    expect(s.fighters[1].hp).toBe(hp); // encore en recharge
  });

  it("les statistiques réelles nuancent sans déséquilibrer", () => {
    const weak = tuning(P(1, 0)), strong = tuning(P(2, 100));
    expect(strong.damage / weak.damage).toBeLessThan(1.4);
    expect(strong.walk).toBeGreaterThan(weak.walk);
    expect(strong.specialCooldown).toBeLessThan(weak.specialCooldown);
  });

  it("duel : deux manches gagnantes, puis fin de match", () => {
    const s = createMatch("duel", [P(1)], [P(2)]);
    for (let round = 0; round < 2; round++) {
      toFight(s);
      s.fighters[1].hp = 1; closeIn(s); tap(s, { punch: true });
      expect(s.phase).toBe("roundEnd");
      run(s, 140);
    }
    expect(s.phase).toBe("matchEnd");
    expect(s.winner).toBe(0);
    expect(s.wins[0]).toBe(2);
  });

  it("équipes 3 contre 3 : élimination, le suivant entre, le vainqueur garde sa vie", () => {
    const s = createMatch("team", [P(1), P(2), P(3)], [P(4), P(5), P(6)]);
    toFight(s);
    s.fighters[0].hp = 600; s.fighters[1].hp = 1; closeIn(s); tap(s, { punch: true });
    run(s, 140);
    expect(s.active).toEqual([0, 1]);
    expect(s.fighters[1].profile.id).toBe(5);
    expect(s.fighters[1].hp).toBe(MAX_HP);
    expect(s.fighters[0].hp).toBeGreaterThan(600); // récupère un peu
    expect(s.fighters[0].hp).toBeLessThan(MAX_HP);
  });

  it("temps écoulé : le moins de vie perd", () => {
    const s = toFight(createMatch("duel", [P(1)], [P(2)]));
    s.fighters[0].hp = 400;
    run(s, ROUND_FRAMES + 1);
    expect(s.phase).toBe("roundEnd");
    expect(s.lastLoser).toEqual([0]);
  });

  it("l'IA joue un match complet sans blocage, de façon reproductible", () => {
    const play = (seed: number) => {
      const s = createMatch("team", [P(1, 40), P(2, 60), P(3, 80)], [P(4), P(5), P(6)]);
      const r0 = makeRng(seed), r1 = makeRng(seed + 1), m0 = newAiMemory(), m1 = newAiMemory();
      let n = 0;
      while (s.phase !== "matchEnd" && n++ < 60 * 60 * 12) step(s, aiInput(s, 0, m0, r0, "normal"), aiInput(s, 1, m1, r1, "difficile"));
      return { phase: s.phase, winner: s.winner, frames: s.frame };
    };
    const a = play(7), b = play(7);
    expect(a.phase).toBe("matchEnd");
    expect(a).toEqual(b);
  });
});
