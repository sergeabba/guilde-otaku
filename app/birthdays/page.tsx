"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List, PartyPopper, Share2, Sword, User } from "lucide-react";
import { Member, Rank } from "../../data/members";
import MemberModal from "../components/MemberModal";
import GuildeHeader from "../components/GuildeHeader";
import { rankAccents } from "../config/ranks";
import { parseBirthday } from "../types";
import { fetchMembers } from "../utils/dataAdapter";
import { countdownTo, daysUntil, nextOccurrence, occurrenceIn } from "../utils/birthdays";
import { useShare } from "../hooks/useShare";
import "./birthdays.css";

type ViewMode = "real" | "anime";
type Layout = "liste" | "calendrier";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Chaque mois garde sa couleur et son ambiance (claire ou sombre).
const monthThemes: Record<number, { accent: string; dark: boolean }> = {
  1: { accent: "#60a5fa", dark: true },  2: { accent: "#f472b6", dark: true },
  3: { accent: "#4ade80", dark: false }, 4: { accent: "#fb923c", dark: false },
  5: { accent: "#f59e0b", dark: false }, 6: { accent: "#c9a84c", dark: true },
  7: { accent: "#f87171", dark: true },  8: { accent: "#fbbf24", dark: true },
  9: { accent: "#a78bfa", dark: true },  10: { accent: "#f97316", dark: true },
  11: { accent: "#94a3b8", dark: false }, 12: { accent: "#34d399", dark: false },
};

type Dated = Member & { day: number; month: number; daysUntil: number };

const CONFETTI_KEY = "guilde-confettis";

