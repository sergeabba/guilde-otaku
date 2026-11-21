"use client";

// Profil vivant : records aux jeux, votes de films et du Bash d'un membre, chargés quand
// la section approche de l'écran. Rien n'est affiché si le membre n'a encore rien fait.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Clapperboard, Crown, Gamepad2, ThumbsDown, ThumbsUp } from "lucide-react";
import { optimizedSrc } from "../../lib/img";
import type { MemberActivity as Activity } from "../../lib/member-activity";

const TAB: Record<string, string> = { "quiz-generique": "quiz", "quiz-nostalgie": "nostalgie", "emoji-quiz": "emoji" };
const DAY = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

export default function MemberActivity({ id, firstName, head }: { id: number; firstName: string; head: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Activity | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let alive = true;
    const io = new IntersectionObserver((e) => {
      if (!e.some((x) => x.isIntersecting)) return;
      io.disconnect();
      fetch(`/api/membres/activite?id=${id}`).then((r) => r.json()).then((d) => alive && setData(d)).catch(() => {});
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => { alive = false; io.disconnect(); };
  }, [id]);

  const empty = data && !data.plays && !data.films.length && !data.bash.watch && !data.bash.skip;
  if (empty) return null;
  return (
    <div ref={ref}>
      {data && (
        <section id="pf-activite" className="pf-section pf-activity" aria-labelledby="pf-activity-title" data-gk-motion="">
          {head}
          <ul className="pf-act-stats">
            {data.plays > 0 && <li><Gamepad2 size={18} aria-hidden="true" /><b>{data.plays}</b><span>partie{data.plays > 1 ? "s" : ""} jouée{data.plays > 1 ? "s" : ""}</span></li>}
            {data.films.length > 0 && <li><Clapperboard size={18} aria-hidden="true" /><b>{data.films.length}</b><span>vote{data.films.length > 1 ? "s" : ""} de films</span></li>}
            {(data.bash.watch + data.bash.skip) > 0 && <li><ThumbsUp size={18} aria-hidden="true" /><b>{data.bash.watch}</b><span>à regarder</span><ThumbsDown size={16} aria-hidden="true" /><b>{data.bash.skip}</b><span>passé{data.bash.skip > 1 ? "s" : ""}</span></li>}
            {data.last && <li className="is-soft"><span>Dernière partie le {DAY.format(new Date(data.last))}</span></li>}
          </ul>

          {data.records.length > 0 && (
            <>
              <h3 className="pf-act-h">Ses records aux jeux</h3>
              <ol className="pf-records">
                {data.records.map((r) => (
                  <li key={r.game} style={{ "--pct": `${r.pct}%` } as React.CSSProperties}>
                    <Link href={`/jeux?jeu=${TAB[r.game] ?? r.game}`}>
                      <span className="pf-rec-game">{r.label}</span>
                      <b className="pf-rec-score">{r.best}<small> / {r.bestMax}</small></b>
                      <span className="pf-rec-bar" aria-hidden="true"><i /></span>
                      <small className="pf-rec-meta">{[`${r.pct} %`, r.level, `${r.plays} partie${r.plays > 1 ? "s" : ""}`].filter(Boolean).join(" · ")}</small>
                    </Link>
                  </li>
                ))}
              </ol>
            </>
          )}

          {data.films.length > 0 && (
            <>
              <h3 className="pf-act-h">Ses votes de films</h3>
              <ul className="pf-film-votes">
                {data.films.map((f) => (
                  <li key={f.slug} className={f.won ? "is-won" : ""}>
                    <Link href={`/vote/${f.slug}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {f.poster ? <img src={optimizedSrc(`https://image.tmdb.org/t/p/w342${f.poster}`, 128)} alt="" width={56} height={84} loading="lazy" /> : <span className="pf-fv-ph" aria-hidden="true" />}
                      <span><b>{f.film}</b><small>{f.poll}</small></span>
                      <em>{f.won ? <><Crown size={14} aria-hidden="true" /> Gagnant</> : f.ended ? "Perdu" : "En cours"}</em>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="pf-act-note">Parties et votes faits en choisissant « {firstName} » dans les jeux. Les parties en invité ne comptent pas ici.</p>
        </section>
      )}
    </div>
  );
}
