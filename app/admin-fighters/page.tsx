"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { Trash2, Pencil, Plus, Flame, Zap, Shield, X, Upload, Lock, Search, ChevronLeft, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Rank, RANK_FILTER_ORDER } from "../../data/members";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { getAdminFormDataHeaders } from "../../lib/admin-fetch";
import type { SupabaseMemberRow } from "../types";

const RANK_COLORS: Record<string, string> = {
  "Fondateur":      "#FFD700",
  "Monarque":       "#FFD700",
  "Ex Monarque":    "#FF6B35",
  "Ordre Céleste":  "#C084FC",
  "New G dorée":    "#F472B6",
  "Vieux Briscard": "#34D399",
  "Futurs Espoirs": "#60A5FA",
  "Revenant":       "#9CA3AF",
  "Fantôme":        "#6B7280",
};

const F = "'Barlow Condensed', sans-serif";

// ── Input style ──────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#fff",
  fontFamily: F, fontSize: 15,
  outline: "none", boxSizing: "border-box",
};

// ── Stat slider ──────────────────────────────────────────────────────────────
function StatSlider({ label, value, onChange, color }: { label: string; value: number; onChange: (n: number) => void; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color, fontFamily: "'Courier New', monospace" }}>{value}</span>
      </div>
      <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.1s" }} />
        <input
          type="range" min={0} max={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%", margin: 0 }}
        />
      </div>
    </div>
  );
}

// ── Upload button ─────────────────────────────────────────────────────────────
function UploadBtn({ label, url, onChange, loading }: { label: string; url: string; onChange: (u: string) => void; loading: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        {url && (
          <img src={url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", objectPosition: "top", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
        <input value={url} onChange={(e) => onChange(e.target.value)} placeholder="URL…" style={{ ...inp, flex: 1 }} />
      </div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px 12px", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
          background: loading ? "rgba(255,255,255,0.03)" : "rgba(201,168,76,0.08)",
          border: `1px solid ${loading ? "rgba(255,255,255,0.06)" : "rgba(201,168,76,0.25)"}`,
          color: loading ? "rgba(255,255,255,0.3)" : "#c9a84c",
          fontFamily: F, fontSize: 12, fontWeight: 800,
        }}
      >
        <Upload size={13} />
        {loading ? "Upload…" : "Uploader depuis l'appareil"}
      </button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onChange("__uploading__");
      }} />
    </div>
  );
}

