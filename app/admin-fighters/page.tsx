"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import GuildeHeader from "../components/GuildeHeader";
import { colors, typography, font } from "../../outputs/styles/tokens";
import { Trash, Pencil, Plus, Flame, Activity, X } from "lucide-react";
import { Rank, RANK_FILTER_ORDER } from "../../data/members";

export default function AdminFightersPage() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [fighters, setFighters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Formulaire d'édition
  const [formName, setFormName] = useState("");
  const [formRank, setFormRank] = useState<Rank>("New G dorée");
  const [formBirthday, setFormBirthday] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formPhoto, setFormPhoto] = useState("/photos/");
  const [formAnimechar, setFormAnimechar] = useState("/anime/");
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

  const checkAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1111") setAuth(true);
    else alert("Mot de passe incorrect");
  };

  useEffect(() => {
    if (auth) fetchFighters();
  }, [auth]);

  const fetchFighters = async () => {
    const { data } = await supabase.from("fighters").select("*").order("id", { ascending: false });
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
      setFormPhoto(f.photo);
      setFormAnimechar(f.animechar);
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
      setFormPhoto("/photos/");
      setFormAnimechar("/anime/");
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
      special: { name: formSpecialName, effect: formSpecialEffect }
    };

    if (editingId) {
      await supabase.from("fighters").update(payload).eq("id", editingId);
    } else {
      await supabase.from("fighters").insert([payload]);
    }
    setShowForm(false);
    fetchFighters();
  };

  if (!auth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg }}>
        <form onSubmit={checkAuth} style={{ display: "flex", flexDirection: "column", gap: "10px", background: colors.bgCard, padding: "30px", borderRadius: "20px" }}>
          <h2 style={{ fontFamily: font, color: "#fff", textAlign: "center", marginBottom: "20px" }}>ADMIN FIGHTERS</h2>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${colors.border}`, background: colors.bg }} autoFocus />
          <button type="submit" style={{ padding: "10px", background: colors.gold, borderRadius: "8px", fontWeight: "bold" }}>Accéder</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.textPrimary, fontFamily: font, paddingBottom: "100px" }}>
      <GuildeHeader activePage="fighters" />
      
      <main style={{ maxWidth: "1200px", margin: "120px auto 0", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontFamily: font, fontWeight: 900, textTransform: "uppercase", fontSize: "40px", marginBottom: "8px" }}>Arène Administrateur</h1>
            <p style={{ color: colors.textSecondary }}>Gérez le roster, ajoutez des statistiques ou tuez des personnages.</p>
          </div>
          <button onClick={() => openForm()} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: colors.gold, color: "#000", fontFamily: font, fontWeight: 900, borderRadius: "100px", border: "none", cursor: "pointer", textTransform: "uppercase" }}>
            <Plus size={18} /> Nouvelle Recrue
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          <AnimatePresence>
            {!loading && fighters.map(f => (
              <motion.div key={f.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, textTransform: "uppercase" }}>{f.name}</h3>
                    <span style={{ fontSize: "12px", color: f.color, padding: "2px 8px", background: `${f.color}20`, borderRadius: "100px", fontWeight: 700 }}>{f.rank}</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => openForm(f)} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}><Pencil size={18} /></button>
                    <button onClick={() => deleteFighter(f.id, f.name)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}><Trash size={18} /></button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: colors.textSecondary }}>
                  <span style={{ display: "flex", gap: "4px", alignItems: "center" }}><Flame size={12} color={colors.youtube} /> {f.stats?.force} FOR</span>
                  <span style={{ display: "flex", gap: "4px", alignItems: "center" }}><Activity size={12} color="#4ade80" /> {f.stats?.vitesse} VIT</span>
                  <span style={{ display: "flex", gap: "4px", alignItems: "center" }}><Flame size={12} color="#60a5fa" /> {f.stats?.technique} TEC</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* FORM MODAL */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", justifyContent: "center", padding: "40px 20px" }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} style={{ background: colors.bg, padding: "30px", borderRadius: "24px", width: "100%", maxWidth: "800px", maxHeight: "100%", overflowY: "auto", border: `1px solid ${colors.border}`, position: "relative" }}>
              <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "transparent", color: "#fff", border: "none", cursor: "pointer" }}><X size={24} /></button>
              
              <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "20px", fontStyle: "italic", textTransform: "uppercase" }}>{editingId ? "Modifier le Combattant" : "Nouvelle Édition"}</h2>
              
              <form onSubmit={saveFighter} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Ligne 1 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Nom complet</label><input required value={formName} onChange={e => setFormName(e.target.value)} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                  <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Rang</label>
                    <select value={formRank} onChange={(e) => setFormRank(e.target.value as Rank)} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }}>
                      {RANK_FILTER_ORDER.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* Ligne 2 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                   <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Couleur Aura (HEX)</label><input value={formColor} onChange={e => setFormColor(e.target.value)} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                   <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Date Naissance</label><input value={formBirthday} onChange={e => setFormBirthday(e.target.value)} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                   <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Badge Spécial (Ex: MVP 2025)</label><input value={formBadge} onChange={e => setFormBadge(e.target.value)} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                </div>

                {/* Bio */}
                <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Biographie & Lore</label><textarea value={formBio} onChange={e => setFormBio(e.target.value)} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px", minHeight: "80px" }} /></div>

                {/* Images */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Image Réelle (/photos/...)</label><input required value={formPhoto} onChange={e => setFormPhoto(e.target.value)} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                  <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Image Anime (/anime/...)</label><input required value={formAnimechar} onChange={e => setFormAnimechar(e.target.value)} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                </div>

                <hr style={{ borderColor: colors.border }} />

                {/* Stats */}
                <h3 style={{ color: colors.gold, fontStyle: "italic", fontWeight: 800 }}>STATISTIQUES DE COMBAT (1-100)</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                   <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Force</label><input type="number" min="0" max="100" value={formForce} onChange={e => setFormForce(Number(e.target.value))} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                   <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Vitesse</label><input type="number" min="0" max="100" value={formVitesse} onChange={e => setFormVitesse(Number(e.target.value))} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                   <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Technique</label><input type="number" min="0" max="100" value={formTechnique} onChange={e => setFormTechnique(Number(e.target.value))} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                </div>

                {/* Spécial */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
                   <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Nom du Coup Spécial</label><input value={formSpecialName} onChange={e => setFormSpecialName(e.target.value)} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                   <div><label style={{ fontSize: "12px", color: colors.textSecondary }}>Effet en combat</label><input value={formSpecialEffect} onChange={e => setFormSpecialEffect(e.target.value)} style={{ width: "100%", padding: "10px", background: colors.bgCard, border: `1px solid ${colors.border}`, color: "#fff", borderRadius: "8px" }} /></div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button type="submit" style={{ padding: "14px 32px", background: colors.gold, border: "none", borderRadius: "100px", color: "#000", fontWeight: 800, cursor: "pointer", fontSize: "16px", textTransform: "uppercase" }}>
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
