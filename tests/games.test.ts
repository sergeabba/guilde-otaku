process.env.GAME_SECRET = "secret-de-test-pour-les-jeux-0123456789";
import { buildQuiz, roundPoints, scoreQuiz, signKey, verifyKey, ROUND_MS } from "../lib/games/quiz";
import { duel } from "../lib/games/duel";
import { computeBadges, NO_STATS } from "../lib/games/badges";
import type { FavoriteWork } from "../lib/member-extras";

describe("quiz des génériques", () => {
  it("garde le corrigé dans un jeton signé qu'on ne peut pas modifier", async () => {
    const { token, rounds } = await buildQuiz(async (i) => `https://audio.test/${i}.m4a`);
    expect(rounds).toHaveLength(10);
    rounds.forEach((r) => { expect(r.choices).toHaveLength(4); expect(new Set(r.choices).size).toBe(4); });
    expect(JSON.stringify(rounds)).not.toContain("answers");
    const key = verifyKey(token)!;
    expect(key.answers).toHaveLength(10);
    const [body, mac] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...key, answers: key.answers.map(() => 0) })).toString("base64url");
    expect(verifyKey(`${forged}.${mac}`)).toBeNull();
    expect(verifyKey(`${body}.${mac}`, Date.now() + 31 * 60_000)).toBeNull();
  });

  it("compte 100 points par bonne réponse, plus un bonus de rapidité", () => {
    expect(roundPoints(true, 0)).toBe(150);
    expect(roundPoints(true, ROUND_MS)).toBe(100);
    expect(roundPoints(true, 999_999)).toBe(100);
    expect(roundPoints(false, 0)).toBe(0);
    const key = verifyKey(signKey({ v: 1, nonce: "n", exp: Date.now() + 60_000, songs: [0, 1], answers: [2, 1] }))!;
    const r = scoreQuiz(key, [{ choice: 2, ms: ROUND_MS }, { choice: 3, ms: 0 }]);
    expect([r.score, r.max, r.good]).toEqual([100, 300, 1]);
    expect(r.correction[1]).toMatchObject({ ok: false, chosen: 3, correct: 1 });
  });
});

const w = (title: string, genres: string[], id: number): FavoriteWork => ({ source: "tmdb", sourceId: `tv:${id}`, kind: "ANIME", titleLocalized: title, genres });

describe("duel de goûts", () => {
  it("monte avec les œuvres et genres en commun, refuse sans favoris", () => {
    const a = { id: 1, name: "A", extras: { favoriteAnime: [w("One Piece", ["Action", "Aventure"], 1), w("Naruto", ["Action"], 2), w("Nana", ["Romance"], 3)] } };
    const b = { id: 2, name: "B", extras: { favoriteAnime: [w("One Piece", ["Action", "Aventure"], 1), w("Naruto", ["Action"], 2)] } };
    const c = { id: 3, name: "C", extras: { favoriteAnime: [w("Nana", ["Romance"], 9)] } };
    const ab = duel(a, b)!, bc = duel(b, c)!;
    expect(ab.common).toEqual(["One Piece", "Naruto"]);
    expect(ab.score).toBeGreaterThan(bc.score);
    expect(bc.common).toEqual([]);
    expect(duel(a, { id: 4, name: "D" })).toBeNull();
  });
});

describe("badges automatiques", () => {
  it("ne donne que des badges mérités par les données", () => {
    expect(computeBadges(undefined, NO_STATS)).toEqual([]);
    const many = Array.from({ length: 10 }, (_, i) => w(`T${i}`, ["Action"], i));
    const ids = computeBadges({ favoriteAnime: many }, { ...NO_STATS, quizBestPct: 85, bashVotes: 5 }).map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining(["collection", "shonen", "oreille", "voix"]));
    expect(ids).not.toContain("encyclo");
  });
});

import { buildChallenge, buildQuiz as buildQuiz2, verifyKey as verifyKey2 } from "../lib/games/quiz";
import { affichePoints, buildAffiche, buildDaily, buildPlusMoins, dailyPoints, dailyStreak, openAffiche, openDaily, openPlusMoins, parisDay, scoreAffiche, stepPlusMoins, tilesAt } from "../lib/games/arcade";
import { toPool, type PoolAnime } from "../lib/games/pool";
import { cleanRanks, isoWeek, tierResults, tierTwins } from "../lib/games/tier";
import songCatalog from "../data/anime-songs.json";

const POOL: PoolAnime[] = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, title: `Anime ${i + 1}`, cover: `https://img.test/${i + 1}.jpg`, score: 50 + (i % 40), year: 2000 + (i % 25) }));

