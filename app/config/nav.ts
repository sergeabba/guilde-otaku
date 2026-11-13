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
  | "atelier";

export interface NavEntry {
  id: PageId;
  label: string;
  href: string;
  /** Intitulé japonais décoratif */
  jp: string;
  /** Une ligne qui dit ce qu'on y trouve */
  blurb: string;
}

export const NAV: NavEntry[] = [
  { id: "membres",      label: "Membres",       href: "/",             jp: "仲間",   blurb: "L'annuaire de la Guilde, grade par grade." },
  { id: "birthdays",    label: "Anniversaires", href: "/birthdays",    jp: "誕生日", blurb: "Qui souffle ses bougies, et dans combien de jours." },
  { id: "wanted",       label: "Wanted",        href: "/wanted",       jp: "手配書", blurb: "Les avis de recherche et leurs primes." },
  { id: "fighters",     label: "Fighters",      href: "/fighters",     jp: "闘士",   blurb: "Choisis ton combattant, lance le duel." },
  { id: "film-semaine", label: "Film Semaine",  href: "/film-semaine", jp: "映画",   blurb: "Le film élu et les séances passées." },
  { id: "bibliotheque", label: "Bibliothèque",  href: "/bibliotheque", jp: "図書館", blurb: "La Chronique du Bash et les verdicts de la Guilde." },
  { id: "bons-plans",   label: "Bons Plans",    href: "/bons-plans",   jp: "お得",   blurb: "Les adresses que la Guilde se refile." },
  { id: "atelier",      label: "Atelier",       href: "/atelier",      jp: "工房",   blurb: "La galerie des créations." },
];

export const chapterNo = (i: number) => String(i + 1).padStart(2, "0");
