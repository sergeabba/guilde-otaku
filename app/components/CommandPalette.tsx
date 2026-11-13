"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CornerDownLeft, ExternalLink, Palette, Search, Tag, X } from "lucide-react";
import { NAV, chapterNo } from "../config/nav";
import { fetchMembers, fetchBonsPlans } from "../utils/dataAdapter";
import { supabase } from "../../lib/supabase";
import { normalize } from "../utils/text";

interface Item {
  key: string;
  group: "Rubriques" | "Membres" | "Bibliothèque" | "Atelier" | "Bons plans";
  title: string;
  sub?: string;
  href: string;
  external?: boolean;
  image?: string;
  hay: string;
}

const GROUP_ORDER: Item["group"][] = ["Rubriques", "Membres", "Bibliothèque", "Atelier", "Bons plans"];
const MAX_PER_GROUP = 6;

const PAGE_ITEMS: Item[] = NAV.map((n, i) => ({
  key: `page-${n.id}`,
  group: "Rubriques",
  title: n.label,
  sub: n.blurb,
  href: n.href,
  hay: normalize(`${n.label} ${n.blurb} ${chapterNo(i)}`),
}));

async function loadIndex(): Promise<Item[]> {
  const [members, biblio, atelier, plans] = await Promise.allSettled([
    fetchMembers(),
    supabase.from("bibliotheque").select("id, title, type, tier"),
    fetch("/api/atelier").then((r) => (r.ok ? r.json() : { images: [] })),
    fetchBonsPlans(),
  ]);

  const items: Item[] = [];

  if (members.status === "fulfilled") {
    for (const m of members.value) {
      items.push({
        key: `m-${m.id}`,
        group: "Membres",
        title: m.name,
        sub: m.rank,
        href: `/membres/${m.id}`,
        image: m.animeChar || m.photo || undefined,
        hay: normalize(`${m.name} ${m.rank} ${m.badge ?? ""}`),
      });
    }
  }
  if (biblio.status === "fulfilled" && Array.isArray(biblio.value.data)) {
    for (const b of biblio.value.data as { id: number; title: string; type?: string; tier?: string }[]) {
      items.push({
        key: `b-${b.id}`,
        group: "Bibliothèque",
        title: b.title,
        sub: [b.type, b.tier].filter(Boolean).join(", "),
        href: `/bibliotheque?fiche=${b.id}`,
        hay: normalize(`${b.title} ${b.type ?? ""} ${b.tier ?? ""}`),
      });
    }
  }
  if (atelier.status === "fulfilled" && Array.isArray(atelier.value?.images)) {
    for (const a of atelier.value.images as { id: number | string; title?: string; category?: string; universe?: string; filename: string }[]) {
      if (!a.title) continue;
      items.push({
        key: `a-${a.id}`,
        group: "Atelier",
        title: a.title,
        sub: [a.category, a.universe].filter(Boolean).join(", "),
        href: `/atelier?oeuvre=${encodeURIComponent(String(a.id))}`,
        hay: normalize(`${a.title} ${a.category ?? ""} ${a.universe ?? ""}`),
      });
    }
  }
  if (plans.status === "fulfilled") {
    for (const p of plans.value) {
      items.push({
        key: `p-${p.id}`,
        group: "Bons plans",
        title: p.title,
        sub: p.category,
        href: p.url,
        external: true,
        hay: normalize(`${p.title} ${p.category} ${p.desc}`),
      });
    }
  }
  return items;
}