describe("blind test Nostalgie et défi entre amis", () => {
  it("ne tire que des génériques français en mode nostalgie", async () => {
    const { token, rounds } = await buildQuiz2(async (i) => `https://audio.test/${i}.m4a`, Date.now(), "nostalgie");
    const key = verifyKey2(token)!;
    const cat = songCatalog as { anime: string; lang?: string }[];
    expect(key.mode).toBe("nostalgie");
    key.songs.forEach((i) => expect(cat[i].lang).toBe("fr"));
    rounds.forEach((r) => r.choices.forEach((c) => expect(cat.some((s) => s.lang === "fr" && s.anime === c)).toBe(true)));
  });
  it("rejoue exactement les mêmes manches et retrouve le corrigé", async () => {
    const first = verifyKey2((await buildQuiz2(async (i) => `p${i}`)).token)!;
    const again = await buildChallenge({ songs: first.songs, choices: first.choices }, 42, async (i) => `p${i}`);
    const k = verifyKey2(again!.token)!;
    expect(k.answers).toEqual(first.answers);
    expect(again!.rounds.map((r) => r.choices)).toEqual(first.choices);
    expect(k.defi).toBe(42);
    expect(await buildChallenge({ songs: [1, 2], choices: [] }, 1, async () => "p")).toBeNull();
  });
});

describe("Affiche en morceaux", () => {
  it("dévoile une case toutes les 2 s et retire 10 points par case", () => {
    expect([tilesAt(0), tilesAt(1999), tilesAt(2000), tilesAt(60_000)]).toEqual([1, 1, 2, 9]);
    expect([affichePoints(true, 0), affichePoints(true, 16_000), affichePoints(false, 0)]).toEqual([100, 20, 0]);
  });
  it("garde le corrigé dans le jeton et compte les points", () => {
    const { token, rounds } = buildAffiche(POOL);
    expect(rounds).toHaveLength(8);
    expect(JSON.stringify(rounds)).not.toMatch(/answers|"id"/);
    const key = openAffiche(token)!;
    expect(openPlusMoins(token)).toBeNull();
    const r = scoreAffiche(key, key.answers.map((c) => ({ choice: c, ms: 0 })), POOL);
    expect([r.score, r.max, r.good]).toEqual([800, 800, 8]);
  });
});

describe("Plus ou moins", () => {
  it("révèle la note après chaque réponse et s'arrête à la première erreur", () => {
    const { token, cards, first } = buildPlusMoins(POOL);
    expect(JSON.stringify(cards)).not.toContain("score");
    let key = openPlusMoins(token)!;
    const byId = new Map(POOL.map((a) => [a.id, a.score]));
    expect(first).toBe(byId.get(key.seq[0]));
    for (let i = 0; i < 3; i++) {
      const good = byId.get(key.seq[key.pos + 1])! > byId.get(key.seq[key.pos])! ? "plus" : "moins";
      const s = stepPlusMoins(key, good, POOL)!;
      expect(s.ok).toBe(true); expect(s.streak).toBe(i + 1);
      key = openPlusMoins(s.token)!;
    }
    const bad = byId.get(key.seq[key.pos + 1])! > byId.get(key.seq[key.pos])! ? "moins" : "plus";
    const end = stepPlusMoins(key, bad, POOL)!;
    expect([end.ok, end.over, end.streak, end.token]).toEqual([false, true, 3, null]);
  });
});

describe("Défi du jour", () => {
  const members = [1, 2, 3, 4, 5].map((id) => ({ id, name: `M${id}`, favorites: [`Commun`, `Seul ${id}`] }));
  it("pose la même question à tout le monde le même jour", async () => {
    const a = await buildDaily("2026-11-17", POOL, members, async (i) => `p${i}`);
    const b = await buildDaily("2026-11-17", POOL, members, async (i) => `p${i}`);
    expect(a!.choices).toEqual(b!.choices);
    expect(openDaily(a!.token)!.answer).toBe(openDaily(b!.token)!.answer);
    const kinds = new Set<string>();
    for (const d of ["2026-11-17", "2026-11-18", "2026-11-19"]) kinds.add((await buildDaily(d, POOL, members, async (i) => `p${i}`))!.kind);
    expect(kinds).toEqual(new Set(["generique", "affiche", "membre"]));
  });
  it("demande un favori que seul un membre possède", async () => {
    for (const d of ["2026-11-17", "2026-11-18", "2026-11-19"]) {
      const q = (await buildDaily(d, POOL, members, async () => null))!;
      if (q.kind !== "membre") continue;
      const key = openDaily(q.token)!;
      expect(q.prompt).toMatch(/« Seul (\d) »/);
      expect(`« Seul ${key.reveal.slice(1)} »`).toBe(q.prompt.match(/« Seul \d »/)![0]);
    }
  });
  it("compte la série de jours réussis et la date de Paris", () => {
    const d = [{ date: "2026-11-15", ok: true }, { date: "2026-11-16", ok: true }, { date: "2026-11-14", ok: false }];
    expect(dailyStreak(d, "2026-11-17")).toBe(2);
    expect(dailyStreak([...d, { date: "2026-11-17", ok: true }], "2026-11-17")).toBe(3);
    expect(parisDay(new Date("2026-11-17T23:30:00Z"))).toBe("2026-11-18");
    expect([dailyPoints(true, 0), dailyPoints(true, 30_000), dailyPoints(false, 0)]).toEqual([150, 100, 0]);
  });
});

