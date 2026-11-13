"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import {
  Lock, Eye, EyeOff, Plus, X, Check, User,
  Search, ChevronLeft, Camera, GripVertical, Globe, Pencil,
} from "lucide-react";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useIsMobile } from "../hooks/useIsMobile";
import { invalidateMembersCache } from "../utils/dataAdapter";
import type { SupabaseMemberRow } from "../types";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { COUNTRIES, flagUrl } from "../config/countries";
import { adminDb } from "../../lib/admin-db-client";
import MemberEditor from "./MemberEditor";
import "./admin-membres.css";


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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminMembresPage() {
  const { authed, checking, password, setPassword, login } = useAdminAuth();
  const isMobile = useIsMobile();

  const [fighters, setFighters] = useState<SupabaseMemberRow[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<SupabaseMemberRow | "new" | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [quickCountry, setQuickCountry] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // La colonne `extras` (favoris, cadrage, musique) n'existe qu'après la migration.
  const extrasSupported = fighters.some((f) => f.extras !== undefined);

  function toast(msg: string, ms = 3000) {
    setSaveToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setSaveToast(null), ms);
  }

  async function fetchFighters() {
    setLoadingMembers(true); setLoadError(null);
    const { data, error } = await supabase.from("fighters").select("*").order("id", { ascending: true });
    if (error) setLoadError(`Lecture des membres impossible : ${error.message}`);
    if (data) setFighters(data);
    setLoadingMembers(false);
  }

  // Chargement différé d'un tour : évite un rendu en cascade au montage.
  useEffect(() => { if (authed) void Promise.resolve().then(fetchFighters); }, [authed]);

  function upsertLocal(row: SupabaseMemberRow, message: string) {
    setFighters((prev) => (prev.some((f) => f.id === row.id) ? prev.map((f) => (f.id === row.id ? row : f)) : [...prev, row]));
    invalidateMembersCache();
    toast(message);
  }

  // ── QUICK COUNTRY ASSIGN ───────────────────────────────────────────────────
  async function quickAssignCountry(member: SupabaseMemberRow) {
    if (!quickCountry) return;
    const { error } = await adminDb.update("fighters", member.id, { country: quickCountry });
    if (error) { toast(`Erreur : ${error.message}`, 5000); return; }
    invalidateMembersCache();
    setFighters(prev => prev.map(f => f.id === member.id ? { ...f, country: quickCountry } : f));
    const c = COUNTRIES.find(x => x.code === quickCountry);
    toast(`${member.name} → ${c?.label || quickCountry}`, 2000);
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
    for (const [i, f] of reordered.entries()) {
      const { error } = await adminDb.update("fighters", f.id, { position: i });
      if (error) { toast(`Erreur d'ordre : ${error.message}`, 5000); return; }
    }
    invalidateMembersCache();
    toast("Ordre mis à jour");
  }

  const filtered = fighters.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

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
        @keyframes spin { to { transform: rotate(360deg); } }
        .mc { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative; }
        .mc:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.5); }
        .mc:focus-visible { outline: 3px solid #c9a84c; outline-offset: 2px; }
        .mc-edit { position: absolute; top: 7px; right: 7px; width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; background: rgba(0,0,0,0.55); color: #fff; }
        .add-card { transition: all 0.18s; }
        .add-card:hover { border-color: rgba(201,168,76,0.7) !important; background: rgba(201,168,76,0.07) !important; transform: translateY(-2px); }
        textarea { resize: vertical; }
        select option { background: #0c0c16; }
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
        <button onClick={() => setEditing("new")}
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
              onClick={() => setEditing("new")}
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
                  role="button"
                  tabIndex={0}
                  aria-label={quickCountry ? `Assigner le pays à ${f.name}` : `Modifier ${f.name}`}
                  onClick={() => (quickCountry ? quickAssignCountry(f) : setEditing(f))}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (quickCountry) quickAssignCountry(f); else setEditing(f); } }}
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

                  <span className="mc-edit" aria-hidden="true"><Pencil size={13} /></span>

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

      {loadError && (
        <p className="am" role="alert" style={{ maxWidth: 1200, margin: "0 auto 24px", padding: "0 16px" }}>
          <span className="am-alert am-alert--error" style={{ display: "block" }}>{loadError}</span>
        </p>
      )}

      {editing && (
        <MemberEditor
          key={editing === "new" ? "new" : editing.id}
          member={editing === "new" ? null : editing}
          extrasSupported={extrasSupported}
          onClose={() => setEditing(null)}
          onSaved={upsertLocal}
          onDeleted={(id, name) => { setFighters((p) => p.filter((f) => f.id !== id)); invalidateMembersCache(); setEditing(null); toast(`${name} supprimé`); }}
        />
      )}

      {/* ── TOAST (en haut : ne masque jamais le bouton Enregistrer) ── */}
      <div aria-live="polite" style={{ position: "fixed", top: "calc(12px + env(safe-area-inset-top))", left: 0, right: 0, zIndex: 9999, display: "flex", justifyContent: "center", pointerEvents: "none", padding: "0 12px" }}>
        <AnimatePresence>
          {saveToast && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              style={{ background: "#0d0d18", border: "1px solid rgba(201,168,76,0.5)", borderRadius: 12, padding: "11px 18px", display: "flex", alignItems: "center", gap: 9, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", fontFamily: F, maxWidth: 520 }}
            >
              <Check size={15} color="#c9a84c" aria-hidden="true" />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{saveToast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