/** Compte à rebours isolé : lui seul se redessine chaque seconde. */
function Countdown({ target }: { target: Date }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const c = countdownTo(target, now);
  const cells: [number, string][] = [[c.days, c.days > 1 ? "jours" : "jour"], [c.hours, "heures"], [c.minutes, "min"], [c.seconds, "sec"]];
  return (
    <div className="bd-count" role="timer" aria-label={`Dans ${c.days} jours, ${c.hours} heures et ${c.minutes} minutes`}>
      {cells.map(([v, label]) => (
        <div key={label} aria-hidden="true">
          <b>{String(v).padStart(2, "0")}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function BirthdaysPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [today, setToday] = useState(() => new Date());
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("anime");
  const [layout, setLayout] = useState<Layout>("liste");
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
  const [confettiOn, setConfettiOn] = useState(true);
  const { share, Toast } = useShare();

  useEffect(() => {
    let cancelled = false;
    fetchMembers().then((list) => { if (!cancelled) setMembers(list); });
    try { if (localStorage.getItem(CONFETTI_KEY) === "off") setConfettiOn(false); } catch {}
    return () => { cancelled = true; };
  }, []);

  // Le jour change à minuit : on revérifie chaque minute
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setToday((prev) => (prev.toDateString() === n.toDateString() ? prev : n));
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const dated = useMemo<Dated[]>(() => (members ?? []).flatMap((m) => {
    const p = parseBirthday(m.birthday);
    return p ? [{ ...m, day: p.day, month: p.month, daysUntil: daysUntil(p.day, p.month, today) }] : [];
  }), [members, today]);

  const byMonth = useMemo(() => {
    const map: Record<number, Dated[]> = {};
    for (let i = 1; i <= 12; i++) map[i] = [];
    dated.forEach((m) => map[m.month].push(m));
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.day - b.day));
    return map;
  }, [dated]);

  const soonest = useMemo(() => {
    if (!dated.length) return [];
    const min = Math.min(...dated.map((m) => m.daysUntil));
    return dated.filter((m) => m.daysUntil === min);
  }, [dated]);
  const isToday = soonest[0]?.daysUntil === 0;
  const upcoming = useMemo(
    () => [...dated].filter((m) => m.daysUntil > (isToday ? 0 : soonest[0]?.daysUntil ?? 0)).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 4),
    [dated, isToday, soonest]
  );

  const currentMonth = today.getMonth() + 1;
  const orderedMonths = Array.from({ length: 12 }, (_, i) => ((currentMonth - 1 + i) % 12) + 1);
  const themeMonth = layout === "calendrier" ? calMonth : activeMonth ?? currentMonth;
  const theme = monthThemes[themeMonth];

  const celebrate = useCallback(async () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const confetti = (await import("canvas-confetti")).default;
    const colors = [theme.accent, "#c9a84c", "#f3eee2", "#d7332b"];
    confetti({ particleCount: 90, spread: 75, origin: { x: 0.2, y: 0.75 }, angle: 60, colors, disableForReducedMotion: true });
    confetti({ particleCount: 90, spread: 75, origin: { x: 0.8, y: 0.75 }, angle: 120, colors, disableForReducedMotion: true });
  }, [theme.accent]);

  // Une seule salve automatique le jour J, si les confettis sont activés
  useEffect(() => {
    if (!isToday || !confettiOn) return;
    const t = setTimeout(celebrate, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToday]);

  const toggleConfetti = () => {
    setConfettiOn((on) => {
      try { localStorage.setItem(CONFETTI_KEY, on ? "off" : "on"); } catch {}
      return !on;
    });
  };

  const portrait = (m: Member) => (viewMode === "anime" ? m.animeChar || m.photo : m.photo || m.animeChar);
  const whenLabel = (d: number) => (d === 0 ? "Aujourd'hui" : d === 1 ? "Demain" : `J-${d}`);
  const shareBirthday = (list: Dated[]) => share({
    title: `Anniversaire de ${list.map((m) => m.name).join(" & ")}`,
    text: list[0].daysUntil === 0
      ? `Aujourd'hui, la Guilde fête ${list.map((m) => m.name).join(" & ")} !`
      : `${list.map((m) => m.name).join(" & ")} : anniversaire le ${list[0].day} ${MONTHS[list[0].month - 1].toLowerCase()}.`,
    url: `/membres/${list[0].id}`,
  });

  // Grille du calendrier : mois affiché dans le cycle des 12 prochains mois
  const calYear = calMonth >= currentMonth ? today.getFullYear() : today.getFullYear() + 1;
  const calCells = useMemo(() => {
    const first = new Date(calYear, calMonth - 1, 1);
    const lead = (first.getDay() + 6) % 7; // lundi en premier
    const count = new Date(calYear, calMonth, 0).getDate();
    const people: Record<number, Dated[]> = {};
    byMonth[calMonth].forEach((m) => {
      const d = occurrenceIn(calYear, m.day, m.month).getDate();
      (people[d] ??= []).push(m);
    });
    const cells: { day: number | null; people: Dated[] }[] = [];
    for (let i = 0; i < lead; i++) cells.push({ day: null, people: [] });
    for (let d = 1; d <= count; d++) cells.push({ day: d, people: people[d] ?? [] });
    while (cells.length % 7) cells.push({ day: null, people: [] });
    return cells;
  }, [calYear, calMonth, byMonth]);

  const loading = members === null;
  const visibleMonths = activeMonth ? [activeMonth] : orderedMonths;
  const hasLeapling = dated.some((m) => m.month === 2 && m.day === 29);

  return (
    <div
      className={`gk-page tone-${theme.dark ? "dark" : "light"}`}
      style={{ "--gk-accent": theme.accent, transition: "background 400ms, color 400ms" } as React.CSSProperties}
    >
      <GuildeHeader activePage="birthdays" accentColor={theme.accent} tone={theme.dark ? "dark" : "light"} />

      <main className="gk-wrap" style={{ maxWidth: 1120, paddingBottom: "clamp(56px, 9vw, 110px)" }}>
        <div className="gk-hero gk-reveal">
          <div className="gk-hero-kicker">
            <p className="gk-chapter"><b>02</b><span>LE CALENDRIER DE LA GUILDE</span></p>
            <span className="gk-jp" aria-hidden="true">誕生日</span>
          </div>
          <h1 className="gk-display gk-h1" style={{ fontSize: "clamp(2.3rem, 10.4vw, 6.4rem)" }}>Anniversaires</h1>
          <p className="gk-body gk-hero-lede">
            Nous sommes le {today.getDate()} {MONTHS[today.getMonth()].toLowerCase()}. Voici qui souffle ses bougies, et quand.
          </p>
        </div>

        {loading ? (
          <div role="status" aria-label="Chargement des anniversaires">
            <div className="gk-skel" style={{ height: 300 }} />
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="gk-skel" style={{ height: 76, marginTop: 10 }} />)}
          </div>
        ) : dated.length === 0 ? (
          <div className="gk-empty">
            <div className="gk-empty-glyph" aria-hidden="true">暦</div>
            <h3>Le calendrier est vide</h3>
            <p>Aucune date d&apos;anniversaire n&apos;a pu être chargée. Recharge la page dans un instant.</p>
          </div>
        ) : (
          <>
            {/* ── À L'HONNEUR ─────────────────────────────────────────── */}
            <section data-gk-motion="reveal" className={`gk-panel bd-spot${isToday ? " is-today" : ""}`} aria-label={isToday ? "Anniversaire du jour" : "Prochain anniversaire"}>
              <div className="bd-spot-media">
                {soonest.map((m) => (
                  <button key={m.id} type="button" onClick={() => setSelectedMember(m)} aria-label={`Ouvrir la fiche de ${m.name}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {portrait(m) && <img key={viewMode} className="gk-wipe-in" src={portrait(m)} alt="" />}
                  </button>
                ))}
              </div>
              <div className="bd-spot-body">
                <p className="gk-chapter" style={{ width: "fit-content" }}>
                  <b>{isToday ? "祝" : "次"}</b>
                  <span>{isToday ? "C'EST AUJOURD'HUI" : "PROCHAIN ANNIVERSAIRE"}</span>
                </p>
                <h2>{soonest.map((m) => m.name).join(" & ")}</h2>
                <p className="bd-spot-date">
                  {soonest[0].day} {MONTHS[soonest[0].month - 1].toLowerCase()}, {[...new Set(soonest.map((m) => m.rank))].join(" et ")}
                </p>
                {isToday ? (
                  <p className="bd-shout">Joyeux anniversaire !</p>
                ) : (
                  <Countdown target={nextOccurrence(soonest[0].day, soonest[0].month, today)} />
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
                  {isToday && (
                    <button type="button" className="gk-btn gk-btn--ink" onClick={celebrate}>
                      <PartyPopper size={17} aria-hidden="true" /> Lancer les confettis
                    </button>
                  )}
                  <button type="button" className={`gk-btn ${isToday ? "gk-btn--ghost" : ""}`} onClick={() => setSelectedMember(soonest[0])}>
                    Voir la fiche
                  </button>
                  <button type="button" className="gk-btn gk-btn--ghost" onClick={() => shareBirthday(soonest)}>
                    <Share2 size={16} aria-hidden="true" /> Partager
                  </button>
                </div>
                {isToday && (
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, font: "700 0.9rem var(--gk-font-ui)", cursor: "pointer", width: "fit-content" }}>
                    <input type="checkbox" checked={confettiOn} onChange={toggleConfetti} style={{ width: 18, height: 18, accentColor: "#111" }} />
                    Confettis automatiques à l&apos;ouverture
                  </label>
                )}
              </div>
            </section>

            {upcoming.length > 0 && (
              <section data-gk-motion="reveal" aria-labelledby="bd-next-title" style={{ marginTop: "clamp(28px, 5vw, 48px)" }}>
                <h2 id="bd-next-title" className="gk-display gk-h4">Ensuite</h2>
                <ul className="bd-rows" style={{ marginTop: 10, borderTop: "var(--gk-stroke) solid var(--gk-border)" }}>
                  {upcoming.map((m) => <Row key={m.id} m={m} src={portrait(m)} label={whenLabel(m.daysUntil)} onOpen={() => setSelectedMember(m)} showMonth />)}
                </ul>
              </section>
            )}

            {/* ── OUTILS ──────────────────────────────────────────────── */}
            <div className="bd-tools">
              <div className="gk-switch" role="group" aria-label="Affichage">
                <button type="button" aria-pressed={layout === "liste"} onClick={() => setLayout("liste")}>
                  <List size={16} aria-hidden="true" /> Liste
                </button>
                <button type="button" aria-pressed={layout === "calendrier"} onClick={() => setLayout("calendrier")}>
                  <CalendarDays size={16} aria-hidden="true" /> Calendrier
                </button>
              </div>
              <div className="gk-switch" role="group" aria-label="Type de portrait">
                <button type="button" aria-pressed={viewMode === "real"} onClick={() => setViewMode("real")}>
                  <User size={16} aria-hidden="true" /> Réel
                </button>
                <button type="button" aria-pressed={viewMode === "anime"} onClick={() => setViewMode("anime")}>
                  <Sword size={16} aria-hidden="true" /> Anime
                </button>
              </div>
            </div>

            {layout === "liste" ? (
              <>
                <div className="gk-chips gk-chips--wrap" role="group" aria-label="Filtrer par mois" style={{ marginTop: 18 }}>
                  <button type="button" className="gk-chip" aria-pressed={activeMonth === null} onClick={() => setActiveMonth(null)}>
                    <span>Toute l&apos;année</span>
                  </button>
                  {orderedMonths.map((mo) => byMonth[mo].length > 0 && (
                    <button
                      key={mo}
                      type="button"
                      className="gk-chip"
                      aria-pressed={activeMonth === mo}
                      onClick={() => setActiveMonth(activeMonth === mo ? null : mo)}
                      aria-label={`${MONTHS[mo - 1]}, ${byMonth[mo].length} anniversaires`}
                    >
                      <span>{MONTHS_SHORT[mo - 1]} <small>{byMonth[mo].length}</small></span>
                    </button>
                  ))}
                </div>

                <div key={activeMonth ?? "all"} className="gk-stagger">
                  {visibleMonths.map((mo, i) => byMonth[mo].length > 0 && (
                    <section data-gk-motion="reveal" key={mo} className="bd-month" style={{ "--i": i } as React.CSSProperties} aria-labelledby={`bd-m-${mo}`}>
                      <div className="bd-month-head">
                        <h2 id={`bd-m-${mo}`} style={{ color: mo === currentMonth ? "var(--gk-accent-text)" : undefined }}>{MONTHS[mo - 1]}</h2>
                        {mo === currentMonth && <span className="gk-tag gk-tag--solid">Ce mois-ci</span>}
                        <span className="bd-n">{byMonth[mo].length} {byMonth[mo].length > 1 ? "membres" : "membre"}</span>
                      </div>
                      <ul className="bd-rows">
                        {byMonth[mo].map((m) => <Row key={m.id} m={m} src={portrait(m)} label={whenLabel(m.daysUntil)} onOpen={() => setSelectedMember(m)} />)}
                      </ul>
                    </section>
                  ))}
                </div>
              </>
            ) : (
              <section data-gk-motion="reveal" aria-label={`Calendrier de ${MONTHS[calMonth - 1]} ${calYear}`}>
                <div className="bd-cal-head">
                  <button type="button" className="gk-icon-btn" onClick={() => setCalMonth((m) => (m === 1 ? 12 : m - 1))} aria-label="Mois précédent">
                    <ChevronLeft size={20} aria-hidden="true" />
                  </button>
                  <h2 aria-live="polite">{MONTHS[calMonth - 1]} <span style={{ color: "var(--gk-faint)" }}>{calYear}</span></h2>
                  <button type="button" className="gk-icon-btn" onClick={() => setCalMonth((m) => (m === 12 ? 1 : m + 1))} aria-label="Mois suivant">
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                </div>
                <div className="bd-cal" key={calMonth}>
                  {DOW.map((d) => <div key={d} className="bd-cal-dow" aria-hidden="true">{d}</div>)}
                  {calCells.map((c, i) => {
                    const isNow = c.day === today.getDate() && calMonth === currentMonth && calYear === today.getFullYear();
                    return (
                      <div key={i} className={`bd-cell${c.day ? "" : " is-out"}${c.people.length ? " has" : ""}${isNow ? " is-now" : ""}`}>
                        {c.day && <span className="bd-cell-n">{c.day}</span>}
                        {c.people.length > 0 && (
                          <div className="bd-cell-people">
                            {c.people.map((m) => (
                              <button key={m.id} type="button" className="no-min" onClick={() => setSelectedMember(m)} aria-label={`${m.name}, le ${c.day} ${MONTHS[calMonth - 1].toLowerCase()}`} title={m.name}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {portrait(m) && <img src={portrait(m)} alt="" loading="lazy" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {byMonth[calMonth].length === 0 ? (
                  <p className="gk-body" style={{ marginTop: 18 }}>Personne ne fête son anniversaire en {MONTHS[calMonth - 1].toLowerCase()}.</p>
                ) : (
                  <div className="bd-cal-names">
                    {byMonth[calMonth].map((m) => (
                      <button key={m.id} type="button" className="gk-chip" onClick={() => setSelectedMember(m)}>
                        <span><small>{m.day}</small> {m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {hasLeapling && (
              <p className="bd-leap">Les anniversaires du 29 février se fêtent le 28 les années non bissextiles.</p>
            )}
          </>
        )}
      </main>

      <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} viewMode={viewMode} />
      <Toast />
    </div>
  );
}

function Row({ m, src, label, onOpen, showMonth = false }: { m: Dated; src: string; label: string; onOpen: () => void; showMonth?: boolean }) {
  const rk = rankAccents[m.rank as Rank] ?? "#c9a84c";
  return (
    <li>
      <button
        type="button"
        className={`bd-row${m.daysUntil === 0 ? " is-today" : ""}`}
        onClick={onOpen}
        aria-label={`${m.name}, ${m.rank}, le ${m.day} ${MONTHS[m.month - 1].toLowerCase()}. ${label}. Ouvrir la fiche.`}
      >
        <span className="bd-day" aria-hidden="true">{String(m.day).padStart(2, "0")}</span>
        <span className="bd-avatar" style={{ borderColor: rk }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src && <img src={src} alt="" loading="lazy" />}
        </span>
        <span className="bd-who">
          <strong>{m.name}</strong>
          <small>{showMonth ? `${MONTHS[m.month - 1]}, ${m.rank}` : m.rank}</small>
        </span>
        <span className={`bd-when${m.daysUntil > 0 && m.daysUntil <= 7 ? " is-soon" : ""}`}>{label}</span>
      </button>
    </li>
  );
}
