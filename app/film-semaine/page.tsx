"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GuildeHeader from "../components/GuildeHeader";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  Film, Calendar, Clock, Star, Play, ChevronDown, ChevronUp,
  Eye, Popcorn, Loader2, AlertCircle, Youtube, Trophy, Sparkles,
} from "lucide-react";

const font = "'Barlow Condensed', sans-serif";
const accent = "#f0a030";

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
    <section style={{ position: "relative", minHeight: isMobile ? "85vh" : "90vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
      {backdropUrl && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <img src={backdropUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0c0a08 0%, rgba(12,10,8,0.85) 30%, rgba(12,10,8,0.5) 60%, rgba(12,10,8,0.7) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(240,160,48,0.08) 0%, transparent 60%)" }} />
        </div>
      )}

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "0 20px 40px" : "0 48px 60px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(240,160,48,0.15)", border: "1px solid rgba(240,160,48,0.3)", padding: "6px 14px", borderRadius: "100px", marginBottom: "16px", backdropFilter: "blur(12px)" }}>
            <Trophy size={14} style={{ color: accent }} />
            <span style={{ fontFamily: font, fontSize: "11px", fontWeight: 900, color: accent, letterSpacing: "0.2em", textTransform: "uppercase" }}>Film choisi de la semaine</span>
          </div>
        </motion.div>

        <div style={{ display: "flex", gap: isMobile ? "20px" : "32px", alignItems: "flex-end", flexDirection: isMobile ? "column" : "row" }}>
          {posterUrl && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{ flexShrink: 0, width: isMobile ? "140px" : "220px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(240,160,48,0.1)", border: "2px solid rgba(240,160,48,0.25)" }}
            >
              <img src={posterUrl} alt={film.title} style={{ width: "100%", display: "block" }} />
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} style={{ flex: 1, paddingBottom: isMobile ? "0" : "20px" }}>
            <h1 style={{ fontFamily: font, fontSize: isMobile ? "clamp(36px, 10vw, 56px)" : "clamp(48px, 6vw, 80px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 0.95, letterSpacing: "-0.02em", marginBottom: "12px", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
              {film.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
              {film.year && (
                <span style={{ fontFamily: font, fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={13} /> {film.year}
                </span>
              )}
              {film.runtime && (
                <span style={{ fontFamily: font, fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={13} /> {formatRuntime(film.runtime)}
                </span>
              )}
              {film.vote_average && film.vote_average > 0 && (
                <span style={{ fontFamily: font, fontSize: "14px", fontWeight: 900, color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Star size={13} fill="#fbbf24" color="#fbbf24" /> {film.vote_average.toFixed(1)}
                </span>
              )}
              {film.director && (
                <span style={{ fontFamily: font, fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                  {film.director}
                </span>
              )}
            </div>

            {film.genres && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                {film.genres.split(", ").map((g) => (
                  <span key={g} style={{ fontFamily: font, fontSize: "11px", fontWeight: 800, color: accent, background: "rgba(240,160,48,0.1)", border: "1px solid rgba(240,160,48,0.2)", padding: "3px 10px", borderRadius: "100px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {g}
                  </span>
                ))}
              </div>
            )}

            {film.synopsis && (
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? "14px" : "16px", fontWeight: 400, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", maxWidth: "600px", marginBottom: "20px", display: isMobile ? "-webkit-box" : "block", WebkitLineClamp: isMobile ? 3 : undefined, WebkitBoxOrient: "vertical", overflow: isMobile ? "hidden" : "visible" }}>
                {film.synopsis}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {film.trailer_key && (
                <button
                  onClick={onTrailer}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "rgba(229,9,20,0.9)", border: "none", borderRadius: "12px", fontFamily: font, fontSize: "14px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", boxShadow: "0 4px 20px rgba(229,9,20,0.3)" }}
                >
                  <Play size={16} fill="#fff" /> Bande-Annonce
                </button>
              )}
              {film.watched && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px", fontFamily: font, fontSize: "13px", fontWeight: 800, color: "#22c55e", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  <Eye size={14} /> Vu en soirtée
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      onClick={onClick}
      style={{ position: "relative", borderRadius: "16px", overflow: "hidden", cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.3s" }}
      whileHover={{ scale: 1.03, boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}
      whileTap={{ scale: 0.98 }}
    >
      <div style={{ height: "260px", overflow: "hidden", position: "relative", background: "#0a0a0a" }}>
        {posterUrl ? (
          <img src={posterUrl} alt={film.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Film size={40} color="rgba(255,255,255,0.1)" />
          </div>
        )}

        {film.chosen && (
          <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "100px", background: "rgba(240,160,48,0.9)", color: "#000", fontFamily: font, fontSize: "9px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <Trophy size={10} /> Élu
          </div>
        )}

        {film.watched && (
          <div style={{ position: "absolute", top: "10px", left: film.chosen ? "70px" : "10px", display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "100px", background: "rgba(34,197,94,0.85)", color: "#fff", fontFamily: font, fontSize: "9px", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <Eye size={9} /> Vu
          </div>
        )}

        {film.trailer_key && (
          <div style={{ position: "absolute", top: "10px", right: "10px", width: "30px", height: "30px", borderRadius: "50%", background: "rgba(229,9,20,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={12} fill="#fff" color="#fff" />
          </div>
        )}

        {film.vote_average && film.vote_average > 0 && (
          <div style={{ position: "absolute", bottom: "10px", right: "10px", display: "flex", alignItems: "center", gap: "3px", padding: "3px 7px", borderRadius: "6px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", fontFamily: font, fontSize: "11px", fontWeight: 800, color: "#fbbf24" }}>
            <Star size={10} fill="#fbbf24" color="#fbbf24" /> {film.vote_average.toFixed(1)}
          </div>
        )}
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        <h3 style={{ fontFamily: font, fontSize: "17px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.1, marginBottom: "6px" }}>
          {film.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {film.year && <span style={{ fontFamily: font, fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>{film.year}</span>}
          {film.runtime && <span style={{ fontFamily: font, fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: "3px" }}><Clock size={9} /> {formatRuntime(film.runtime)}</span>}
          {film.genres && (
            <span style={{ fontFamily: font, fontSize: "10px", fontWeight: 700, color: accent, opacity: 0.7 }}>
              {film.genres.split(", ")[0]}
            </span>
          )}
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
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", background: "#0c0a08", border: "1px solid rgba(240,160,48,0.2)", borderRadius: "20px", padding: isMobile ? "20px" : "32px", maxWidth: "650px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 0 60px rgba(240,160,48,0.08)" }}
      >
        {backdropUrl && (
          <div style={{ margin: isMobile ? "-20px -20px 16px" : "-32px -32px 16px", height: "160px", overflow: "hidden", borderRadius: "20px 20px 0 0" }}>
            <img src={backdropUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "160px", background: "linear-gradient(to top, #0c0a08 0%, transparent 100%)" }} />
          </div>
        )}

        <div style={{ display: "flex", gap: "20px", flexDirection: isMobile ? "column" : "row" }}>
          {posterUrl && (
            <div style={{ flexShrink: 0, width: isMobile ? "100px" : "140px", height: isMobile ? "150px" : "210px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(240,160,48,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
              <img src={posterUrl} alt={film.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            {film.chosen && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: font, fontSize: "10px", fontWeight: 900, color: accent, background: "rgba(240,160,48,0.1)", border: "1px solid rgba(240,160,48,0.25)", padding: "3px 10px", borderRadius: "100px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>
                <Trophy size={10} /> Film choisi
              </span>
            )}
            <h2 style={{ fontFamily: font, fontSize: isMobile ? "24px" : "32px", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: "8px" }}>
              {film.title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "12px" }}>
              {film.year && <span style={{ fontFamily: font, fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "3px" }}><Calendar size={12} /> {film.year}</span>}
              {film.runtime && <span style={{ fontFamily: font, fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "3px" }}><Clock size={12} /> {formatRuntime(film.runtime)}</span>}
              {film.vote_average && film.vote_average > 0 && <span style={{ fontFamily: font, fontSize: "13px", fontWeight: 800, color: "#fbbf24", display: "flex", alignItems: "center", gap: "3px" }}><Star size={12} fill="#fbbf24" color="#fbbf24" /> {film.vote_average.toFixed(1)}</span>}
            </div>
            {film.director && <p style={{ fontFamily: font, fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>Réalisateur : <strong style={{ color: "#fff", fontWeight: 800 }}>{film.director}</strong></p>}
            {film.genres && (
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {film.genres.split(", ").map((g) => (
                  <span key={g} style={{ fontFamily: font, fontSize: "10px", fontWeight: 700, color: accent, background: "rgba(240,160,48,0.08)", border: "1px solid rgba(240,160,48,0.15)", padding: "2px 7px", borderRadius: "100px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {film.synopsis && (
          <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? "14px" : "15px", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>{film.synopsis}</p>
          </div>
        )}

        {film.trailer_key && (
          <a href={`https://www.youtube.com/watch?v=${film.trailer_key}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px", background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.25)", borderRadius: "10px", fontFamily: font, fontSize: "14px", fontWeight: 900, color: "#e50914", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", textDecoration: "none", marginTop: "12px" }}
          >
            <Youtube size={16} /> Voir la Bande-Annonce
          </a>
        )}

        <button onClick={onClose} style={{ width: "100%", padding: "12px", background: accent, border: "none", borderRadius: "10px", fontFamily: font, fontSize: "14px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", marginTop: "10px" }}>
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}

function TrailerOverlay({ trailerKey, onClose }: { trailerKey: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}
        style={{ width: "min(900px, 100%)", aspectRatio: "16/9", borderRadius: "16px", overflow: "hidden", boxShadow: "0 0 80px rgba(229,9,20,0.2)" }}
      >
        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} title="Trailer" allow="autoplay; encrypted-media" allowFullScreen style={{ border: "none" }} />
      </motion.div>
      <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: "20px" }}>
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
    <div style={{ minHeight: "100vh", background: "#0c0a08", color: "#fff", fontFamily: font, position: "relative", overflowX: "hidden" }}>
      <GuildeHeader activePage="film-semaine" accentColor={accent} bgColor="rgba(12,10,8,0.85)" />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: "20px" }}>
          <Loader2 size={40} color={accent} className="animate-spin" />
          <p style={{ fontFamily: font, fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>Chargement...</p>
        </div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: "16px", padding: "20px", textAlign: "center" }}>
          <AlertCircle size={40} color={error === "SETUP_REQUIRED" ? accent : "#f87171"} />
          {error === "SETUP_REQUIRED" ? (
            <>
              <p style={{ fontFamily: font, fontSize: "18px", fontWeight: 900, color: accent, textTransform: "uppercase" }}>Table non créée</p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.4)", maxWidth: "400px" }}>Exécute le script SQL dans Supabase pour créer la table film_semaine.</p>
              <a href="https://supabase.com/dashboard/project/cocotbrclgjfqmdcffag/sql/new" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 24px", borderRadius: "10px", background: accent, color: "#000", fontWeight: 800, fontFamily: font, textDecoration: "none", fontSize: "13px", textTransform: "uppercase" }}>Ouvrir SQL Editor</a>
            </>
          ) : (
            <p style={{ fontFamily: font, fontSize: "14px", fontWeight: 700, color: "#f87171" }}>{error}</p>
          )}
        </div>
      ) : films.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: "16px" }}>
          <Popcorn size={56} color="rgba(255,255,255,0.08)" />
          <p style={{ fontFamily: font, fontSize: "18px", fontWeight: 800, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>Aucun film programmé</p>
        </div>
      ) : (
        <>
          {chosenFilm && (
            <>
              <HeroSection
                film={chosenFilm}
                onTrailer={() => chosenFilm.trailer_key && setTrailerKey(chosenFilm.trailer_key)}
              />

              {otherFilms.length > 0 && (
                <section style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "40px 20px 0" : "60px 48px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                    <div style={{ width: "4px", height: "24px", background: accent, borderRadius: "2px", flexShrink: 0 }} />
                    <h2 style={{ fontFamily: font, fontSize: "22px", fontWeight: 900, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontStyle: "italic" }}>
                      Les autres films de la semaine
                    </h2>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(180px, 1fr))", gap: isMobile ? "10px" : "14px" }}>
                    {otherFilms.map((film: FilmEntry, i: number) => (
                      <FilmCard key={film.id} film={film} index={i} onClick={() => setSelectedFilm(film)} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {!chosenFilm && currentWeek && (
            <section style={{ padding: isMobile ? "80px 20px 40px" : "120px 48px 40px", maxWidth: "1100px", margin: "0 auto" }}>
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: font, fontSize: "12px", fontWeight: 800, color: accent, letterSpacing: "0.25em", textTransform: "uppercase", background: "rgba(240,160,48,0.08)", border: "1px solid rgba(240,160,48,0.15)", padding: "6px 14px", borderRadius: "100px", marginBottom: "16px" }}>
                  <Popcorn size={13} /> Guilde Otaku · Soirées Discord
                </span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ fontSize: isMobile ? "clamp(40px,12vw,64px)" : "clamp(56px,7vw,96px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9, textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: "20px" }}
              >
                FILM <span style={{ color: accent }}>DE LA SEMAINE</span>
              </motion.h1>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(180px, 1fr))", gap: isMobile ? "10px" : "14px", marginTop: "40px" }}>
                {currentWeek[1].map((film: FilmEntry, i: number) => (
                  <FilmCard key={film.id} film={film} index={i} onClick={() => setSelectedFilm(film)} />
                ))}
              </div>
            </section>
          )}

          {weeks.length > 1 && (
            <section style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "48px 20px 80px" : "60px 48px 100px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
                <div style={{ width: "4px", height: "24px", background: "rgba(255,255,255,0.15)", borderRadius: "2px" }} />
                <h2 style={{ fontFamily: font, fontSize: "22px", fontWeight: 900, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", fontStyle: "italic" }}>
                  Semaines précédentes
                </h2>
              </div>
              {weeks.slice(chosenFilm ? 1 : 1).map(([weekLabel, weekFilms]) => {
                const isExpanded = expandedWeeks.has(weekLabel);
                const weekChosen = weekFilms.find((f: FilmEntry) => f.chosen);
                const weekOthers = weekFilms.filter((f: FilmEntry) => !f.chosen);
                return (
                  <div key={weekLabel} style={{ marginBottom: "32px" }}>
                    <button onClick={() => toggleWeek(weekLabel)} style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "none", borderLeft: "none", borderRight: "none", borderTop: "none", cursor: "pointer", padding: "0" }}>
                      <h3 style={{ fontFamily: font, fontSize: "20px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontStyle: "italic" }}>{weekLabel}</h3>
                      <span style={{ fontFamily: font, fontSize: "11px", color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>{weekFilms.length} films</span>
                      <div style={{ flex: 1 }} />
                      {isExpanded ? <ChevronUp size={16} color="rgba(255,255,255,0.25)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.25)" />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
                          {weekChosen && (
                            <div style={{ marginBottom: "16px", padding: "16px", background: "rgba(240,160,48,0.04)", border: "1px solid rgba(240,160,48,0.12)", borderRadius: "14px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }} onClick={() => setSelectedFilm(weekChosen)}>
                              {weekChosen.poster_path && <img src={`https://image.tmdb.org/t/p/w154${weekChosen.poster_path}`} alt="" style={{ width: "50px", height: "75px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />}
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                  <Trophy size={11} color={accent} />
                                  <span style={{ fontFamily: font, fontSize: "15px", fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>{weekChosen.title}</span>
                                </div>
                                <span style={{ fontFamily: font, fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{weekChosen.year} · {weekChosen.genres?.split(", ")[0]}</span>
                              </div>
                              {weekChosen.watched && <span style={{ fontFamily: font, fontSize: "10px", fontWeight: 800, color: "#22c55e", letterSpacing: "0.1em", textTransform: "uppercase" }}>Vu ✓</span>}
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(180px, 1fr))", gap: isMobile ? "10px" : "14px" }}>
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
        </>
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