const GROUP_ICON = {
  "Bibliothèque": BookOpen,
  "Atelier": Palette,
  "Bons plans": Tag,
} as const;

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<Item[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
    restoreRef.current?.focus?.();
  }, []);

  // Ouverture : Ctrl/Cmd+K ou évènement "guilde:search"
  useEffect(() => {
    const show = () => {
      restoreRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) restoreRef.current = document.activeElement as HTMLElement | null;
          return !o;
        });
      }
    };
    window.addEventListener("guilde:search", show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("guilde:search", show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Chargement paresseux de l'index à la première ouverture
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!index) {
      let cancelled = false;
      loadIndex().then((items) => { if (!cancelled) setIndex(items); });
      return () => { cancelled = true; document.body.style.overflow = prev; };
    }
    return () => { document.body.style.overflow = prev; };
  }, [open, index]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    const pool = [...PAGE_ITEMS, ...(index ?? [])];
    if (!q) return PAGE_ITEMS;
    const words = q.split(/\s+/);
    const matched = pool.filter((it) => words.every((w) => it.hay.includes(w)));
    const out: Item[] = [];
    for (const g of GROUP_ORDER) out.push(...matched.filter((m) => m.group === g).slice(0, MAX_PER_GROUP));
    return out;
  }, [query, index]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    listRef.current?.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = useCallback((it: Item) => {
    close();
    if (it.external) window.open(it.href, "_blank", "noopener,noreferrer");
    else router.push(it.href);
  }, [close, router]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.max(0, Math.min(a + 1, results.length - 1))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && e.target === inputRef.current && results[active]) { e.preventDefault(); go(results[active]); }
    else if (e.key === "Tab") {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input:not(:disabled), button:not(:disabled):not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  let lastGroup = "";
  return (
    <div className="gk-cmd-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={dialogRef} className="gk-cmd tone-dark" role="dialog" aria-modal="true" aria-label="Recherche dans la Guilde" onKeyDown={onKeyDown}>
        <div className="gk-cmd-top">
          <Search size={20} aria-hidden="true" style={{ color: "var(--gk-gold)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Un membre, une œuvre, une rubrique..."
            aria-label="Rechercher"
            role="combobox"
            aria-expanded="true"
            aria-controls="gk-cmd-list"
            aria-activedescendant={results[active] ? `gk-cmd-${results[active].key}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="gk-icon-btn" onClick={close} aria-label="Fermer la recherche">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="gk-cmd-list" id="gk-cmd-list" role="listbox" ref={listRef}>
          {results.length === 0 && (
            <div className="gk-empty" style={{ border: 0, padding: "40px 20px" }}>
              <div className="gk-empty-glyph" aria-hidden="true">無</div>
              <h3>Rien pour « {query} »</h3>
              <p>{index ? "Essaie un prénom, un titre d'anime ou le nom d'une rubrique." : "L'index se charge, encore une seconde."}</p>
            </div>
          )}
          {results.map((it, i) => {
            const header = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            const Icon = GROUP_ICON[it.group as keyof typeof GROUP_ICON];
            return (
              <div key={it.key}>
                {header && <div className="gk-cmd-group">{header}</div>}
                <button
                  type="button"
                  id={`gk-cmd-${it.key}`}
                  role="option"
                  aria-selected={i === active}
                  className={`gk-cmd-item${i === active ? " is-active" : ""}`}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(it)}
                  tabIndex={-1}
                >
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt="" loading="lazy" />
                  ) : (
                    <span className="gk-cmd-ico" aria-hidden="true">
                      {it.group === "Rubriques"
                        ? <b style={{ font: "800 0.8rem var(--gk-font-ui)" }}>{chapterNo(NAV.findIndex((n) => `page-${n.id}` === it.key))}</b>
                        : Icon ? <Icon size={16} /> : null}
                    </span>
                  )}
                  <span>
                    {it.title}
                    {it.sub && <small>{it.sub}</small>}
                  </span>
                  {it.external ? <ExternalLink size={15} aria-hidden="true" /> : i === active ? <CornerDownLeft size={15} aria-hidden="true" /> : null}
                </button>
              </div>
            );
          })}
        </div>

        <div className="gk-cmd-foot" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd>naviguer</span>
          <span><kbd>Entrée</kbd>ouvrir</span>
          <span><kbd>Échap</kbd>fermer</span>
        </div>
      </div>
    </div>
  );
}
