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

import { applyRound, isRoomCode, livePoints, liveRanking, roomCode } from "../app/jeux/live-logic";
describe("quiz en direct", () => {
  it("compte les points de la manche pour chaque joueur", () => {
    expect([livePoints(true, 0), livePoints(true, 20_000), livePoints(false, 0)]).toEqual([150, 100, 0]);
    const r1 = applyRound({}, { a: { choice: 2, ms: 0 }, b: { choice: 1, ms: 0 }, c: { choice: 2, ms: 10_000 } }, 2);
    expect(r1.gains).toEqual({ a: 150, b: 0, c: 125 });
    const r2 = applyRound(r1.scores, { b: { choice: 0, ms: 20_000 } }, 0);
    expect(r2.scores).toEqual({ a: 150, b: 100, c: 125 });
  });
  it("classe les joueurs, garde ceux qui sont partis", () => {
    const peers = [{ pid: "a", name: "A", image: null }, { pid: "b", name: "B", image: null }];
    const r = liveRanking({ a: 100, b: 250, z: 300 }, peers);
    expect(r.map((x) => [x.pid, x.gone])).toEqual([["z", true], ["b", false], ["a", false]]);
    expect(liveRanking({ b: 5, a: 5 }, peers).map((x) => x.pid)).toEqual(liveRanking({ a: 5, b: 5 }, [...peers].reverse()).map((x) => x.pid));
  });
  it("génère des codes de salle lisibles", () => {
    for (let i = 0; i < 50; i++) expect(isRoomCode(roomCode())).toBe(true);
    expect(isRoomCode("ABCD0")).toBe(false);
    expect(isRoomCode("abcde")).toBe(false);
  });
});

import { charHints, compareAnime, dlePoints, pickDaily, type DleAnime, type DleChar } from "../lib/games/dle-logic";
import { buildEmoji, checkPuzzle, emojiPoints, openEmoji, scoreEmoji, type Puzzle } from "../lib/games/emoji";
import emojiBase from "../data/emoji-quiz.json";

describe("Devine l'anime / le perso", () => {
  const A = (o: Partial<DleAnime>): DleAnime => ({ id: 1, title: "A", alt: null, cover: "c", year: 2010, format: "Série", episodes: 24, score: 80, genres: ["Action", "Drame"], studio: "MAPPA", source: "Manga", ...o });
  it("compare un essai à l'anime mystère (flèches, proches, genres en commun)", () => {
    const secret = A({ id: 9, year: 2015, score: 82, episodes: 12, genres: ["Action", "Fantasy"] });
    const f = compareAnime(A({ id: 2, year: 2014, score: 90, episodes: 24, studio: "MAPPA" }), secret);
    expect(f.ok).toBe(false);
    expect([f.year.dir, f.year.near, f.score.dir, f.score.near, f.episodes.dir]).toEqual(["up", true, "down", false, "down"]);
    expect([f.studio.ok, f.format.ok, f.genres.shared, f.genres.all]).toEqual([true, true, ["Action"], false]);
    expect(compareAnime(secret, secret).ok).toBe(true);
  });
  it("donne le même secret à tout le monde le même jour et des points dégressifs", () => {
    expect(pickDaily("2026-11-18", 150, "x")).toBe(pickDaily("2026-11-18", 150, "x"));
    expect(new Set(["2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21"].map((d) => pickDaily(d, 150, "x"))).size).toBeGreaterThan(1);
    expect([dlePoints(1), dlePoints(6), dlePoints(null), dlePoints(7)]).toEqual([100, 25, 0, 0]);
  });
  it("dévoile un indice de plus par essai raté, sans jamais donner le nom", () => {
    const c: DleChar = { id: 1, name: "Satoru Gojou", alt: [], image: "https://img/x.png", gender: "Homme", age: "28 ans", role: "Personnage principal", anime: "Jujutsu Kaisen", animeId: 5, year: 2020, genres: ["Action"] };
    const img = (l: 1 | 2) => `/img?l=${l}`;
    const h0 = charHints(c, 0, img), h3 = charHints(c, 3, img), h9 = charHints(c, 9, img);
    expect(h0.map((h) => h.label)).toEqual(["Rôle", "Genre", "Âge"]);
    expect(h3.some((h) => h.value === "Jujutsu Kaisen")).toBe(true);
    expect(h3.some((h) => h.value === "/img?l=1")).toBe(true);
    expect(JSON.stringify(h9)).not.toContain("Gojou");
    expect(JSON.stringify(h9)).not.toContain("x.png");
    expect(h9.at(-1)).toMatchObject({ label: "Son nom", value: "S····· G···· (6, 5 lettres)" });
  });
});

