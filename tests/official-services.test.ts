import { officialService, hostOf } from "../lib/official-services";
describe("officialService", () => {
  it("reconnaît les plateformes officielles", () => {
    expect(officialService("https://www.crunchyroll.com")).toBe("Crunchyroll");
    expect(officialService("https://animationdigitalnetwork.fr/video/x")).toBe("ADN");
  });
  it("ne déclare pas officiel un domaine inconnu ou ressemblant", () => {
    expect(officialService("https://anime-sama.to/")).toBeNull();
    expect(officialService("https://crunchyroll.com.evil.example")).toBeNull();
  });
  it("accepte une adresse sans protocole", () => { expect(hostOf("movix.cash")).toBe("movix.cash"); });
});
