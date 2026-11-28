// Données des prototypes DA v3 : entrées du site avec, pour chacune, un hôte choisi d'après
// les fiches réelles (jamais inventé) et la raison affichée. Module serveur.
import { exploData, type ExploMember } from "./explo-data";
import { FR_MONTHS, nextBirthdays, studioMembers } from "./studio-data";

export interface V3Entry { id: string; label: string; href: string; rubric: string; host: number; why: string }

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export async function v3Data() {
  const [{ members, starId, week }, all] = await Promise.all([exploData(), studioMembers()]);
  const cast = members.filter((m) => m.cut);
  const used = new Set<number>();
  const take = (list: ExploMember[], score: (m: ExploMember) => number) => {
    const m = [...list].filter((x) => !used.has(x.id)).sort((a, b) => score(b) - score(a))[0] ?? cast[0];
    used.add(m.id); return m;
  };
  const star = cast.find((m) => m.id === starId) ?? cast[0]; used.add(star.id);
  const s = (k: "force" | "vitesse" | "technique") => (m: ExploMember) => m.stats?.[k] ?? 0;
  const fort = take(cast, s("force")), vif = take(cast, s("vitesse")), tech = take(cast, s("technique"));
  const lecteur = take(cast, (m) => m.works.length), titre = take(cast, (m) => m.awards.length);
  const bday = nextBirthdays(all, new Date(), 8).find((b) => cast.some((c) => c.id === b.m.id && !used.has(c.id)));
  const fete = bday ? cast.find((c) => c.id === bday.m.id)! : take(cast, () => 0);
  used.add(fete.id);
  const entries: V3Entry[] = [
    { id: "membres", label: "Les nakama", href: "/#annuaire", rubric: "membres", host: star.id, why: "En couverture cette semaine" },
    { id: "qg", label: "Le QG", href: "/qg", rubric: "qg", host: (cast.find((m) => m.rank === "Fondateur") ?? star).id, why: "Il garde la tour de la Guilde" },
    { id: "fighters", label: "Fighters", href: "/fighters", rubric: "fighters", host: fort.id, why: `La plus grande force · ${fort.stats?.force ?? "?"}` },
    { id: "wanted", label: "Wanted", href: "/wanted", rubric: "wanted", host: titre.id, why: `Le plus titré · ${titre.awards.length} distinctions` },
    { id: "bibliotheque", label: "Bibliothèque", href: "/bibliotheque", rubric: "bibliotheque", host: lecteur.id, why: `Le plus lecteur · ${lecteur.works.length} séries favorites` },
    { id: "teams", label: "Teams", href: "/teams", rubric: "teams", host: vif.id, why: `Le plus rapide · ${vif.stats?.vitesse ?? "?"}` },
    { id: "jeux", label: "Jeux", href: "/jeux", rubric: "jeux", host: tech.id, why: `La meilleure technique · ${tech.stats?.technique ?? "?"}` },
    { id: "birthdays", label: "Anniversaires", href: "/birthdays", rubric: "birthdays", host: fete.id, why: bday ? (bday.days === 0 ? "C'est son anniversaire" : `Anniversaire dans ${bday.days} jours`) : "Prochain anniversaire" },
    { id: "cinema", label: "Cinéma", href: "/cinema", rubric: "cinema", host: star.id, why: "La salle de la Guilde" },
  ];
  const now = new Date();
  return {
    members, entries, week,
    date: { day: DAYS[now.getDay()], num: now.getDate(), month: FR_MONTHS[now.getMonth()] },
    count: members.length, ranks: new Set(members.map((m) => m.rank)).size,
  };
}
