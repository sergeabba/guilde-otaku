"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import GuildeHeader from "../components/GuildeHeader";
import { colors, typography, font } from "../../outputs/styles/tokens";
import { Trash, Pencil, Plus, Flame, Activity, X, Upload } from "lucide-react";
import { Rank, RANK_FILTER_ORDER } from "../../data/members";

export default function AdminFightersPage() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [fighters, setFighters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingAnime, setUploadingAnime] = useState(false);

  // Formulaire d'édition
  const [formName, setFormName] = useState("");
  const [formRank, setFormRank] = useState<Rank>("New G dorée");
  const [formBirthday, setFormBirthday] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formAnimechar, setFormAnimechar] = useState("");
  const [formColor, setFormColor] = useState("#E91E8C");
  const [formBadge, setFormBadge] = useState("");
  const [formRankjp, setFormRankjp] = useState("");

  // Stats
  const [formForce, setFormForce] = useState(50);
  const [formVitesse, setFormVitesse] = useState(50);
  const [formTechnique, setFormTechnique] = useState(50);

  // Special
  const [formSpecialName, setFormSpecialName] = useState("");
  const [formSpecialEffect, setFormSpecialEffect] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = sessionStorage.getItem("guilde_admin_auth") === "true";
      if (isAuth) setAuth(true);
      setChecking(false);
    }
  }, []);

  const checkAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1111") {
      sessionStorage.setItem("guilde_admin_auth", "true");
      setAuth(true);
    } else {
      alert("Mot de passe incorrect");
    }
  };

  useEffect(() => {
    if (auth) fetchFighters();
  }, [auth]);

  // ─── UPLOAD VIA API ROUTE (bypass RLS) ──────────────────────────────────────
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photo" | "anime"
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (type === "photo") setUploadingPhoto(true);
    else setUploadingAnime(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "fighters");

      // Générer un nom de fichier unique basé sur le nom du membre + type
      const slug = formName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      const suffix = type === "photo" ? "photo" : "anime";
      formData.append("filename", `${slug || Date.now()}_${suffix}`);

      const res = await fetch("/api/upload-storage", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        alert("Erreur upload : " + (data.error ?? "Erreur inconnue"));
        return;
      }

      if (type === "photo") setFormPhoto(data.url);
      else setFormAnimechar(data.url);
    } catch (err: any) {
      alert("Erreur réseau : " + err.message);
    } finally {
      if (type === "photo") setUploadingPhoto(false);
      else setUploadingAnime(false);
    }
  };

  const fetchFighters = async () => {
    const { data } = await supabase
      .from("fighters")
      .select("*")
      .order("id", { ascending: false });
    if (data) setFighters(data);
    setLoading(false);
  };

  const openForm = (f: any = null) => {
    if (f) {
      setEditingId(f.id);
      setFormName(f.name);
      setFormRank(f.rank);
      setFormBirthday(f.birthday);
      setFormBio(f.bio || "");
      setFormPhoto(f.photo || "");
      setFormAnimechar(f.animechar || "");
      setFormColor(f.color);
      setFormBadge(f.badge || "");
      setFormRankjp(f.rankjp || "");
      setFormForce(f.stats?.force ?? 50);
      setFormVitesse(f.stats?.vitesse ?? 50);
      setFormTechnique(f.stats?.technique ?? 50);
      setFormSpecialName(f.special?.name || "");
      setFormSpecialEffect(f.special?.effect || "");
    } else {
      setEditingId(null);
      setFormName("");
      setFormRank("New G dorée");
      setFormBirthday("");
      setFormBio("");
      setFormPhoto("");
      setFormAnimechar("");
      setFormColor("#E91E8C");
      setFormBadge("");
      setFormRankjp("");
      setFormForce(50);
      setFormVitesse(50);
      setFormTechnique(50);
      setFormSpecialName("");
      setFormSpecialEffect("");
    }
    setShowForm(true);
  };

  const deleteFighter = async (id: number, name: string) => {
    if (!confirm(`Tuer à jamais ${name} ?`)) return;
    await supabase.from("fighters").delete().eq("id", id);
    fetchFighters();
  };

  const saveFighter = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formName,
      rank: formRank,
      birthday: formBirthday,
      bio: formBio,
      photo: formPhoto,
      animechar: formAnimechar,
      color: formColor,
      badge: formBadge,
      rankjp: formRankjp,
      stats: { force: formForce, vitesse: formVitesse, technique: formTechnique },
      special: { name: formSpecialName, effect: formSpecialEffect },
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("fighters")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("fighters").insert([payload]));
    }

    if (error) {
      alert("Erreur sauvegarde : " + error.message);
      return;
    }

    setShowForm(false);
    fetchFighters();
  };

  if (checking) return null;

  if (!auth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.bg,
        }}
      >
        <form
          onSubmit={checkAuth}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: colors.bgCard,
            padding: "30px",
            borderRadius: "20px",
          }}
        >
          <h2
            style={{
              fontFamily: font,
              color: "#fff",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            ADMIN FIGHTERS
          </h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: "#fff",
            }}
            autoFocus
          />
          <button
            type="submit"
            style={{
              padding: "10px",
              background: colors.gold,
              borderRadius: "8px",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
            }}
          >
            Accéder
          </button>
        </form>
      </div>
    );
  }

  // ─── STYLES COMMUNS DES INPUTS ──────────────────────────────────────────────
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

  // ─── BOUTON D'UPLOAD ────────────────────────────────────────────────────────
  const UploadButton = ({
    type,
    currentUrl,
  }: {
    type: "photo" | "anime";
    currentUrl: string;
  }) => {
    const uploading = type === "photo" ? uploadingPhoto : uploadingAnime;
    const label = type === "photo" ? "Image Réelle" : "Image Anime";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "12px", color: colors.textSecondary }}>
          {label}
        </label>

        {/* Prévisualisation */}
        {currentUrl && (
          <img
            src={currentUrl}
            alt="preview"
            style={{
              width: "80px",
              height: "80px",
              objectFit: "cover",
              objectPosition: "top",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
            }}
          />
        )}

        {/* URL manuelle */}
        <input
          type="text"
          value={currentUrl}
          onChange={(e) =>
            type === "photo"
              ? setFormPhoto(e.target.value)
              : setFormAnimechar(e.target.value)
          }
          placeholder="URL ou uploader ci-dessous..."
          style={inputStyle}
        />

        {/* Bouton d'upload fichier */}
        <label
          style={{
            cursor: uploading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: font,
            background: uploading
              ? "rgba(255,255,255,0.05)"
              : "rgba(201,168,76,0.1)",
            padding: "10px",
            borderRadius: "8px",
            textAlign: "center",
            border: `1px solid ${uploading ? colors.border : "rgba(201,168,76,0.3)"
              }`,
            color: uploading ? colors.textSecondary : colors.gold,
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <Upload size={14} />
          {uploading ? "Upload en cours..." : "Uploader depuis l'appareil"}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, type)}
            style={{ display: "none" }}
            disabled={uploading}
          />
        </label>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.textPrimary,
        fontFamily: font,
        paddingBottom: "100px",
      }}
    >
      <GuildeHeader activePage="fighters" />

      <main
        style={{
          maxWidth: "1200px",
          margin: "120px auto 0",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: font,
                fontWeight: 900,
                textTransform: "uppercase",
                fontSize: "40px",
                marginBottom: "8px",
              }}
            >
              Arène Administrateur
            </h1>
            <p style={{ color: colors.textSecondary }}>
              Gérez le roster, ajoutez des statistiques ou tuez des personnages.
            </p>
          </div>
          <button
            onClick={() => openForm()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              background: colors.gold,
              color: "#000",
              fontFamily: font,
              fontWeight: 900,
              borderRadius: "100px",
              border: "none",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            <Plus size={18} /> Nouvelle Recrue
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          <AnimatePresence>
            {!loading &&
              fighters.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`,
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
                      {/* Mini preview photo */}
                      {(f.photo || f.animechar) && (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: `2px solid ${f.color || colors.gold}`,
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={f.animechar || f.photo}
                            alt={f.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: "top",
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h3
                          style={{
                            fontSize: "20px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                          }}
                        >
                          {f.name}
                        </h3>
                        <span
                          style={{
                            fontSize: "12px",
                            color: f.color,
                            padding: "2px 8px",
                            background: `${f.color}20`,
                            borderRadius: "100px",
                            fontWeight: 700,
                          }}
                        >
                          {f.rank}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => openForm(f)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#60a5fa",
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => deleteFighter(f.id, f.name)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#f87171",
                          cursor: "pointer",
                        }}
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      fontSize: "11px",
                      color: colors.textSecondary,
                    }}
                  >
                    <span
                      style={{ display: "flex", gap: "4px", alignItems: "center" }}
                    >
                      <Flame size={12} color="#f87171" /> {f.stats?.force} FOR
                    </span>
                    <span
                      style={{ display: "flex", gap: "4px", alignItems: "center" }}
                    >
                      <Activity size={12} color="#4ade80" /> {f.stats?.vitesse} VIT
                    </span>
                    <span
                      style={{ display: "flex", gap: "4px", alignItems: "center" }}
                    >
                      <Flame size={12} color="#60a5fa" /> {f.stats?.technique} TEC
                    </span>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
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
                maxWidth: "800px",
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
                {editingId ? "Modifier le Combattant" : "Nouvelle Édition"}
              </h2>

              <form
                onSubmit={saveFighter}
                style={{ display: "flex", flexDirection: "column", gap: "24px" }}
              >
                {/* Ligne 1 : Nom + Rang */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>
                      Nom complet
                    </label>
                    <input
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>
                      Rang
                    </label>
                    <select
                      value={formRank}
                      onChange={(e) => setFormRank(e.target.value as Rank)}
                      style={{ ...inputStyle }}
                    >
                      {RANK_FILTER_ORDER.map((r) => (
                        <option
                          key={r}
                          value={r}
                          style={{ background: colors.bg, color: "#fff" }}
                        >
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ligne 2 : Couleur + Anniversaire + Badge */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>
                      Couleur Aura (HEX)
                    </label>
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
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>
                      Date Naissance
                    </label>
                    <input
                      value={formBirthday}
                      onChange={(e) => setFormBirthday(e.target.value)}
                      placeholder="Ex: 3 Mars"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>
                      Badge Spécial
                    </label>
                    <input
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      placeholder="Ex: MVP 2025"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label style={{ fontSize: "12px", color: colors.textSecondary }}>
                    Biographie & Lore
                  </label>
                  <textarea
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                  />
                </div>

                {/* Images avec upload */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <UploadButton type="photo" currentUrl={formPhoto} />
                  <UploadButton type="anime" currentUrl={formAnimechar} />
                </div>

                <hr style={{ borderColor: colors.border }} />

                {/* Stats */}
                <h3
                  style={{
                    color: colors.gold,
                    fontStyle: "italic",
                    fontWeight: 800,
                    fontFamily: font,
                  }}
                >
                  STATISTIQUES DE COMBAT (1-100)
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "16px",
                  }}
                >
                  {[
                    { label: "Force", val: formForce, set: setFormForce },
                    { label: "Vitesse", val: formVitesse, set: setFormVitesse },
                    { label: "Technique", val: formTechnique, set: setFormTechnique },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label style={{ fontSize: "12px", color: colors.textSecondary }}>
                        {label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={val}
                        onChange={(e) => set(Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>

                {/* Coup Spécial */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>
                      Nom du Coup Spécial
                    </label>
                    <input
                      value={formSpecialName}
                      onChange={(e) => setFormSpecialName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: colors.textSecondary }}>
                      Effet en combat
                    </label>
                    <input
                      value={formSpecialEffect}
                      onChange={(e) => setFormSpecialEffect(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      padding: "14px 24px",
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "100px",
                      color: colors.textSecondary,
                      fontFamily: font,
                      cursor: "pointer",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "14px 32px",
                      background: colors.gold,
                      border: "none",
                      borderRadius: "100px",
                      color: "#000",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: "16px",
                      textTransform: "uppercase",
                      fontFamily: font,
                    }}
                  >
                    {editingId ? "Sauvegarder" : "Invoquer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}