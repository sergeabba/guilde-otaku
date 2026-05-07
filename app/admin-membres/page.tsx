"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import {
  Lock, Eye, EyeOff, Plus, Trash2, Pencil, X, Check,
  Upload, RefreshCw, User, Sword, Video, Image as ImageIcon,
  Search, AlertTriangle, Users, Film, Cake, ChevronLeft,
} from "lucide-react";
import { RANK_FILTER_ORDER, type Rank } from "../../data/members";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useIsMobile } from "../hooks/useIsMobile";
import { getAdminFormDataHeaders, getAdminHeaders } from "../../lib/admin-fetch";
import { invalidateMembersCache } from "../utils/dataAdapter";
import type { SupabaseMemberRow } from "../types";

type Tab = "membres" | "medias";
type PhotoType = "photo" | "anime";
type MediaKind = "image" | "video";

interface StorageFile { name: string; url: string; path: string; }

const F = "'Barlow Condensed', sans-serif";

const RANK_COLORS: Record<string, string> = {
  "Fondateur": "#FFD700", "Monarque": "#FFD700", "Ex Monarque": "#FF6B35",
  "Ordre Céleste": "#C084FC", "New G dorée": "#F472B6",
  "Vieux Briscard": "#34D399", "Futurs Espoirs": "#60A5FA",
  "Revenant": "#9CA3AF", "Fantôme": "#6B7280",
};

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#fff",
  fontFamily: F, fontSize: 15,
  outline: "none", boxSizing: "border-box",
};

