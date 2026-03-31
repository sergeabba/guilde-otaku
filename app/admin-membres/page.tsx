"use client";

import { useState, useRef } from "react";
import { members } from "../../data/members";
import { Upload, Check, X, Image as ImageIcon, User, Sword, Lock } from "lucide-react";
import { useIsMobile } from "../hooks/useIsMobile";

const ADMIN_PASSWORD = "1111";

type PhotoType = "photo" | "anime";

export default function AdminMembresPage() {
  const isMobile = useIsMobile();
  const [authed, setAuthed]         = useState(false);
  const [pwInput, setPwInput]       = useState("");
  const [pwError, setPwError]       = useState(false);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [photoType, setPhotoType]   = useState<PhotoType>("photo");
  const [dragOver, setDragOver]     = useState(false);
  const [preview, setPreview]       = useState<string | null>(null);
  const [file, setFile]             = useState<File | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [result, setResult]         = useState<{ url: string; success: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── GARDE MOT DE PASSE ───────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed', sans-serif" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "48px 40px", width: "min(400px, 90vw)", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Lock size={24} color="#c9a84c" />
          </div>
          <p style={{ fontSize: "11px", fontWeight: 800, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "8px" }}>ESPACE ADMIN</p>
          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#fff", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: "32px" }}>ACCÈS RESTREINT</h1>
          <input
            type="password"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={e => { if (e.key === "Enter") { if (pwInput === ADMIN_PASSWORD) setAuthed(true); else setPwError(true); } }}
            placeholder="Mot de passe..."
            style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${pwError ? "#f87171" : "rgba(255,255,255,0.1)"}`, borderRadius: "10px", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", textAlign: "center", letterSpacing: "0.3em", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
          />
          {pwError && <p style={{ color: "#f87171", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Mot de passe incorrect</p>}
          <button
            onClick={() => { if (pwInput === ADMIN_PASSWORD) setAuthed(true); else setPwError(true); }}
            style={{ width: "100%", padding: "14px", background: "#c9a84c", border: "none", borderRadius: "10px", color: "#000", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}
          >
            ENTRER
          </button>
        </div>
      </div>
    );
  }

  const member = selectedMember !== null ? members.find(m => m.id === selectedMember) : null;

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file || !member) return;
    setUploading(true);

    // Nom du fichier = même convention que le projet existant
    const memberSlug = member.name.toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    const folder = photoType === "photo" ? "photos" : "anime";
    // Récupère l'extension du fichier existant depuis le chemin dans members.ts
    const existingPath = photoType === "photo" ? member.photo : member.animeChar;
    const existingExt = existingPath.split(".").pop() ?? "jpg";
    const filename = existingPath.split("/").pop()?.replace(/\.[^.]+$/, "") ?? memberSlug;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("filename", filename);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    setUploading(false);
    if (data.url) {
      setResult({ url: data.url, success: true });
    } else {
      setResult({ url: data.error ?? "Erreur inconnue", success: false });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", padding: isMobile ? "40px 16px" : "60px 40px" }}>
      <style>{`
        .drop-zone { transition: all 0.2s; }
        .drop-zone:hover { border-color: rgba(201,168,76,0.5) !important; background: rgba(201,168,76,0.03) !important; }
      `}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.35em", color: "#c9a84c", textTransform: "uppercase", marginBottom: "8px" }}>
          GUILDE OTAKU · ESPACE ADMIN
        </p>
        <h1 style={{ fontSize: "clamp(40px,8vw,64px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 0.9, marginBottom: "40px" }}>
          UPLOAD <span style={{ color: "#c9a84c" }}>PHOTOS</span>
        </h1>

        {/* Étape 1 : Choisir le membre */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", marginBottom: "20px" }}>
          <label style={labelStyle}>ÉTAPE 1 · CHOISIR LE MEMBRE</label>
          <select
            value={selectedMember ?? ""}
            onChange={e => { setSelectedMember(Number(e.target.value) || null); setPreview(null); setFile(null); setResult(null); }}
            style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", outline: "none", cursor: "pointer" }}
          >
            <option value="" style={{ background: "#050508" }}>Sélectionner un membre...</option>
            {members.map(m => (
              <option key={m.id} value={m.id} style={{ background: "#050508" }}>
                #{String(m.id).padStart(2,"0")} — {m.name} ({m.rank})
              </option>
            ))}
          </select>

          {/* Aperçu du membre sélectionné */}
          {member && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
              <img src={member.photo} alt="" style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid #c9a84c" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, textTransform: "uppercase", color: "#fff", lineHeight: 1 }}>{member.name}</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{member.rank} · ID #{member.id}</p>
              </div>
            </div>
          )}
        </div>

        {/* Étape 2 : Type de photo */}
        {member && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", marginBottom: "20px" }}>
            <label style={labelStyle}>ÉTAPE 2 · TYPE DE PHOTO</label>
            <div style={{ display: "flex", gap: "10px" }}>
              {([
                { value: "photo", label: "Photo réelle", icon: <User size={14} />, current: member.photo },
                { value: "anime", label: "Personnage anime", icon: <Sword size={14} />, current: member.animeChar },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPhotoType(opt.value as PhotoType)}
                  style={{
                    flex: 1, padding: "14px", borderRadius: "10px", cursor: "pointer",
                    background: photoType === opt.value ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${photoType === opt.value ? "#c9a84c" : "rgba(255,255,255,0.08)"}`,
                    color: photoType === opt.value ? "#c9a84c" : "rgba(255,255,255,0.5)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                    transition: "all 0.2s",
                  }}
                >
                  {opt.icon}
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>{opt.label}</span>
                  <span style={{ fontSize: "10px", opacity: 0.5, fontStyle: "italic" }}>{opt.current}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 3 : Upload */}
        {member && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", marginBottom: "20px" }}>
            <label style={labelStyle}>ÉTAPE 3 · DÉPOSER L'IMAGE</label>

            {/* Drop zone */}
            <div
              className="drop-zone"
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#c9a84c" : "rgba(255,255,255,0.12)"}`,
                borderRadius: "14px",
                padding: "40px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(201,168,76,0.04)" : "transparent",
                transition: "all 0.2s",
                marginBottom: "16px",
              }}
            >
              {preview ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <img src={preview} alt="" style={{ height: "180px", maxWidth: "140px", objectFit: "cover", borderRadius: "10px", border: "2px solid #c9a84c" }} />
                  <p style={{ fontSize: "13px", color: "#c9a84c", fontWeight: 700 }}>{file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)} Ko</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Cliquer pour changer</p>
                </div>
              ) : (
                <>
                  <Upload size={32} color="rgba(255,255,255,0.2)" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>Glisser une image ici</p>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", marginTop: "4px" }}>ou cliquer pour parcourir · JPG, PNG, WebP · max 5 Mo</p>
                </>
              )}
            </div>
            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            {/* Résultat */}
            {result && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", background: result.success ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${result.success ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: "10px", marginBottom: "14px" }}>
                {result.success ? <Check size={16} color="#34d399" /> : <X size={16} color="#f87171" />}
                <p style={{ fontSize: "14px", color: result.success ? "#34d399" : "#f87171", fontWeight: 700 }}>
                  {result.success ? `✓ Image sauvegardée : ${result.url}` : `Erreur : ${result.url}`}
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{ width: "100%", padding: "15px", background: !file || uploading ? "rgba(201,168,76,0.3)" : "#c9a84c", border: "none", borderRadius: "12px", cursor: !file || uploading ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "16px", color: "#000", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
            >
              <Upload size={18} />
              {uploading ? "Upload en cours..." : `Uploader en tant que ${photoType === "photo" ? "photo réelle" : "personnage anime"}`}
            </button>
          </div>
        )}

        {/* Info */}
        <div style={{ padding: "16px 20px", background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "12px" }}>
          <p style={{ fontSize: "13px", color: "rgba(96,165,250,0.8)", lineHeight: 1.6 }}>
            <strong>Note :</strong> L'image est sauvegardée directement dans <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "4px" }}>/public/photos/</code> ou <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "4px" }}>/public/anime/</code> avec le même nom de fichier que dans <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "4px" }}>members.ts</code>. Aucune modification de code nécessaire.
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.35)",
  letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px",
};