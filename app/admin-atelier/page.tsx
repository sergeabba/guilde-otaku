"use client";

import { useState, useEffect } from "react";
import { 
  Upload, X, Trash2, Loader2, Image as ImageIcon, 
  Lock, Check, ArrowLeft, Plus, Pencil, Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ADMIN_PASSWORD } from "../../lib/constants";
import type { AtelierItem, SupabaseAtelierRow } from "../types";

// --- STYLES (Matching admin-biblio) ---
const font = "'Barlow Condensed', sans-serif";
const colors = {
  bg:            "#050508",
  gold:          "#c9a84c",
  goldBorder:    "rgba(201,168,76,0.3)",
  goldLight:     "rgba(201,168,76,0.04)",
  goldGlow:      "rgba(201,168,76,0.4)",
  border:        "rgba(255,255,255,0.07)",
  bgCard:        "rgba(255,255,255,0.03)",
  bgHover:       "rgba(255,255,255,0.06)",
  textPrimary:   "#fff",
  textSecondary: "rgba(255,255,255,0.5)",
  danger:        "#f87171",
};

export default function AdminAtelier() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  const [images, setImages] = useState<SupabaseAtelierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dbStatus, setDbStatus] = useState<"connected" | "error">("connected");
  const [dbError, setDbError] = useState<string | null>(null);

  // État d'édition
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = sessionStorage.getItem("guilde_admin_auth") === "true";
      if (isAuth) setAuthed(true);
      setChecking(false);
    }
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/atelier");
      const data = await res.json();
      setImages(data.images || []);
      setDbStatus(data.db_status || "connected");
      setDbError(data.db_error || null);
    } catch (e: any) {
      setDbStatus("error");
      setDbError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchImages();
  }, [authed]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/atelier", {
        method: "POST",
        body: formData,
      });
      if (res.ok) fetchImages();
      else alert("Erreur d'upload");
    } catch (e) {
      alert("Erreur réseau");
    }
    setUploading(false);
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Supprimer définitivement "${filename}" ?`)) return;
    try {
      const res = await fetch("/api/atelier", {
        method: "DELETE",
        body: JSON.stringify({ filename }),
      });
      if (res.ok) fetchImages();
    } catch (e) {
      alert("Erreur de suppression");
    }
  };

  const handleSaveMetadata = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const { id, url, has_db_record, ...dataToSave } = editingItem;
      const res = await fetch("/api/atelier", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
      if (res.ok) {
        setEditingItem(null);
        fetchImages();
      } else {
        alert("Erreur de sauvegarde. Vérifiez si la table 'atelier' existe sur Supabase.");
      }
    } catch (e) {
      alert("Erreur réseau");
    }
    setSaving(false);
  };

  if (checking) return null;

  if (!authed) {
    return (
       <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "20px", padding: "48px 40px", width: "min(400px, 90vw)", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: `1px solid ${colors.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Lock size={24} color={colors.gold} />
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 900, color: colors.textPrimary, textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: "32px" }}>ACCÈS ATELIER</h1>
          <input
            type="password"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={e => { if (e.key === "Enter") { if (pwInput === ADMIN_PASSWORD) { sessionStorage.setItem("guilde_admin_auth", "true"); setAuthed(true); } else setPwError(true); } }}
            placeholder="Mot de passe..."
            style={{ width: "100%", padding: "14px 16px", background: colors.bgCard, border: `1px solid ${pwError ? colors.danger : colors.border}`, borderRadius: "10px", color: colors.textPrimary, fontFamily: font, fontSize: "18px", textAlign: "center", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
          />
          {pwError && <p style={{ color: colors.danger, fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Incorrect</p>}
          <button onClick={() => { if (pwInput === ADMIN_PASSWORD) { sessionStorage.setItem("guilde_admin_auth", "true"); setAuthed(true); } else setPwError(true); }}
            style={{ width: "100%", padding: "14px", background: colors.gold, border: "none", borderRadius: "10px", color: "#000", fontFamily: font, fontWeight: 900, cursor: "pointer" }}>
            ENTRER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.textPrimary, fontFamily: font, padding: "60px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "60px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.gold, textDecoration: "none", fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>
              <ArrowLeft size={16} /> RETOUR AU HUB
            </Link>
            <h1 style={{ fontSize: "clamp(40px, 8vw, 64px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 0.9, marginBottom: "8px" }}>
              GESTION <span style={{ color: colors.gold }}>ATELIER</span>
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: "18px" }}>Personnalisez les descriptions, noms et prompts de vos œuvres.</p>
          </div>
        </div>

        {/* Zone SQL Alert - Visible only if DB error */}
        {dbStatus === "error" && (
          <div style={{ background: "rgba(248,113,113,0.05)", border: `1px solid rgba(248,113,113,0.3)`, borderRadius: "16px", padding: "24px", marginBottom: "32px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
              <Palette size={20} color={colors.danger} />
              <p style={{ fontSize: "14px", color: colors.danger, margin: 0, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Configuration Database Requise
              </p>
            </div>
            <p style={{ fontSize: "14px", color: colors.textSecondary, marginBottom: "20px", lineHeight: 1.5 }}>
              La table <code style={{ background: "rgba(255,255,255,0.05)", padding: "2px 4px", borderRadius: "4px", color: "#fff" }}>atelier</code> est introuvable sur votre Supabase. 
              Exécutez le SQL suivant dans votre éditeur Supabase pour activer la sauvegarde des métadonnées :
            </p>
            <pre style={{ 
              background: "#000", padding: "16px", borderRadius: "12px", fontSize: "12px", color: "#34d399", 
              overflowX: "auto", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "16px", fontFamily: "monospace" 
            }}>
{`CREATE TABLE atelier (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    filename TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    prompt TEXT,
    category TEXT,
    universe TEXT DEFAULT 'Guilde Otaku',
    accent TEXT DEFAULT '#8b5cf6',
    size TEXT DEFAULT 'small'
);`}
            </pre>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`CREATE TABLE atelier (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    filename TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    prompt TEXT,
    category TEXT,
    universe TEXT DEFAULT 'Guilde Otaku',
    accent TEXT DEFAULT '#8b5cf6',
    size TEXT DEFAULT 'small'
);`);
                alert("SQL copié !");
              }}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              Copier le SQL
            </button>
          </div>
        )}

        {dbStatus === "connected" && (
          <div style={{ background: "rgba(52,211,153,0.05)", border: `1px solid rgba(52,211,153,0.2)`, borderRadius: "16px", padding: "12px 20px", marginBottom: "32px", display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px #34d399" }} />
            <p style={{ fontSize: "13px", color: "#34d399", margin: 0, fontWeight: 600 }}>
              Base de données connectée. La table 'atelier' est prête.
            </p>
          </div>
        )}

        {/* Upload Zone */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]); }}
          style={{
            border: `2px dashed ${dragActive ? colors.gold : colors.border}`,
            background: dragActive ? colors.goldLight : "transparent",
            borderRadius: "24px", padding: "60px", textAlign: "center", marginBottom: "60px",
            transition: "all 0.3s ease", cursor: "pointer", position: "relative"
          }}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input id="file-input" type="file" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <Loader2 size={48} color={colors.gold} />
              </motion.div>
              <p style={{ color: colors.gold, fontWeight: 700 }}>Upload en cours...</p>
            </div>
          ) : (
            <>
              <Upload size={48} color={colors.gold} style={{ marginBottom: "16px" }} />
              <p style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>Cliquez ou déposez une nouvelle œuvre</p>
              <p style={{ color: colors.textSecondary }}>SVG, PNG, JPG ou WebP (Max 10Mo)</p>
            </>
          )}
        </div>

        {/* Gallery Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          <AnimatePresence>
            {images.map((img) => (
              <motion.div
                key={img.filename}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "16px",
                  overflow: "hidden", position: "relative"
                }}
              >
                <div style={{ aspectRatio: "4/5", overflow: "hidden", background: "#000", position: "relative" }}>
                  <img src={img.url} alt={img.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", gap: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: img.accent, padding: "4px 8px", borderRadius: "100px", border: `1px solid ${img.accent}40` }}>
                      {img.category}
                    </span>
                    {img.has_db_record && (
                       <span style={{ fontSize: "10px", fontWeight: 800, background: "rgba(52,211,153,0.1)", backdropFilter: "blur(4px)", color: "#34d399", padding: "4px 8px", borderRadius: "100px", border: `1px solid rgba(52,211,153,0.3)` }}>
                          DB LOADED
                       </span>
                    )}
                  </div>
                </div>
                <div style={{ padding: "16px" }}>
                   <div style={{ marginBottom: "12px" }}>
                      <p style={{ fontWeight: 800, fontSize: "16px", textTransform: "uppercase", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.title}</p>
                      <p style={{ fontSize: "12px", color: colors.textSecondary, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", height: "36px" }}>
                        {img.description || "(Pas de description)"}
                      </p>
                   </div>
                   
                   <div style={{ display: "flex", gap: "8px" }}>
                      <button 
                        onClick={() => setEditingItem({ ...img })}
                        style={{ 
                          flex: 1, background: colors.goldLight, border: `1px solid ${colors.goldBorder}`, borderRadius: "8px", 
                          padding: "10px", color: colors.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                          fontFamily: font, fontWeight: 700, textTransform: "uppercase", fontSize: "12px"
                        }}
                      >
                        <Pencil size={14} /> Modifier info
                      </button>
                      <button 
                        onClick={() => handleDelete(img.filename)}
                        style={{ 
                          background: "rgba(248,113,113,0.1)", border: "none", borderRadius: "8px", 
                          padding: "10px", color: colors.danger, cursor: "pointer" 
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!loading && images.length === 0 && (
          <div style={{ textAlign: "center", padding: "100px", color: colors.textSecondary, fontSize: "18px", fontStyle: "italic" }}>
            Aucune image dans l'Atelier.
          </div>
        )}

      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
              zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
            }}
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: "800px", background: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: "24px", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column"
              }}
            >
              <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, flex: 1, overflow: "hidden" }}>
                <div style={{ width: "40%", background: "#000", position: "relative", display: "flex" }}>
                   <img src={editingItem.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                   <div style={{ position: "absolute", bottom: "20px", left: "20px", right: "20px", padding: "12px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
                      <p style={{ fontSize: "10px", fontWeight: 800, color: colors.gold, textTransform: "uppercase", margin: 0, letterSpacing: "0.1em" }}>ID Fichier</p>
                      <p style={{ fontSize: "12px", color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{editingItem.filename}</p>
                   </div>
                </div>

                <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                    <div>
                      <h2 style={{ fontSize: "24px", fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", margin: 0 }}>Détails de l'œuvre</h2>
                      <p style={{ color: colors.textSecondary, fontSize: "14px" }}>Mise à jour des métadonnées</p>
                    </div>
                    <button onClick={() => setEditingItem(null)} style={{ background: "none", border: "none", color: colors.textSecondary, cursor: "pointer" }}><X size={24} /></button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: colors.gold, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.1em" }}>Titre de l'œuvre</label>
                      <input 
                        type="text" value={editingItem.title} 
                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                        style={{ width: "100%", padding: "12px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", color: "#fff", outline: "none", fontFamily: font, fontSize: "18px" }} 
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: colors.gold, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.1em" }}>Catégorie</label>
                        <select 
                          value={editingItem.category} 
                          onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                          style={{ width: "100%", padding: "12px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", color: "#fff", outline: "none", fontFamily: font }}
                        >
                          <option value="Portrait">Portrait</option>
                          <option value="Scène">Scène</option>
                          <option value="Création">Création</option>
                          <option value="VFX">VFX</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: colors.gold, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.1em" }}>Taille Bento</label>
                        <select 
                          value={editingItem.size} 
                          onChange={(e) => setEditingItem({ ...editingItem, size: e.target.value })}
                          style={{ width: "100%", padding: "12px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", color: "#fff", outline: "none", fontFamily: font }}
                        >
                          <option value="small">Petite</option>
                          <option value="medium">Moyenne</option>
                          <option value="wide">Large (2 cols)</option>
                          <option value="tall">Haute (2 rows)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: colors.gold, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.1em" }}>Description / Lore</label>
                      <textarea 
                        rows={3} value={editingItem.description} 
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        style={{ width: "100%", padding: "12px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", color: "#fff", outline: "none", resize: "none", fontFamily: font, fontSize: "15px" }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: colors.gold, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.1em" }}>AI Prompt (Original)</label>
                      <textarea 
                        rows={3} value={editingItem.prompt} 
                        onChange={(e) => setEditingItem({ ...editingItem, prompt: e.target.value })}
                        style={{ width: "100%", padding: "12px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", color: "#fff", outline: "none", resize: "none", fontFamily: "monospace", fontSize: "11px" }} 
                      />
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                      <button 
                        onClick={handleSaveMetadata} disabled={saving}
                        style={{ flex: 1, padding: "16px", background: colors.gold, border: "none", borderRadius: "12px", color: "#000", fontWeight: 900, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontFamily: font }}
                      >
                        {saving ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <><Check size={18} /> Sauvegarder</>}
                      </button>
                      <button 
                        onClick={() => setEditingItem(null)}
                        style={{ padding: "16px 24px", background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border}`, borderRadius: "12px", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: font }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
