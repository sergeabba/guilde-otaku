// Sommaire du site : source unique pour l'en-tête, le menu mobile,
// le pied de page et la recherche globale.
export type PageId =
  | "qg"
  | "membres"
  | "birthdays"
  | "wanted"
  | "teams"
  | "fighters"
  | "film-semaine"
  | "bibliotheque"
  | "bons-plans"
  | "atelier"
  | "calendrier"
  | "cinema"
  | "jeux";

export interface NavEntry {
  id: PageId;
  label: string;
  href: string;
  /** Intitulé décoratif en rōmaji (jamais d'écriture japonaise) */
  jp: string;
  /** Une ligne qui dit ce qu'on y trouve */
  blurb: string;
}

export const NAV: NavEntry[] = [
  { id: "qg",           label: "Quartier général", href: "/qg",        jp: "Honbu",    blurb: "La tour de la Guilde, étage par étage." },
  { id: "membres",      label: "Membres",       href: "/",             jp: "Nakama",   blurb: "L'annuaire de la Guilde, grade par grade." },
  { id: "birthdays",    label: "Anniversaires", href: "/birthdays",    jp: "Tanjōbi", blurb: "Qui souffle ses bougies, et dans combien de jours." },
  { id: "teams",        label: "Teams",         href: "/teams",        jp: "Chīmu",   blurb: "Les cinq de basket et les onze de foot de la Guilde." },
  { id: "wanted",       label: "Wanted",        href: "/wanted",       jp: "Tehaisho", blurb: "Les avis de recherche et leurs primes." },
  { id: "fighters",     label: "Fighters",      href: "/fighters",     jp: "Tōshi",   blurb: "Choisis ton combattant, lance le duel." },
  { id: "film-semaine", label: "Film Semaine",  href: "/film-semaine", jp: "Eiga",   blurb: "Le film élu et les séances passées." },
  { id: "bibliotheque", label: "Bibliothèque",  href: "/bibliotheque", jp: "Toshokan", blurb: "La Chronique du Bash et les verdicts de la Guilde." },
  { id: "bons-plans",   label: "Bons Plans",    href: "/bons-plans",   jp: "Otoku",   blurb: "Les adresses que la Guilde se refile." },
  { id: "atelier",      label: "Futilités",     href: "/atelier",      jp: "Kōbō",   blurb: "Les futilités de la Guilde : la galerie des créations." },
  { id: "calendrier",   label: "Calendrier",    href: "/calendrier",   jp: "Hōsō",   blurb: "Les épisodes de la semaine, et qui les suit." },
  { id: "jeux",         label: "Jeux",          href: "/jeux",         jp: "Asobi",   blurb: "Quiz des génériques, duels de goûts et badges." },
  { id: "cinema",       label: "Cinéma",        href: "/cinema",       jp: "Gekijō", blurb: "Bandes-annonces et où regarder en France." },
];

export const chapterNo = (i: number) => String(i + 1).padStart(2, "0");

/** Regroupement des rubriques (en-tête et sommaire) : trois familles au lieu de onze entrées. */
export interface NavGroup { id: string; label: string; jp: string; items: PageId[] }
export const NAV_GROUPS: NavGroup[] = [
  { id: "guilde", label: "La Guilde", jp: "Nakama", items: ["qg", "membres", "teams", "birthdays", "fighters", "jeux", "wanted"] },
  { id: "culture", label: "Animes & films", jp: "Bunka", items: ["bibliotheque", "calendrier", "cinema", "film-semaine"] },
  { id: "bonus", label: "Bonus", jp: "Omake", items: ["atelier", "bons-plans"] },
];
export const groupOf = (id: PageId) => NAV_GROUPS.find((g) => g.items.includes(id));
export const navEntry = (id: PageId) => NAV.find((n) => n.id === id)!;

/** Numéro de chapitre d'une rubrique : sa place dans le sommaire (familles dans l'ordre).
 *  Le même numéro partout (en-tête, sommaire, pied de page, repère de page). */
export const NAV_ORDER: PageId[] = NAV_GROUPS.flatMap((g) => g.items);
export const chapterOf = (id: string) => {
  const i = NAV_ORDER.indexOf(id as PageId);
  return i < 0 ? null : chapterNo(i);
};
