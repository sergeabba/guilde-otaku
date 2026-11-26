"use client";

// L'annuaire en planches. Deux vues, mêmes filtres (recherche, grade) :
// - Planche : un chapitre par grade ; chaque membre a sa case, le personnage déborde.
// - Liste : une ligne par membre, rapide à parcourir, triable.
// La vue choisie est gardée sur l'appareil et dans l'adresse (?vue=liste).
import { useEffect, useMemo, useState } from "react";
import type { ExploMember } from "../../../../lib/explo-data";
import TurnLink from "../../TurnLink";
import { Cut, Face } from "../parts";

type View = "planche" | "liste";
const KEY = "gk-annuaire-vue";
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const no = (id: number) => `N°${String(id).padStart(3, "0")}`;

export default function Annuaire({ members }: { members: ExploMember[] }) {
  const [view, setView] = useState<View>("planche");
  const [q, setQ] = useState("");
  const [rank, setRank] = useState<string | null>(null);
  const [sort, setSort] = useState<"numero" | "nom">("numero");

  useEffect(() => {
    void Promise.resolve().then(() => {
      const v = new URLSearchParams(location.search).get("vue") ?? (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
      if (v === "liste" || v === "planche") setView(v);
    });
  }, []);
  const change = (v: View) => {
    setView(v);
    try { localStorage.setItem(KEY, v); } catch { /* stockage indisponible */ }
    const url = new URL(location.href); url.searchParams.set("vue", v); history.replaceState(history.state, "", url);
  };

  const ranks = useMemo(() => Array.from(new Set(members.map((m) => m.rank))).map((r) => ({ rank: r, accent: members.find((m) => m.rank === r)!.accent, romaji: members.find((m) => m.rank === r)!.romaji, count: members.filter((m) => m.rank === r).length })), [members]);
  const list = useMemo(() => {
    const out = members.filter((m) => (!rank || m.rank === rank) && (!q || fold(`${m.name} ${m.rank} ${m.alias ?? ""} ${m.country ?? ""}`).includes(fold(q))));
    return sort === "nom" ? [...out].sort((a, b) => a.name.localeCompare(b.name, "fr")) : out;
  }, [members, rank, q, sort]);
  const chapters = ranks.map((r) => ({ ...r, ms: list.filter((m) => m.rank === r.rank) })).filter((c) => c.ms.length);

  return (
    <>
      <header className="xn-head">
        <p className="xa-box xn-kicker">Le registre de la Guilde</p>
        <h1 className="xn-title">Les nakama</h1>
        <p className="xn-count"><b>{list.length}</b> sur {members.length}</p>
        <label className="xn-search">
          <span className="xn-sr">Chercher un membre</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qui cherches-tu ?" autoComplete="off" enterKeyHint="search" />
        </label>
        <div className="xn-ranks" role="group" aria-label="Grade">
          <button type="button" aria-pressed={!rank} onClick={() => setRank(null)}>Tous</button>
          {ranks.map((r) => (
            <button key={r.rank} type="button" aria-pressed={rank === r.rank} style={{ "--acc": r.accent } as React.CSSProperties} onClick={() => setRank(rank === r.rank ? null : r.rank)}>
              {r.rank} <small>{r.count}</small>
            </button>
          ))}
        </div>
        <div className="xn-views" role="group" aria-label="Affichage">
          <button type="button" aria-pressed={view === "planche"} onClick={() => change("planche")}>Planche</button>
          <button type="button" aria-pressed={view === "liste"} onClick={() => change("liste")}>Liste</button>
        </div>
      </header>

      {list.length === 0 && <p className="xa-box xn-empty">Personne ne répond à « {q} »… Essaie un autre nom, ou tous les grades.</p>}

      {view === "planche" ? (
        chapters.map((c, ci) => (
          <section key={c.rank} className="xn-chapter" aria-labelledby={`xn-c${ci}`} style={{ "--acc": c.accent } as React.CSSProperties}>
            <h2 id={`xn-c${ci}`} className="xn-ch-title"><span className="xn-ch-no">Chapitre {ci + 1}</span><b>{c.rank}</b><i>{c.romaji}</i><small>{c.ms.length} nakama</small></h2>
            <ul className="xn-grid">
              {c.ms.map((m, k) => (
                <li key={m.id} className={`xn-cell xn-s${k % 5}${k % 7 === 0 && c.ms.length > 2 ? " is-big" : ""}`} style={{ "--acc": m.accent } as React.CSSProperties}>
                  <TurnLink href={`/explo/a/membre/${m.id}`} kind="xa-turn" className="xn-link" label={`${m.name}, ${m.rank}`} morph=".xa-cut">
                    <span className="xn-bg" aria-hidden="true"><span className="xa-speed" /><span className="xa-tone" /></span>
                    <Cut m={m} className={`xa-cut xa-inked${m.cut ? "" : " xn-plain"}`} />
                    <span className="xn-tag"><b>{m.first}</b><small>{no(m.id)}</small></span>
                  </TurnLink>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <section className="xn-list" aria-label="Liste des membres">
          <div className="xn-sort" role="group" aria-label="Trier">
            <span>Trier</span>
            <button type="button" aria-pressed={sort === "numero"} onClick={() => setSort("numero")}>Numéro</button>
            <button type="button" aria-pressed={sort === "nom"} onClick={() => setSort("nom")}>Nom</button>
          </div>
          <ol>
            {list.map((m) => (
              <li key={m.id} style={{ "--acc": m.accent } as React.CSSProperties}>
                <TurnLink href={`/explo/a/membre/${m.id}`} kind="xa-turn" className="xn-row" label={`${m.name}, ${m.rank}`}>
                  <span className="xn-thumb" aria-hidden="true"><Face m={m} zoom={1.9} /></span>
                  <span className="xn-no">{no(m.id)}</span>
                  <b className="xn-name">{m.name}</b>
                  <span className="xn-rank">{m.rank}</span>
                  <span className="xn-meta">{[m.country, m.birthday].filter(Boolean).join(" · ")}</span>
                </TurnLink>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
