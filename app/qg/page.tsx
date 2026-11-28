import { pageMetadata } from "../../lib/og/page-meta";
import { getPublicMembers } from "../../lib/members-server";
import { fetchFeaturedFilm } from "../../lib/hebdo";
import { cutoutFor } from "../../lib/cutout";
import { bounty } from "../../lib/wanted";
import { listTeams } from "../../lib/teams";
import { getAtelierTiles } from "../../lib/atelier-server";
import { fetchBonsPlans } from "../utils/dataAdapter";
import { DOSSIER_BASH_DATA, dossierBashSeason, sortDossierBash } from "../../lib/dossier-bash";
import { parseBirthday } from "../types";
import { daysUntil } from "../utils/birthdays";
import { RANK_FILTER_ORDER } from "../../data/members";
import { rankAccents, rankLogos, rankRomaji, type Rank } from "../config/ranks";
import { GAME_COUNT } from "./game-count";
import QgClient, { type QgData, type QgPerson } from "./QgClient";

export async function generateMetadata() {
  return pageMetadata("accueil", "/qg", "Le Quartier général", "Le repaire de la Guilde, étage par étage : le trône des grades, le musée, la salle de projection, la bibliothèque, l'arcade, la salle des fêtes, le vestiaire et l'atelier.");
}

// Toutes les données sont réelles : membres publics, primes calculées (lib/wanted),
// chroniques, film élu, équipes et galerie (quand le serveur y a accès). Une donnée
// indisponible est annoncée comme telle, jamais remplacée par une valeur inventée.
export default async function QgPage() {
  const [members, film, teams, tiles, plans] = await Promise.all([
    getPublicMembers(),
    fetchFeaturedFilm().catch(() => null),
    listTeams(true).catch(() => ({ available: false, teams: [] })),
    getAtelierTiles(6).catch(() => []),
    fetchBonsPlans().catch(() => []),
  ]);
  const person = (m: (typeof members)[number]): QgPerson => {
    const c = cutoutFor(m.animeChar);
    return { id: m.id, name: m.name, rank: m.rank, color: rankAccents[m.rank as Rank] ?? "#c9a84c", cut: c ? { src: c.src, w: c.w, h: c.h } : null, anime: m.animeChar || m.photo || null };
  };
  const founder = members.find((m) => m.rank === "Fondateur") ?? null;
  const byBounty = [...members].sort((a, b) => bounty(b).total - bounty(a).total);
  const now = new Date();
  const dated = members.flatMap((m) => { const b = parseBirthday(m.birthday); return b ? [{ m, ...b, days: daysUntil(b.day, b.month, now) }] : []; }).sort((a, b) => a.days - b.days);
  const next = dated[0] ?? null;
  const chron = sortDossierBash(DOSSIER_BASH_DATA);
  const data: QgData = {
    total: members.length,
    ranks: RANK_FILTER_ORDER.map((r) => ({ rank: r, count: members.filter((m) => m.rank === r).length, color: rankAccents[r], logo: rankLogos[r], romaji: rankRomaji[r] })).filter((r) => r.count > 0),
    founder: founder ? person(founder) : null,
    court: members.filter((m) => m.rank === "Monarque" && cutoutFor(m.animeChar)).slice(0, 4).map(person),
    wanted: byBounty.slice(0, 3).map((m) => ({ ...person(m), prime: bounty(m).total })),
    birthday: next ? { ...person(next.m), day: next.day, month: next.month, days: next.days } : null,
    film,
    chronique: chron[0] ? { title: chron[0].title, cover: chron[0].hdCover || chron[0].cover, season: dossierBashSeason(chron[0].date)?.label ?? null, count: chron.length } : null,
    covers: chron.slice(1, 9).map((c) => c.hdCover || c.cover).filter(Boolean),
    teams: teams.available ? teams.teams.length : null,
    atelier: tiles.length ? tiles.slice(0, 3).map((t) => t.src) : [],
    plans: plans.length,
    games: GAME_COUNT,
    gamers: [...members].filter((m) => cutoutFor(m.animeChar)).sort((a, b) => (b.stats?.technique ?? 0) - (a.stats?.technique ?? 0)).slice(0, 3).map(person),
  };
  return <QgClient data={data} />;
}
