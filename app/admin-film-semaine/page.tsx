"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "../hooks/useIsMobile";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { getAdminHeaders, getAdminFormDataHeaders } from "../../lib/admin-fetch";
import {
  Search, Plus, Trash2, Eye, EyeOff, Film, Loader2, Lock,
  Calendar, X, Check, Star, Clock, Trophy,
} from "lucide-react";

const font = "'Barlow Condensed', sans-serif";
const accent = "#e50914";
const colors = {
  bg: "#050505",
  bgCard: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  gold: "#c9a84c",
  textPrimary: "#fff",
  textSecondary: "rgba(255,255,255,0.5)",
  textMuted: "rgba(255,255,255,0.3)",
};

interface TmdbResult {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
}

interface TmdbDetails extends TmdbResult {
  runtime: number | null;
  genres: string;
  trailer_key: string | null;
  director: string | null;
}

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
}

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().split("T")[0];
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const endOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
  };
  return `Semaine du ${d.toLocaleDateString("fr-FR", options)}`;
}

export default function AdminFilmSemainePage() {
  const { authed: auth, password: pw, setPassword: setPw, login } = useAdminAuth();
  const [films, setFilms] = useState<FilmEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TmdbDetails | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [weekDate, setWeekDate] = useState(getMonday(new Date()));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  const loadFilms = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/film-semaine");
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setFilms(d.films ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth) loadFilms();
  }, [auth]);

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const r = await fetch(`/api/tmdb-search?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      setSearchResults(d.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onSearchChange = (val: string) => {
    setSearchQ(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(val), 400);
  };

  const selectMovie = async (m: TmdbResult) => {
    setFetchingDetails(true);
    try {
      const r = await fetch(`/api/tmdb-search?tmdb_id=${m.id}`);
      const d = await r.json();
      setSelectedMovie(d);
    } catch {
    } finally {
      setFetchingDetails(false);
    }
  };

  const addFilm = async () => {
    if (!selectedMovie) return;
    setSaving(true);
    setMessage(null);
    try {
      const r = await fetch("/api/film-semaine", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          title: selectedMovie.title,
          tmdb_id: selectedMovie.id,
          week_label: formatWeekLabel(weekDate),
          week_date: weekDate,
          poster_path: selectedMovie.poster_path,
          backdrop_path: selectedMovie.backdrop_path,
          synopsis: selectedMovie.overview,
          trailer_key: selectedMovie.trailer_key,
          vote_average: selectedMovie.vote_average,
          genres: selectedMovie.genres,
          year: selectedMovie.release_date
            ? parseInt(selectedMovie.release_date.split("-")[0])
            : null,
          runtime: selectedMovie.runtime,
          director: selectedMovie.director,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setMessage({ type: "ok", text: `"${selectedMovie.title}" ajouté !` });
      setSelectedMovie(null);
      setSearchQ("");
      setSearchResults([]);
      loadFilms();
    } catch (e: any) {
      setMessage({ type: "err", text: e.message ?? "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  const deleteFilm = async (id: number) => {
    if (!confirm("Supprimer ce film ?")) return;
    try {
      await fetch(`/api/film-semaine?id=${id}`, { method: "DELETE", headers: getAdminHeaders() });
      loadFilms();
    } catch {
    }
  };

  const toggleWatched = async (film: FilmEntry) => {
    try {
      await fetch(`/api/film-semaine?id=${film.id}`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ watched: !film.watched }),
      });
      loadFilms();
    } catch {
    }
  };

  const weeksList = useMemo(() => {
    const map = new Map<string, FilmEntry[]>();
    for (const f of films) {
      if (!map.has(f.week_label)) map.set(f.week_label, []);
      map.get(f.week_label)!.push(f);
    }
    return [...map.entries()].sort(([, a], [, b]) =>
      new Date(b[0].week_date).getTime() - new Date(a[0].week_date).getTime()
    );
  }, [films]);

  const toggleChosen = async (film: FilmEntry) => {
    try {
      await fetch(`/api/film-semaine?id=${film.id}`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ chosen: !film.chosen }),
      });
      loadFilms();
    } catch {
    }
  };

  if (!auth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: font,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: "24px",
            padding: "40px",
            width: "min(400px, 90vw)",
            textAlign: "center",
          }}
        >
          <Lock size={40} color={accent} style={{ marginBottom: "20px" }} />
          <h2
            style={{
              fontFamily: font,
              fontSize: "28px",
              fontWeight: 900,
              color: colors.textPrimary,
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Admin Film de la Semaine
          </h2>
          <input
            type="password"
            placeholder="Mot de passe"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              color: colors.textPrimary,
              fontFamily: font,
              fontSize: "16px",
              outline: "none",
              marginBottom: "16px",
              boxSizing: "border-box",
            }}
          />
        <button
          onClick={() => login()}
          style={{
              width: "100%",
              padding: "12px",
              background: accent,
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontFamily: font,
              fontSize: "16px",
              fontWeight: 900,
              textTransform: "uppercase",
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            Accéder
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.textPrimary,
        fontFamily: font,
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: isMobile ? "20px 16px 80px" : "40px 32px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <Film size={24} color={accent} />
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            Admin — Film de la Semaine
          </h1>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "20px",
              background:
                message.type === "ok"
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(248,113,113,0.1)",
              border:
                message.type === "ok"
                  ? "1px solid rgba(34,197,94,0.3)"
                  : "1px solid rgba(248,113,113,0.3)",
              color: message.type === "ok" ? "#22c55e" : "#f87171",
              fontFamily: font,
              fontSize: "14px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {message.text}
            <button
              onClick={() => setMessage(null)}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        <section
          style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "32px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus size={18} color={accent} /> Ajouter un film
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 800,
                color: colors.textMuted,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              <Calendar
                size={11}
                style={{
                  display: "inline",
                  verticalAlign: "middle",
                  marginRight: "4px",
                }}
              />{" "}
              Semaine (lundi)
            </label>
            <input
              type="date"
              value={weekDate}
              onChange={(e) => setWeekDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
                color: colors.textPrimary,
                fontFamily: font,
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <p
              style={{
                fontSize: "12px",
                color: colors.textMuted,
                marginTop: "4px",
              }}
            >
              {formatWeekLabel(weekDate)}
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 800,
                color: colors.textMuted,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              <Search
                size={11}
                style={{
                  display: "inline",
                  verticalAlign: "middle",
                  marginRight: "4px",
                }}
              />{" "}
              Chercher un film sur TMDB
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Ex: Interstellar, Your Name..."
                value={searchQ}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "10px",
                  color: colors.textPrimary,
                  fontFamily: font,
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {searching && (
                <Loader2
                  size={18}
                  className="animate-spin"
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: accent,
                  }}
                />
              )}
            </div>

            {searchResults.length > 0 && !selectedMovie && (
              <div
                style={{
                  marginTop: "8px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: `1px solid ${colors.border}`,
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectMovie(m)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "10px 14px",
                      background: colors.bgCard,
                      border: "none",
                      borderBottom: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: font,
                    }}
                  >
                    {m.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                        alt=""
                        style={{
                          width: "40px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "14px",
                          textTransform: "uppercase",
                        }}
                      >
                        {m.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: colors.textMuted,
                          marginTop: "2px",
                        }}
                      >
                        {m.release_date?.split("-")[0] ?? ""}{" "}
                        {m.vote_average > 0 && (
                          <span style={{ color: "#fbbf24" }}>
                            ★ {m.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {fetchingDetails && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: colors.textMuted,
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              <Loader2 size={16} className="animate-spin" /> Récupération des
              détails TMDB...
            </div>
          )}

          {selectedMovie && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: `${accent}08`,
                border: `1px solid ${accent}30`,
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    color: accent,
                  }}
                >
                  {selectedMovie.title}
                </h3>
                <button
                  onClick={() => {
                    setSelectedMovie(null);
                    setSearchQ("");
                    setSearchResults([]);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.textMuted,
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                {selectedMovie.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                    alt=""
                    style={{
                      width: "100px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginBottom: "8px",
                    }}
                  >
                    {selectedMovie.release_date && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: colors.textSecondary,
                        }}
                      >
                        <Calendar size={11} style={{ marginRight: "3px" }} />{" "}
                        {selectedMovie.release_date.split("-")[0]}
                      </span>
                    )}
                    {selectedMovie.runtime && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: colors.textSecondary,
                        }}
                      >
                        <Clock size={11} style={{ marginRight: "3px" }} />{" "}
                        {selectedMovie.runtime} min
                      </span>
                    )}
                    {selectedMovie.vote_average > 0 && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#fbbf24",
                          fontWeight: 800,
                        }}
                      >
                        <Star size={11} style={{ marginRight: "3px" }} />{" "}
                        {selectedMovie.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {selectedMovie.director && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: colors.textSecondary,
                        marginBottom: "6px",
                      }}
                    >
                      Réalisateur :{" "}
                      <strong style={{ color: "#fff" }}>
                        {selectedMovie.director}
                      </strong>
                    </p>
                  )}
                  {selectedMovie.genres && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: colors.textMuted,
                        marginBottom: "6px",
                      }}
                    >
                      {selectedMovie.genres}
                    </p>
                  )}
                  {selectedMovie.trailer_key && (
                    <a
                      href={`https://www.youtube.com/watch?v=${selectedMovie.trailer_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "12px",
                        color: accent,
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      ▶ Voir le trailer
                    </a>
                  )}
                  {selectedMovie.overview && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: colors.textSecondary,
                        lineHeight: 1.5,
                        marginTop: "8px",
                        maxHeight: "80px",
                        overflow: "hidden",
                      }}
                    >
                      {selectedMovie.overview}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={addFilm}
                disabled={saving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "12px",
                  background: accent,
                  border: "none",
                  borderRadius: "10px",
                  color: "#fff",
                  fontFamily: font,
                  fontSize: "15px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: saving ? "wait" : "pointer",
                  marginTop: "16px",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}{" "}
                {saving ? "Ajout en cours..." : "Ajouter à la semaine"}
              </button>
            </motion.div>
          )}
        </section>

        <section>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Film size={18} color={colors.gold} /> Films enregistrés
          </h2>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "40px 0",
              }}
            >
              <Loader2 size={32} className="animate-spin" color={accent} />
            </div>
          ) : films.length === 0 ? (
            <p style={{ color: colors.textMuted, fontSize: "16px", textAlign: "center", padding: "40px 0" }}>
              Aucun film pour le moment.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {weeksList.map(([weekLabel, weekFilms]) => {
                const chosenFilm = weekFilms.find(f => f.chosen);
                return (
                  <div key={weekLabel}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${colors.border}` }}>
                      <h3 style={{ fontFamily: font, fontSize: "16px", fontWeight: 900, color: colors.textSecondary, textTransform: "uppercase", fontStyle: "italic" }}>
                        {weekLabel}
                      </h3>
                      <span style={{ fontFamily: font, fontSize: "11px", color: colors.textMuted, fontWeight: 600 }}>
                        {weekFilms.length} film{weekFilms.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderRadius: "12px", overflow: "hidden" }}>
                      {weekFilms.map((film) => (
                        <div
                          key={film.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 16px",
                            background: film.chosen
                              ? "rgba(240,160,48,0.06)"
                              : film.watched
                              ? "rgba(34,197,94,0.04)"
                              : colors.bgCard,
                            borderBottom: `1px solid ${colors.border}`,
                            borderLeft: film.chosen ? "3px solid #f0a030" : "3px solid transparent",
                            transition: "background 0.2s",
                          }}
                        >
                          {film.poster_path && (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${film.poster_path}`}
                              alt=""
                              style={{ width: "36px", height: "54px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: "14px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                              {film.title}
                              {film.chosen && <Trophy size={13} style={{ color: "#f0a030" }} />}
                            </div>
                            <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
                              {film.year && `${film.year} · `}{film.genres?.split(", ").slice(0, 2).join(", ")}
                            </div>
                          </div>
                  <button
                    onClick={() => toggleChosen(film)}
                    title={film.chosen ? "Retirer le statut élu" : "Élire comme film de la semaine"}
                    style={{
                      background: film.chosen
                        ? "rgba(240,160,48,0.15)"
                        : colors.bgCard,
                      border: film.chosen
                        ? "1px solid rgba(240,160,48,0.3)"
                        : `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      color: film.chosen ? "#f0a030" : colors.textMuted,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontFamily: font,
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {film.chosen ? (
                      <>
                        <Trophy size={12} /> Élu
                      </>
                    ) : (
                      <>
                        <Trophy size={12} /> Élire
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => toggleWatched(film)}
                    title={film.watched ? "Marquer comme non vu" : "Marquer comme vu"}
                    style={{
                      background: film.watched
                        ? "rgba(34,197,94,0.15)"
                        : colors.bgCard,
                      border: film.watched
                        ? "1px solid rgba(34,197,94,0.3)"
                        : `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      color: film.watched ? "#22c55e" : colors.textMuted,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontFamily: font,
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {film.watched ? (
                      <>
                        <Eye size={12} /> Vu
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} /> À voir
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteFilm(film.id)}
                    style={{
                      background: "rgba(248,113,113,0.08)",
                      border: "1px solid rgba(248,113,113,0.15)",
                      borderRadius: "8px",
                      padding: "6px",
                      cursor: "pointer",
                      color: "#f87171",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
