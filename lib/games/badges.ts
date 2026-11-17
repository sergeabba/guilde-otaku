// Badges automatiques : calculés à partir de données réelles (fiche du membre, parties
// jouées, votes du Bash). Distincts du palmarès officiel, qui reste saisi à la main.

import type { MemberExtras } from "../member-extras";

export interface MemberStats { quizPlays: number; quizBestPct: number; duels: number; bashVotes: number; nostalgiePlays: number; afficheBestPct: number; pmBest: number; dailyWins: number }
export const NO_STATS: MemberStats = { quizPlays: 0, quizBestPct: 0, duels: 0, bashVotes: 0, nostalgiePlays: 0, afficheBestPct: 0, pmBest: 0, dailyWins: 0 };

export interface Badge { id: string; label: string; romaji: string; desc: string; tier: "bronze" | "argent" | "or" }

interface Rule { id: string; label: string; romaji: string; tier: Badge["tier"]; test: (e: MemberExtras | undefined, s: MemberStats) => boolean; desc: string }

const anime = (e?: MemberExtras) => e?.favoriteAnime?.length ?? 0;
const manga = (e?: MemberExtras) => e?.favoriteManga?.length ?? 0;
const all = (e?: MemberExtras) => [...(e?.favoriteAnime ?? []), ...(e?.favoriteManga ?? [])];
const share = (e: MemberExtras | undefined, re: RegExp) => {
  const list = all(e).filter((w) => w.genres?.length);
  return list.length >= 4 ? list.filter((w) => w.genres!.some((g) => re.test(g))).length / list.length : 0;
};

const RULES: Rule[] = [
  { id: "collection", label: "Collectionneur", romaji: "Shūshūka", tier: "bronze", desc: "10 œuvres ou plus en favori.", test: (e) => anime(e) + manga(e) >= 10 },
  { id: "encyclo", label: "Encyclopédie vivante", romaji: "Hyakka", tier: "or", desc: "20 œuvres ou plus en favori.", test: (e) => anime(e) + manga(e) >= 20 },
  { id: "lecteur", label: "Rat de bibliothèque", romaji: "Dokusho", tier: "bronze", desc: "5 mangas ou plus en favori.", test: (e) => manga(e) >= 5 },
  { id: "shonen", label: "Shōnen dans le sang", romaji: "Nekketsu", tier: "argent", desc: "La moitié de ses favoris sont des œuvres d'action ou d'aventure.", test: (e) => share(e, /action|aventure|adventure/i) >= 0.5 },
  { id: "coeur", label: "Cœur d'artichaut", romaji: "Koigokoro", tier: "argent", desc: "Un tiers de ses favoris sont des romances.", test: (e) => share(e, /romance/i) >= 1 / 3 },
  { id: "melomane", label: "Mélomane", romaji: "Ongakuzuki", tier: "bronze", desc: "3 morceaux ou plus dans sa playlist.", test: (e) => (e?.music?.length ?? 0) >= 3 },
  { id: "decore", label: "Décoré", romaji: "Kunshō", tier: "argent", desc: "2 distinctions ou plus au palmarès.", test: (e) => (e?.awards?.length ?? 0) >= 2 },
  { id: "oreille", label: "Oreille d'or", romaji: "Mimi no tatsujin", tier: "or", desc: "80 % des points ou plus à un quiz des génériques.", test: (_, s) => s.quizBestPct >= 80 },
  { id: "quizeur", label: "Habitué du quiz", romaji: "Jōren", tier: "bronze", desc: "10 quiz des génériques joués.", test: (_, s) => s.quizPlays >= 10 },
  { id: "entremetteur", label: "Entremetteur", romaji: "Nakōdo", tier: "bronze", desc: "5 duels de goûts lancés.", test: (_, s) => s.duels >= 5 },
  { id: "dorothee", label: "Enfant du Club Dorothée", romaji: "Natsukashii", tier: "bronze", desc: "3 blind tests Nostalgie joués.", test: (_, s) => s.nostalgiePlays >= 3 },
  { id: "lynx", label: "Œil de lynx", romaji: "Takanome", tier: "or", desc: "75 % des points ou plus à l'Affiche en morceaux.", test: (_, s) => s.afficheBestPct >= 75 },
  { id: "flair", label: "Flair infaillible", romaji: "Chokkan", tier: "argent", desc: "Série de 10 ou plus à Plus ou moins.", test: (_, s) => s.pmBest >= 10 },
  { id: "assidu", label: "Assidu", romaji: "Mainichi", tier: "argent", desc: "7 défis du jour réussis.", test: (_, s) => s.dailyWins >= 7 },
  { id: "voix", label: "Voix du Bash", romaji: "Koe", tier: "argent", desc: "A voté à 5 sondages du Bash ou plus.", test: (_, s) => s.bashVotes >= 5 },
];

export const BADGE_RULES = RULES.map(({ id, label, romaji, tier, desc }) => ({ id, label, romaji, tier, desc }));

export function computeBadges(extras: MemberExtras | undefined, stats: MemberStats = NO_STATS): Badge[] {
  return RULES.filter((r) => r.test(extras, stats)).map(({ id, label, romaji, tier, desc }) => ({ id, label, romaji, tier, desc }));
}
