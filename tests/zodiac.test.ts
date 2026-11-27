import { zodiacOf } from "../lib/zodiac";
describe("zodiacOf", () => {
  it.each([[1, 1, "Capricorne"], [19, 1, "Capricorne"], [20, 1, "Verseau"], [15, 3, "Poissons"], [21, 3, "Bélier"], [29, 11, "Sagittaire"], [21, 12, "Sagittaire"], [22, 12, "Capricorne"], [31, 12, "Capricorne"], [23, 7, "Lion"]])("%i/%i → %s", (d, m, s) => {
    expect(zodiacOf(d as number, m as number)).toBe(s);
  });
});