describe("Quiz des émojis", () => {
  const P: Puzzle[] = (emojiBase as { emojis: string; answer: string; hint: string }[]).map((p, i) => ({ id: `b${i}`, ...p }));
  it("toutes les énigmes de base sont valides et les titres uniques", () => {
    P.forEach((p) => expect(typeof checkPuzzle(p)).toBe("object"));
    expect(new Set(P.map((p) => p.answer)).size).toBe(P.length);
  });
  it("garde le corrigé dans le jeton, l'indice coûte la moitié", () => {
    const { token, rounds } = buildEmoji(P);
    expect(rounds).toHaveLength(8);
    expect(JSON.stringify(rounds)).not.toContain("answers");
    const key = openEmoji(token)!;
    rounds.forEach((r, i) => expect(r.choices[key.answers[i]]).toBeTruthy());
    const res = scoreEmoji(key, key.answers.map((c, i) => ({ choice: c, ms: 20_000, hint: i === 0 })), P);
    expect([res.score, res.good]).toEqual([750, 8]);
    expect([emojiPoints(true, 0, false), emojiPoints(true, 20_000, true), emojiPoints(false, 0, false)]).toEqual([150, 50, 0]);
  });
  it("refuse le texte, le japonais et les énigmes trop courtes ou trop longues", () => {
    expect(typeof checkPuzzle({ emojis: "🍥🦊", answer: "Naruto" })).toBe("object");
    expect(checkPuzzle({ emojis: "🍥", answer: "Naruto" })).toMatch(/2 à 8/);
    expect(checkPuzzle({ emojis: "🍥abc🦊", answer: "Naruto" })).toMatch(/2 à 8/);
    expect(checkPuzzle({ emojis: "🍥🦊🍜🥷🍥🦊🍜🥷🍥", answer: "Naruto" })).toMatch(/2 à 8/);
    expect(checkPuzzle({ emojis: "🍥🦊", answer: "ナルト" })).toMatch(/Titre/);
    expect(typeof checkPuzzle({ emojis: "👨‍👩‍👧 7️⃣", answer: "Test" })).toBe("object");
  });
});

import { isSequel } from "../lib/games/dle";
describe("animes mystère : pas de suites", () => {
  it("reconnaît les suites", () => {
    for (const t of ["One-Punch Man Season 2", "Attack on Titan Season 3 Part 2", "Mob Psycho 100 II", "Naruto: Shippuden", "Demon Slayer: Kimetsu no Yaiba Entertainment District Arc", "Kaguya-sama: Love is War 2nd Season", "Attack on Titan Final Season", "Overlord II"]) expect([t, isSequel(t)]).toEqual([t, true]);
    for (const t of ["Attack on Titan", "One Punch Man", "Mob Psycho 100", "Naruto", "Spy x Family", "Steins;Gate", "Code Geass: Lelouch of the Rebellion"]) expect([t, isSequel(t)]).toEqual([t, false]);
  });
});

import { LEVEL_MULT, parseLevel, withMult } from "../lib/games/levels";
import { normAnswer, sameTitle } from "../lib/games/fuzzy";
import { buildCreateur, buildStudio, buildThemes, buildVoix, openQcm, qcmPoints, scoreQcm, themesAt } from "../lib/games/qcm";
import { safeTags, type CatAnime, type CatChar } from "../lib/games/catalog";
import { pmFits, buildPlusMoins as buildPm, openPlusMoins as openPm, buildAffiche as buildAff, openAffiche as openAff, scoreAffiche as scoreAff } from "../lib/games/arcade";
import { buildQuiz as buildQ, verifyKey as verifyQ, scoreQuiz as scoreQ, traps } from "../lib/games/quiz";
import { charHints as hints } from "../lib/games/dle-logic";

