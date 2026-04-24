"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import GuildeHeader from "../components/GuildeHeader";
import { colors, typography, font } from "../../outputs/styles/tokens";
import { Trash, Pencil, Plus, X, Globe } from "lucide-react";
import { useAdminAuth } from "../hooks/useAdminAuth";
import type { SupabaseBonPlanRow } from "../types";

export default function AdminBonsPlansPage() {
  const { authed: auth, checking, password, setPassword, login: checkAuth } = useAdminAuth();
  const [links, setLinks] = useState<SupabaseBonPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const deleteLink = async (id: number, title: string) => {
    if (!confirm(`Supprimer définitivement ${title} ?`)) return;
    await supabase.from("bons_plans").delete().eq("id", id);
    fetchLinks();
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
      alert("Erreur sauvegarde : " + error.message);
      return;
    }

    setShowForm(false);
    fetchLinks();
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
            ADMIN BONS PLANS
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
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.textPrimary,
        fontFamily: font,
        paddingBottom: "100px",
      }}
    >
      <GuildeHeader activePage="bons-plans" />

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
              Archive Administrateur
            </h1>
            <p style={{ color: colors.textSecondary }}>
              Gérez les bons plans de la Guilde. Streams, Scans, Outils de Hackers.
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
            <Plus size={18} /> Nouveau Bon Plan
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
                        onClick={() => deleteLink(link.id, link.title)}
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
    </div>
  );
}
