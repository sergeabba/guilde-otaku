// Sommaire du site : source unique pour l'en-tête, le menu mobile,
// le pied de page et la recherche globale.
export type PageId =
  | "membres"
  | "birthdays"
  | "wanted"
  | "fighters"
  | "film-semaine"
  | "bibliotheque"
  | "bons-plans"
  | "atelier"
  | "calendrier"
  | "cinema";

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
  { id: "membres",      label: "Membres",       href: "/",             jp: "Nakama",   blurb: "L'annuaire de la Guilde, grade par grade." },
  { id: "birthdays",    label: "Anniversaires", href: "/birthdays",    jp: "Tanjōbi", blurb: "Qui souffle ses bougies, et dans combien de jours." },
  { id: "wanted",       label: "Wanted",        href: "/wanted",       jp: "Tehaisho", blurb: "Les avis de recherche et leurs primes." },
  { id: "fighters",     label: "Fighters",      href: "/fighters",     jp: "Tōshi",   blurb: "Choisis ton combattant, lance le duel." },
  { id: "film-semaine", label: "Film Semaine",  href: "/film-semaine", jp: "Eiga",   blurb: "Le film élu et les séances passées." },
  { id: "bibliotheque", label: "Bibliothèque",  href: "/bibliotheque", jp: "Toshokan", blurb: "La Chronique du Bash et les verdicts de la Guilde." },
  { id: "bons-plans",   label: "Bons Plans",    href: "/bons-plans",   jp: "Otoku",   blurb: "Les adresses que la Guilde se refile." },
  { id: "atelier",      label: "Atelier",       href: "/atelier",      jp: "Kōbō",   blurb: "La galerie des créations." },
  { id: "calendrier",   label: "Calendrier",    href: "/calendrier",   jp: "Hōsō",   blurb: "Les épisodes de la semaine, et qui les suit." },
  { id: "cinema",       label: "Cinéma",        href: "/cinema",       jp: "Gekijō", blurb: "Bandes-annonces et où regarder en France." },
];

export const chapterNo = (i: number) => String(i + 1).padStart(2, "0");
