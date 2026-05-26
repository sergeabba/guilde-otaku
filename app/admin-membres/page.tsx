"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import {
  Lock, Eye, EyeOff, Plus, Trash2, Pencil, X, Check,
  Upload, RefreshCw, User, Sword, Video, Image as ImageIcon,
  Search, AlertTriangle, ChevronLeft, Camera, GripVertical, Globe,
} from "lucide-react";
import { RANK_FILTER_ORDER, type Rank } from "../../data/members";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useIsMobile } from "../hooks/useIsMobile";
import { getAdminFormDataHeaders, getAdminHeaders } from "../../lib/admin-fetch";
import { invalidateMembersCache } from "../utils/dataAdapter";
import type { SupabaseMemberRow } from "../types";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { COUNTRIES, flagUrl } from "../config/countries";

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
  width: "100%", padding: "10px 13px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#fff",
  fontFamily: F, fontSize: 14,
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

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ height: 1, width: 18, background: "#c9a84c", borderRadius: 1 }} />
      <span style={{ fontFamily: F, fontSize: 10, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.25em", textTransform: "uppercase" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)", borderRadius: 1 }} />
    </div>
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
          <input type={showPw ? "text" : "password"} value={password}
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

// ─── SORTABLE CARD WRAPPER ────────────────────────────────────────────────────
function SortableCard({ id, children }: { id: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners} style={{ position: "absolute", top: 6, left: 6, zIndex: 10, padding: 4, borderRadius: 6, background: "rgba(0,0,0,0.6)", cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GripVertical size={14} color="rgba(255,255,255,0.7)" />
      </div>
      {children}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminMembresPage() {
  const { authed, checking, password, setPassword, login } = useAdminAuth();
  const isMobile = useIsMobile();

  // ── Members ──────────────────────────────────────────────────────────────
  const [fighters, setFighters] = useState<SupabaseMemberRow[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [search, setSearch] = useState("");
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // ── Panel (unified: infos + médias) ──────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<SupabaseMemberRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Form — infos
  const [formName, setFormName] = useState("");
  const [formRank, setFormRank] = useState<Rank>("New G dorée");
  const [formBirthday, setFormBirthday] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formColor, setFormColor] = useState("#E91E8C");
  const [formCountry, setFormCountry] = useState("");

  // Reorder mode
  const [reorderMode, setReorderMode] = useState(false);
  // Quick country assign mode
  const [quickCountry, setQuickCountry] = useState<string | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<SupabaseMemberRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Médias (dans le panneau) ──────────────────────────────────────────────
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
    if (data) {
      setFighters(data);
      // Update editingMember if panel is open
      if (editingId) {
        const updated = data.find(f => f.id === editingId);
        if (updated) setEditingMember(updated);
      }
    }
    setLoadingMembers(false);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function resetMedia() {
    setPhotoType("photo"); setMediaKind("image");
    setPreview(null); setFile(null); setUploadResult(null); setGallery([]);
  }

  function openNew() {
    setEditingId(null); setEditingMember(null);
    setFormName(""); setFormRank("New G dorée"); setFormBirthday(""); setFormBio(""); setFormColor("#E91E8C"); setFormCountry("");
    resetMedia();
    setPanelOpen(true);
  }

  function openEdit(f: SupabaseMemberRow) {
    setEditingId(f.id); setEditingMember(f);
    setFormName(f.name); setFormRank(f.rank as Rank);
    setFormBirthday(f.birthday || ""); setFormBio(f.bio || ""); setFormColor(f.color || "#E91E8C");
    setFormCountry(f.country || "");
    resetMedia();
    fetchGallery(memberSlug(f.name));
    setPanelOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    const payload = { name: formName.trim(), rank: formRank, birthday: formBirthday.trim(), bio: formBio.trim(), color: formColor, country: formCountry.trim() || null };
    if (editingId) {
      await supabase.from("fighters").update(payload).eq("id", editingId);
      const updated = { ...editingMember!, ...payload };
      setEditingMember(updated);
      setFighters(prev => prev.map(f => f.id === editingId ? updated : f));
      invalidateMembersCache();
      setSaving(false);
    } else {
      await supabase.from("fighters").insert([{
        ...payload, photo: "", animechar: "",
        stats: { force: 50, vitesse: 50, technique: 50 },
        special: { name: "—", effect: "—" },
      }]);
      invalidateMembersCache();
      setSaving(false);
      setPanelOpen(false);
      fetchFighters();
    }
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
    if (editingId === deleteTarget.id) setPanelOpen(false);
    fetchFighters();
    setSaveToast(`${name} supprimé`);
    setTimeout(() => setSaveToast(null), 3000);
  }

  async function toggleHidden(member: SupabaseMemberRow) {
    const newHidden = !member.hidden;
    await supabase.from("fighters").update({ hidden: newHidden }).eq("id", member.id);
    invalidateMembersCache();
    setFighters(prev => prev.map(f => f.id === member.id ? { ...f, hidden: newHidden } : f));
    setSaveToast(`${member.name} ${newHidden ? "masqué" : "réaffiché"}`);
    setTimeout(() => setSaveToast(null), 3000);
  }

  // ── QUICK COUNTRY ASSIGN ───────────────────────────────────────────────────
  async function quickAssignCountry(member: SupabaseMemberRow) {
    if (!quickCountry) return;
    await supabase.from("fighters").update({ country: quickCountry }).eq("id", member.id);
    invalidateMembersCache();
    setFighters(prev => prev.map(f => f.id === member.id ? { ...f, country: quickCountry } : f));
    const c = COUNTRIES.find(x => x.code === quickCountry);
    setSaveToast(`${member.name} → ${c?.label || quickCountry}`);
    setTimeout(() => setSaveToast(null), 2000);
  }

  // ── REORDER (DnD) ─────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filtered.findIndex(f => f.id === active.id);
    const newIndex = filtered.findIndex(f => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(filtered, oldIndex, newIndex);
    setFighters(prev => {
      const otherFighters = prev.filter(f => !reordered.find(r => r.id === f.id));
      return [...reordered, ...otherFighters];
    });
    const updates = reordered.map((f, i) => ({ id: f.id, position: i }));
    for (const u of updates) {
      await supabase.from("fighters").update({ position: u.position }).eq("id", u.id);
    }
    invalidateMembersCache();
    setSaveToast("Ordre mis à jour");
    setTimeout(() => setSaveToast(null), 3000);
  }

  // ── MEDIA ────────────────────────────────────────────────────────────────
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

  function handleFile(f: File) {
    const isVideo = f.type.startsWith("video/");
    setFile(f); setUploadResult(null); setMediaKind(isVideo ? "video" : "image");
    if (isVideo) { setPreview(URL.createObjectURL(f)); }
    else { const r = new FileReader(); r.onload = (e) => setPreview(e.target?.result as string); r.readAsDataURL(f); }
  }

  async function handleApplyGallery(gf: StorageFile) {
    if (!editingMember) return;
    const isVideo = isVideoUrl(gf.url);
    const field = isVideo
      ? (photoType === "photo" ? "photovideo" : "animevideo")
      : (photoType === "photo" ? "photo" : "animechar");
    const res = await fetch("/api/update-fighter-photo", {
      method: "POST", headers: getAdminHeaders(),
      body: JSON.stringify({ memberName: editingMember.name, field, url: gf.url }),
    });
    const data = await res.json();
    if (res.ok && !data.error) {
      const updated = { ...editingMember, [field]: gf.url };
      setEditingMember(updated);
      setFighters(prev => prev.map(f => f.id === editingMember.id ? updated : f));
      invalidateMembersCache();
    }
    setUploadResult({ url: gf.url, success: res.ok && !data.error });
  }

  async function handleUpload() {
    if (!file || !editingMember) return;
    setUploading(true);
    try {
      const suffix = mediaKind === "video"
        ? (photoType === "photo" ? "photo_video" : "anime_video")
        : (photoType === "photo" ? "photo" : "anime");
      const slug = memberSlug(editingMember.name);
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
        body: JSON.stringify({ memberName: editingMember.name, field, url: up.url }),
      });
      const ud = await ur.json();
      if (!ur.ok || ud.error) { setUploadResult({ url: `Upload OK mais DB échoué : ${ud.error}`, success: false }); return; }
      const updated = { ...editingMember, [field]: up.url };
      setEditingMember(updated);
      setFighters(prev => prev.map(f => f.id === editingMember.id ? updated : f));
      invalidateMembersCache();
      setUploadResult({ url: up.url, success: true });
      fetchGallery(memberSlug(editingMember.name));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      setUploadResult({ url: msg, success: false });
    } finally { setUploading(false); }
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

  const rankC = editingMember ? (RANK_COLORS[editingMember.rank] ?? "#9CA3AF") : "#c9a84c";

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: F }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .mc { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative; }
        .mc:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.5); }
        .mc:hover .mc-ov { opacity: 1 !important; }
        .add-card { transition: all 0.18s; }
        .add-card:hover { border-color: rgba(201,168,76,0.7) !important; background: rgba(201,168,76,0.07) !important; transform: translateY(-2px); }
        .ab { background: rgba(0,0,0,0); border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; }
        .gallery-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scroll-snap-type: x mandatory; }
        .gallery-scroll::-webkit-scrollbar { height: 3px; }
        .gallery-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 3px; }
        .gi { flex-shrink: 0; scroll-snap-align: start; position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; transition: transform 0.15s, box-shadow 0.15s; }
        .gi:hover { transform: scale(1.05); box-shadow: 0 0 0 2px #c9a84c; }
        .dz { transition: border-color 0.2s, background 0.2s; }
        .dz:hover { border-color: rgba(201,168,76,0.5) !important; background: rgba(201,168,76,0.04) !important; }
        textarea { resize: vertical; }
        select option { background: #0c0c16; }
        .ps::-webkit-scrollbar { width: 3px; }
        .ps::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,8,0.96)", backdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "13px 16px" : "14px 28px", display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", flexShrink: 0, textDecoration: "none" }}>
            <ChevronLeft size={17} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 1 }}>ADMIN · GUILDE OTAKU</p>
            <h1 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 1 }}>
              GESTION <span style={{ color: "#c9a84c" }}>MEMBRES</span>
            </h1>
          </div>
          {/* Compteur */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ padding: "6px 14px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8, textAlign: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#c9a84c", fontStyle: "italic", display: "block", lineHeight: 1 }}>{fighters.length}</span>
              <span style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase" }}>MEMBRES</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH + ADD ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "18px 16px 14px" : "22px 28px 18px", display: "flex", gap: 10 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.28)", pointerEvents: "none" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un membre…"
            style={{ ...inp, paddingLeft: 32 }}
          />
        </div>
        <button onClick={() => setReorderMode(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", background: reorderMode ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${reorderMode ? "#60a5fa" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: reorderMode ? "#60a5fa" : "rgba(255,255,255,0.5)", whiteSpace: "nowrap", flexShrink: 0 }}>
          <GripVertical size={15} /> {!isMobile && "ORDRE"}
        </button>
        <button onClick={openNew}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: "#c9a84c", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#000", boxShadow: "0 4px 16px rgba(201,168,76,0.3)", whiteSpace: "nowrap", flexShrink: 0 }}>
          <Plus size={15} /> {!isMobile && "AJOUTER"}
        </button>
      </div>

      {/* ── QUICK COUNTRY ASSIGN BAR ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 16px 10px" : "0 28px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: quickCountry ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${quickCountry ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, transition: "all 0.3s" }}>
          <Globe size={14} color={quickCountry ? "#34d399" : "rgba(255,255,255,0.3)"} />
          <span style={{ fontSize: 11, fontWeight: 800, color: quickCountry ? "#34d399" : "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            {quickCountry ? "CLIQUEZ POUR ASSIGNER" : "ASSIGN RAPIDE"}
          </span>
          <select
            value={quickCountry || ""}
            onChange={(e) => setQuickCountry(e.target.value || null)}
            style={{ ...inp, flex: 1, maxWidth: 200, padding: "6px 10px", fontSize: 12, background: "rgba(255,255,255,0.06)" }}
          >
            <option value="">-- Choisir pays --</option>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          {quickCountry && (
            <>
              <img src={flagUrl(quickCountry)} alt="" style={{ width: 22, height: 16, objectFit: "cover", borderRadius: 2 }} />
              <button onClick={() => setQuickCountry(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4, display: "flex" }}>
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── GRILLE MEMBRES ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 16px 40px" : "0 28px 40px" }}>
        {loadingMembers ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(201,168,76,0.2)", borderTopColor: "#c9a84c", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : reorderMode ? (
          /* ── MODE REORDER : liste verticale drag & drop ── */
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {filtered.map((f, i) => {
                  const c = RANK_COLORS[f.rank] ?? "#9CA3AF";
                  const avatar = f.photo || f.animechar;
                  return (
                    <SortableCard key={f.id} id={f.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px 10px 40px", background: "rgba(255,255,255,0.03)", border: `1px solid ${c}30`, borderRadius: 10, opacity: f.hidden ? 0.5 : 1 }}>
                        <span style={{ fontFamily: F, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.3)", width: 24, textAlign: "center" }}>{i + 1}</span>
                        <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: `${c}18`, flexShrink: 0, border: `1px solid ${c}40` }}>
                          {avatar && !isVideoUrl(avatar) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={14} color={`${c}80`} /></div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: F, fontSize: 14, fontWeight: 900, color: "#fff", fontStyle: "italic", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                          <span style={{ fontSize: 10, fontWeight: 800, color: c, fontFamily: F }}>{f.rank}</span>
                        </div>
                        {f.country && <img src={flagUrl(f.country)} alt={f.country} style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2 }} />}
                      </div>
                    </SortableCard>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          /* ── MODE NORMAL : grille cartes ── */
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(auto-fill, minmax(130px, 1fr))" : "repeat(auto-fill, minmax(168px, 1fr))",
            gap: isMobile ? 9 : 12,
          }}>
            {/* Carte "Ajouter" */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
              onClick={openNew}
              className="add-card"
              style={{
                aspectRatio: "2/3", borderRadius: 14,
                background: "rgba(255,255,255,0.02)",
                border: "2px dashed rgba(201,168,76,0.3)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 10, cursor: "pointer",
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={20} color="#c9a84c" />
              </div>
              <p style={{ fontFamily: F, fontSize: 11, fontWeight: 800, color: "#c9a84c", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", lineHeight: 1.4 }}>
                AJOUTER<br />UN MEMBRE
              </p>
            </motion.div>

            {/* Cartes membres */}
            {filtered.map((f, i) => {
              const c = RANK_COLORS[f.rank] ?? "#9CA3AF";
              const avatar = f.photo || f.animechar;
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.025, 0.35) }}
                  className="mc"
                  onClick={quickCountry ? () => quickAssignCountry(f) : undefined}
                  style={{
                    aspectRatio: "2/3", borderRadius: 14,
                    overflow: "hidden",
                    background: `${c}18`,
                    outline: quickCountry && f.country === quickCountry ? "2px solid #34d399" : undefined,
                    border: `1px solid ${f.hidden ? "rgba(251,191,36,0.3)" : `${c}28`}`,
                    opacity: f.hidden ? 0.6 : 1,
                  }}
                >
                  {/* Photo */}
                  {avatar ? (
                    isVideoUrl(avatar) ? (
                      <video src={avatar} muted loop autoPlay playsInline
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt={f.name}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={36} color={`${c}50`} />
                    </div>
                  )}

                  {/* Gradient + info bas */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isMobile ? "8px 8px" : "10px 10px" }}>
                    <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 100, fontSize: 8, fontWeight: 800, fontFamily: F, background: `${c}22`, color: c, border: `1px solid ${c}45`, marginBottom: 3 }}>
                      {f.rank}
                    </span>
                    <p style={{ fontFamily: F, fontSize: isMobile ? 12 : 14, fontWeight: 900, color: "#fff", fontStyle: "italic", textTransform: "uppercase", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </p>
                  </div>

                  {/* Overlay hover : actions */}
                  <div
                    className="mc-ov"
                    style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.58)",
                      backdropFilter: "blur(2px)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 8, opacity: 0, transition: "opacity 0.2s",
                    }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(f); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)", color: "#fff", cursor: "pointer", fontFamily: F, fontSize: 12, fontWeight: 800, textTransform: "uppercase", backdropFilter: "blur(8px)" }}
                    >
                      <Pencil size={13} /> Éditer
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleHidden(f); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: f.hidden ? "rgba(52,211,153,0.18)" : "rgba(251,191,36,0.18)", border: `1px solid ${f.hidden ? "rgba(52,211,153,0.4)" : "rgba(251,191,36,0.4)"}`, color: f.hidden ? "#34d399" : "#fbbf24", cursor: "pointer", fontFamily: F, fontSize: 12, fontWeight: 800, textTransform: "uppercase", backdropFilter: "blur(8px)" }}
                    >
                      {f.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                      {f.hidden ? "Afficher" : "Masquer"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(f); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(248,113,113,0.18)", border: "1px solid rgba(248,113,113,0.35)", color: "#f87171", cursor: "pointer", fontFamily: F, fontSize: 12, fontWeight: 800, textTransform: "uppercase", backdropFilter: "blur(8px)" }}
                    >
                      <Trash2 size={13} /> Supprimer
                    </button>
                  </div>

                  {/* Badge "masqué" */}
                  {f.hidden && (
                    <div style={{ position: "absolute", top: 7, left: 7, padding: "3px 8px", background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.45)", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <EyeOff size={9} color="#fbbf24" />
                      <span style={{ fontFamily: F, fontSize: 8, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.1em" }}>MASQUÉ</span>
                    </div>
                  )}

                  {/* Badge "pas de photo" */}
                  {!avatar && (
                    <div style={{ position: "absolute", top: 7, right: 7, padding: "3px 6px", background: "rgba(248,113,113,0.18)", border: "1px solid rgba(248,113,113,0.35)", borderRadius: 6 }}>
                      <Camera size={9} color="#f87171" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PANNEAU UNIFIÉ (infos + médias) ── */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: isMobile ? "100vw" : "min(520px,100vw)", background: "#0b0b16", borderLeft: "1px solid rgba(255,255,255,0.08)", zIndex: 101, display: "flex", flexDirection: "column" }}
            >
              {/* En-tête panneau */}
              <div style={{ padding: isMobile ? "18px 18px" : "22px 26px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                {editingMember && (
                  <div style={{ width: 42, height: 42, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: `2px solid ${rankC}40`, background: `${rankC}15` }}>
                    {(editingMember.photo && !isVideoUrl(editingMember.photo)) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editingMember.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={16} color={`${rankC}80`} />
                      </div>
                    )}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: F, fontSize: 9, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 2 }}>
                    {editingId ? "MODIFIER LE MEMBRE" : "NOUVEAU MEMBRE"}
                  </p>
                  <h2 style={{ fontFamily: F, fontSize: 20, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 1, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {editingId ? (formName || "ÉDITION") : "CRÉER"}
                  </h2>
                </div>
                <button onClick={() => setPanelOpen(false)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 8, cursor: "pointer", color: "rgba(255,255,255,0.55)", display: "flex", flexShrink: 0 }}>
                  <X size={17} />
                </button>
              </div>

              {/* Corps scrollable */}
              <div className="ps" style={{ flex: 1, overflowY: "auto", padding: isMobile ? "18px 18px" : "22px 26px" }}>

                {/* ── SECTION INFOS ── */}
                <SectionTitle label="INFORMATIONS" />
                <form id="membre-form" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: editingId ? 32 : 0 }}>
                  <Field label="NOM COMPLET" required>
                    <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Jean Dupont" required style={inp} />
                  </Field>

                  <Field label="RANG">
                    <select value={formRank} onChange={(e) => setFormRank(e.target.value as Rank)} style={inp}>
                      {RANK_FILTER_ORDER.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="ANNIVERSAIRE">
                      <input value={formBirthday} onChange={(e) => setFormBirthday(e.target.value)} placeholder="Ex: 21 juin" style={inp} />
                    </Field>
                    <Field label="COULEUR">
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)}
                          style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer", borderRadius: 8, padding: 2, flexShrink: 0 }} />
                        <input value={formColor} onChange={(e) => setFormColor(e.target.value)} placeholder="#E91E8C" style={{ ...inp, fontSize: 12 }} />
                      </div>
                    </Field>
                  </div>

                  <Field label="PAYS">
                    <select value={formCountry} onChange={(e) => setFormCountry(e.target.value)} style={{ ...inp, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
                      <option value="">— Aucun —</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </Field>

                  <Field label="BIO">
                    <textarea value={formBio} onChange={(e) => setFormBio(e.target.value)}
                      placeholder="Description du membre…"
                      rows={4} style={{ ...inp, lineHeight: 1.6 }} />
                  </Field>

                  {/* Aperçu */}
                  <div style={{ padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: `${formColor}22`, border: `1px solid ${formColor}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={13} color={formColor} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formName || "Prévisualisation"}</p>
                      <span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 100, fontSize: 10, fontWeight: 800, fontFamily: F, background: `${(RANK_COLORS[formRank] ?? "#9CA3AF")}18`, color: RANK_COLORS[formRank] ?? "#9CA3AF", border: `1px solid ${(RANK_COLORS[formRank] ?? "#9CA3AF")}40` }}>
                        {formRank}
                      </span>
                    </div>
                  </div>

                  <button type="submit" disabled={saving || !formName.trim()}
                    style={{ width: "100%", padding: 12, background: saving || !formName.trim() ? "rgba(201,168,76,0.28)" : "#c9a84c", border: "none", borderRadius: 10, cursor: saving || !formName.trim() ? "not-allowed" : "pointer", color: "#000", fontFamily: F, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                    <Check size={15} />
                    {saving ? "Sauvegarde…" : editingId ? "ENREGISTRER LES INFOS" : "CRÉER LE MEMBRE"}
                  </button>
                </form>

                {/* ── SECTION MÉDIAS (seulement en édition) ── */}
                {editingId && (
                  <>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 0 24px" }} />
                    <SectionTitle label="MÉDIAS" />

                    {/* Sélecteur type photo : Réel / Anime */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {([
                        { value: "photo" as PhotoType, label: "Photo réelle", icon: <User size={13} />, url: editingMember?.photo ?? "" },
                        { value: "anime" as PhotoType, label: "Personnage anime", icon: <Sword size={13} />, url: editingMember?.animechar ?? "" },
                      ]).map(opt => (
                        <button key={opt.value} onClick={() => setPhotoType(opt.value)}
                          style={{ padding: "10px 8px", borderRadius: 10, cursor: "pointer", background: photoType === opt.value ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${photoType === opt.value ? "#c9a84c" : "rgba(255,255,255,0.08)"}`, color: photoType === opt.value ? "#c9a84c" : "rgba(255,255,255,0.45)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s", fontFamily: F }}>
                          {opt.url && !isVideoUrl(opt.url) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={opt.url} alt="" style={{ width: 48, height: 48, borderRadius: 7, objectFit: "cover", objectPosition: "top", border: `2px solid ${photoType === opt.value ? "#c9a84c" : "rgba(255,255,255,0.12)"}` }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : opt.url && isVideoUrl(opt.url) ? (
                            <video src={opt.url} muted style={{ width: 48, height: 48, borderRadius: 7, objectFit: "cover", border: `2px solid ${photoType === opt.value ? "#c9a84c" : "rgba(255,255,255,0.12)"}` }} />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {opt.icon}
                            </div>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Image / Vidéo */}
                    <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
                      {([
                        { kind: "image" as MediaKind, label: "IMAGE", icon: <ImageIcon size={11} /> },
                        { kind: "video" as MediaKind, label: "VIDÉO", icon: <Video size={11} /> },
                      ]).map(t => (
                        <button key={t.kind} onClick={() => { setMediaKind(t.kind); setFile(null); setPreview(null); }}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, cursor: "pointer", background: mediaKind === t.kind ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${mediaKind === t.kind ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.07)"}`, color: mediaKind === t.kind ? "#60a5fa" : "rgba(255,255,255,0.35)", fontFamily: F, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", transition: "all 0.15s" }}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Galerie existante */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontFamily: F, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.32)", letterSpacing: "0.2em", textTransform: "uppercase" }}>FICHIERS EXISTANTS</span>
                        <button className="ab" onClick={() => editingMember && fetchGallery(memberSlug(editingMember.name))} title="Rafraîchir" style={{ color: "rgba(255,255,255,0.3)", padding: 3 }}>
                          <RefreshCw size={12} />
                        </button>
                      </div>
                      {galleryLoading && <p style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>Chargement…</p>}
                      {galleryError && <p style={{ fontFamily: F, fontSize: 11, color: "#f87171" }}>{galleryError}</p>}
                      {!galleryLoading && !galleryError && gallery.length === 0 && (
                        <p style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Aucun fichier existant.</p>
                      )}
                      {!galleryLoading && gallery.length > 0 && (
                        <div className="gallery-scroll">
                          {gallery.map(gf => {
                            const isVid = isVideoUrl(gf.url);
                            return (
                              <div key={gf.name} className="gi" onClick={() => handleApplyGallery(gf)} title={gf.name}
                                style={{ width: isVid ? 88 : 70, height: 84, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                                {isVid ? (
                                  <video src={gf.url} muted loop autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={gf.url} alt={gf.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                )}
                                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.75))", padding: "4px 3px 2px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {isVid ? <Video size={8} color="#60a5fa" /> : <ImageIcon size={8} color="rgba(255,255,255,0.4)" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Zone de dépôt */}
                    <div
                      className="dz"
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                      onClick={() => inputRef.current?.click()}
                      style={{ border: `2px dashed ${dragOver ? "#c9a84c" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "22px 16px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(201,168,76,0.04)" : "transparent", marginBottom: 12 }}
                    >
                      {preview ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          {file?.type.startsWith("video/") ? (
                            <video src={preview} controls muted style={{ maxHeight: 130, maxWidth: "100%", borderRadius: 8, border: "2px solid #60a5fa" }} />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={preview} alt="" style={{ height: 110, maxWidth: "100%", objectFit: "cover", borderRadius: 8, border: "2px solid #c9a84c" }} />
                          )}
                          <p style={{ fontFamily: F, fontSize: 11, color: file?.type.startsWith("video/") ? "#60a5fa" : "#c9a84c", fontWeight: 700 }}>
                            {file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)} Ko
                          </p>
                          <p style={{ fontFamily: F, fontSize: 10, color: "rgba(255,255,255,0.28)" }}>Cliquer pour changer</p>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} color="rgba(255,255,255,0.18)" style={{ margin: "0 auto 8px" }} />
                          <p style={{ fontFamily: F, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>
                            Glisser un {mediaKind === "video" ? "vidéo" : "image"} ici
                          </p>
                          <p style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>
                            {mediaKind === "video" ? "MP4, WebM · max 50 Mo" : "JPG, PNG, WebP · max 5 Mo"}
                          </p>
                        </>
                      )}
                    </div>

                    <input ref={inputRef} type="file" accept={mediaKind === "video" ? ".mp4,.webm,.mov" : ".jpg,.jpeg,.png,.webp"} style={{ display: "none" }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

                    {uploadResult && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: uploadResult.success ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${uploadResult.success ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 9, marginBottom: 10 }}>
                        {uploadResult.success ? <Check size={13} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} /> : <X size={13} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />}
                        <p style={{ fontFamily: F, fontSize: 12, color: uploadResult.success ? "#34d399" : "#f87171", fontWeight: 700, wordBreak: "break-all" }}>
                          {uploadResult.success ? "Média appliqué avec succès" : `Erreur : ${uploadResult.url}`}
                        </p>
                      </div>
                    )}

                    <button onClick={handleUpload} disabled={!file || uploading}
                      style={{ width: "100%", padding: 12, background: !file || uploading ? (mediaKind === "video" ? "rgba(96,165,250,0.28)" : "rgba(201,168,76,0.28)") : (mediaKind === "video" ? "#60a5fa" : "#c9a84c"), border: "none", borderRadius: 10, cursor: !file || uploading ? "not-allowed" : "pointer", fontFamily: F, fontWeight: 900, fontSize: 13, color: "#000", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                      {mediaKind === "video" ? <Video size={15} /> : <Upload size={15} />}
                      {uploading ? "Upload en cours…" : `Uploader — ${photoType === "photo" ? "photo réelle" : "anime"}`}
                    </button>
                  </>
                )}
              </div>

              {/* Pied de panneau */}
              <div style={{ padding: isMobile ? "14px 18px" : "16px 26px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
                <button type="button" onClick={() => setPanelOpen(false)}
                  style={{ width: "100%", padding: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, cursor: "pointer", color: "rgba(255,255,255,0.45)", fontFamily: F, fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>
                  FERMER
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MODALE SUPPRESSION ── */}
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
              style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(400px,92vw)", background: "#0c0c18", border: "1px solid rgba(248,113,113,0.22)", borderRadius: 18, padding: "32px 28px", zIndex: 201, textAlign: "center" }}
            >
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <AlertTriangle size={24} color="#f87171" />
              </div>
              <h2 style={{ fontFamily: F, fontSize: 24, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "#fff", marginBottom: 8 }}>SUPPRIMER ?</h2>
              <p style={{ fontFamily: F, fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 4, lineHeight: 1.5 }}>
                <span style={{ color: "#fff", fontWeight: 900 }}>{deleteTarget.name}</span> sera définitivement retiré.
              </p>
              <p style={{ fontFamily: F, fontSize: 11, color: "rgba(248,113,113,0.55)", marginBottom: 24, fontStyle: "italic" }}>Cette action est irréversible.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontFamily: F, fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>
                  ANNULER
                </button>
                <button onClick={confirmDelete} disabled={deleting}
                  style={{ flex: 1, padding: 12, background: deleting ? "rgba(248,113,113,0.28)" : "#ef4444", border: "none", borderRadius: 10, cursor: deleting ? "not-allowed" : "pointer", color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <Trash2 size={14} />
                  {deleting ? "Suppression…" : "SUPPRIMER"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#0d0d18", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 12, padding: "11px 20px", display: "flex", alignItems: "center", gap: 9, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", fontFamily: F, pointerEvents: "none", whiteSpace: "nowrap" }}
          >
            <Check size={15} color="#c9a84c" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
