// L'hebdo de la Guilde (prototype d'accueil) : quel numéro, quelle couverture, quelle
// mise en page. Tout part des données réelles et de la date ; rien n'est inventé.
// - Édition anniversaire : un membre fête son anniversaire cette semaine (lundi-dimanche).
// - Sinon : membre tiré pour la semaine, couverture dans l'édition de son grade.
// - Numéro collector : le premier de l'année et chaque dizaine (n°10, 20…).
// - La planche des visages change de disposition d'une semaine à l'autre.
import { coverStar, isoWeek, type Edition, type StudioMember } from "./studio-data";
import { supabase } from "./supabase";

export type IssueKind = Edition | "anniversaire";
export interface HebdoIssue {
  week: number; year: number; monday: Date; sunday: Date;
  star: StudioMember | null; kind: IssueKind; collector: boolean; layout: 0 | 1 | 2;
  /** Jour de l'anniversaire mis en couverture (édition anniversaire). */
  birthday?: Date;
}

/** Anniversaire d'un membre tombant dans la semaine [lundi, dimanche] (gère le passage d'année). */
export function birthdayInWeek(m: StudioMember, monday: Date): Date | null {
  if (!m.birthDay || !m.birthMonth) return null;
  const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
  const end = new Date(start); end.setDate(start.getDate() + 6);
  for (const y of [start.getFullYear(), end.getFullYear()]) {
    const d = new Date(y, m.birthMonth - 1, m.birthDay);
    if (d >= start && d <= end) return d;
  }
  return null;
}

export function hebdoIssue(all: StudioMember[], date = new Date()): HebdoIssue {
  const { week, year, monday } = isoWeek(date);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const collector = week === 1 || week % 10 === 0;
  const layout = (week % 3) as 0 | 1 | 2;
  const fete = all.filter((m) => m.anime || m.real).map((m) => ({ m, d: birthdayInWeek(m, monday) })).filter((x): x is { m: StudioMember; d: Date } => !!x.d)
    .sort((a, b) => a.d.getTime() - b.d.getTime());
  if (fete.length) return { week, year, monday, sunday, star: fete[0].m, kind: "anniversaire", collector, layout, birthday: fete[0].d };
  const star = coverStar(all, week, year);
  return { week, year, monday, sunday, star, kind: star?.edition ?? "shonen", collector, layout };
}

/** Les numéros précédents, reconstitués avec la même règle (aucune une n'est encore enregistrée). */
export function hebdoArchive(all: StudioMember[], now = new Date(), n = 12): HebdoIssue[] {
  return Array.from({ length: n }, (_, k) => { const d = new Date(now); d.setDate(now.getDate() - 7 * (k + 1)); return hebdoIssue(all, d); });
}

export interface FeaturedFilm { title: string; synopsis: string | null; image: string | null }

/** Film élu de la semaine la plus récente, s'il y en a un (rien si la table est vide ou injoignable). */
export async function fetchFeaturedFilm(): Promise<FeaturedFilm | null> {
  try {
    const { data } = await supabase
      .from("film_semaine")
      .select("title, synopsis, backdrop_path, poster_path, chosen, week_date")
      .order("week_date", { ascending: false })
      .limit(12);
    if (!Array.isArray(data) || data.length === 0) return null;
    const latest = data[0].week_date;
    const chosen = data.find((f) => f.week_date === latest && f.chosen);
    if (!chosen) return null;
    const path = chosen.backdrop_path || chosen.poster_path;
    return { title: chosen.title, synopsis: chosen.synopsis, image: path ? `https://image.tmdb.org/t/p/w780${path}` : null };
  } catch {
    return null;
  }
}
