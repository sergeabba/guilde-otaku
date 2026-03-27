"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Search, Check, X, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type Tier = "Chef-d'œuvre" | "Pépite" | "Bof" | "Surcoté" | "A définir";

interface BulkResult {
  query: string;
  found: boolean;
  media: any | null;
  // État local
  selected: boolean;
  tier: Tier;
  note: number;
  overrideSynopsis: string;
}

const TIER_COLORS: Record<Tier, string> = {
  "Chef-d'œuvre": "#FFD700",
  "Pépite": "#34d399",
  "Bof": "#94a3b8",
  "Surcoté": "#f87171",
  "A définir": "#a1a1aa",
};

export default function BulkImportPage() {
  const [rawInput, setRawInput] = useState("");
  const [results, setResults] = useState<BulkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const handleSearch = async () => {
    const titles = rawInput
      .split("\n")
      .map(t => t.trim())
      .filter(Boolean);
    
    if (!titles.length) return;
    setLoading(true);
    setResults([]);

    const res = await fetch("/api/anilist-bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titles }),
    });
    const data = await res.json();

    setResults(data.results.map((r: any) => ({
      ...r,
      selected: r.found,
      tier: r.media?.autoTier ?? "A définir",
      note: r.media?.score ?? 0,
      overrideSynopsis: "",
    })));
    setLoading(false);
  };

  const toggle = (i: number) => setResults(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const setTier = (i: number, tier: Tier) => setResults(prev => prev.map((r, idx) => idx === i ? { ...r, tier } : r));
  const setNote = (i: number, note: number) => setResults(prev => prev.map((r, idx) => idx === i ? { ...r, note } : r));

  const handleSaveSelected = async () => {
    const toSave = results.filter(r => r.selected && r.found && r.media);
    if (!toSave.length) return;
    setSaving(true);
    let count = 0;

    for (const item of toSave) {
      const { error } = await supabase.from("bibliotheque").insert({
        title: item.media.title,
        type: item.media.type,
        cover_image: item.media.cover,
        banner_image: item.media.banner ?? null,
        score: item.note,
        tier: item.tier,
        status: item.media.status,
        synopsis: item.overrideSynopsis.trim() || item.media.synopsis,
        year: item.media.year,
        episodes: item.media.episodes,
        genres: item.media.genres,
        studio: item.media.studio,
        trailer_url: item.media.trailerUrl,
      });
      if (!error) count++;
    }

    setSavedCount(count);
    setSaving(false);
    // Retire les sauvegardés de la liste
    setResults(prev => prev.filter(r => !r.selected || !r.found));
  };

  const selectedCount = results.filter(r => r.selected && r.found).length;

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", padding: "60px 40px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <Link href="/admin-biblio" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "13px", letterSpacing: "0.1em" }}>← Admin Bibliothèque</Link>
          <h1 style={{ fontSize: "clamp(40px,8vw,72px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "#fff", lineHeight: 0.9, marginTop: "16px" }}>
            BULK <span style={{ color: "#c9a84c" }}>IMPORT</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "12px", fontSize: "15px", lineHeight: 1.5 }}>
            Colle une liste de titres (un par ligne). AniList va chercher tout ça d'un coup, le tier est auto-calculé selon le score.
          </p>
        </div>

        {/* Succès */}
        {savedCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "12px", marginBottom: "24px" }}>
            <Check size={18} color="#34d399" />
            <p style={{ color: "#34d399", fontWeight: 900, fontSize: "16px" }}>{savedCount} œuvre{savedCount > 1 ? "s" : ""} ajoutée{savedCount > 1 ? "s" : ""} avec succès !</p>
            <button onClick={() => setSavedCount(0)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}><X size={14} /></button>
          </div>
        )}

        {/* Zone de saisie */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "28px", marginBottom: "28px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px" }}>
            LISTE DES TITRES (1 PAR LIGNE)
          </label>
          <textarea
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            rows={8}
            placeholder={"Frieren\nOne Piece\nDemon Slayer\nVinland Saga\nChainsaw Man"}
            style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", resize: "vertical", lineHeight: 1.7, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
              {rawInput.split("\n").filter(t => t.trim()).length} titre{rawInput.split("\n").filter(t => t.trim()).length > 1 ? "s" : ""} détecté{rawInput.split("\n").filter(t => t.trim()).length > 1 ? "s" : ""}
            </span>
            <button
              onClick={handleSearch}
              disabled={loading || !rawInput.trim()}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: loading ? "rgba(201,168,76,0.4)" : "#c9a84c", border: "none", borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "15px", color: "#000", textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Recherche en cours...</> : <><Search size={16} /> Rechercher tout</>}
            </button>
          </div>
        </div>

        {/* Résultats */}
        {results.length > 0 && (
          <>
            {/* Barre d'action sticky */}
            <div style={{ position: "sticky", top: "16px", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "rgba(5,5,8,0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "#c9a84c" }}>{selectedCount}</span>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>sélectionné{selectedCount > 1 ? "s" : ""} sur {results.filter(r => r.found).length} trouvé{results.filter(r => r.found).length > 1 ? "s" : ""}</span>
              </div>
              <button
                onClick={handleSaveSelected}
                disabled={saving || selectedCount === 0}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", background: selectedCount === 0 ? "rgba(74,222,128,0.3)" : "#4ade80", border: "none", borderRadius: "10px", cursor: selectedCount === 0 ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "14px", color: "#000", textTransform: "uppercase" }}
              >
                {saving ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Sauvegarde...</> : <><Check size={15} /> Sauvegarder la sélection</>}
              </button>
            </div>

            {/* Liste des résultats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  display: "flex", gap: "16px",
                  padding: "16px", borderRadius: "14px",
                  background: r.selected && r.found ? "rgba(201,168,76,0.05)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${r.selected && r.found ? "rgba(201,168,76,0.25)" : r.found ? "rgba(255,255,255,0.07)" : "rgba(248,113,113,0.2)"}`,
                  opacity: !r.found ? 0.6 : 1,
                  alignItems: "flex-start",
                }}>
                  {/* Checkbox */}
                  <button
                    onClick={() => r.found && toggle(i)}
                    style={{
                      flexShrink: 0, width: "28px", height: "28px",
                      borderRadius: "6px", border: `2px solid ${r.selected && r.found ? "#c9a84c" : "rgba(255,255,255,0.2)"}`,
                      background: r.selected && r.found ? "#c9a84c" : "transparent",
                      cursor: r.found ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: "2px", flexDirection: "row",
                    }}
                  >
                    {r.selected && r.found && <Check size={14} color="#000" />}
                  </button>

                  {/* Cover */}
                  {r.found && r.media?.cover && (
                    <img src={r.media.cover} alt="" style={{ width: "54px", height: "76px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
                  )}

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {!r.found ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertCircle size={14} color="#f87171" />
                        <span style={{ fontSize: "14px", color: "#f87171" }}>"{r.query}" — introuvable sur AniList</span>
                      </div>
                    ) : (
                      <>
                        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, color: "#fff", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "6px" }}>
                          {r.media.title}
                          {r.media.title !== r.query && <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontStyle: "italic", fontWeight: 500, marginLeft: "8px" }}>pour "{r.query}"</span>}
                        </h3>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                          <span style={tagStyle}>{r.media.type}</span>
                          {r.media.year && <span style={tagStyle}>{r.media.year}</span>}
                          {r.media.episodes && <span style={tagStyle}>{r.media.episodes} ép.</span>}
                          <span style={{ ...tagStyle, color: "#ffd700", background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)" }}>★ {r.media.score}/10</span>
                          {r.media.studio && <span style={tagStyle}>{r.media.studio}</span>}
                        </div>

                        {/* Contrôles tier + note */}
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          {/* Tier selector */}
                          {(["Chef-d'œuvre","Pépite","Bof","Surcoté","A définir"] as Tier[]).map(t => (
                            <button key={t} onClick={() => setTier(i, t)}
                              style={{
                                fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", fontWeight: 800,
                                padding: "4px 10px", borderRadius: "100px", cursor: "pointer",
                                background: r.tier === t ? `${TIER_COLORS[t]}18` : "rgba(255,255,255,0.04)",
                                color: r.tier === t ? TIER_COLORS[t] : "rgba(255,255,255,0.4)",
                                border: `1px solid ${r.tier === t ? TIER_COLORS[t] + "50" : "rgba(255,255,255,0.08)"}`,
                                textTransform: "uppercase", letterSpacing: "0.06em",
                                transition: "all 0.2s",
                              }}
                            >{t}</button>
                          ))}
                          {/* Note override */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "4px" }}>
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Note:</span>
                            <input type="number" step="0.1" min="0" max="10" value={r.note}
                              onChange={e => setNote(i, Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                              style={{ width: "52px", padding: "4px 8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#ffd700", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 900, outline: "none" }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Animation CSS */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

const tagStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px",
  color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)",
  padding: "2px 7px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.08)",
};