describe("niveaux de difficulté", () => {
  it("multiplie les points selon le niveau", () => {
    expect([parseLevel("expert"), parseLevel("x"), parseLevel(undefined)]).toEqual(["expert", "normal", "normal"]);
    expect([withMult(100, "facile"), withMult(100, "normal"), withMult(100, "expert")]).toEqual([100, 150, 200]);
    expect(LEVEL_MULT.expert).toBe(2);
  });
  it("réponses tapées : accents, casse et petites fautes acceptés", () => {
    expect(normAnswer("L'Attaque des Titans !")).toBe("l attaque des titans");
    expect(sameTitle("attaque des titants", ["L'Attaque des Titans"])).toBe(true);
    expect(sameTitle("frieren", ["Frieren"])).toBe(true);
    expect(sameTitle("naruto", ["Bleach"])).toBe(false);
    expect(sameTitle("a", ["A"])).toBe(false);
  });
  it("quiz : Facile = openings ; Expert = 6 choix pièges et extrait de 5 s", async () => {
    const cat = songCatalog as { kind: string; lang?: string }[];
    const easy = verifyQ((await buildQ(async (i) => `p${i}`, Date.now(), "generique", "facile")).token)!;
    easy.songs.forEach((i) => expect(cat[i].kind).toBe("OP"));
    const ex = await buildQ(async (i) => `p${i}`, Date.now(), "generique", "expert");
    ex.rounds.forEach((r) => { expect(r.choices).toHaveLength(6); expect(r.clip).toBe(5); expect(r.start).toBeGreaterThanOrEqual(3); expect(r.start).toBeLessThanOrEqual(22); });
    const key = verifyQ(ex.token)!;
    const res = scoreQ(key, key.answers.map((c) => ({ choice: c, ms: 20_000 })));
    expect([res.score, res.max]).toEqual([key.songs.length * 200, key.songs.length * 300]);
    expect(traps({ anime: "X", year: 2000 } as never, ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"], 5)).toHaveLength(5);
  });
  it("affiche Expert : noir et blanc, une case toutes les 3 s, points doublés", () => {
    const { token, rounds } = buildAff(POOL, Date.now(), Math.random, "expert");
    expect(rounds[0]).toMatchObject({ gray: true, tileMs: 3000 });
    const key = openAff(token)!;
    const r = scoreAff(key, key.answers.map((c) => ({ choice: c, ms: 2999 })), POOL);
    expect([r.score, r.max]).toEqual([1600, 1600]);
  });
  it("plus ou moins : écarts du niveau respectés", () => {
    const P = POOL.map((a, i) => ({ ...a, popularity: 100_000 + i * 7_000 }));
    expect(pmFits(P[0], { ...P[1], score: P[0].score + 9 }, "note", "facile")).toBe(true);
    expect(pmFits(P[0], { ...P[1], score: P[0].score + 3 }, "note", "facile")).toBe(false);
    expect(pmFits(P[0], { ...P[1], score: P[0].score + 3 }, "note", "expert")).toBe(true);
    expect(pmFits(P[0], { ...P[1], score: P[0].score + 9 }, "note", "expert")).toBe(false);
    const g = buildPm(P, Date.now(), Math.random, "facile");
    const key = openPm(g.token)!;
    const by = new Map(P.map((a) => [a.id, a]));
    for (let i = 0; i + 1 < key.seq.length; i++) expect(Math.abs(by.get(key.seq[i])!.score - by.get(key.seq[i + 1])!.score)).toBeGreaterThanOrEqual(8);
  });
  it("devine le perso : Facile donne l'anime tout de suite, Expert le doubleur avant, l'anime en dernier", () => {
    const c = { id: 1, name: "Satoru Gojou", alt: [], image: "x", gender: "Homme", age: null, role: "Personnage principal", anime: "Jujutsu Kaisen", animeId: 5, year: 2020, genres: ["Action"], voice: "Yuuichi Nakamura" };
    expect(hints(c, 0, () => "img", "facile").some((h) => h.value === "Jujutsu Kaisen")).toBe(true);
    const ex = hints(c, 3, () => "img", "expert");
    expect(ex.some((h) => h.value === "Yuuichi Nakamura")).toBe(true);
    expect(ex.some((h) => h.value === "Jujutsu Kaisen")).toBe(false);
    expect(hints(c, 4, () => "img", "expert").some((h) => h.value === "Jujutsu Kaisen")).toBe(false);
    expect(hints(c, 5, () => "img", "expert").some((h) => h.value === "Jujutsu Kaisen")).toBe(true);
  });
});

describe("jeux experts", () => {
  const A = (i: number, o: Partial<CatAnime> = {}): CatAnime => ({ rank: i, id: i, title: `Anime ${i}`, alt: null, cover: `c${i}`, year: 2000 + (i % 20), format: "Série", episodes: 12, score: 70, popularity: 1000, genres: [], studio: `Studio ${i % 9}`, source: "Manga", tags: ["Magie", "École", "Voyage", "Dragons", "Guerre", `T${i % 4}`], creator: `Auteur ${i % 12}`, director: `Réal ${i % 11}`, ...o });
  const animes = Array.from({ length: 60 }, (_, i) => A(i + 1));
  it("garde seulement les thèmes traduits, sans spoiler", () => {
    expect(safeTags([{ name: "Pirates", rank: 98, isMediaSpoiler: false }, { name: "Time Skip", rank: 90, isMediaSpoiler: true }, { name: "Unknown Tag", rank: 99, isMediaSpoiler: false }, { name: "Travel", rank: 40, isMediaSpoiler: false }])).toEqual(["Pirates"]);
  });
  it("thèmes : 5 thèmes, choix ou réponse tapée selon le niveau", () => {
    const n = buildThemes(animes, "normal");
    expect(n.rounds).toHaveLength(6);
    n.rounds.forEach((r) => { expect(r.tags).toHaveLength(5); expect(r.choices).toHaveLength(6); });
    const ex = buildThemes(animes, "expert");
    expect(ex.rounds[0].choices).toHaveLength(0);
    expect(ex.titles!.length).toBe(60);
    const key = openQcm(ex.token)!;
    const res = scoreQcm(key, key.accepted.map((t) => ({ choice: null, text: t[0].toLowerCase(), ms: 0 })));
    expect([res.good, res.score]).toEqual([6, 6 * 200]);
    expect([themesAt(0), themesAt(4000), themesAt(99_000)]).toEqual([1, 2, 5]);
    expect(qcmPoints("themes", true, 16_000, "normal")).toBe(Math.round(40 * 1.5));
  });
  it("créateur, studio, voix : bonne réponse unique parmi les propositions", () => {
    for (const g of [buildCreateur(animes, "expert"), buildStudio(animes, "facile")]) {
      const key = openQcm(g.token)!;
      g.rounds.forEach((r, i) => { expect(new Set(r.choices.map((c) => c.label)).size).toBe(r.choices.length); expect(r.choices[key.answers[i]].label).toBe(key.reveal[i].label); });
    }
    expect(buildCreateur(animes, "expert").rounds.some((r) => r.prompt.startsWith("Qui a réalisé"))).toBe(true);
    const chars: CatChar[] = Array.from({ length: 40 }, (_, i) => ({ rank: i + 1, id: i, name: `Perso ${i}`, alt: [], image: "i", gender: null, age: null, role: "x", anime: `Anime ${i % 7}`, animeId: i % 7, animeRank: null, year: 2010, genres: [], voice: `Voix ${i % 15}` }));
    const v = buildVoix(chars, "normal"), key = openQcm(v.token)!;
    v.rounds.forEach((r, i) => {
      const voice = r.prompt.match(/doublé par (.+) \?/)![1];
      const right = r.choices[key.answers[i]];
      expect(chars.find((c) => c.name === right.label)!.voice).toBe(voice);
      r.choices.filter((_, k) => k !== key.answers[i]).forEach((c) => expect(chars.find((x) => x.name === c.label)!.voice).not.toBe(voice));
    });
  });
});

describe("questions : ponctuation", () => {
  it("ne double pas le point d'interrogation", () => {
    const g = buildStudio([1, 2, 3, 4, 5].map((i) => ({ rank: i, id: i, title: i === 1 ? "Love is War?" : `T${i}`, alt: null, cover: "c", year: 2020, format: "Série", episodes: 12, score: 70, popularity: 1, genres: [], studio: `S${i}`, source: null, tags: [], creator: null, director: null })), "facile");
    g.rounds.forEach((r) => expect(r.prompt).not.toMatch(/\?\s*\?/));
  });
});

import { animeHints, nameShape, titleShape } from "../lib/games/dle-logic";
import { distinctDecoys, songsOfTags, songTag } from "../lib/games/quiz";
import type { CatalogSong } from "../lib/anime-song";
describe("blind test : pas de répétition ni de déduction", () => {
  const songs = songCatalog as CatalogSong[];
  it("le catalogue a grossi, sans doublon d'extrait", () => {
    expect(songs.length).toBeGreaterThanOrEqual(160);
    expect(songs.filter((s) => s.lang === "fr").length).toBeGreaterThanOrEqual(35);
    expect(new Set(songs.map((s) => s.itunesId)).size).toBe(songs.length);
  });
  it("une bonne réponse n'est jamais un leurre, et les leurres ne se répètent pas", () => {
    const jp = songs.filter((s) => s.lang !== "fr");
    const animes = [...new Set(jp.map((s) => s.anime))];
    const picked = [...new Map(jp.map((s) => [s.anime, s])).values()].slice(0, 10);
    for (const near of [false, true]) {
      const d = distinctDecoys(picked, animes, near ? 5 : 3, near);
      const answers = new Set(picked.map((s) => s.anime));
      const flat = d.flat();
      expect(flat.some((a) => answers.has(a))).toBe(false);
      expect(new Set(flat).size).toBe(flat.length);
      d.forEach((x) => expect(x).toHaveLength(near ? 5 : 3));
    }
  });
  it("nostalgie : même avec peu d'animes, aucune réponse servie en leurre", () => {
    const fr = songs.filter((s) => s.lang === "fr");
    const animes = [...new Set(fr.map((s) => s.anime))];
    const picked = [...new Map(fr.map((s) => [s.anime, s])).values()].slice(0, 10);
    const d = distinctDecoys(picked, animes, 3);
    const answers = new Set(picked.map((s) => s.anime));
    expect(d.flat().some((a) => answers.has(a))).toBe(false);
    d.forEach((x) => expect(new Set(x).size).toBe(3));
  });
  it("les titres déjà entendus passent en dernier", async () => {
    process.env.GAME_SECRET ||= "test-secret";
    const fr = songs.map((s, i) => ({ s, i })).filter((x) => x.s.lang === "fr").map((x) => x.i);
    const recent = fr.slice(0, 20);
    expect(songsOfTags(recent.map(songTag)).sort()).toEqual([...recent].sort());
    const { token } = await buildQuiz(async () => "https://x/p.m4a", Date.now(), "nostalgie", "normal", recent);
    const key = verifyKey(token)!;
    expect(key.songs.filter((i) => recent.includes(i)).length).toBe(0);
  });
});
describe("indices sans rang", () => {
  it("forme du nom et du titre", () => {
    expect(nameShape("Monkey D. Luffy")).toBe("M····· D. L···· (6, 1, 5 lettres)");
    expect(titleShape("Fullmetal Alchemist: Brotherhood")).toBe("Commence par « F », 3 mots");
  });
  it("Devine l'anime : thèmes puis forme du titre, selon le niveau", () => {
    const a = { id: 1, title: "Steins;Gate", alt: null, cover: "", year: 2011, format: "Série", episodes: 24, score: 90, genres: [], studio: null, source: null, tags: ["Voyage dans le temps", "Complot", "Scientifique", "Otaku"] };
    expect(animeHints(a, 0, "facile")).toEqual([]);
    expect(animeHints(a, 1, "facile")[0].label).toBe("Ses thèmes");
    expect(animeHints(a, 1, "normal")).toEqual([]);
    expect(animeHints(a, 4, "normal").map((h) => h.label)).toEqual(["Ses thèmes", "Son titre"]);
    expect(animeHints(a, 3, "expert")[0].value.split(", ")).toHaveLength(2);
  });
});

import { boardOf, type Play as StorePlay } from "../lib/games/store";
describe("classement par niveau", () => {
  const P = (id: number, member: number, score: number, level?: string): StorePlay => ({ id, game: "quiz-generique", device: `d${member}`, member_id: member, player_name: null, score, max_score: 1500, detail: level ? { level } : {}, created_at: `2026-11-1${id}T10:00:00Z` });
  const rows = [P(1, 1, 900, "expert"), P(2, 2, 1200, "facile"), P(3, 3, 700), P(4, 1, 400, "normal")];
  it("ne compare que les parties du même niveau (sans niveau = Normal)", () => {
    expect(boardOf("quiz-generique", rows, "expert").players.map((r) => r.member_id)).toEqual([1]);
    expect(boardOf("quiz-generique", rows, "normal").players.map((r) => [r.member_id, r.best])).toEqual([[3, 700], [1, 400]]);
    expect(boardOf("quiz-generique", rows, "facile").levels).toEqual({ facile: 1, normal: 2, expert: 1 });
  });
  it("le duel garde un seul classement", () => {
    expect(boardOf("duel", rows, "expert").players).toHaveLength(3);
  });
});
