"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GuildeHeader from "../components/GuildeHeader";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  Film, Calendar, Clock, Star, Play, ChevronDown, ChevronUp,
  Eye, Popcorn, Loader2, AlertCircle, Youtube, Trophy, Volume2,
} from "lucide-react";

const font = "'Barlow Condensed', sans-serif";
const bodyFont = "'Outfit', sans-serif";

interface FilmEntry {
  id: number;
  title: string;
  tmdb_id: number | null;
  week_label: string;
  week_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  synopsis: string | null;
  trailer_key: string | null;
  vote_average: number | null;
  genres: string | null;
  year: number | null;
  runtime: number | null;
  director: string | null;
  watched: boolean;
  chosen?: boolean;
  created_at: string;
}

function formatRuntime(min: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? m : ""}` : `${m}min`;
}

function HeroSection({ film, onTrailer }: { film: FilmEntry; onTrailer: () => void }) {
  const isMobile = useIsMobile();
  const backdropUrl = film.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${film.backdrop_path}`
    : null;
  const posterUrl = film.poster_path
    ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
    : null;

  return (
    <section style={{ position: "relative", minHeight: isMobile ? "100vh" : "95vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
      {backdropUrl && (
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: "linear" }}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        >
          <img src={backdropUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, #0a0806 0%, rgba(10,8,6,0.92) 25%, rgba(10,8,6,0.6) 55%, rgba(10,8,6,0.75) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 100%, rgba(240,160,48,0.12) 0%, transparent 50%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(229,9,20,0.06) 0%, transparent 40%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px", background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(10,8,6,0.3) 2px, rgba(10,8,6,0.3) 4px)", opacity: 0.3 }} />
        </motion.div>
      )}

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "0 24px 48px" : "0 48px 80px" }}>
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.7 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, rgba(240,160,48,0.2), rgba(240,160,48,0.05))", border: "1px solid rgba(240,160,48,0.35)", padding: "7px 16px", borderRadius: "6px", marginBottom: "20px", backdropFilter: "blur(16px)" }}>
            <Trophy size={14} fill="rgba(240,160,48,0.6)" style={{ color: "#f0a030" }} />
            <span style={{ fontFamily: font, fontSize: "10px", fontWeight: 900, color: "#f0a030", letterSpacing: "0.3em", textTransform: "uppercase" }}>Film élu de la semaine</span>
          </div>
        </motion.div>

        <div style={{ display: "flex", gap: isMobile ? "20px" : "40px", alignItems: "flex-end", flexDirection: isMobile ? "column" : "row" }}>
          {posterUrl && (
            <motion.div
              initial={{ opacity: 0, y: 40, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ flexShrink: 0, width: isMobile ? "160px" : "260px", borderRadius: "4px", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(240,160,48,0.15), 0 0 60px rgba(240,160,48,0.08)", position: "relative" }}
            >
              <img src={posterUrl} alt={film.title} style={{ width: "100%", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 30px rgba(0,0,0,0.3)" }} />
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} style={{ flex: 1, paddingBottom: isMobile ? "0" : "24px" }}>
            <h1 style={{ fontFamily: font, fontSize: isMobile ? "clamp(40px, 11vw, 64px)" : "clamp(56px, 7vw, 96px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 0.9, letterSpacing: "-0.02em", marginBottom: "16px", textShadow: "0 4px 40px rgba(0,0,0,0.5)" }}>
              {film.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
              {film.year && (
                <span style={{ fontFamily: font, fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Calendar size={14} /> {film.year}
                </span>
              )}
              {film.runtime && (
                <span style={{ fontFamily: font, fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Clock size={14} /> {formatRuntime(film.runtime)}
                </span>
              )}
              {film.vote_average && film.vote_average > 0 && (
                <span style={{ fontFamily: font, fontSize: "15px", fontWeight: 900, color: "#fbbf24", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Star size={14} fill="#fbbf24" color="#fbbf24" /> {film.vote_average.toFixed(1)}
                </span>
              )}
              <span style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.15)" }} />
              {film.director && (
                <span style={{ fontFamily: font, fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
                  {film.director}
                </span>
              )}
            </div>

            {film.genres && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
                {film.genres.split(", ").map((g) => (
                  <span key={g} style={{ fontFamily: font, fontSize: "11px", fontWeight: 800, color: "#f0a030", background: "rgba(240,160,48,0.08)", border: "1px solid rgba(240,160,48,0.18)", padding: "4px 12px", borderRadius: "2px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {g}
                  </span>
                ))}
              </div>
            )}

            {film.synopsis && (
              <p style={{ fontFamily: bodyFont, fontSize: isMobile ? "15px" : "17px", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", maxWidth: "640px", marginBottom: "28px", display: isMobile ? "-webkit-box" : "block", WebkitLineClamp: isMobile ? 3 : undefined, WebkitBoxOrient: "vertical", overflow: isMobile ? "hidden" : "visible" }}>
                {film.synopsis}
              </p>
            )}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {film.trailer_key && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onTrailer}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 28px", background: "#e50914", border: "none", borderRadius: "4px", fontFamily: font, fontSize: "14px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer", boxShadow: "0 8px 30px rgba(229,9,20,0.35)" }}
                >
                  <Play size={18} fill="#fff" /> Bande-Annonce
                </motion.button>
              )}
              {film.watched && (
                <span style={{ display: "flex", alignItems: "center", gap: "7px", padding: "12px 20px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "4px", fontFamily: font, fontSize: "13px", fontWeight: 800, color: "#22c55e", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <Eye size={14} /> Vu en soirtée
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(240,160,48,0.2), transparent)" }} />
    </section>
  );
}

function FilmCard({ film, index, onClick }: { film: FilmEntry; index: number; onClick: () => void }) {
  const isMobile = useIsMobile();
  const posterUrl = film.poster_path
    ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      style={{ position: "relative", borderRadius: "4px", overflow: "hidden", cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", transition: "all 0.3s" }}
      whileHover={{ scale: 1.03, borderColor: "rgba(240,160,48,0.3)" }}
      whileTap={{ scale: 0.98 }}
    >
      <div style={{ height: "270px", overflow: "hidden", position: "relative", background: "#080604" }}>
        {posterUrl ? (
          <img src={posterUrl} alt={film.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Film size={36} color="rgba(255,255,255,0.08)" />
          </div>
        )}

        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,8,6,0.9) 0%, transparent 40%)" }} />

        {film.chosen && (
          <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "2px", background: "rgba(240,160,48,0.9)", color: "#000", fontFamily: font, fontSize: "9px", fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            <Trophy size={10} fill="#000" /> Élu
          </div>
        )}

        {film.watched && (
          <div style={{ position: "absolute", top: "10px", left: film.chosen ? "72px" : "10px", display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "2px", background: "rgba(34,197,94,0.85)", color: "#fff", fontFamily: font, fontSize: "9px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <Eye size={9} /> Vu
          </div>
        )}

        {film.trailer_key && (
          <motion.div whileHover={{ scale: 1.1 }}
            style={{ position: "absolute", top: "10px", right: "10px", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(229,9,20,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(229,9,20,0.4)" }}
          >
            <Play size={13} fill="#fff" color="#fff" />
          </motion.div>
        )}

        {film.vote_average && film.vote_average > 0 && (
          <div style={{ position: "absolute", bottom: "50px", right: "10px", display: "flex", alignItems: "center", gap: "3px", padding: "3px 8px", borderRadius: "2px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", fontFamily: font, fontSize: "11px", fontWeight: 800, color: "#fbbf24" }}>
            <Star size={10} fill="#fbbf24" color="#fbbf24" /> {film.vote_average.toFixed(1)}
          </div>
        )}

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px 16px" }}>
          <h3 style={{ fontFamily: font, fontSize: "18px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.1, marginBottom: "6px" }}>
            {film.title}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {film.year && <span style={{ fontFamily: font, fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>{film.year}</span>}
            {film.runtime && <span style={{ fontFamily: font, fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: "3px" }}><Clock size={10} /> {formatRuntime(film.runtime)}</span>}
            {film.genres && (
              <span style={{ fontFamily: font, fontSize: "10px", fontWeight: 700, color: "#f0a030", opacity: 0.7 }}>
                {film.genres.split(", ").slice(0, 2).join(" · ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FilmModal({ film, onClose }: { film: FilmEntry; onClose: () => void }) {
  const isMobile = useIsMobile();
  const posterUrl = film.poster_path ? `https://image.tmdb.org/t/p/w500${film.poster_path}` : null;
  const backdropUrl = film.backdrop_path ? `https://image.tmdb.org/t/p/w1280${film.backdrop_path}` : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", background: "#0a0806", border: "1px solid rgba(240,160,48,0.15)", borderRadius: "6px", padding: isMobile ? "20px" : "32px", maxWidth: "640px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(240,160,48,0.05)" }}
      >
        {backdropUrl && (
          <div style={{ margin: isMobile ? "-20px -20px 16px" : "-32px -32px 16px", height: "140px", overflow: "hidden", borderRadius: "6px 6px 0 0", position: "relative" }}>
            <img src={backdropUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0a0806 0%, transparent 100%)" }} />
          </div>
        )}

        <div style={{ display: "flex", gap: "20px", flexDirection: isMobile ? "column" : "row" }}>
          {posterUrl && (
            <div style={{ flexShrink: 0, width: isMobile ? "100px" : "150px", height: isMobile ? "150px" : "225px", borderRadius: "4px", overflow: "hidden", border: "1px solid rgba(240,160,48,0.15)", boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>
              <img src={posterUrl} alt={film.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            {film.chosen && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: font, fontSize: "10px", fontWeight: 900, color: "#f0a030", background: "rgba(240,160,48,0.08)", border: "1px solid rgba(240,160,48,0.2)", padding: "3px 10px", borderRadius: "2px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
                <Trophy size={10} fill="rgba(240,160,48,0.5)" /> Film choisi
              </span>
            )}
            <h2 style={{ fontFamily: font, fontSize: isMobile ? "26px" : "34px", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: "10px" }}>
              {film.title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "12px" }}>
              {film.year && <span style={{ fontFamily: font, fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: "3px" }}><Calendar size={12} /> {film.year}</span>}
              {film.runtime && <span style={{ fontFamily: font, fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: "3px" }}><Clock size={12} /> {formatRuntime(film.runtime)}</span>}
              {film.vote_average && film.vote_average > 0 && <span style={{ fontFamily: font, fontSize: "13px", fontWeight: 800, color: "#fbbf24", display: "flex", alignItems: "center", gap: "3px" }}><Star size={12} fill="#fbbf24" color="#fbbf24" /> {film.vote_average.toFixed(1)}</span>}
            </div>
            {film.director && <p style={{ fontFamily: font, fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>Réalisateur : <strong style={{ color: "#fff", fontWeight: 800 }}>{film.director}</strong></p>}
            {film.genres && (
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {film.genres.split(", ").map((g) => (
                  <span key={g} style={{ fontFamily: font, fontSize: "10px", fontWeight: 700, color: "#f0a030", background: "rgba(240,160,48,0.06)", border: "1px solid rgba(240,160,48,0.12)", padding: "2px 8px", borderRadius: "2px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {film.synopsis && (
          <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "4px" }}>
            <p style={{ fontFamily: bodyFont, fontSize: isMobile ? "14px" : "15px", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>{film.synopsis}</p>
          </div>
        )}

        {film.trailer_key && (
          <a href={`https://www.youtube.com/watch?v=${film.trailer_key}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px", background: "rgba(229,9,20,0.08)", border: "1px solid rgba(229,9,20,0.2)", borderRadius: "4px", fontFamily: font, fontSize: "14px", fontWeight: 900, color: "#e50914", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", textDecoration: "none", marginTop: "12px" }}
          >
            <Youtube size={16} /> Voir la Bande-Annonce
          </a>
        )}

        <button onClick={onClose} style={{ width: "100%", padding: "12px", background: "#f0a030", border: "none", borderRadius: "4px", fontFamily: font, fontSize: "14px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", marginTop: "10px" }}>
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}

function TrailerOverlay({ trailerKey, onClose }: { trailerKey: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.96)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }} onClick={(e) => e.stopPropagation()}
        style={{ width: "min(900px, 100%)", aspectRatio: "16/9", borderRadius: "4px", overflow: "hidden", boxShadow: "0 0 100px rgba(229,9,20,0.15)" }}
      >
        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} title="Trailer" allow="autoplay; encrypted-media" allowFullScreen style={{ border: "none" }} />
      </motion.div>
      <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontFamily: font, fontSize: "16px", fontWeight: 900 }}>
        ✕
      </button>
    </motion.div>
  );
}

export default function FilmSemainePage() {
  const [films, setFilms] = useState<FilmEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilm, setSelectedFilm] = useState<FilmEntry | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch("/api/film-semaine")
      .then(async (r) => {
        const text = await r.text();
        if (!text) return { films: [] };
        try { return JSON.parse(text); } catch { return { error: "Réponse serveur invalide" }; }
      })
      .then((data) => {
        if (data.error) throw new Error(data.error === "SETUP_REQUIRED" ? "SETUP_REQUIRED" : data.error);
        setFilms(data.films ?? []);
        const currentWeeks = new Set<string>();
        const sorted = [...(data.films ?? [])].sort((a: FilmEntry, b: FilmEntry) => new Date(b.week_date).getTime() - new Date(a.week_date).getTime());
        if (sorted.length > 0) currentWeeks.add(sorted[0].week_label);
        setExpandedWeeks(currentWeeks);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const weeks = useMemo(() => {
    const map = new Map<string, FilmEntry[]>();
    for (const f of films) {
      if (!map.has(f.week_label)) map.set(f.week_label, []);
      map.get(f.week_label)!.push(f);
    }
    return [...map.entries()].sort(([, a], [, b]) => new Date(b[0].week_date).getTime() - new Date(a[0].week_date).getTime());
  }, [films]);

  const toggleWeek = (label: string) => {
    setExpandedWeeks((prev) => { const next = new Set(prev); if (next.has(label)) next.delete(label); else next.add(label); return next; });
  };

  const currentWeek = weeks[0];
  const chosenFilm = currentWeek?.[1]?.find((f: FilmEntry) => f.chosen);
  const otherFilms = currentWeek?.[1]?.filter((f: FilmEntry) => !f.chosen) ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0806", color: "#fff", fontFamily: font, position: "relative", overflowX: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-30%", right: "-20%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(240,160,48,0.04) 0%, transparent 60%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(229,9,20,0.03) 0%, transparent 60%)", filter: "blur(80px)" }} />
      </div>

      <GuildeHeader activePage="film-semaine" accentColor="#f0a030" bgColor="rgba(10,8,6,0.85)" />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: "20px", position: "relative", zIndex: 10 }}>
          <Loader2 size={36} color="#f0a030" className="animate-spin" />
          <p style={{ fontFamily: font, fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>Chargement de la programmation...</p>
        </div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: "16px", padding: "20px", textAlign: "center", position: "relative", zIndex: 10 }}>
          <AlertCircle size={36} color={error === "SETUP_REQUIRED" ? "#f0a030" : "#f87171"} />
          {error === "SETUP_REQUIRED" ? (
            <>
              <p style={{ fontFamily: font, fontSize: "16px", fontWeight: 900, color: "#f0a030", textTransform: "uppercase" }}>Table non créée</p>
              <p style={{ fontFamily: bodyFont, fontSize: "14px", color: "rgba(255,255,255,0.35)", maxWidth: "400px" }}>Exécute le script SQL dans Supabase.</p>
              <a href="https://supabase.com/dashboard/project/cocotbrclgjfqmdcffag/sql/new" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 24px", borderRadius: "4px", background: "#f0a030", color: "#000", fontWeight: 800, fontFamily: font, textDecoration: "none", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>SQL Editor</a>
            </>
          ) : (
            <p style={{ fontFamily: font, fontSize: "14px", fontWeight: 700, color: "#f87171" }}>{error}</p>
          )}
        </div>
      ) : films.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: "16px", position: "relative", zIndex: 10 }}>
          <Popcorn size={48} color="rgba(255,255,255,0.06)" />
          <p style={{ fontFamily: font, fontSize: "16px", fontWeight: 800, color: "rgba(255,255,255,0.15)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Aucun film programmé</p>
        </div>
      ) : (
        <div style={{ position: "relative", zIndex: 10 }}>
          {chosenFilm && (
            <>
              <HeroSection film={chosenFilm} onTrailer={() => chosenFilm.trailer_key && setTrailerKey(chosenFilm.trailer_key)} />

              {otherFilms.length > 0 && (
                <section style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "48px 24px 0" : "72px 48px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
                    <div style={{ width: "3px", height: "28px", background: "linear-gradient(to bottom, #f0a030, transparent)", borderRadius: "2px" }} />
                    <h2 style={{ fontFamily: font, fontSize: "20px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontStyle: "italic", letterSpacing: "0.04em" }}>
                      Les autres candidats
                    </h2>
                    <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(240,160,48,0.15), transparent)" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(190px, 1fr))", gap: isMobile ? "10px" : "14px" }}>
                    {otherFilms.map((film: FilmEntry, i: number) => (
                      <FilmCard key={film.id} film={film} index={i} onClick={() => setSelectedFilm(film)} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {!chosenFilm && currentWeek && (
            <section style={{ padding: isMobile ? "100px 24px 40px" : "140px 48px 40px", maxWidth: "1100px", margin: "0 auto" }}>
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: font, fontSize: "11px", fontWeight: 800, color: "#f0a030", letterSpacing: "0.25em", textTransform: "uppercase", background: "rgba(240,160,48,0.06)", border: "1px solid rgba(240,160,48,0.12)", padding: "6px 14px", borderRadius: "2px", marginBottom: "20px" }}>
                  <Popcorn size={12} /> Guilde Otaku · Soirées Discord
                </span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ fontSize: isMobile ? "clamp(44px,13vw,72px)" : "clamp(64px,9vw,110px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.85, textTransform: "uppercase", letterSpacing: "-0.04em", marginBottom: "20px" }}
              >
                FILM <span style={{ color: "#f0a030" }}>DE LA</span><br />SEMAINE
              </motion.h1>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(190px, 1fr))", gap: isMobile ? "10px" : "14px", marginTop: "48px" }}>
                {currentWeek[1].map((film: FilmEntry, i: number) => (
                  <FilmCard key={film.id} film={film} index={i} onClick={() => setSelectedFilm(film)} />
                ))}
              </div>
            </section>
          )}

          {weeks.length > 1 && (
            <section style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "56px 24px 80px" : "80px 48px 100px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "36px" }}>
                <div style={{ width: "3px", height: "28px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }} />
                <h2 style={{ fontFamily: font, fontSize: "20px", fontWeight: 800, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", fontStyle: "italic", letterSpacing: "0.04em" }}>
                  Semaines précédentes
                </h2>
                <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(255,255,255,0.05), transparent)" }} />
              </div>
              {weeks.slice(1).map(([weekLabel, weekFilms]) => {
                const isExpanded = expandedWeeks.has(weekLabel);
                const weekChosen = weekFilms.find((f: FilmEntry) => f.chosen);
                const weekOthers = weekFilms.filter((f: FilmEntry) => !f.chosen);
                return (
                  <div key={weekLabel} style={{ marginBottom: "28px" }}>
                    <button onClick={() => toggleWeek(weekLabel)} style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "none", borderLeft: "none", borderRight: "none", borderTop: "none", cursor: "pointer", padding: "0" }}>
                      <h3 style={{ fontFamily: font, fontSize: "18px", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontStyle: "italic" }}>{weekLabel}</h3>
                      <span style={{ fontFamily: font, fontSize: "11px", color: "rgba(255,255,255,0.15)", fontWeight: 600 }}>{weekFilms.length} films</span>
                      <div style={{ flex: 1 }} />
                      {isExpanded ? <ChevronUp size={14} color="rgba(255,255,255,0.2)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.2)" />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
                          {weekChosen && (
                            <div style={{ marginBottom: "14px", padding: "14px", background: "rgba(240,160,48,0.03)", border: "1px solid rgba(240,160,48,0.1)", borderRadius: "4px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }} onClick={() => setSelectedFilm(weekChosen)}>
                              {weekChosen.poster_path && <img src={`https://image.tmdb.org/t/p/w154${weekChosen.poster_path}`} alt="" style={{ width: "46px", height: "69px", objectFit: "cover", borderRadius: "3px", flexShrink: 0 }} />}
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                  <Trophy size={10} fill="rgba(240,160,48,0.5)" style={{ color: "#f0a030" }} />
                                  <span style={{ fontFamily: font, fontSize: "14px", fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>{weekChosen.title}</span>
                                </div>
                                <span style={{ fontFamily: font, fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{weekChosen.year} · {weekChosen.genres?.split(", ")[0]}</span>
                              </div>
                              {weekChosen.watched && <span style={{ fontFamily: font, fontSize: "10px", fontWeight: 800, color: "#22c55e", letterSpacing: "0.1em", textTransform: "uppercase" }}>Vu ✓</span>}
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(190px, 1fr))", gap: isMobile ? "10px" : "14px" }}>
                            {weekOthers.map((film: FilmEntry, i: number) => (
                              <FilmCard key={film.id} film={film} index={i} onClick={() => setSelectedFilm(film)} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedFilm && <FilmModal film={selectedFilm} onClose={() => setSelectedFilm(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {trailerKey && <TrailerOverlay trailerKey={trailerKey} onClose={() => setTrailerKey(null)} />}
      </AnimatePresence>
    </div>
  );
}
