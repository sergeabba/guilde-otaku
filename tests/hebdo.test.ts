import { birthdayInWeek, hebdoIssue } from "../lib/hebdo";
import { memberLinks, mentions, type StudioMember } from "../lib/studio-data";

const base = (o: Partial<StudioMember>): StudioMember => ({
  id: 1, name: "Test", first: "Test", rank: "Monarque", romaji: "", accent: "#000", anime: "/a.jpg", real: null, animePos: "", realPos: "",
  animeVideo: null, realVideo: null, bio: "Bio.", lede: "", birthday: null, birthDay: null, birthMonth: null, country: null, flag: null,
  stats: null, special: null, bankai: null, domaine: null, awards: [], works: [], music: [], alias: null,
  edition: "prestige", motif: "rayons", generation: "couronne", mirror: false, series: null, ...o,
});

describe("l'hebdo", () => {
  it("trouve un anniversaire dans la semaine, y compris à cheval sur deux années", () => {
    const m = base({ birthDay: 2, birthMonth: 1 });
    expect(birthdayInWeek(m, new Date(2026, 11, 28))?.getFullYear()).toBe(2027);
    expect(birthdayInWeek(m, new Date(2026, 11, 14))).toBeNull();
  });
  it("met en couverture le membre qui fête son anniversaire", () => {
    const fete = base({ id: 7, birthDay: 26, birthMonth: 11, edition: "shonen" });
    const is = hebdoIssue([base({ id: 1 }), base({ id: 2 }), fete], new Date(2026, 10, 25));
    expect(is.kind).toBe("anniversaire");
    expect(is.star?.id).toBe(7);
  });
  it("sinon, prend l'édition du membre tiré et marque les numéros collector", () => {
    const is = hebdoIssue([base({ id: 1, edition: "seinen" })], new Date(2026, 2, 4));
    expect(is.kind).toBe("seinen");
    expect(hebdoIssue([base({})], new Date(2026, 2, 4)).collector).toBe(is.week % 10 === 0);
  });
});

describe("liens entre membres", () => {
  it("reconnaît un membre cité en mot entier, pas dans un autre mot", () => {
    expect(mentions("Duo de l'année avec Bash", { name: "Bash", first: "Bash", alias: null })).toBe(true);
    expect(mentions("Le Bashing du siècle", { name: "Bash", first: "Bash", alias: null })).toBe(false);
  });
  it("ne garde que des liens prouvés et plafonne les compatriotes", () => {
    const a = base({ id: 1, name: "Alpha", first: "Alpha", flag: "SN", country: "Sénégal", awards: [{ title: "Duo avec Bravo" }] });
    const b = base({ id: 2, name: "Bravo", first: "Bravo" });
    const others = [3, 4, 5, 6, 7].map((id) => base({ id, name: `M${id}x`, first: `M${id}x`, flag: "SN", country: "Sénégal" }));
    const l = memberLinks(a, [a, b, ...others]);
    expect(l[0]).toMatchObject({ id: 2, kind: "cite" });
    expect(l.filter((x) => x.kind === "pays")).toHaveLength(3);
    expect(l.some((x) => x.id === 1)).toBe(false);
  });
});
