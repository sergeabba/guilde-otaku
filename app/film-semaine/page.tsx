"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GuildeHeader from "../components/GuildeHeader";
import OptimizedImage from "../components/OptimizedImage";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  Film, Calendar, Clock, Star, Play, ChevronDown, ChevronUp,
  Eye, Popcorn, Loader2, AlertCircle, Youtube,
} from "lucide-react";

const font = "'Barlow Condensed', sans-serif";
const accent = "#e50914";

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
  created_at: string;
}

function formatRuntime(min: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? m : ""}` : `${m}min`;
}

function FilmCard({
  film,
  index,
  onSelect,
}: {
  film: FilmEntry;
  index: number;
  onSelect: () => void;
}) {
  const isMobile = useIsMobile();
  const posterUrl = film.poster_path
    ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
    : null;
  const backdropUrl = film.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${film.backdrop_path}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onClick={onSelect}
      style={{
        position: "relative",
        borderRadius: "20px",
        overflow: "hidden",
        cursor: "pointer",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 20px 40px rgba(229,9,20,0.15)`,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {backdropUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            opacity: 0.15,
          }}
        >
          <img
            src={backdropUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            height: "280px",
            overflow: "hidden",
            borderRadius: "20px 20px 0 0",
            position: "relative",
            background: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={film.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.5s",
              }}
            />
          ) : (
            <Film size={48} color="rgba(255,255,255,0.15)" />
          )}

          {film.watched && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                borderRadius: "100px",
                background: "rgba(34,197,94,0.9)",
                color: "#fff",
                fontFamily: font,
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                backdropFilter: "blur(8px)",
              }}
            >
              <Eye size={11} /> Vu
            </div>
          )}

          {film.trailer_key && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(229,9,20,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
              }}
            >
              <Play size={16} fill="#fff" color="#fff" />
            </div>
          )}

          {film.vote_average && film.vote_average > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                right: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "8px",
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                fontFamily: font,
                fontSize: "12px",
                fontWeight: 800,
                color: "#fbbf24",
              }}
            >
              <Star size={11} fill="#fbbf24" color="#fbbf24" />
              {film.vote_average.toFixed(1)}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 20px 20px" }}>
          <h3
            style={{
              fontFamily: font,
              fontSize: "20px",
              fontWeight: 900,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: 1.1,
              marginBottom: "8px",
            }}
          >
            {film.title}
          </h3>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "10px",
            }}
          >
            {film.year && (
              <span
                style={{
                  fontFamily: font,
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Calendar size={11} /> {film.year}
              </span>
            )}
            {film.runtime && (
              <span
                style={{
                  fontFamily: font,
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Clock size={11} /> {formatRuntime(film.runtime)}
              </span>
            )}
          </div>

          {film.genres && (
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {film.genres.split(", ").map((g) => (
                <span
                  key={g}
                  style={{
                    fontFamily: font,
                    fontSize: "10px",
                    fontWeight: 700,
                    color: accent,
                    background: `${accent}15`,
                    border: `1px solid ${accent}30`,
                    padding: "2px 8px",
                    borderRadius: "100px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FilmModal({
  film,
  onClose,
}: {
  film: FilmEntry;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const posterUrl = film.poster_path
    ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
    : null;
  const backdropUrl = film.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${film.backdrop_path}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#0d0d14",
          border: `1px solid ${accent}40`,
          borderRadius: "24px",
          padding: isMobile ? "24px" : "40px",
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: `0 0 60px ${accent}20`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "20px",
            right: "20px",
            height: "3px",
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            borderRadius: "0 0 4px 4px",
          }}
        />

        {backdropUrl && (
          <div
            style={{
              width: "calc(100% + 80px)",
              marginLeft: isMobile ? "-24px" : "-40px",
              marginTop: isMobile ? "-24px" : "-40px",
              marginRight: isMobile ? "-24px" : "-40px",
              height: "200px",
              overflow: "hidden",
              borderRadius: "24px 24px 0 0",
              marginBottom: "20px",
            }}
          >
            <img
              src={backdropUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "200px",
                background:
                  "linear-gradient(to top, #0d0d14 0%, rgba(13,13,20,0.4) 60%, transparent 100%)",
                marginTop: isMobile ? "-24px" : "-40px",
              }}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "24px",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {posterUrl && (
            <div
              style={{
                flexShrink: 0,
                width: isMobile ? "120px" : "160px",
                height: isMobile ? "180px" : "240px",
                borderRadius: "12px",
                overflow: "hidden",
                border: `1px solid ${accent}30`,
                boxShadow: `0 10px 30px rgba(0,0,0,0.5)`,
              }}
            >
              <img
                src={posterUrl}
                alt={film.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
                flexWrap: "wrap",
              }}
            >
              {film.watched && (
                <span
                  style={{
                    fontFamily: font,
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#22c55e",
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    padding: "3px 10px",
                    borderRadius: "100px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  <Eye
                    size={11}
                    style={{
                      display: "inline",
                      verticalAlign: "middle",
                      marginRight: "4px",
                    }}
                  />
                  Vu en soirtée
                </span>
              )}
              {film.genres &&
                film.genres.split(", ").map((g) => (
                  <span
                    key={g}
                    style={{
                      fontFamily: font,
                      fontSize: "10px",
                      fontWeight: 700,
                      color: accent,
                      background: `${accent}12`,
                      border: `1px solid ${accent}25`,
                      padding: "2px 8px",
                      borderRadius: "100px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {g}
                  </span>
                ))}
            </div>

            <h2
              style={{
                fontFamily: font,
                fontSize: isMobile ? "28px" : "36px",
                fontWeight: 900,
                color: "#fff",
                textTransform: "uppercase",
                fontStyle: "italic",
                lineHeight: 1,
                marginBottom: "8px",
              }}
            >
              {film.title}
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                marginBottom: "16px",
              }}
            >
              {film.year && (
                <span
                  style={{
                    fontFamily: font,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Calendar size={13} /> {film.year}
                </span>
              )}
              {film.runtime && (
                <span
                  style={{
                    fontFamily: font,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Clock size={13} /> {formatRuntime(film.runtime)}
                </span>
              )}
              {film.vote_average && film.vote_average > 0 && (
                <span
                  style={{
                    fontFamily: font,
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#fbbf24",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Star size={13} fill="#fbbf24" color="#fbbf24" />{" "}
                  {film.vote_average.toFixed(1)}/10
                </span>
              )}
            </div>

            {film.director && (
              <p
                style={{
                  fontFamily: font,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "12px",
                }}
              >
                Réalisateur :{" "}
                <span style={{ color: "#fff", fontWeight: 800 }}>
                  {film.director}
                </span>
              </p>
            )}
          </div>
        </div>

        {film.synopsis && (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: isMobile ? "15px" : "16px",
                fontWeight: 400,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {film.synopsis}
            </p>
          </div>
        )}

        {film.trailer_key && (
          <a
            href={`https://www.youtube.com/watch?v=${film.trailer_key}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "14px",
              background: "rgba(229,9,20,0.1)",
              border: "1px solid rgba(229,9,20,0.3)",
              borderRadius: "12px",
              fontFamily: font,
              fontSize: "16px",
              fontWeight: 900,
              color: accent,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
              textDecoration: "none",
              marginBottom: "12px",
            }}
          >
            <Youtube size={18} /> Voir la Bande-Annonce
          </a>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px",
            background: accent,
            border: "none",
            borderRadius: "12px",
            fontFamily: font,
            fontSize: "16px",
            fontWeight: 900,
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          FERMER
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function FilmSemainePage() {
  const [films, setFilms] = useState<FilmEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilm, setSelectedFilm] = useState<FilmEntry | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch("/api/film-semaine")
      .then(async (r) => {
        const text = await r.text();
        if (!text) return { films: [] };
        try {
          return JSON.parse(text);
        } catch {
          return { error: "Réponse serveur invalide" };
        }
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        if (data.needsSetup) throw new Error("SETUP_REQUIRED");
        setFilms(data.films ?? []);
        const currentWeeks = new Set<string>();
        const sorted = [...(data.films ?? [])].sort(
          (a: FilmEntry, b: FilmEntry) =>
            new Date(b.week_date).getTime() - new Date(a.week_date).getTime()
        );
        if (sorted.length > 0) currentWeeks.add(sorted[0].week_label);
        setExpandedWeeks(currentWeeks);
      })
      .catch((e) => setError(e.message === "SETUP_REQUIRED" ? "SETUP_REQUIRED" : e.message))
      .finally(() => setLoading(false));
  }, []);

  const weeks = useMemo(() => {
    const map = new Map<string, FilmEntry[]>();
    for (const f of films) {
      if (!map.has(f.week_label)) map.set(f.week_label, []);
      map.get(f.week_label)!.push(f);
    }
    const entries = [...map.entries()].sort(([, a], [, b]) => {
      const da = a[0]?.week_date ? new Date(a[0].week_date).getTime() : 0;
      const db = b[0]?.week_date ? new Date(b[0].week_date).getTime() : 0;
      return db - da;
    });
    return entries;
  }, [films]);

  const toggleWeek = (label: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        fontFamily: font,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "60vw",
            height: "60vw",
            background: `radial-gradient(circle, rgba(229,9,20,0.08) 0%, transparent 65%)`,
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "-10%",
            width: "50vw",
            height: "50vw",
            background: "radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <GuildeHeader activePage="film-semaine" accentColor={accent} />

      <div style={{ position: "relative", zIndex: 10 }}>
        <section
          style={{
            padding: isMobile ? "60px 20px 40px" : "90px 48px 60px",
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p
              style={{
                fontFamily: font,
                fontSize: "12px",
                fontWeight: 800,
                color: accent,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: "16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: `${accent}12`,
                padding: "8px 16px",
                borderRadius: "100px",
                border: `1px solid ${accent}25`,
              }}
            >
              <Popcorn size={14} /> Guilde Otaku · Soirées Discord
            </p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: isMobile
                ? "clamp(40px,12vw,64px)"
                : "clamp(72px,9vw,120px)",
              fontWeight: 900,
              fontStyle: "italic",
              lineHeight: 0.9,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              marginBottom: "24px",
            }}
          >
            FILM <span style={{ color: accent }}>DE LA SEMAINE</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: isMobile ? "16px" : "18px",
              color: "rgba(255,255,255,0.5)",
              maxWidth: "520px",
              lineHeight: 1.6,
            }}
          >
            La programmation cinéma de la Guilde. Chaque semaine, on vote sur
            le groupe et on se retrouve sur Discord pour mater les films
            sélectionnés.
          </motion.p>
        </section>

        <section
          style={{
            padding: isMobile ? "0 20px 80px" : "0 48px 100px",
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "40vh",
                gap: "20px",
              }}
            >
              <Loader2
                size={48}
                color={accent}
                className="animate-spin"
              />
              <p
                style={{
                  fontFamily: font,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Chargement de la programmation...
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "40vh",
                gap: "16px",
                padding: "0 20px",
                textAlign: "center",
              }}
            >
              <AlertCircle size={48} color={error === "SETUP_REQUIRED" ? accent : "#f87171"} />
              {error === "SETUP_REQUIRED" ? (
                <>
                  <p style={{ fontFamily: font, fontSize: "20px", fontWeight: 900, color: accent, textTransform: "uppercase" }}>
                    Table non créée
                  </p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.5)", maxWidth: "500px", lineHeight: 1.6 }}>
                    La table <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", fontSize: "13px" }}>film_semaine</code> n'existe pas encore dans Supabase. Exécute le script SQL dans le SQL Editor de Supabase pour la créer.
                  </p>
                  <a
                    href="https://supabase.com/dashboard/project/cocotbrclgjfqmdcffag/sql/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "10px 24px",
                      borderRadius: "10px",
                      border: "none",
                      background: accent,
                      color: "#fff",
                      fontWeight: 800,
                      fontFamily: font,
                      cursor: "pointer",
                      textDecoration: "none",
                      fontSize: "14px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Ouvrir Supabase SQL Editor
                  </a>
                </>
              ) : (
                <>
                  <p style={{ fontFamily: font, fontSize: "16px", fontWeight: 700, color: "#f87171" }}>
                    {error}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "10px",
                      border: "none",
                      background: accent,
                      color: "#fff",
                      fontWeight: 800,
                      fontFamily: font,
                      cursor: "pointer",
                    }}
                  >
                    Réessayer
                  </button>
                </>
              )}
            </div>
          ) : weeks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
              }}
            >
              <Popcorn
                size={64}
                color="rgba(255,255,255,0.1)"
                style={{ marginBottom: "16px" }}
              />
              <p
                style={{
                  fontFamily: font,
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Aucun film programmé pour le moment
              </p>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.2)",
                  marginTop: "8px",
                }}
              >
                Les films de la semaine apparaîtront ici.
              </p>
            </div>
          ) : (
            weeks.map(([weekLabel, weekFilms]) => {
              const isExpanded = expandedWeeks.has(weekLabel);
              const allWatched = weekFilms.every((f) => f.watched);
              const isCurrentWeek =
                weeks[0]?.[0] === weekLabel && !allWatched;

              return (
                <div key={weekLabel} style={{ marginBottom: "40px" }}>
                  <button
                    onClick={() => toggleWeek(weekLabel)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      width: "100%",
                      marginBottom: "20px",
                      paddingBottom: "14px",
                      borderBottom: `1px solid ${
                        isCurrentWeek
                          ? `${accent}30`
                          : "rgba(255,255,255,0.06)"
                      }`,
                      background: "none",
                      borderLeft: "none",
                      borderRight: "none",
                      borderTop: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: "0",
                    }}
                  >
                    <div
                      style={{
                        width: "5px",
                        height: "32px",
                        background: isCurrentWeek ? accent : "rgba(255,255,255,0.15)",
                        borderRadius: "3px",
                        boxShadow: isCurrentWeek
                          ? `0 0 12px ${accent}40`
                          : "none",
                        flexShrink: 0,
                      }}
                    />
                    <h2
                      style={{
                        fontFamily: font,
                        fontSize: "28px",
                        fontWeight: 900,
                        color: isCurrentWeek ? accent : "rgba(255,255,255,0.5)",
                        textTransform: "uppercase",
                        fontStyle: "italic",
                        letterSpacing: "-0.01em",
                        lineHeight: 1,
                      }}
                    >
                      {weekLabel}
                    </h2>
                    {isCurrentWeek && (
                      <span
                        style={{
                          fontFamily: font,
                          fontSize: "10px",
                          fontWeight: 800,
                          color: "#fff",
                          background: accent,
                          padding: "3px 10px",
                          borderRadius: "100px",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                        }}
                      >
                        En cours
                      </span>
                    )}
                    {allWatched && !isCurrentWeek && (
                      <span
                        style={{
                          fontFamily: font,
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#22c55e",
                          background: "rgba(34,197,94,0.1)",
                          border: "1px solid rgba(34,197,94,0.2)",
                          padding: "2px 8px",
                          borderRadius: "100px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Terminé
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: font,
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.25)",
                        fontWeight: 600,
                        marginLeft: "4px",
                      }}
                    >
                      {weekFilms.length} film{weekFilms.length > 1 ? "s" : ""}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: `linear-gradient(90deg, ${
                          isCurrentWeek ? `${accent}20` : "rgba(255,255,255,0.04)"
                        }, transparent)`,
                      }}
                    />
                    {isExpanded ? (
                      <ChevronUp
                        size={20}
                        color="rgba(255,255,255,0.3)"
                      />
                    ) : (
                      <ChevronDown
                        size={20}
                        color="rgba(255,255,255,0.3)"
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: isMobile
                              ? "repeat(2, 1fr)"
                              : "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: isMobile ? "10px" : "16px",
                          }}
                        >
                          {weekFilms.map((film, i) => (
                            <FilmCard
                              key={film.id}
                              film={film}
                              index={i}
                              onSelect={() => setSelectedFilm(film)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </section>
      </div>

      <AnimatePresence>
        {selectedFilm && (
          <FilmModal
            film={selectedFilm}
            onClose={() => setSelectedFilm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
