// Signe astrologique dérivé d'une date d'anniversaire (jour, mois) : donnée réelle, calcul visible.
const STARTS: [number, number, string][] = [
  [1, 20, "Verseau"], [2, 19, "Poissons"], [3, 21, "Bélier"], [4, 20, "Taureau"], [5, 21, "Gémeaux"], [6, 21, "Cancer"],
  [7, 23, "Lion"], [8, 23, "Vierge"], [9, 23, "Balance"], [10, 23, "Scorpion"], [11, 22, "Sagittaire"], [12, 22, "Capricorne"],
];
export function zodiacOf(day: number, month: number): string {
  let sign = "Capricorne";
  for (const [m, d, name] of STARTS) if (month > m || (month === m && day >= d)) sign = name;
  return sign;
}
