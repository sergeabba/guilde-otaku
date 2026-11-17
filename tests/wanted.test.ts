import { bounty, formatBounty, RANK_BOUNTY, sayBounty } from "../lib/wanted";

describe("primes du Wanted", () => {
  it("additionne grade, puissance, palmarès, titre et culture", () => {
    const b = bounty({ rank: "Fondateur", stats: { force: 95, vitesse: 90, technique: 99 }, badge: "JAIZE D'OR", extras: { awards: [{}, {}], favoriteAnime: new Array(10).fill({}), favoriteManga: new Array(5).fill({}) } });
    expect(b.lines.map((l) => l.amount)).toEqual([1_500_000_000, 284_000_000, 100_000_000, 100_000_000, 45_000_000]);
    expect(b.total).toBe(2_029_000_000);
  });
  it("plafonne la culture à 30 œuvres et tolère une fiche vide", () => {
    const b = bounty({ rank: "Fantôme", extras: { favoriteAnime: new Array(50).fill({}) } });
    expect(b.lines.find((l) => l.key === "culture")).toMatchObject({ amount: 90_000_000, detail: "50 œuvres (30 comptées)" });
    expect(bounty({ rank: "Fantôme" }).total).toBe(RANK_BOUNTY["Fantôme"]);
  });
  it("le grade pèse plus que tout le reste réuni", () => {
    const max = (rank: Parameters<typeof bounty>[0]["rank"]) => bounty({ rank, stats: { force: 99, vitesse: 99, technique: 99 } }).total;
    expect(max("Monarque")).toBeLessThan(bounty({ rank: "Fondateur" }).total + 400_000_000);
  });
  it("affiche au format des avis de recherche", () => {
    expect(formatBounty(30_000_000)).toBe("30,000,000-");
    expect(sayBounty(1_500_000_000)).toBe("1,5 milliard");
    expect(sayBounty(2_029_000_000)).toBe("2,03 milliards");
    expect(sayBounty(450_000_000)).toBe("450 millions");
  });
});
