"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { colors, typography, font } from "../../outputs/styles/tokens";
import { Trash, Pencil, Plus, X, Globe, Lock, ChevronLeft, AlertTriangle, Check } from "lucide-react";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useIsMobile } from "../hooks/useIsMobile";
import type { SupabaseBonPlanRow } from "../types";

export default function AdminBonsPlansPage() {
  const { authed: auth, checking, password, setPassword, login: checkAuth } = useAdminAuth();
  const isMobile = useIsMobile();
  const [links, setLinks] = useState<SupabaseBonPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Formulaire d'édition
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCategory, setFormCategory] = useState("Animes");
  const [formColor, setFormColor] = useState("#8b5cf6");
  const [formLogo, setFormLogo] = useState("");

  const categories = ["Animes", "Scans", "Films/Séries", "Utiles"];

  useEffect(() => {
    if (auth) fetchLinks();
  }, [auth]);

  const fetchLinks = async () => {
    const { data } = await supabase
      .from("bons_plans")
      .select("*")
      .order("id", { ascending: false });
    if (data) setLinks(data);
    setLoading(false);
  };

  const openForm = (l: SupabaseBonPlanRow | null = null) => {
    if (l) {
      setEditingId(l.id);
      setFormTitle(l.title);
      setFormDesc(l.desc);
      setFormUrl(l.url);
      setFormCategory(l.category);
      setFormColor(l.color || "#8b5cf6");
      setFormLogo(l.logo || "");
    } else {
      setEditingId(null);
      setFormTitle("");
      setFormDesc("");
      setFormUrl("");
      setFormCategory("Animes");
      setFormColor("#8b5cf6");
      setFormLogo("");
    }
    setShowForm(true);
  };

  const confirmDeleteLink = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("bons_plans").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    fetchLinks();
    showToast(`${deleteTarget.title} supprimé`);
  };

  const saveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formTitle,
      desc: formDesc,
      url: formUrl,
      category: formCategory,
      color: formColor,
      logo: formLogo,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("bons_plans")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("bons_plans").insert([payload]));
    }

    if (error) {
      showToast("Erreur : " + error.message);
      return;
    }

    setShowForm(false);
    fetchLinks();
    showToast(editingId ? `${formTitle} modifié` : `${formTitle} ajouté`);
  };

  const migrateOldLinks = async () => {
    if (!confirm("Voulez-vous injecter définitivement vos anciens sites codés en dur dans Supabase ?")) return;
    
    // Le même tableau que dans dataAdapter
    const oldLinks = [
      { title: "Anime-Sama", desc: "La référence actuelle. Excellente plateforme de streaming anime communautaire.", url: "https://anime-sama.to/", category: "Animes", fallback_icon: "Tv", color: "#8b5cf6", logo: "https://www.google.com/s2/favicons?domain=anime-sama.to&sz=128" },
      { title: "SushiScan", desc: "La meilleure base pour lire vos scans mangas en VF rapidement.", url: "https://sushiscan.net/", category: "Scans", fallback_icon: "BookOpen", color: "#f43f5e", logo: "https://www.google.com/s2/favicons?domain=sushiscan.net&sz=128" },
      { title: "FRAnime", desc: "Site de stream anime très fluide, très complet et sans prise de tête.", url: "https://franime.fr/", category: "Animes", fallback_icon: "Tv", color: "#f97316", logo: "https://www.google.com/s2/favicons?domain=franime.fr&sz=128" },
      { title: "VoirAnime", desc: "L'un des plus connus. Streaming d'animes très souvent mis à jour.", url: "https://voiranime.tv/", category: "Animes", fallback_icon: "Tv", color: "#3b82f6", logo: "https://www.google.com/s2/favicons?domain=voiranime.com&sz=128" },
      { title: "Movix", desc: "Le bon plan du Don pour le streaming de vos Séries et Films classiques.", url: "https://movix.rodeo/", category: "Films/Séries", fallback_icon: "Film", color: "#eab308", logo: "https://www.google.com/s2/favicons?domain=movix.rodeo&sz=128" },
      { title: "MovieBox", desc: "Excellente alternative de stream film pour vos soirées cinéma.", url: "https://moviebox.ph/", category: "Films/Séries", fallback_icon: "Film", color: "#14b8a6", logo: "https://www.google.com/s2/favicons?domain=moviebox.ph&sz=128" },
      { title: "WiTV", desc: "La solution parfaite pour regarder la telé en Stream et tout le reste.", url: "https://witv.team/", category: "Utiles", fallback_icon: "Tv", color: "#f43f5e", logo: "https://www.google.com/s2/favicons?domain=witv.team&sz=128" },
      { title: "Ygg", desc: "Le tracker de référence pour retrouver tous les torrents fr.", url: "https://ygg.gratis/", category: "Utiles", fallback_icon: "Globe", color: "#0ea5e9", logo: "https://www.google.com/s2/favicons?domain=ygg.gratis&sz=128" },
      { title: "Crunchyroll", desc: "Le géant du streaming. Indispensable pour les simulcasts officiels.", url: "https://www.crunchyroll.com", category: "Animes", fallback_icon: "Tv", color: "#f97316", logo: "https://cdn.simpleicons.org/crunchyroll/f97316" },
    ];

    const { error } = await supabase.from("bons_plans").insert(oldLinks);
    if (error) {
      alert("Erreur lors de la migration : " + error.message);
    } else {
      alert("Anciens liens récupérés avec succès !");
      fetchLinks();
    }
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(201,168,76,0.2)", borderTopColor: "#c9a84c", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!auth) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "min(420px,92vw)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: "48px 40px", textAlign: "center", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}
        >
          <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 28px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={26} color="#10b981" />
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#10b981", letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 8 }}>GUILDE OTAKU</p>
          <h1 style={{ fontSize: "clamp(28px,6vw,38px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: 32 }}>BONS PLANS</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") checkAuth(e as any); }} placeholder="Mot de passe…" autoFocus
            style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontFamily: font, fontSize: 18, textAlign: "center", letterSpacing: "0.25em", outline: "none", marginBottom: 16, boxSizing: "border-box" }}
          />
          <button onClick={(e) => checkAuth(e as any)} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: 12, color: "#fff", fontFamily: font, fontSize: 16, fontWeight: 900, textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.1em", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}>
            ENTRER
          </button>
        </motion.div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px",
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    color: "#fff",
    borderRadius: "8px",
    fontFamily: font,
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.textPrimary, fontFamily: font }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── STICKY TOP BAR ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,8,0.95)", backdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "14px 16px" : "16px 28px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", flexShrink: 0, textDecoration: "none" }}>
            <ChevronLeft size={18} />
          </Link>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "#10b981", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 2 }}>ADMIN · GUILDE OTAKU</p>
            <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 1 }}>
              BONS <span style={{ color: "#10b981" }}>PLANS</span>
            </h1>
          </div>
          <button onClick={() => openForm()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#10b981", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: font, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#000", boxShadow: "0 4px 16px rgba(16,185,129,0.35)", whiteSpace: "nowrap", flexShrink: 0 }}>
            <Plus size={16} /> {!isMobile && "AJOUTER"}
          </button>
        </div>
      </div>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "24px 16px 80px" : "32px 28px 80px" }}>


        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          <AnimatePresence>
            {!loading &&
              links.map((link) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${link.color || colors.gold}`,
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: `${link.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: link.color,
                        }}
                      >
                        {link.logo ? (
                          <img src={link.logo} alt="logo" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
                        ) : (
                          <Globe size={18} color={link.color} />
                        )}
                      </div>

                      <div>
                        <h3
                          style={{
                            fontSize: "20px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                          }}
                        >
                          {link.title}
                        </h3>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.4)",
                            fontWeight: 600,
                          }}
                        >
                          {link.category}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => openForm(link)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 8, color: "#60a5fa", cursor: "pointer" }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: link.id, title: link.title })}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", cursor: "pointer" }}
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>

                  <a href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: link.color, wordBreak: "break-all" }}>
                    {link.url}
                  </a>
                  
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {!loading && links.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "100px" }}>
            <Globe size={48} color="rgba(255,255,255,0.2)" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "24px", color: "rgba(255,255,255,0.4)", marginBottom: "30px", textTransform: "uppercase" }}>Aucun Bon Plan trouvé dans Supabase</h2>
            <button
              onClick={migrateOldLinks}
              style={{
                padding: "16px 32px",
                background: "transparent",
                border: `2px solid ${colors.gold}`,
                color: colors.gold,
                borderRadius: "100px",
                fontFamily: font,
                fontWeight: 900,
                fontSize: "16px",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Récupérer les Anciens Archvies Locales
            </button>
          </div>
        )}
      </main>

      {/* ── FORM MODAL ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              zIndex: 9999,
              display: "flex",
              justifyContent: "center",
              padding: "40px 20px",
              overflowY: "auto",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{
                background: colors.bg,
                padding: "30px",
                borderRadius: "24px",
                width: "100%",
                maxWidth: "600px",
                height: "fit-content",
                border: `1px solid ${colors.border}`,
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowForm(false)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={24} />
              </button>

              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  marginBottom: "20px",
                  fontStyle: "italic",
                  textTransform: "uppercase",
                }}
              >
                {editingId ? "Modifier le Lien" : "Nouveau Lien"}
              </h2>

              <form
                onSubmit={saveLink}
                style={{ display: "flex", flexDirection: "column", gap: "24px" }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>Titre</label>
                    <input required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>Catégorie</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      style={{ ...inputStyle }}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c} style={{ background: colors.bg, color: "#fff" }}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: colors.textSecondary }}>URL Complète (commençant par https://)</label>
                  <input required value={formUrl} onChange={(e) => setFormUrl(e.target.value)} style={inputStyle} placeholder="https://..." />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: colors.textSecondary }}>Description / Punchline</label>
                  <textarea required value={formDesc} onChange={(e) => setFormDesc(e.target.value)} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>Couleur Thème (HEX)</label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        style={{ width: "40px", height: "40px", borderRadius: "8px", border: "none", cursor: "pointer" }}
                      />
                      <input
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>URL d'un Logo direct (optionnel)</label>
                    <input value={formLogo} onChange={(e) => setFormLogo(e.target.value)} style={inputStyle} placeholder="https://..." />
                    <p style={{ fontSize: "11px", color: colors.textSecondary, marginTop: "4px" }}>
                      Si vide, l'application essaiera d'utiliser le service Google Favicon.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    padding: "16px",
                    background: colors.gold,
                    color: "#000",
                    border: "none",
                    borderRadius: "12px",
                    fontFamily: font,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    fontSize: "16px",
                    cursor: "pointer",
                    marginTop: "10px",
                  }}
                >
                  Enregistrer
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM MODAL ── */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !deleting && setDeleteTarget(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 200 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: "min(400px,92vw)", background: "#0d0d18", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 20, padding: "32px 28px", textAlign: "center", boxShadow: "0 0 60px rgba(248,113,113,0.12), 0 24px 60px rgba(0,0,0,0.7)", fontFamily: font }}
            >
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <AlertTriangle size={22} color="#f87171" />
              </div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#f87171", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 8 }}>SUPPRESSION DÉFINITIVE</p>
              <h3 style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", marginBottom: 8, color: "#fff" }}>{deleteTarget.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28, lineHeight: 1.5 }}>Ce bon plan sera retiré définitivement de la liste.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontFamily: font, fontSize: 14, fontWeight: 800, textTransform: "uppercase" }}>ANNULER</button>
                <button onClick={confirmDeleteLink} disabled={deleting} style={{ flex: 1, padding: 12, background: deleting ? "rgba(248,113,113,0.3)" : "#ef4444", border: "none", borderRadius: 12, cursor: deleting ? "not-allowed" : "pointer", color: "#fff", fontFamily: font, fontSize: 14, fontWeight: 900, textTransform: "uppercase" }}>
                  {deleting ? "Suppression…" : "SUPPRIMER"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#0d0d18", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 14, padding: "12px 22px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", fontFamily: font, pointerEvents: "none", whiteSpace: "nowrap" }}
          >
            <Check size={16} color="#c9a84c" />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "0.03em" }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
