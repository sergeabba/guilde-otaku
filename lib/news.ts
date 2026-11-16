// Actualités de la Bibliothèque (V4.2 § 6, § 7B « news:sync ») : lecture de flux RSS
// de médias français, rangement en attente, relecture humaine avant publication.
// On ne garde que ce que le média publie lui-même dans son flux (titre, lien, date,
// court extrait) : jamais l'article entier, toujours le lien et le nom de la source.
import type { SupabaseClient } from "@supabase/supabase-js";

export interface NewsFeed { name: string; url: string; site: string }

/** Flux suivis (vérifiés : RSS public, en français). */
export const NEWS_FEEDS: NewsFeed[] = [
  { name: "Adala News", url: "https://adala-news.fr/feed/", site: "https://adala-news.fr/" },
  { name: "Journal du Japon", url: "https://www.journaldujapon.com/feed/", site: "https://www.journaldujapon.com/" },
];

export interface ParsedNews {
  source: string;
  source_url: string;
  title: string;
  excerpt: string | null;
  author: string | null;
  categories: string[];
  published_at: string | null;
}

export type NewsStatus = "pending" | "published" | "rejected";
export interface NewsRow extends ParsedNews {
  id: number;
  status: NewsStatus;
  edited_title: string | null;
  edited_excerpt: string | null;
  created_at: string;
  reviewed_at: string | null;
}

/** Article tel qu'affiché sur le site (texte revu par l'admin s'il existe). */
export interface PublicNews { id: number; source: string; url: string; title: string; excerpt: string | null; date: string | null; categories: string[] }

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", laquo: "«", raquo: "»" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const cdata = (s: string) => s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
const text = (html: string) => decodeEntities(cdata(html).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const tag = (block: string, name: string) => block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"))?.[1] ?? null;
const tags = (block: string, name: string) => [...block.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "gi"))].map((m) => m[1]);

/** Coupe proprement à la fin d'un mot, avec points de suspension. */
export function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[\s,;:.–-]+$/, "")}…`;
}

/** Articles d'un flux RSS 2.0 (WordPress). Liens https uniquement ; doublons écartés. */
export function parseFeed(xml: string, source: string): ParsedNews[] {
  const out: ParsedNews[] = [];
  const seen = new Set<string>();
  for (const block of tags(xml, "item")) {
    const title = text(tag(block, "title") ?? "");
    const link = text(tag(block, "link") ?? "");
    if (!title || !/^https:\/\/[^\s]+$/.test(link) || seen.has(link)) continue;
    seen.add(link);
    // WordPress ajoute « L'article … est apparu en premier sur … » : on le retire.
    const raw = text(tag(block, "description") ?? "").replace(/\s*L[’']article .{0,400}? est apparu en premier sur .*$/i, "").trim();
    const date = tag(block, "pubDate");
    const when = date ? new Date(text(date)) : null;
    out.push({
      source,
      source_url: link.slice(0, 600),
      title: clip(title, 300),
      excerpt: raw ? clip(raw, 280) : null,
      author: text(tag(block, "dc:creator") ?? "") || null,
      categories: [...new Set(tags(block, "category").map(text).filter(Boolean))].slice(0, 6).map((c) => clip(c, 40)),
      published_at: when && !Number.isNaN(when.getTime()) ? when.toISOString() : null,
    });
  }
  return out;
}

export async function fetchFeed(feed: NewsFeed): Promise<ParsedNews[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "GuildeOtaku/1.0 (+https://guilde-otaku.vercel.app)", Accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseFeed(await res.text(), feed.name);
}

export interface SyncReport { source: string; read: number; added: number; error: string | null }

/**
 * Lit chaque flux et met les nouveaux articles en attente (idempotent : un lien déjà
 * connu n'est jamais ajouté deux fois). Chaque passage est journalisé. `dryRun` :
 * lecture seule, rien n'est écrit.
 */
export async function syncNews(db: SupabaseClient | null, { dryRun = false, feeds = NEWS_FEEDS } = {}): Promise<SyncReport[]> {
  const reports: SyncReport[] = [];
  for (const feed of feeds) {
    const started = new Date().toISOString();
    let read = 0, added = 0, error: string | null = null;
    try {
      const items = await fetchFeed(feed);
      read = items.length;
      if (!dryRun && db && items.length) {
        const { data, error: e } = await db.from("news_items").upsert(items, { onConflict: "source_url", ignoreDuplicates: true }).select("id");
        if (e) throw new Error(e.message);
        added = data?.length ?? 0;
      } else if (dryRun) {
        added = items.length;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "erreur inconnue";
    }
    if (!dryRun && db) {
      await db.from("news_runs").insert({ source: feed.name, started_at: started, finished_at: new Date().toISOString(), read_count: read, added_count: added, error });
    }
    reports.push({ source: feed.name, read, added, error });
  }
  return reports;
}

export function toPublic(r: NewsRow): PublicNews {
  return { id: r.id, source: r.source, url: r.source_url, title: r.edited_title?.trim() || r.title, excerpt: r.edited_excerpt?.trim() || r.excerpt, date: r.published_at, categories: r.categories ?? [] };
}
