"use client";

import { useState, useRef, useEffect } from "react";
import { members } from "../../data/members";
import { Upload, Check, X, User, Sword, Lock, Video, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { getAdminFormDataHeaders, getAdminHeaders } from "../../lib/admin-fetch";

type PhotoType = "photo" | "anime";
type MediaKind = "image" | "video";

interface StorageFile {
  name: string;
  url: string;
  path: string;
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url);
}

export default function AdminMembresPage() {
  const isMobile = useIsMobile();
  const { authed, checking, password: pwInput, setPassword: setPwInput, error: pwError, login } = useAdminAuth();

  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [photoType, setPhotoType] = useState<PhotoType>("photo");
  const [mediaKind, setMediaKind] = useState<MediaKind>("image");

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ url: string; success: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gallery state
  const [gallery, setGallery] = useState<StorageFile[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  if (checking) return null;

  const member = selectedMember !== null ? members.find((m) => m.id === selectedMember) : null;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function memberSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  }

  async function fetchGallery(slug: string) {
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const res = await fetch(
        `/api/list-storage?folder=fighters&prefix=${encodeURIComponent(slug)}`,
        { headers: getAdminHeaders() }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setGalleryError(data.error ?? "Erreur");
        setGallery([]);
      } else {
        setGallery(data.files ?? []);
      }
    } catch {
      setGalleryError("Erreur réseau");
      setGallery([]);
    } finally {
      setGalleryLoading(false);
    }
  }

  const handleMemberSelect = (id: number | null) => {
    setSelectedMember(id);
    setPreview(null);
    setFile(null);
    setResult(null);
    setGallery([]);
    if (id !== null) {
      const m = members.find((m) => m.id === id);
      if (m) fetchGallery(memberSlug(m.name));
    }
  };

  const handleFile = (f: File) => {
    const isVideo = f.type.startsWith("video/");
    setFile(f);
    setResult(null);
    setMediaKind(isVideo ? "video" : "image");
    if (isVideo) {
      setPreview(URL.createObjectURL(f));
    } else {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // Apply existing gallery file directly (no re-upload)
  const handleApplyGalleryFile = async (galleryFile: StorageFile) => {
    if (!member) return;
    const isVideo = isVideoUrl(galleryFile.url);
    const field = isVideo
      ? (photoType === "photo" ? "photovideo" : "animevideo")
      : (photoType === "photo" ? "photo" : "animechar");

    const res = await fetch("/api/update-fighter-photo", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ memberName: member.name, field, url: galleryFile.url }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      setResult({ url: `Erreur : ${data.error}`, success: false });
    } else {
      setResult({ url: galleryFile.url, success: true });
    }
  };

  const handleUpload = async () => {
    if (!file || !member) return;
    setUploading(true);

    try {
      const suffix = mediaKind === "video"
        ? (photoType === "photo" ? "photo_video" : "anime_video")
        : (photoType === "photo" ? "photo" : "anime");

      const slug = memberSlug(member.name);
      const filename = `${slug}_${suffix}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "fighters");
      formData.append("filename", filename);

      const res = await fetch("/api/upload-storage", {
        method: "POST",
        headers: getAdminFormDataHeaders(),
        body: formData,
      });

      const uploadData = await res.json();

      if (!res.ok || uploadData.error) {
        setResult({ url: uploadData.error ?? "Erreur inconnue", success: false });
        return;
      }

      // Champ DB selon type de média
      const field = mediaKind === "video"
        ? (photoType === "photo" ? "photovideo" : "animevideo")
        : (photoType === "photo" ? "photo" : "animechar");

      const updateRes = await fetch("/api/update-fighter-photo", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ memberName: member.name, field, url: uploadData.url }),
      });
      const updateData = await updateRes.json();

      if (!updateRes.ok || updateData.error) {
        setResult({ url: `Upload OK mais mise à jour échouée : ${updateData.error}`, success: false });
        return;
      }

      setResult({ url: uploadData.url, success: true });
      // Refresh gallery
      fetchGallery(memberSlug(member.name));
    } catch (err: any) {
      setResult({ url: err.message ?? "Erreur réseau", success: false });
    } finally {
      setUploading(false);
    }
  };

  // ── Auth screen ──────────────────────────────────────────────────────────────
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
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") login(); }}
            placeholder="Mot de passe..."
            style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${pwError ? "#f87171" : "rgba(255,255,255,0.1)"}`, borderRadius: "10px", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", textAlign: "center", letterSpacing: "0.3em", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
          />
          {pwError && <p style={{ color: "#f87171", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Mot de passe incorrect</p>}
          <button
            onClick={() => login()}
            style={{ width: "100%", padding: "14px", background: "#c9a84c", border: "none", borderRadius: "10px", color: "#000", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}
          >
            ENTRER
          </button>
        </div>
      </div>
    );
  }

  // ── Current media values ─────────────────────────────────────────────────────
  const currentPhoto = member?.photo ?? "";
  const currentAnime = member?.animeChar ?? "";

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", padding: isMobile ? "40px 16px" : "60px 40px" }}>
      <style>{`
        .drop-zone { transition: all 0.2s; }
        .drop-zone:hover { border-color: rgba(201,168,76,0.5) !important; background: rgba(201,168,76,0.03) !important; }
        .gallery-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x mandatory; }
        .gallery-scroll::-webkit-scrollbar { height: 4px; }
        .gallery-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 4px; }
        .gallery-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 4px; }
        .gallery-item { flex-shrink: 0; scroll-snap-align: start; position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; transition: transform 0.15s, box-shadow 0.15s; }
        .gallery-item:hover { transform: scale(1.04); box-shadow: 0 0 0 2px #c9a84c, 0 4px 16px rgba(201,168,76,0.3); }
        .media-tab { transition: all 0.18s; }
        .media-tab:hover { opacity: 1 !important; }
      `}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.35em", color: "#c9a84c", textTransform: "uppercase", marginBottom: "8px" }}>GUILDE OTAKU · ESPACE ADMIN</p>
        <h1 style={{ fontSize: "clamp(40px,8vw,64px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 0.9, marginBottom: "40px" }}>
          UPLOAD <span style={{ color: "#c9a84c" }}>MÉDIAS</span>
        </h1>

        {/* ── Étape 1 : Membre ── */}
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <label style={labelStyle}>ÉTAPE 1 · CHOISIR LE MEMBRE</label>
          <select
            value={selectedMember ?? ""}
            onChange={(e) => handleMemberSelect(Number(e.target.value) || null)}
            style={selectStyle}
          >
            <option value="" style={{ background: "#050508" }}>Sélectionner un membre...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id} style={{ background: "#050508" }}>
                #{String(m.id).padStart(2, "0")} — {m.name} ({m.rank})
              </option>
            ))}
          </select>

          {member && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
              <img
                src={currentPhoto}
                alt=""
                style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid #c9a84c" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, textTransform: "uppercase", color: "#fff", lineHeight: 1 }}>{member.name}</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{member.rank} · ID #{member.id}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Étape 2 : Type ── */}
        {member && (
          <div style={{ ...cardStyle, marginBottom: "20px" }}>
            <label style={labelStyle}>ÉTAPE 2 · TYPE DE MÉDIA</label>

            {/* Photo réelle / Anime */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              {([
                { value: "photo", label: "Photo réelle", icon: <User size={14} />, current: currentPhoto },
                { value: "anime", label: "Personnage anime", icon: <Sword size={14} />, current: currentAnime },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPhotoType(opt.value as PhotoType)}
                  style={{
                    flex: 1, padding: "14px", borderRadius: "10px", cursor: "pointer",
                    background: photoType === opt.value ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${photoType === opt.value ? "#c9a84c" : "rgba(255,255,255,0.08)"}`,
                    color: photoType === opt.value ? "#c9a84c" : "rgba(255,255,255,0.5)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", transition: "all 0.2s",
                  }}
                >
                  {opt.icon}
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>{opt.label}</span>
                  {opt.current && (
                    isVideoUrl(opt.current) ? (
                      <video
                        src={opt.current}
                        muted
                        style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)", marginTop: "4px" }}
                      />
                    ) : (
                      <img
                        src={opt.current}
                        alt=""
                        style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover", objectPosition: "top", border: "1px solid rgba(255,255,255,0.1)", marginTop: "4px" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )
                  )}
                  <span style={{ fontSize: "9px", opacity: 0.4, fontStyle: "italic", wordBreak: "break-all", textAlign: "center" }}>{opt.current}</span>
                </button>
              ))}
            </div>

            {/* Image / Vidéo tabs */}
            <div style={{ display: "flex", gap: "8px" }}>
              {([
                { kind: "image" as MediaKind, label: "IMAGE", icon: <ImageIcon size={12} /> },
                { kind: "video" as MediaKind, label: "VIDÉO", icon: <Video size={12} /> },
              ]).map((tab) => (
                <button
                  key={tab.kind}
                  className="media-tab"
                  onClick={() => { setMediaKind(tab.kind); setFile(null); setPreview(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                    background: mediaKind === tab.kind ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${mediaKind === tab.kind ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.07)"}`,
                    color: mediaKind === tab.kind ? "#60a5fa" : "rgba(255,255,255,0.35)",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "12px", fontWeight: 800, letterSpacing: "0.1em",
                    opacity: mediaKind === tab.kind ? 1 : 0.7,
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
              {mediaKind === "video" && (
                <span style={{ alignSelf: "center", fontSize: "11px", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                  Remplace la photo — affiché en loop sur la carte
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Étape 3 : Galerie existante ── */}
        {member && (
          <div style={{ ...cardStyle, marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>ÉTAPE 3 · SÉLECTIONNER UN FICHIER EXISTANT</label>
              <button
                onClick={() => fetchGallery(memberSlug(member.name))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: "4px" }}
                title="Rafraîchir"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {galleryLoading && (
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>Chargement...</p>
            )}
            {galleryError && (
              <p style={{ fontSize: "12px", color: "#f87171" }}>{galleryError}</p>
            )}
            {!galleryLoading && !galleryError && gallery.length === 0 && (
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                Aucun fichier trouvé pour ce membre. Uploadez-en un ci-dessous.
              </p>
            )}
            {!galleryLoading && gallery.length > 0 && (
              <>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "10px" }}>
                  Scroll horizontal · cliquez pour appliquer directement
                </p>
                <div className="gallery-scroll">
                  {gallery.map((f) => {
                    const isVid = isVideoUrl(f.url);
                    return (
                      <div
                        key={f.name}
                        className="gallery-item"
                        onClick={() => handleApplyGalleryFile(f)}
                        title={`Appliquer : ${f.name}`}
                        style={{
                          width: isVid ? "100px" : "80px",
                          height: "100px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {isVid ? (
                          <video
                            src={f.url}
                            muted
                            loop
                            autoPlay
                            playsInline
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <img
                            src={f.url}
                            alt={f.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        {/* File type badge */}
                        <div style={{
                          position: "absolute", bottom: 0, left: 0, right: 0,
                          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
                          padding: "6px 4px 3px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {isVid
                            ? <Video size={10} color="#60a5fa" />
                            : <ImageIcon size={10} color="rgba(255,255,255,0.5)" />
                          }
                        </div>
                        {/* Name tooltip on hover */}
                        <div style={{
                          position: "absolute", top: 0, left: 0, right: 0,
                          padding: "3px 4px",
                          background: "rgba(0,0,0,0.7)",
                          fontSize: "8px", color: "rgba(255,255,255,0.6)",
                          wordBreak: "break-all", lineHeight: 1.2,
                          opacity: 0,
                          transition: "opacity 0.15s",
                        }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0"; }}
                        >
                          {f.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Étape 4 : Nouvel upload ── */}
        {member && (
          <div style={{ ...cardStyle, marginBottom: "20px" }}>
            <label style={labelStyle}>ÉTAPE 4 · UPLOADER UN NOUVEAU FICHIER</label>

            <div
              className="drop-zone"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#c9a84c" : "rgba(255,255,255,0.12)"}`,
                borderRadius: "14px", padding: "40px 20px", textAlign: "center",
                cursor: "pointer", background: dragOver ? "rgba(201,168,76,0.04)" : "transparent",
                transition: "all 0.2s", marginBottom: "16px",
              }}
            >
              {preview ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  {file?.type.startsWith("video/") ? (
                    <video
                      src={preview}
                      controls
                      muted
                      style={{ maxHeight: "180px", maxWidth: "240px", borderRadius: "10px", border: "2px solid #60a5fa" }}
                    />
                  ) : (
                    <img
                      src={preview}
                      alt=""
                      style={{ height: "180px", maxWidth: "140px", objectFit: "cover", borderRadius: "10px", border: "2px solid #c9a84c" }}
                    />
                  )}
                  <p style={{ fontSize: "13px", color: file?.type.startsWith("video/") ? "#60a5fa" : "#c9a84c", fontWeight: 700 }}>
                    {file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)} Ko
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Cliquer pour changer</p>
                </div>
              ) : (
                <>
                  <Upload size={32} color="rgba(255,255,255,0.2)" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>
                    Glisser un {mediaKind === "video" ? "vidéo" : "image"} ici
                  </p>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", marginTop: "4px" }}>
                    {mediaKind === "video"
                      ? "ou cliquer pour parcourir · MP4, WebM · max 50 Mo"
                      : "ou cliquer pour parcourir · JPG, PNG, WebP · max 5 Mo"}
                  </p>
                </>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={mediaKind === "video" ? ".mp4,.webm,.mov" : ".jpg,.jpeg,.png,.webp"}
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            {/* Résultat */}
            {result && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: "10px", padding: "14px 16px",
                background: result.success ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
                border: `1px solid ${result.success ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                borderRadius: "10px", marginBottom: "14px",
              }}>
                {result.success
                  ? <Check size={16} color="#34d399" style={{ flexShrink: 0, marginTop: "2px" }} />
                  : <X size={16} color="#f87171" style={{ flexShrink: 0, marginTop: "2px" }} />
                }
                <div>
                  <p style={{ fontSize: "14px", color: result.success ? "#34d399" : "#f87171", fontWeight: 700, wordBreak: "break-all" }}>
                    {result.success ? "✓ Média appliqué avec succès" : `Erreur : ${result.url}`}
                  </p>
                  {result.success && (
                    <>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px", wordBreak: "break-all" }}>{result.url}</p>
                      <p style={{ fontSize: "12px", color: "rgba(52,211,153,0.7)", marginTop: "6px", fontStyle: "italic" }}>
                        La photo a été mise à jour automatiquement dans la base de données.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                width: "100%", padding: "15px",
                background: !file || uploading
                  ? (mediaKind === "video" ? "rgba(96,165,250,0.3)" : "rgba(201,168,76,0.3)")
                  : (mediaKind === "video" ? "#60a5fa" : "#c9a84c"),
                border: "none", borderRadius: "12px",
                cursor: !file || uploading ? "not-allowed" : "pointer",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "16px",
                color: "#000", textTransform: "uppercase", letterSpacing: "0.1em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              }}
            >
              {mediaKind === "video" ? <Video size={18} /> : <Upload size={18} />}
              {uploading
                ? "Upload en cours..."
                : `Uploader comme ${mediaKind === "video" ? "vidéo" : "photo"} ${photoType === "photo" ? "réelle" : "anime"}`
              }
            </button>
          </div>
        )}

        {/* Info */}
        <div style={{ padding: "16px 20px", background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "12px" }}>
          <p style={{ fontSize: "13px", color: "rgba(96,165,250,0.8)", lineHeight: 1.6 }}>
            <strong>Note :</strong> Les médias sont stockés dans{" "}
            <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "4px" }}>
              guilde-images/fighters/
            </code>
            . Les vidéos (mp4/webm) remplacent la photo sur la carte — elles sont jouées en boucle silencieuse. La galerie affiche tous les fichiers uploadés pour ce membre.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "20px",
  padding: "24px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: "11px",
  fontWeight: 800,
  color: "rgba(255,255,255,0.35)",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  marginBottom: "12px",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  color: "#fff",
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: "16px",
  outline: "none",
  cursor: "pointer",
};