export default function AdminFightersPage() {
  const { authed, checking, password, setPassword, login } = useAdminAuth();
  const [showPw, setShowPw] = useState(false);
  const [fighters, setFighters] = useState<SupabaseMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState<Rank | "Tous">("Tous");

  // Panel état
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupabaseMemberRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Uploads
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingAnime, setUploadingAnime] = useState(false);
  const photoFileRef = useRef<HTMLInputElement>(null);
  const animeFileRef = useRef<HTMLInputElement>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formRank, setFormRank] = useState<Rank>("New G dorée");
  const [formBirthday, setFormBirthday] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formAnimechar, setFormAnimechar] = useState("");
  const [formColor, setFormColor] = useState("#E91E8C");
  const [formBadge, setFormBadge] = useState("");
  const [formRankjp, setFormRankjp] = useState("");
  const [formForce, setFormForce] = useState(50);
  const [formVitesse, setFormVitesse] = useState(50);
  const [formTechnique, setFormTechnique] = useState(50);
  const [formSpecialName, setFormSpecialName] = useState("");
  const [formSpecialEffect, setFormSpecialEffect] = useState("");

  useEffect(() => { if (authed) fetchFighters(); }, [authed]);

  const fetchFighters = async () => {
    setLoading(true);
    const { data } = await supabase.from("fighters").select("*").order("id", { ascending: true });
    if (data) setFighters(data);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setFormName(""); setFormRank("New G dorée"); setFormBirthday(""); setFormBio("");
    setFormPhoto(""); setFormAnimechar(""); setFormColor("#E91E8C"); setFormBadge("");
    setFormRankjp(""); setFormForce(50); setFormVitesse(50); setFormTechnique(50);
    setFormSpecialName(""); setFormSpecialEffect("");
    setPanelOpen(true);
  };

  const openEdit = (f: SupabaseMemberRow) => {
    setEditingId(f.id);
    setFormName(f.name); setFormRank(f.rank as Rank); setFormBirthday(f.birthday);
    setFormBio(f.bio || ""); setFormPhoto(f.photo || ""); setFormAnimechar(f.animechar || "");
    setFormColor(f.color); setFormBadge(f.badge || ""); setFormRankjp(f.rankjp || "");
    setFormForce(f.stats?.force ?? 50); setFormVitesse(f.stats?.vitesse ?? 50);
    setFormTechnique(f.stats?.technique ?? 50);
    setFormSpecialName(f.special?.name || ""); setFormSpecialEffect(f.special?.effect || "");
    setPanelOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: formName, rank: formRank, birthday: formBirthday, bio: formBio,
      photo: formPhoto, animechar: formAnimechar, color: formColor,
      badge: formBadge, rankjp: formRankjp,
      stats: { force: formForce, vitesse: formVitesse, technique: formTechnique },
      special: { name: formSpecialName, effect: formSpecialEffect },
    };
    if (editingId) {
      await supabase.from("fighters").update(payload).eq("id", editingId);
    } else {
      await supabase.from("fighters").insert([payload]);
    }
    setSaving(false);
    setPanelOpen(false);
    fetchFighters();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("fighters").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchFighters();
  };

  const handleUpload = async (file: File, type: "photo" | "anime") => {
    if (type === "photo") setUploadingPhoto(true);
    else setUploadingAnime(true);
    try {
      const slug = formName.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "fighters");
      formData.append("filename", `${slug || Date.now()}_${type}`);
      const res = await fetch("/api/upload-storage", { method: "POST", headers: getAdminFormDataHeaders(), body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        if (type === "photo") setFormPhoto(data.url);
        else setFormAnimechar(data.url);
      }
    } finally {
      if (type === "photo") setUploadingPhoto(false);
      else setUploadingAnime(false);
    }
  };

  const filtered = fighters.filter(f => {
    const matchRank = rankFilter === "Tous" || f.rank === rankFilter;
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    return matchRank && matchSearch;
  });

  // ── Auth screen ──────────────────────────────────────────────────────────────
  if (checking) return null;
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: "min(400px,92vw)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: "48px 40px", textAlign: "center" }}
        >
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Lock size={24} color="#c9a84c" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: 32 }}>ACCÈS RESTREINT</h1>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              type={showPw ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") login(); }}
              placeholder="Mot de passe…"
              style={{ ...inp, textAlign: "center", letterSpacing: "0.25em", paddingRight: 44 }}
            />
            <button onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button onClick={() => login()} style={{ width: "100%", padding: 14, background: "#c9a84c", border: "none", borderRadius: 12, color: "#000", fontFamily: F, fontSize: 16, fontWeight: 900, textTransform: "uppercase", cursor: "pointer" }}>ENTRER</button>
        </motion.div>
      </div>
    );
  }

  const power = (f: SupabaseMemberRow) => {
    const s = f.stats;
    if (!s) return 0;
    return Math.round((s.force + s.vitesse + s.technique) / 3);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: F }}>
      <style>{`
        .fighter-row { transition: background 0.15s; }
        .fighter-row:hover { background: rgba(255,255,255,0.04) !important; }
        .rank-pill { display: inline-block; padding: 2px 10px; border-radius: 100px; font-size: 11px; font-weight: 800; font-family: ${F}; }
        .action-btn { background: none; border: none; cursor: pointer; padding: 7px; border-radius: 8px; transition: background 0.15s; display: flex; align-items: center; justify-content: center; }
        .action-btn:hover { background: rgba(255,255,255,0.08); }
        input[type=range] { -webkit-appearance: none; appearance: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #fff; cursor: pointer; }
        .filter-pill { cursor: pointer; padding: 5px 14px; border-radius: 100px; font-size: 12px; font-weight: 800; font-family: ${F}; letter-spacing: 0.05em; transition: all 0.15s; white-space: nowrap; border: 1px solid transparent; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,8,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 2 }}>ADMIN · GUILDE OTAKU</p>
            <h1 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 1 }}>
              ROSTER <span style={{ color: "#c9a84c" }}>FIGHTERS</span>
            </h1>
          </div>
          <button
            onClick={openNew}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 22px", background: "#c9a84c",
              border: "none", borderRadius: 12, cursor: "pointer",
              fontFamily: F, fontSize: 14, fontWeight: 900,
              textTransform: "uppercase", letterSpacing: "0.08em", color: "#000",
              boxShadow: "0 4px 16px rgba(201,168,76,0.35)",
            }}
          >
            <Plus size={16} />
            Nouvelle Recrue
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 80px" }}>

        {/* ── FILTERS ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{ ...inp, paddingLeft: 34, fontSize: 14 }}
            />
          </div>
          {/* Rank pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["Tous", ...RANK_FILTER_ORDER] as (Rank | "Tous")[]).map(r => {
              const col = r === "Tous" ? "#c9a84c" : (RANK_COLORS[r] ?? "#fff");
              const active = rankFilter === r;
              return (
                <button key={r} className="filter-pill"
                  onClick={() => setRankFilter(r)}
                  style={{
                    background: active ? `${col}18` : "rgba(255,255,255,0.03)",
                    color: active ? col : "rgba(255,255,255,0.4)",
                    borderColor: active ? `${col}50` : "rgba(255,255,255,0.07)",
                  }}
                >
                  {r === "Tous" ? "Tous" : r}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── COUNT ── */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>
          {filtered.length} membre{filtered.length !== 1 ? "s" : ""}
          {rankFilter !== "Tous" && ` · ${rankFilter}`}
        </p>

        {/* ── LIST ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.2)", fontSize: 16 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.2)", fontSize: 16 }}>Aucun résultat</div>
        ) : (
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            {filtered.map((f, i) => {
              const col = RANK_COLORS[f.rank] ?? "#c9a84c";
              const pwr = power(f);
              const mediaSrc = f.animechar || f.photo;
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.3) }}
                  className="fighter-row"
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "14px 20px",
                    background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                    borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  {/* Left accent */}
                  <div style={{ width: 3, height: 44, borderRadius: 2, background: col, flexShrink: 0, opacity: 0.7 }} />

                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", border: `1.5px solid ${col}35`, flexShrink: 0, background: "rgba(255,255,255,0.05)" }}>
                    {mediaSrc ? (
                      <img src={mediaSrc} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: `${col}50` }}>{f.name[0]}</div>
                    )}
                  </div>

                  {/* Name + Rank */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 17, textTransform: "uppercase", lineHeight: 1, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </div>
                    <span className="rank-pill" style={{ background: `${col}15`, color: col, border: `1px solid ${col}30` }}>
                      {f.rank}
                    </span>
                  </div>

                  {/* Stats — hidden on small screens via text */}
                  <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                    {f.stats && (
                      <>
                        <StatBadge icon={<Flame size={11} />} color="#f87171" value={f.stats.force} label="FOR" />
                        <StatBadge icon={<Zap size={11} />} color="#60a5fa" value={f.stats.vitesse} label="VIT" />
                        <StatBadge icon={<Shield size={11} />} color="#a78bfa" value={f.stats.technique} label="TEC" />
                      </>
                    )}
                  </div>

                  {/* PWR */}
                  <div style={{ flexShrink: 0, textAlign: "center", minWidth: 44 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: col, lineHeight: 1 }}>{pwr}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>PWR</div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="action-btn" onClick={() => openEdit(f)} title="Modifier">
                      <Pencil size={15} color="#60a5fa" />
                    </button>
                    <button className="action-btn" onClick={() => setDeleteTarget(f)} title="Supprimer">
                      <Trash2 size={15} color="#f87171" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SIDE PANEL (form) ── */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 100 }}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0, width: "min(560px, 100vw)",
                background: "#0a0a12", borderLeft: "1px solid rgba(255,255,255,0.08)",
                zIndex: 101, overflowY: "auto",
                boxShadow: "-40px 0 80px rgba(0,0,0,0.6)",
              }}
            >
              {/* Panel header */}
              <div style={{ position: "sticky", top: 0, background: "#0a0a12", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 2 }}>
                    {editingId ? "MODIFIER" : "AJOUTER"}
                  </p>
                  <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", lineHeight: 1 }}>
                    {editingId ? formName || "Combattant" : "Nouvelle Recrue"}
                  </h2>
                </div>
                <button onClick={() => setPanelOpen(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 8, cursor: "pointer", color: "#fff", display: "flex" }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Nom + Rang */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="NOM COMPLET">
                    <input required value={formName} onChange={(e) => setFormName(e.target.value)} style={inp} />
                  </Field>
                  <Field label="RANG">
                    <select value={formRank} onChange={(e) => setFormRank(e.target.value as Rank)} style={{ ...inp, cursor: "pointer" }}>
                      {RANK_FILTER_ORDER.map(r => <option key={r} value={r} style={{ background: "#0a0a12" }}>{r}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Anniversaire + Badge + Couleur */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="ANNIVERSAIRE">
                    <input value={formBirthday} onChange={(e) => setFormBirthday(e.target.value)} placeholder="ex: 3 mars" style={inp} />
                  </Field>
                  <Field label="BADGE SPÉCIAL">
                    <input value={formBadge} onChange={(e) => setFormBadge(e.target.value)} placeholder="ex: MVP 2025" style={inp} />
                  </Field>
                </div>

                <Field label="COULEUR AURA">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: "none", cursor: "pointer", padding: 2, background: "rgba(255,255,255,0.05)" }} />
                    <input value={formColor} onChange={(e) => setFormColor(e.target.value)} style={{ ...inp, flex: 1 }} />
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: formColor, flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                </Field>

                {/* Bio */}
                <Field label="BIOGRAPHIE">
                  <textarea value={formBio} onChange={(e) => setFormBio(e.target.value)} style={{ ...inp, minHeight: 80, resize: "vertical" }} />
                </Field>

                {/* Photos */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", marginBottom: 14 }}>MÉDIAS</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>PHOTO RÉELLE</label>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        {formPhoto && <img src={formPhoto} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", objectPosition: "top", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                        <input value={formPhoto} onChange={(e) => setFormPhoto(e.target.value)} placeholder="URL…" style={{ ...inp, flex: 1, fontSize: 12 }} />
                      </div>
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 8, cursor: uploadingPhoto ? "not-allowed" : "pointer", background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.2)", color: "#c9a84c", fontFamily: F, fontSize: 12, fontWeight: 800 }}>
                        <Upload size={12} />
                        {uploadingPhoto ? "Upload…" : "Uploader"}
                        <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingPhoto} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "photo"); }} />
                      </label>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>PERSONNAGE ANIME</label>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        {formAnimechar && <img src={formAnimechar} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", objectPosition: "top", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                        <input value={formAnimechar} onChange={(e) => setFormAnimechar(e.target.value)} placeholder="URL…" style={{ ...inp, flex: 1, fontSize: 12 }} />
                      </div>
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 8, cursor: uploadingAnime ? "not-allowed" : "pointer", background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa", fontFamily: F, fontSize: 12, fontWeight: 800 }}>
                        <Upload size={12} />
                        {uploadingAnime ? "Upload…" : "Uploader"}
                        <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingAnime} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "anime"); }} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", marginBottom: 16 }}>STATS DE COMBAT</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <StatSlider label="FORCE" value={formForce} onChange={setFormForce} color="#f87171" />
                    <StatSlider label="VITESSE" value={formVitesse} onChange={setFormVitesse} color="#60a5fa" />
                    <StatSlider label="TECHNIQUE" value={formTechnique} onChange={setFormTechnique} color="#a78bfa" />
                  </div>
                </div>

                {/* Coup spécial */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", marginBottom: 14 }}>COUP SPÉCIAL</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Field label="NOM">
                      <input value={formSpecialName} onChange={(e) => setFormSpecialName(e.target.value)} placeholder="ex: Kamehameha" style={inp} />
                    </Field>
                    <Field label="EFFET">
                      <input value={formSpecialEffect} onChange={(e) => setFormSpecialEffect(e.target.value)} placeholder="ex: Dommages x2 sur critique" style={inp} />
                    </Field>
                  </div>
                </div>

                {/* Footer buttons */}
                <div style={{ position: "sticky", bottom: 0, background: "#0a0a12", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "16px 0 0", marginTop: 8, display: "flex", gap: 10 }}>
                  <button type="button" onClick={() => setPanelOpen(false)} style={{ flex: 1, padding: "13px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "rgba(255,255,255,0.5)", fontFamily: F, fontSize: 14, fontWeight: 800, cursor: "pointer", textTransform: "uppercase" }}>
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} style={{ flex: 2, padding: "13px", background: saving ? "rgba(201,168,76,0.4)" : "#c9a84c", border: "none", borderRadius: 12, color: "#000", fontFamily: F, fontSize: 14, fontWeight: 900, cursor: saving ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: saving ? "none" : "0 4px 16px rgba(201,168,76,0.35)" }}>
                    {saving ? "Sauvegarde…" : editingId ? "Sauvegarder" : "Invoquer le Combattant"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM MODAL ── */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 200 }}
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                zIndex: 201, width: "min(400px, 92vw)",
                background: "#0d0d18", border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 20, padding: "32px 28px", textAlign: "center",
                boxShadow: "0 0 60px rgba(248,113,113,0.12), 0 24px 60px rgba(0,0,0,0.7)",
              }}
            >
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <AlertTriangle size={22} color="#f87171" />
              </div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#f87171", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 8 }}>SUPPRESSION DÉFINITIVE</p>
              <h3 style={{ fontSize: 24, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", marginBottom: 8 }}>
                {deleteTarget.name}
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: 28 }}>
                Cette action est irréversible. Le membre sera retiré définitivement du roster.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "rgba(255,255,255,0.5)", fontFamily: F, fontSize: 14, fontWeight: 800, cursor: "pointer", textTransform: "uppercase" }}>
                  Annuler
                </button>
                <button onClick={confirmDelete} style={{ flex: 1, padding: "12px", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 12, color: "#f87171", fontFamily: F, fontSize: 14, fontWeight: 900, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Supprimer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>{label}</label>
      {children}
    </div>
  );
}

function StatBadge({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 30 }}>
      <div style={{ color }}>{icon}</div>
      <span style={{ fontSize: 13, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>{label}</span>
    </div>
  );
}
