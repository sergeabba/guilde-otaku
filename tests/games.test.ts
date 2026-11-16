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