describe("réservoir AniList et tier list", () => {
  it("écarte les titres en écriture japonaise, sans affiche ou sans note", () => {
    const p = toPool([
      { id: 1, title: { romaji: "Naruto", english: null }, averageScore: 80, seasonYear: 2002, coverImage: { extraLarge: "c" } },
      { id: 2, title: { romaji: null, english: null }, averageScore: 80, seasonYear: 2002, coverImage: { extraLarge: "c" } },
      { id: 3, title: { romaji: "Bleach", english: "Bleach" }, averageScore: null, seasonYear: 2004, coverImage: { extraLarge: "c" } },
      { id: 4, title: { romaji: "NARUTO", english: null }, averageScore: 70, seasonYear: 2002, coverImage: { extraLarge: "c" } },
    ]);
    expect(p.map((a) => a.id)).toEqual([1]);
  });
  it("calcule la semaine ISO, la moyenne et les jumeaux", () => {
    expect(isoWeek(new Date("2026-11-17T12:00:00Z"))).toBe("2026-W47");
    expect(isoWeek(new Date("2027-01-01T12:00:00Z"))).toBe("2026-W53");
    const allowed = new Map([1, 2, 3, 4].map((id) => [id, { title: `T${id}`, cover: null }]));
    expect(cleanRanks([{ id: 1, tier: "S" }, { id: 1, tier: "A" }, { id: 9, tier: "S" }, { id: 2, tier: "Z" }], allowed)).toHaveLength(1);
    const row = (d: string, tiers: string[]) => ({ device: d, member_id: null, player_name: d, ranks: cleanRanks(tiers.map((t, i) => ({ id: i + 1, tier: t })), allowed) });
    const rows = [row("a", ["S", "A", "B", "D"]), row("b", ["S", "A", "B", "C"]), row("c", ["D", "D", "S", "S"])];
    const res = tierResults(rows);
    expect(res[0]).toMatchObject({ id: 1, votes: 3 });
    const twins = tierTwins(rows, (r) => r.player_name!);
    expect(twins[0]).toMatchObject({ a: "a", b: "b", pct: 94 });
  });
});

import { playerKey, rankPlayers } from "../lib/games/store";
describe("classement complet", () => {
  const dev = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
  const play = (o: Partial<{ device: string; member_id: number | null; player_name: string | null; score: number; at: string }>) => ({
    id: 1, game: "quiz-generique" as const, device: o.device ?? dev(1), member_id: o.member_id ?? null, player_name: o.player_name ?? null,
    score: o.score ?? 0, max_score: 1500, detail: { good: 3, rounds: 10, songs: [1, 2] }, created_at: o.at ?? "2026-11-17T10:00:00Z",
  });
  it("regroupe par joueur, classe par record et ne dévoile pas l'appareil", () => {
    const rows = [
      play({ member_id: 7, device: dev(1), score: 900, at: "2026-11-17T10:00:00Z" }),
      play({ member_id: 7, device: dev(2), score: 1100, at: "2026-11-17T11:00:00Z" }),
      play({ device: dev(3), player_name: "Zoro", score: 1000 }),
      play({ device: dev(4), score: 300 }),
    ];
    const r = rankPlayers("quiz-generique", rows);
    expect(r.map((x) => [x.key.slice(0, 1), x.best, x.plays])).toEqual([["m", 1100, 2], ["g", 1000, 1], ["g", 300, 1]]);
    expect(r[0]).toMatchObject({ member_id: 7, avg: 1000, total: 2000 });
    expect(r[1].name).toBe("Zoro");
    expect(JSON.stringify(r)).not.toContain(dev(3));
    expect(JSON.stringify(r)).not.toContain("songs");
    expect(playerKey({ member_id: null, device: dev(3) })).toBe(r[1].key);
  });
  it("classe le défi du jour au total de points", () => {
    const rows = [play({ device: dev(1), score: 150 }), play({ device: dev(2), score: 120 }), play({ device: dev(2), score: 110 })];
    expect(rankPlayers("defi-jour", rows).map((x) => x.total)).toEqual([230, 150]);
  });
});
