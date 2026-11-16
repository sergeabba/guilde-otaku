"use client";

// Actualités publiées (relues dans l'admin) : titre, court extrait, média et lien vers
// l'article d'origine. Section absente tant que rien n'est publié.
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { PublicNews } from "../../lib/news";
import "../styles/news.css";

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

export default function NewsFeed() {
  const [news, setNews] = useState<PublicNews[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/news").then((r) => (r.ok ? r.json() : { news: [] })).then((d) => { if (alive) setNews(d.news ?? []); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!news.length) return null;
  return (
    <section className="nw" aria-labelledby="nw-title">
      <header className="nw-head">
        <span className="gk-chapter"><b>✦</b><span>NYŪSU</span></span>
        <h2 id="nw-title" className="gk-display">Actualités</h2>
        <p>Choisies par la Guilde chez les médias spécialisés. Chaque article se lit chez son auteur.</p>
      </header>
      <ol className="nw-list">
        {news.slice(0, 9).map((n, i) => (
          <li key={n.id} className="nw-item" style={{ "--i": i } as React.CSSProperties}>
            <a href={n.url} target="_blank" rel="noopener noreferrer">
              <span className="nw-meta">{n.source}{n.date ? ` · ${DATE.format(new Date(n.date))}` : ""}</span>
              <span className="nw-title">{n.title}</span>
              {n.excerpt && <span className="nw-excerpt">{n.excerpt}</span>}
              <span className="nw-more">Lire sur {n.source} <ArrowUpRight size={15} aria-hidden="true" /></span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