function isVideoUrl(url: string) { return /\.(mp4|webm|mov)$/i.test(url); }
function memberSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#f87171", marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function RankBadge({ rank }: { rank: string }) {
  const c = RANK_COLORS[rank] ?? "#9CA3AF";
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 800, fontFamily: F, background: `${c}18`, color: c, border: `1px solid ${c}40`, whiteSpace: "nowrap" }}>
      {rank}
    </span>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ password, setPassword, login }: { password: string; setPassword: (v: string) => void; login: () => void }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: "min(400px,92vw)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: "48px 40px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <Lock size={24} color="#c9a84c" />
        </div>
        <p style={{ fontSize: 10, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 8 }}>ESPACE ADMIN</p>
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
        <button onClick={() => login()} style={{ width: "100%", padding: 14, background: "#c9a84c", border: "none", borderRadius: 12, color: "#000", fontFamily: F, fontSize: 16, fontWeight: 900, textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em" }}>
          ENTRER
        </button>
      </motion.div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminMembresPage() {
  const { authed, checking, password, setPassword, login } = useAdminAuth();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>("membres");

  // Members state
  const [fighters, setFighters] = useState<SupabaseMemberRow[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [search, setSearch] = useState("");

  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Panel (add / edit)
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRank, setFormRank] = useState<Rank>("New G dorée");
  const [formBirthday, setFormBirthday] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formColor, setFormColor] = useState("#E91E8C");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<SupabaseMemberRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Media state
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [photoType, setPhotoType] = useState<PhotoType>("photo");
  const [mediaKind, setMediaKind] = useState<MediaKind>("image");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ url: string; success: boolean } | null>(null);
  const [gallery, setGallery] = useState<StorageFile[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (authed) fetchFighters(); }, [authed]);

  async function fetchFighters() {
    setLoadingMembers(true);
    const { data } = await supabase.from("fighters").select("*").order("id", { ascending: true });
    if (data) setFighters(data);
    setLoadingMembers(false);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function openNew() {
    setEditingId(null);
    setFormName(""); setFormRank("New G dorée"); setFormBirthday(""); setFormBio(""); setFormColor("#E91E8C");
    setPanelOpen(true);
  }

  function openEdit(f: SupabaseMemberRow) {
    setEditingId(f.id);
    setFormName(f.name); setFormRank(f.rank as Rank);
    setFormBirthday(f.birthday || ""); setFormBio(f.bio || ""); setFormColor(f.color || "#E91E8C");
    setPanelOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    const payload = { name: formName.trim(), rank: formRank, birthday: formBirthday.trim(), bio: formBio.trim(), color: formColor };
    if (editingId) {
      await supabase.from("fighters").update(payload).eq("id", editingId);
    } else {
      await supabase.from("fighters").insert([{
        ...payload, photo: "", animechar: "",
        stats: { force: 50, vitesse: 50, technique: 50 },
        special: { name: "—", effect: "—" },
      }]);
    }
    invalidateMembersCache();
    setSaving(false);
    setPanelOpen(false);
    fetchFighters();
    const msg = editingId ? `${formName.trim()} mis à jour` : `${formName.trim()} ajouté`;
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const name = deleteTarget.name;
    await supabase.from("fighters").delete().eq("id", deleteTarget.id);
    invalidateMembersCache();
    setDeleting(false);
    setDeleteTarget(null);
    fetchFighters();
    setSaveToast(`${name} supprimé`);
    setTimeout(() => setSaveToast(null), 3000);
  }

  // ── MEDIA ────────────────────────────────────────────────────────────────
  const selectedMediaMember = selectedMediaId !== null ? fighters.find(f => f.id === selectedMediaId) : null;

  async function fetchGallery(slug: string) {
    setGalleryLoading(true); setGalleryError(null);
    try {
      const res = await fetch(`/api/list-storage?folder=fighters&prefix=${encodeURIComponent(slug)}`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) { setGalleryError(data.error ?? "Erreur"); setGallery([]); }
      else setGallery(data.files ?? []);
    } catch { setGalleryError("Erreur réseau"); setGallery([]); }
    finally { setGalleryLoading(false); }
  }

  function handleMediaMemberSelect(id: number | null) {
    setSelectedMediaId(id); setPreview(null); setFile(null); setUploadResult(null); setGallery([]);
    if (id !== null) { const m = fighters.find(f => f.id === id); if (m) fetchGallery(memberSlug(m.name)); }
  }

  function handleFile(f: File) {
    const isVideo = f.type.startsWith("video/");
    setFile(f); setUploadResult(null); setMediaKind(isVideo ? "video" : "image");
    if (isVideo) { setPreview(URL.createObjectURL(f)); }
    else { const r = new FileReader(); r.onload = (e) => setPreview(e.target?.result as string); r.readAsDataURL(f); }
  }

  async function handleApplyGallery(gf: StorageFile) {
    if (!selectedMediaMember) return;
    const isVideo = isVideoUrl(gf.url);
    const field = isVideo
      ? (photoType === "photo" ? "photovideo" : "animevideo")
      : (photoType === "photo" ? "photo" : "animechar");
    const res = await fetch("/api/update-fighter-photo", {
      method: "POST", headers: getAdminHeaders(),
      body: JSON.stringify({ memberName: selectedMediaMember.name, field, url: gf.url }),
    });
    const data = await res.json();
    setUploadResult({ url: gf.url, success: res.ok && !data.error });
  }

  async function handleUpload() {
    if (!file || !selectedMediaMember) return;
    setUploading(true);
    try {
      const suffix = mediaKind === "video"
        ? (photoType === "photo" ? "photo_video" : "anime_video")
        : (photoType === "photo" ? "photo" : "anime");
      const slug = memberSlug(selectedMediaMember.name);
      const fd = new FormData();
      fd.append("file", file); fd.append("folder", "fighters"); fd.append("filename", `${slug}_${suffix}`);
      const res = await fetch("/api/upload-storage", { method: "POST", headers: getAdminFormDataHeaders(), body: fd });
      const up = await res.json();
      if (!res.ok || up.error) { setUploadResult({ url: up.error ?? "Erreur", success: false }); return; }
      const field = mediaKind === "video"
        ? (photoType === "photo" ? "photovideo" : "animevideo")
        : (photoType === "photo" ? "photo" : "animechar");
      const ur = await fetch("/api/update-fighter-photo", {
        method: "POST", headers: getAdminHeaders(),
        body: JSON.stringify({ memberName: selectedMediaMember.name, field, url: up.url }),
      });
      const ud = await ur.json();
      if (!ur.ok || ud.error) { setUploadResult({ url: `Upload OK mais DB échoué : ${ud.error}`, success: false }); return; }
      setUploadResult({ url: up.url, success: true });
      fetchGallery(memberSlug(selectedMediaMember.name));
    } catch (err: any) { setUploadResult({ url: err.message ?? "Erreur réseau", success: false }); }
    finally { setUploading(false); }
  }

  const filtered = fighters.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!panelOpen && !deleteTarget) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteTarget) setDeleteTarget(null);
      else if (panelOpen) setPanelOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [panelOpen, deleteTarget]);

  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(201,168,76,0.2)", borderTopColor: "#c9a84c", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!authed) return <AuthScreen password={password} setPassword={setPassword} login={login} />;

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: F }}>
      <style>{`
        .member-row { transition: background 0.15s; }
        .member-row:hover { background: rgba(255,255,255,0.04) !important; }
        .action-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 9px; transition: background 0.15s; display: flex; align-items: center; justify-content: center; }
        .action-btn:hover { background: rgba(255,255,255,0.08); }
        .action-btn.danger:hover { background: rgba(248,113,113,0.12); }
        .tab-btn { cursor: pointer; padding: 8px 18px; border-radius: 9px; font-size: 12px; font-weight: 800; font-family: ${F}; letter-spacing: 0.1em; transition: all 0.18s; display: flex; align-items: center; gap: 7px; border: none; }
        .gallery-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x mandatory; }
        .gallery-scroll::-webkit-scrollbar { height: 4px; }
        .gallery-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 4px; }
        .gallery-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 4px; }
        .gallery-item { flex-shrink: 0; scroll-snap-align: start; position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; transition: transform 0.15s, box-shadow 0.15s; }
        .gallery-item:hover { transform: scale(1.04); box-shadow: 0 0 0 2px #c9a84c, 0 4px 16px rgba(201,168,76,0.3); }
        .drop-zone { transition: all 0.2s; }
        .drop-zone:hover { border-color: rgba(201,168,76,0.5) !important; background: rgba(201,168,76,0.03) !important; }
        textarea { resize: vertical; }
        select option { background: #0c0c16; }
      `}</style>

      {/* ── STICKY TOP BAR ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,8,0.95)", backdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "14px 16px" : "16px 28px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", flexShrink: 0, textDecoration: "none", transition: "all 0.15s" }}>
            <ChevronLeft size={18} />
          </Link>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 2 }}>ADMIN · GUILDE OTAKU</p>
            <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 1 }}>
              GESTION <span style={{ color: "#c9a84c" }}>MEMBRES</span>
            </h1>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
            {([
              { id: "membres" as Tab, icon: <Users size={13} />, label: "MEMBRES" },
              { id: "medias" as Tab, icon: <Film size={13} />, label: "MÉDIAS" },
            ]).map(t => (
              <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}
                style={{
                  background: tab === t.id ? "rgba(201,168,76,0.15)" : "transparent",
                  color: tab === t.id ? "#c9a84c" : "rgba(255,255,255,0.4)",
                  border: tab === t.id ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent",
                }}>
                {t.icon} {!isMobile && t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "24px 16px" : "32px 28px" }}>
        <AnimatePresence mode="wait">
          {tab === "membres" ? (
            <motion.div key="membres" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>

              {/* Search + Add */}
              <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
                  <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                  <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un membre…"
                    style={{ ...inp, paddingLeft: 36 }}
                  />
                </div>
                <button onClick={openNew}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", background: "#c9a84c", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: F, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#000", boxShadow: "0 4px 16px rgba(201,168,76,0.35)", whiteSpace: "nowrap" }}>
                  <Plus size={16} /> {isMobile ? "" : "AJOUTER"}
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                  { label: "TOTAL", value: fighters.length, color: "#c9a84c" },
                  { label: "RÉSULTATS", value: filtered.length, color: "#60a5fa" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "10px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: s.color, fontStyle: "italic" }}>{s.value}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Member list */}
              {loadingMembers ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.2)", fontSize: 14, fontStyle: "italic" }}>Chargement…</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.2)", fontSize: 14, fontStyle: "italic" }}>Aucun membre trouvé</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {filtered.map((f, i) => {
                    const c = RANK_COLORS[f.rank] ?? "#9CA3AF";
                    const avatar = f.photo || f.animechar;
                    return (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                        className="member-row"
                        style={{
                          display: "flex", alignItems: "center", gap: isMobile ? 10 : 16,
                          padding: isMobile ? "12px 14px" : "14px 18px",
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderLeft: `3px solid ${c}`,
                          borderRadius: 12,
                        }}
                      >
                        {/* Avatar */}
                        <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: `1px solid ${c}30`, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {avatar ? (
                            isVideoUrl(avatar) ? (
                              <video src={avatar} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            )
                          ) : (
                            <User size={18} color={`${c}80`} />
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                            <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", letterSpacing: "0.03em" }}>
                              {f.name}
                            </span>
                            <RankBadge rank={f.rank} />
                          </div>
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {f.birthday && (
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                                <Cake size={11} /> {f.birthday}
                              </span>
                            )}
                            {f.bio && (
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 120 : 320 }}>
                                {f.bio}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <button className="action-btn" title="Modifier" onClick={() => openEdit(f)}>
                            <Pencil size={15} color="rgba(255,255,255,0.5)" />
                          </button>
                          <button className="action-btn danger" title="Supprimer" onClick={() => setDeleteTarget(f)}>
                            <Trash2 size={15} color="rgba(248,113,113,0.7)" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="medias" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
              <MediasTab
                fighters={fighters}
                selectedMediaId={selectedMediaId}
                onSelectMember={handleMediaMemberSelect}
                selectedMember={selectedMediaMember}
                photoType={photoType}
                onPhotoType={setPhotoType}
                mediaKind={mediaKind}
                onMediaKind={(k) => { setMediaKind(k); setFile(null); setPreview(null); }}
                gallery={gallery}
                galleryLoading={galleryLoading}
                galleryError={galleryError}
                onRefreshGallery={() => selectedMediaMember && fetchGallery(memberSlug(selectedMediaMember.name))}
                onApplyGallery={handleApplyGallery}
                dragOver={dragOver}
                onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onFileClick={() => inputRef.current?.click()}
                preview={preview}
                file={file}
                uploading={uploading}
                uploadResult={uploadResult}
                onUpload={handleUpload}
                inputRef={inputRef}
                onFile={handleFile}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SIDE PANEL (add / edit) ── */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px,100vw)", background: "#0c0c18", borderLeft: "1px solid rgba(255,255,255,0.09)", zIndex: 101, display: "flex", flexDirection: "column" }}
            >
              {/* Header */}
              <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 4 }}>
                    {editingId ? "MODIFIER LE MEMBRE" : "NOUVEAU MEMBRE"}
                  </p>
                  <h2 style={{ fontSize: 24, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 1, color: "#fff" }}>
                    {editingId ? "ÉDITION" : "CRÉER"}
                  </h2>
                </div>
                <button onClick={() => setPanelOpen(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "8px", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex" }}>
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form id="membre-form" onSubmit={handleSave} style={{ flex: 1, overflowY: "auto", padding: "28px", display: "flex", flexDirection: "column", gap: 20 }}>
                <Field label="NOM COMPLET" required>
                  <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Jean Dupont" required style={inp} />
                </Field>

                <Field label="RANG">
                  <select value={formRank} onChange={(e) => setFormRank(e.target.value as Rank)} style={inp}>
                    {RANK_FILTER_ORDER.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>

                <Field label="DATE DE NAISSANCE">
                  <input value={formBirthday} onChange={(e) => setFormBirthday(e.target.value)} placeholder="Ex: 21 juin" style={inp} />
                </Field>

                <Field label="BIO">
                  <textarea
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    placeholder="Description du membre, son histoire, sa personnalité…"
                    rows={6}
                    style={{ ...inp, lineHeight: 1.65 }}
                  />
                </Field>

                <Field label="COULEUR SIGNATURE">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)}
                      style={{ width: 44, height: 44, border: "none", background: "none", cursor: "pointer", borderRadius: 8, padding: 2, flexShrink: 0 }} />
                    <input value={formColor} onChange={(e) => setFormColor(e.target.value)} placeholder="#E91E8C" style={{ ...inp, flex: 1 }} />
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: formColor, flexShrink: 0, border: "2px solid rgba(255,255,255,0.15)" }} />
                  </div>
                </Field>

                {/* Aperçu rang */}
                <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${formColor}20`, border: `1px solid ${formColor}40`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={16} color={formColor} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", color: "#fff" }}>{formName || "Prévisualisation"}</div>
                    <div style={{ marginTop: 3 }}><RankBadge rank={formRank} /></div>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div style={{ padding: "20px 28px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setPanelOpen(false)}
                  style={{ flex: 1, padding: "13px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontFamily: F, fontSize: 14, fontWeight: 800, textTransform: "uppercase" }}>
                  ANNULER
                </button>
                <button type="submit" form="membre-form" disabled={saving || !formName.trim()}
                  style={{ flex: 2, padding: "13px", background: saving || !formName.trim() ? "rgba(201,168,76,0.3)" : "#c9a84c", border: "none", borderRadius: 12, cursor: saving || !formName.trim() ? "not-allowed" : "pointer", color: "#000", fontFamily: F, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Check size={16} />
                  {saving ? "Sauvegarde…" : editingId ? "ENREGISTRER" : "CRÉER LE MEMBRE"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM MODAL ── */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !deleting && setDeleteTarget(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, backdropFilter: "blur(8px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(420px,92vw)", background: "#0c0c18", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 20, padding: "36px 32px", zIndex: 201, textAlign: "center" }}
            >
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <AlertTriangle size={26} color="#f87171" />
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "#fff", marginBottom: 10 }}>SUPPRIMER ?</h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", marginBottom: 6, lineHeight: 1.5 }}>
                <span style={{ color: "#fff", fontWeight: 900 }}>{deleteTarget.name}</span> sera définitivement retiré du site.
              </p>
              <p style={{ fontSize: 12, color: "rgba(248,113,113,0.6)", marginBottom: 28, fontStyle: "italic" }}>
                Cette action est irréversible — le membre disparaîtra de toutes les pages.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  style={{ flex: 1, padding: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontFamily: F, fontSize: 14, fontWeight: 800, textTransform: "uppercase" }}>
                  ANNULER
                </button>
                <button onClick={confirmDelete} disabled={deleting}
                  style={{ flex: 1, padding: 13, background: deleting ? "rgba(248,113,113,0.3)" : "#ef4444", border: "none", borderRadius: 12, cursor: deleting ? "not-allowed" : "pointer", color: "#fff", fontFamily: F, fontSize: 14, fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Trash2 size={16} />
                  {deleting ? "Suppression…" : "SUPPRIMER"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── SAVE TOAST ── */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{
              position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
              zIndex: 9999, background: "#0d0d18",
              border: "1px solid rgba(201,168,76,0.4)",
              borderRadius: 14, padding: "12px 22px",
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.15)",
              fontFamily: F, pointerEvents: "none", whiteSpace: "nowrap",
            }}
          >
            <Check size={16} color="#c9a84c" />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "0.03em" }}>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MÉDIAS TAB ───────────────────────────────────────────────────────────────
function MediasTab({
  fighters, selectedMediaId, onSelectMember, selectedMember,
  photoType, onPhotoType, mediaKind, onMediaKind,
  gallery, galleryLoading, galleryError, onRefreshGallery, onApplyGallery,
  dragOver, onDragOver, onDragLeave, onDrop, onFileClick,
  preview, file, uploading, uploadResult, onUpload, inputRef, onFile, isMobile,
}: {
  fighters: SupabaseMemberRow[];
  selectedMediaId: number | null;
  onSelectMember: (id: number | null) => void;
  selectedMember: SupabaseMemberRow | null | undefined;
  photoType: PhotoType; onPhotoType: (t: PhotoType) => void;
  mediaKind: MediaKind; onMediaKind: (k: MediaKind) => void;
  gallery: StorageFile[]; galleryLoading: boolean; galleryError: string | null;
  onRefreshGallery: () => void; onApplyGallery: (f: StorageFile) => void;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileClick: () => void;
  preview: string | null; file: File | null; uploading: boolean;
  uploadResult: { url: string; success: boolean } | null;
  onUpload: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (f: File) => void;
  isMobile: boolean;
}) {
  const currentPhoto = selectedMember?.photo ?? "";
  const currentAnime = selectedMember?.animechar ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Étape 1 — Membre */}
      <Card>
        <StepLabel step={1} label="CHOISIR LE MEMBRE" />
        <select
          value={selectedMediaId ?? ""}
          onChange={(e) => onSelectMember(Number(e.target.value) || null)}
          style={inp}
        >
          <option value="">Sélectionner un membre…</option>
          {fighters.map(f => (
            <option key={f.id} value={f.id}>#{String(f.id).padStart(2, "0")} — {f.name} ({f.rank})</option>
          ))}
        </select>

        {selectedMember && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
            {currentPhoto && !isVideoUrl(currentPhoto) ? (
              <img src={currentPhoto} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid #c9a84c", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "2px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={20} color="#c9a84c" />
              </div>
            )}
            <div>
              <p style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", color: "#fff", lineHeight: 1 }}>{selectedMember.name}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{selectedMember.rank} · ID #{selectedMember.id}</p>
            </div>
          </div>
        )}
      </Card>

      {selectedMember && (
        <>
          {/* Étape 2 — Type */}
          <Card>
            <StepLabel step={2} label="TYPE DE MÉDIA" />
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {([
                { value: "photo" as PhotoType, label: "Photo réelle", icon: <User size={14} />, current: currentPhoto },
                { value: "anime" as PhotoType, label: "Personnage anime", icon: <Sword size={14} />, current: currentAnime },
              ]).map(opt => (
                <button key={opt.value} onClick={() => onPhotoType(opt.value)}
                  style={{ flex: 1, padding: "14px 10px", borderRadius: 12, cursor: "pointer", background: photoType === opt.value ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${photoType === opt.value ? "#c9a84c" : "rgba(255,255,255,0.08)"}`, color: photoType === opt.value ? "#c9a84c" : "rgba(255,255,255,0.45)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.18s", fontFamily: F }}>
                  {opt.icon}
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{opt.label}</span>
                  {opt.current && (
                    isVideoUrl(opt.current) ? (
                      <video src={opt.current} muted style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)", marginTop: 4 }} />
                    ) : (
                      <img src={opt.current} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", objectPosition: "top", border: "1px solid rgba(255,255,255,0.1)", marginTop: 4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )
                  )}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {([
                { kind: "image" as MediaKind, label: "IMAGE", icon: <ImageIcon size={12} /> },
                { kind: "video" as MediaKind, label: "VIDÉO", icon: <Video size={12} /> },
              ]).map(tab => (
                <button key={tab.kind} onClick={() => onMediaKind(tab.kind)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, cursor: "pointer", background: mediaKind === tab.kind ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${mediaKind === tab.kind ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.07)"}`, color: mediaKind === tab.kind ? "#60a5fa" : "rgba(255,255,255,0.35)", fontFamily: F, fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", transition: "all 0.15s" }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
              {mediaKind === "video" && (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>Jouée en loop sur la carte</span>
              )}
            </div>
          </Card>

          {/* Étape 3 — Galerie */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <StepLabel step={3} label="SÉLECTIONNER UN FICHIER EXISTANT" noMargin />
              <button onClick={onRefreshGallery} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4, display: "flex" }} title="Rafraîchir">
                <RefreshCw size={14} />
              </button>
            </div>
            {galleryLoading && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>Chargement…</p>}
            {galleryError && <p style={{ fontSize: 12, color: "#f87171" }}>{galleryError}</p>}
            {!galleryLoading && !galleryError && gallery.length === 0 && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", fontStyle: "italic" }}>Aucun fichier existant. Uploadez-en un ci-dessous.</p>
            )}
            {!galleryLoading && gallery.length > 0 && (
              <>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>Scroll horizontal · cliquez pour appliquer directement</p>
                <div className="gallery-scroll">
                  {gallery.map(f => {
                    const isVid = isVideoUrl(f.url);
                    return (
                      <div key={f.name} className="gallery-item" onClick={() => onApplyGallery(f)} title={`Appliquer : ${f.name}`}
                        style={{ width: isVid ? 100 : 80, height: 100, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {isVid ? (
                          <video src={f.url} muted loop autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <img src={f.url} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.8))", padding: "6px 4px 3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {isVid ? <Video size={10} color="#60a5fa" /> : <ImageIcon size={10} color="rgba(255,255,255,0.4)" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          {/* Étape 4 — Upload */}
          <Card>
            <StepLabel step={4} label="UPLOADER UN NOUVEAU FICHIER" />
            <div
              className="drop-zone"
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={onFileClick}
              style={{ border: `2px dashed ${dragOver ? "#c9a84c" : "rgba(255,255,255,0.1)"}`, borderRadius: 14, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(201,168,76,0.04)" : "transparent", marginBottom: 16 }}
            >
              {preview ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  {file?.type.startsWith("video/") ? (
                    <video src={preview} controls muted style={{ maxHeight: 180, maxWidth: 240, borderRadius: 10, border: "2px solid #60a5fa" }} />
                  ) : (
                    <img src={preview} alt="" style={{ height: 160, maxWidth: 140, objectFit: "cover", borderRadius: 10, border: "2px solid #c9a84c" }} />
                  )}
                  <p style={{ fontSize: 13, color: file?.type.startsWith("video/") ? "#60a5fa" : "#c9a84c", fontWeight: 700 }}>
                    {file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)} Ko
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Cliquer pour changer</p>
                </div>
              ) : (
                <>
                  <Upload size={30} color="rgba(255,255,255,0.18)" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.45)" }}>
                    Glisser un {mediaKind === "video" ? "vidéo" : "image"} ici
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginTop: 4 }}>
                    {mediaKind === "video" ? "MP4, WebM · max 50 Mo" : "JPG, PNG, WebP · max 5 Mo"}
                  </p>
                </>
              )}
            </div>

            <input ref={inputRef} type="file" accept={mediaKind === "video" ? ".mp4,.webm,.mov" : ".jpg,.jpeg,.png,.webp"} style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />

            {uploadResult && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: uploadResult.success ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${uploadResult.success ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 10, marginBottom: 14 }}>
                {uploadResult.success ? <Check size={15} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} /> : <X size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />}
                <div>
                  <p style={{ fontSize: 14, color: uploadResult.success ? "#34d399" : "#f87171", fontWeight: 700, wordBreak: "break-all" }}>
                    {uploadResult.success ? "✓ Média appliqué avec succès" : `Erreur : ${uploadResult.url}`}
                  </p>
                  {uploadResult.success && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4, wordBreak: "break-all" }}>{uploadResult.url}</p>
                  )}
                </div>
              </div>
            )}

            <button onClick={onUpload} disabled={!file || uploading}
              style={{ width: "100%", padding: 15, background: !file || uploading ? (mediaKind === "video" ? "rgba(96,165,250,0.3)" : "rgba(201,168,76,0.3)") : (mediaKind === "video" ? "#60a5fa" : "#c9a84c"), border: "none", borderRadius: 12, cursor: !file || uploading ? "not-allowed" : "pointer", fontFamily: F, fontWeight: 900, fontSize: 15, color: "#000", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {mediaKind === "video" ? <Video size={17} /> : <Upload size={17} />}
              {uploading ? "Upload en cours…" : `Uploader comme ${mediaKind === "video" ? "vidéo" : "photo"} ${photoType === "photo" ? "réelle" : "anime"}`}
            </button>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 24 }}>
      {children}
    </div>
  );
}

function StepLabel({ step, label, noMargin }: { step: number; label: string; noMargin?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: noMargin ? 0 : 14 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: "#c9a84c", fontFamily: "'Barlow Condensed', sans-serif" }}>{step}</span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
